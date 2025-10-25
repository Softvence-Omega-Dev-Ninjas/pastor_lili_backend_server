import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Phone number with country code',
    example: '14386196448',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The file to upload',
  })
  @IsOptional()
  file?: any;
}

export const apiBodyExample = {
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
        maxItems: 20,
      },
    },
  },
};
