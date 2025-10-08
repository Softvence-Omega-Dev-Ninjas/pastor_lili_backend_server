import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234', description: '4-digit OTP sent to email for password reset' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewPassword123', description: 'New password for the account' })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
