import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import { TwilioService } from 'src/lib/twilio/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private twilio: TwilioService,
    private config: ConfigService,
  ) {}

  private generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  // create new user...
  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (exists)
      throw new BadRequestException('You already registered. Please Login');
    const hash = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hash,
        otp,
        otpExpiresAt: otpExpiry,
        verified: false,
      },
    });
    return user;
    // await this.mail.sendOtp(dto.email, otp);
    // return { message: 'User created. OTP sent to email.' };
  }
  // user login
  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.getTokens(user.id, user.email ?? '', user.role);
  }

  // send otp for email verifications.
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('No user found with this email');

    if (user.verified) {
      throw new BadRequestException('This email is already verified.');
    }

    const otp = this.generateOtp(); // 4-digit OTP
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 10 mins validity

    await this.prisma.user.update({
      where: { email },
      data: { otp, otpExpiresAt: otpExpiry },
    });

    await this.mail.sendOtp(email, otp, 'Email Verification OTP');

    return { message: 'OTP sent to your email.' };
  }

  // otp verify for email verify
  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('No user');
    if (user.verified) return { message: 'Already verified' };
    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired otp');
    }
    await this.prisma.user.update({
      where: { email },
      data: { verified: true, otp: null, otpExpiresAt: null },
    });
    return { message: 'Verified' };
  }

  // forget password......
  async forgetPasswordOtp(identifier: string) {
    // identifier can be email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user)
      throw new BadRequestException('No user found with this email or phone');

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt: otpExpiry },
    });

    if (identifier.includes('@')) {
      await this.mail.forgetPassOtp(identifier, otp, 'Forget Password OTP');
      return { message: 'OTP sent to your email.' };
    } else {
      await this.twilio.sendOtp(identifier, otp);
      return { message: 'OTP sent to your phone.' };
    }
  }
  // forget verify otp
  async forgetVerifyOtp(identifier: string, otp: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user) throw new BadRequestException('No user found');
    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully' };
  }

  // get token
  async getTokens(userId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRE,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });
    return { user, accessToken, refreshToken };
  }

  // async refreshTokens(refreshToken: string) {
  //   try {
  //     const payload = this.jwt.verify(refreshToken, { secret: this.config.get('JWT_REFRESH_SECRET') }) as any;
  //     return this.getTokens(payload.sub, payload.email, payload.role);
  //   } catch (err) {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }
  // }

  // reset password...
  async resetPassword(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('No user');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hash, otp: null, otpExpiresAt: null },
    });
    return { message: 'Password reset successful' };
  }

  // Google & Facebook login handlers (called by strategies)
  async oauthLogin(profile: {
    email: string;
    id: string;
    name?: string;
    picture?: string;
    provider: 'google' | 'facebook';
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (!user) {
      const createData: any = {
        email: profile.email,
        fullName: profile.name || profile.email,
        verified: true,
        avatar: profile.picture,
      };
      if (profile.provider === 'google') createData.googleId = profile.id;
      if (profile.provider === 'facebook') createData.facebookId = profile.id;
      user = await this.prisma.user.create({ data: createData });
    } else {
      // attach provider id if missing
      const updateData: any = {};
      if (profile.provider === 'google' && !user.googleId)
        updateData.googleId = profile.id;
      if (profile.provider === 'facebook' && !user.facebookId)
        updateData.facebookId = profile.id;
      if (Object.keys(updateData).length)
        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
    }
    return this.getTokens(user.id, user.email ?? '', user.role);
  }
}
