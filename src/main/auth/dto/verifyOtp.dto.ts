import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@gmail.com or 14386196448' })
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  otp: string;
}

export class OtpDto {
  @ApiProperty({ example: 'john@gmail.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: '1234' })
  @IsNotEmpty()
  otp: string;
}
