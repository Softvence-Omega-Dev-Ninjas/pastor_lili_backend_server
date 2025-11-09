import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class adminResetPasswordDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'adminPass' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
