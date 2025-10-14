import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty({ example: 'Modern City Apartment' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Beautiful apartment with city view' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 150 })
  @IsNotEmpty()
  price: number | string; //  can come as string from form-data

  @ApiProperty({ example: 4 })
  @IsOptional()
  capacity?: number | string; //  same reason

  @ApiProperty({
    example: ['WiFi', 'Parking'],
    description: 'List of amenities, or comma-separated string',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[] | string; //  allow string for form-data

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
    description: 'Upload images (1–5 files)',
  })
  @IsOptional()
  files?: any[];
}
