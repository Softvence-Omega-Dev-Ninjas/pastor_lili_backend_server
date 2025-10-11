import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Modern City Apartment', description: 'Title of the space' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Spacious apartment near downtown', description: 'Description of the space' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 150.0, description: 'Updated price per night' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 3, description: 'Updated capacity of the space' })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ example: ['image1.jpg', 'image2.jpg'], description: 'Updated images for the space' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: ['WiFi', 'TV'], description: 'Updated list of amenities' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
