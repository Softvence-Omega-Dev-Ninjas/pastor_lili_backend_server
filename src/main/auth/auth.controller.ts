import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ResendOtpDto, VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgetPasswordDto } from './dto/forgetPassword.dto';
import { handleRequest } from 'src/common/utils/handle.request';


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
    return this.authService.verifyOtp(body.email, body.otp);
  }

  // forget password send otp
  @Post('forgetPassword-otp')
  forgetPasswordOtp(@Body() body: ResendOtpDto) {
    return this.authService.forgetPasswordOtp(body.email)
  }
  // forget password send otp verify..
  @Post('verify-forget-otp')
  forgetVerifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.forgetVerifyOtp(body.email, body.otp);
  }


  // @Post('refresh')
  // refresh(@Body() body: { refreshToken: string }) {
  //   return this.authService.refreshTokens(body.refreshToken);
  // }


  @Post('forget-password')
  reset(@Body() dto: ForgetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.newPassword);
  }


  // OAuth entry points will typically be frontend handled. Provide callback endpoints if needed.
}
