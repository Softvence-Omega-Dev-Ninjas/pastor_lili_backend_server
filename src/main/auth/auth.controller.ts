import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ResendOtpDto, VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgetPasswordDto, ResetPasswordDto } from './dto/forgetPassword.dto';
import { handleRequest } from 'src/common/utils/handle.request';
import { AuthGuard } from '@nestjs/passport';


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
  @Post('emailVerify-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body.email);
  }
  // otp verification for email verified 
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.identifier, body.otp);
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
