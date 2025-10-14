import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

   @ApiProperty({ example: 5 })
  price?: number | string;

  @ApiProperty({ example: 4 })
  capacity?: number | string;

  @ApiProperty({
    example: ['WiFi', 'Parking'],
    description: 'List of amenities, or comma-separated string',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[] | string;

 @ApiProperty({
     type: 'array',
     items: { type: 'string', format: 'binary' },
     required: false,
     description: 'Upload images (1–5 files)',
   })
   @IsOptional()
   files?: any[];
}
