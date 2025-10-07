import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'OTP sent to the user email',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 characters' })
  otp: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
