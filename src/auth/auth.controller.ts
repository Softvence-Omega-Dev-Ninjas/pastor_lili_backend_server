import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('forgot')
  forgot(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset')
  reset(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }

  // OAuth entry points will typically be frontend handled. Provide callback endpoints if needed.
}
