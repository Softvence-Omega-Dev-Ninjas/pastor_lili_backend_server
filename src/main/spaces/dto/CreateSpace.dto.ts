import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty({ 
    example: 'Cozy Beach Apartment', 
    description: 'Title of the space' 
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    example: 'A cozy apartment near the beach with sea view', 
    description: 'Description of the space'
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    example: 120.5, 
    description: 'Price per night for the space' 
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ 
    example: 4, 
    description: 'Capacity of the space (optional)' 
  })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ 
    example: ['image1.jpg', 'image2.jpg'], 
    description: 'Images of the space' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ 
    example: ['WiFi', 'Parking', 'Air Conditioning'], 
    description: 'Amenities provided in the space' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
