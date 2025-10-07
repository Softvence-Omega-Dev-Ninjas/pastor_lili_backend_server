import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

