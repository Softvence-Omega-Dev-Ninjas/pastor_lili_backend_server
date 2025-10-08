import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ResendOtpDto, VerifyOtpDto } from './dto/verifyOtp.dto';
import { ForgetPasswordDto } from './dto/forgetPassword.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('emailVerify-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body.email);
  }

  @Post('forgetPassword-otp')
  forgetPasswordOtp(@Body() body: ResendOtpDto) {
    return this.authService.forgetPasswordOtp(body.email)
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.otp);
  }



  // @Post('refresh')
  // refresh(@Body() body: { refreshToken: string }) {
  //   return this.authService.refreshTokens(body.refreshToken);
  // }


  @Post('forget-password')
  reset(@Body() dto: ForgetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }


  // OAuth entry points will typically be frontend handled. Provide callback endpoints if needed.
}
