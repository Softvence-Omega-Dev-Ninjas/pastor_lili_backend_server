import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@gmail.com or 14386196448' })
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
    @ApiProperty({ example: 'john@gmail.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}
