import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({ example: 'john@gmail.com or 14386196448' })
  @IsNotEmpty()
  @IsString()
  identifier: string; // email or phone
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@gmail.com or 14386196448' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
