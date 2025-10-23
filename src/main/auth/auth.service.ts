<<<<<<< HEAD
=======
<<<<<<< HEAD
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
=======
>>>>>>> main
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { MailService } from 'src/lib/mail/mail.service';
import { TwilioService } from 'src/lib/twilio/twilio.service';
<<<<<<< HEAD

<<<<<<< HEAD
=======
=======
import type { StringValue } from 'ms';
import { expand } from 'dotenv-expand';
import { config } from 'dotenv';
import path from 'path';

expand(config({ path: path.resolve(process.cwd(), '.env') }));
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6

>>>>>>> main
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private twilio: TwilioService,
<<<<<<< HEAD
    private config: ConfigService,
  ) {}
=======
<<<<<<< HEAD
    private config: ConfigService
  ) { }
=======
    private readonly configService: ConfigService,
  ) {}
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main

  private generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  // create new user...
  async signup(dto: SignupDto) {
<<<<<<< HEAD
=======
<<<<<<< HEAD

    const exists = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('You already registered. Please Login');
=======
>>>>>>> main
    const exists = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (exists)
      throw new BadRequestException('You already registered. Please Login');
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    const hash = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await this.prisma.user.create({
<<<<<<< HEAD
=======
<<<<<<< HEAD
      data: { fullName: dto.fullName, email: dto.email, password: hash, otp, otpExpiresAt: otpExpiry, verified: false }
=======
>>>>>>> main
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hash,
        otp,
        otpExpiresAt: otpExpiry,
        verified: false,
      },
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    });
    return user;
    // await this.mail.sendOtp(dto.email, otp);
    // return { message: 'User created. OTP sent to email.' };
  }
<<<<<<< HEAD
  // user login
  async login(dto: { email: string; password: string }) {
=======
<<<<<<< HEAD
 // user login 
  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
=======
  // user login
  async login(dto: { email: string; password: string }) {
>>>>>>> main
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
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
<<<<<<< HEAD
    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired otp');
    }
=======
<<<<<<< HEAD
    if (!user.otp || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired otp');
    }
    await this.prisma.user.update({ where: { email }, data: { verified: true, otp: null, otpExpiresAt: null } });
=======
    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired otp');
    }
>>>>>>> main
    await this.prisma.user.update({
      where: { email },
      data: { verified: true, otp: null, otpExpiresAt: null },
    });
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    return { message: 'Verified' };
  }

  // forget password......
  async forgetPasswordOtp(identifier: string) {
    // identifier can be email or phone
    const user = await this.prisma.user.findFirst({
      where: {
<<<<<<< HEAD
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user)
      throw new BadRequestException('No user found with this email or phone');
=======
<<<<<<< HEAD
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
    });
    if (!user) throw new BadRequestException('No user found with this email or phone');
=======
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user)
      throw new BadRequestException('No user found with this email or phone');
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main

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
<<<<<<< HEAD
  // forget verify otp
=======
<<<<<<< HEAD
  // forget verify otp 
>>>>>>> main
  async forgetVerifyOtp(identifier: string, otp: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user) throw new BadRequestException('No user found');
<<<<<<< HEAD
=======
    if (!user.otp || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
=======
  // forget verify otp
  async forgetVerifyOtp(identifier: string, otp: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user) throw new BadRequestException('No user found');
>>>>>>> main
    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully' };
  }
<<<<<<< HEAD

=======
<<<<<<< HEAD
 
=======

>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
  // get token
  async getTokens(userId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const payload = { sub: userId, email, role };
<<<<<<< HEAD
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRE,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });
=======
<<<<<<< HEAD
    const accessToken = this.jwt.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_ACCESS_EXPIRE });
    const refreshToken = this.jwt.sign(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_EXPIRE });
=======
    const secret = process.env.JWT_SECRET;
    const expire = process.env.JWT_REFRESH_EXPIRE ?? '90d';
    const refreshSecreat =
      process.env.JWT_REFRESH_SECRET ?? 'refreshtokensecreat';
    const accessToken = this.jwt.sign(payload, {
      secret: secret ?? 'access token secreat by sabbir',
      expiresIn: expire as StringValue,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.configService.getOrThrow<string>(refreshSecreat!),
      expiresIn: expire as StringValue,
    });
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
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
<<<<<<< HEAD
    await this.prisma.user.update({
      where: { email },
      data: { password: hash, otp: null, otpExpiresAt: null },
    });
=======
<<<<<<< HEAD
    await this.prisma.user.update({ where: { email }, data: { password: hash, otp: null, otpExpiresAt: null } });
>>>>>>> main
    return { message: 'Password reset successful' };
  }

  // Google & Facebook login handlers (called by strategies)
<<<<<<< HEAD
=======
  async oauthLogin(profile: { email: string; id: string; name?: string; picture?: string; provider: 'google' | 'facebook' }) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
=======
    await this.prisma.user.update({
      where: { email },
      data: { password: hash, otp: null, otpExpiresAt: null },
    });
    return { message: 'Password reset successful' };
  }

  // Google & Facebook login handlers (called by strategies)
>>>>>>> main
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
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    if (!user) {
      const createData: any = {
        email: profile.email,
        fullName: profile.name || profile.email,
        verified: true,
<<<<<<< HEAD
        avatar: profile.picture,
=======
<<<<<<< HEAD
        avatar: profile.picture
=======
        avatar: profile.picture,
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
      };
      if (profile.provider === 'google') createData.googleId = profile.id;
      if (profile.provider === 'facebook') createData.facebookId = profile.id;
      user = await this.prisma.user.create({ data: createData });
    } else {
      // attach provider id if missing
      const updateData: any = {};
<<<<<<< HEAD
=======
<<<<<<< HEAD
      if (profile.provider === 'google' && !user.googleId) updateData.googleId = profile.id;
      if (profile.provider === 'facebook' && !user.facebookId) updateData.facebookId = profile.id;
      if (Object.keys(updateData).length) await this.prisma.user.update({ where: { id: user.id }, data: updateData });
=======
>>>>>>> main
      if (profile.provider === 'google' && !user.googleId)
        updateData.googleId = profile.id;
      if (profile.provider === 'facebook' && !user.facebookId)
        updateData.facebookId = profile.id;
      if (Object.keys(updateData).length)
        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
<<<<<<< HEAD
=======
>>>>>>> 629848a8c4a818746ebc8de9471216be75e51fe6
>>>>>>> main
    }
    return this.getTokens(user.id, user.email ?? '', user.role);
  }
}
