import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({ example: 'john@gmail.com', description: 'Email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'NewPassword123', description: 'New password for the account' })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
