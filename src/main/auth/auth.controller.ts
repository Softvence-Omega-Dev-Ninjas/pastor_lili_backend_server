import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import {  OtpDto, VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgetPasswordDto, ResetPasswordDto } from './dto/forgetPassword.dto';
import { handleRequest } from 'src/common/utils/handle.request';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return handleRequest(
      () => this.authService.signup(dto),
      'User created successfully',
    );
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return handleRequest(
      () => this.authService.login(dto),
      'User login successfully',
    );

  }
  // email verify otp
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @Post('emailVerify-otp')
  resendOtp(@GetUser('email') email:string) {
    return this.authService.resendOtp(email);
  }
  // otp verification for email verified 
  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @Post('verify-otp')
  verifyOtp(@GetUser('email') email:string, @Body() dto: OtpDto) {
    return this.authService.verifyOtp(email , dto.otp);
  }

  // forget password send otp
  @Post('forget-password/otp')
  async sendForgetOtp(@Body() dto: ForgetPasswordDto) {
    return this.authService.forgetPasswordOtp(dto.identifier);
  }
  // forget password send otp verify..
  @Post('forget-password/verify')
  async verifyForgetOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.forgetVerifyOtp(dto.identifier, dto.otp);
  }


  // @Post('refresh')
  // refresh(@Body() body: { refreshToken: string }) {
  //   return this.authService.refreshTokens(body.refreshToken);
  // }


  @Post('forget-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.identifier, dto.newPassword);
  }


  // OAuth entry points will typically be frontend handled. Provide callback endpoints if needed.
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req) {
    // redirect with tokens
    const tokens = req.user;
    return {
      message: 'Login successful',
      tokens,
    };
  }
}
