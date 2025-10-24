import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import { TwilioService } from 'src/lib/twilio/twilio.service';
import type { StringValue } from 'ms';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv';
import path from 'path';
import { GoogleLoginDto } from './dto/GoogleLogin.dto';
import { Role } from '@prisma/client';
import { EmailVerifiedDto } from './dto/forgetPassword.dto';
import { OtpDto } from './dto/verifyOtp.dto';


expand(config({ path: path.resolve(process.cwd(), '.env') }));

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private twilio: TwilioService,
    private readonly configService: ConfigService,
  ) { }

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
    await this.mail.sendOtp(dto.email, otp);
    return { message: 'User created. OTP sent to email.' };
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
  async resendOtp(dto: EmailVerifiedDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('No user found with this email');

    if (user.verified) {
      throw new BadRequestException('This email is already verified.');
    }

    const otp = this.generateOtp(); // 4-digit OTP
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 10 mins validity

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { otp, otpExpiresAt: otpExpiry },
    });

    await this.mail.sendOtp(dto.email, otp, 'Email Verification OTP');

    return { message: 'OTP sent to your email.' };
  }

  // otp verify for email verify
  async verifyOtp(dto: OtpDto) {
    const { email, otp } = dto;

    // Find the user by email
    const user = await this.prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) {
      throw new UnauthorizedException('No user found with this email');
    }

    // Check if already verified
    if (user.verified) {
      return { message: 'User is already verified' };
    }

    // Validate OTP existence and match
    if (!user.otp || user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if OTP is expired
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // ✅ OTP verified successfully
    await this.prisma.user.update({
      where: { email },
      data: {
        verified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Email verification successful' };
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
    const secret = process.env.JWT_SECRET;
    const expire = process.env.JWT_REFRESH_EXPIRE ?? '90d';
    const refreshSecreat =
      process.env.JWT_REFRESH_SECRET ?? 'refreshtokensecreat';
    if (!secret || !expire || !refreshSecreat)
      throw new InternalServerErrorException(
        'Secreat OR Expire OR Refresh secreat not found on .env file',
      );
    const accessToken = this.jwt.sign(payload, {
      secret: secret ?? 'access token secreat by sabbir',
      expiresIn: expire as StringValue,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: refreshSecreat,
      expiresIn: expire as StringValue,
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

  // google login.....
  async googleLogin(dto: GoogleLoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      const hash = dto.password ? await bcrypt.hash(dto.password, 10) : null;

      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          password: hash,
          role: Role.USER,
          avatar: dto.avatar,
          verified: true,
        },
      });
    }

    return this.getTokens(user.id, user.email ?? '', user.role);
  }


  // async socialLogin(idToken: string, provider: 'google' | 'facebook') {
  //   const decoded: any = await this.firebaseService.verifyToken(idToken);
  //   const { uid, email, name, picture } = decoded;


  //   if (!email) throw new BadRequestException('Email not provided by provider');

  //   let user = await this.prisma.user.findUnique({ where: { email } });

  //   if (!user) {
  //     const data: any = {
  //       fullName: name ?? 'Unknown User',
  //       email,
  //       verified: true,
  //       avatar: picture,
  //     };
  //     if (provider === 'google') data.googleId = uid;
  //     if (provider === 'facebook') data.facebookId = uid;

  //     user = await this.prisma.user.create({ data });
  //   } else {
  //     const updates: any = {};
  //     if (provider === 'google' && !user.googleId) updates.googleId = uid;
  //     if (provider === 'facebook' && !user.facebookId) updates.facebookId = uid;
  //     if (Object.keys(updates).length > 0) {
  //       user = await this.prisma.user.update({ where: { id: user.id }, data: updates });
  //     }
  //   }
  //   return this.getTokens(user.id, user.email ?? '', user.role);
  // }


}
