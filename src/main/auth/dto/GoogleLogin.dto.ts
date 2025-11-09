import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'name of the user',
    example: 'john',
  })
  @IsEmail()
  @IsOptional()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'johndoe@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Profile photo URL of the user',
    example:
      'https://res.cloudinary.com/demo/image/upload/v1698765432/profile_photo.jpg',
  })
  @IsOptional()
  @IsString()
  avatar: string;
}
