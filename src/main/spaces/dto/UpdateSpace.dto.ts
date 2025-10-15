import { ApiPropertyOptional } from "@nestjs/swagger";
import { Amenity } from "@prisma/client";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateSpaceDto {
  @ApiPropertyOptional({ example: 'Modern City Apartment', description: 'Title of the space' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'City center, close to metro', description: 'Optional subtitle' })
  @IsString()
  @IsOptional()
  subTitle?: string;

  @ApiPropertyOptional({ example: 'Spacious apartment with natural light', description: 'Description of the space' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'No smoking inside, keep noise low', description: 'Guidelines for guests' })
  @IsString()
  @IsOptional()
  guidelines?: string;

  @ApiPropertyOptional({ example: 150, description: 'Price per night in USD' })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 4, description: 'Maximum guest capacity' })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({
    example: [Amenity.WIFI, Amenity.PARKING_AVAILABLE, Amenity.AIR_CONDITIONING],
    description: 'List of amenities (enum values)',
    isArray: true,
    enum: Amenity,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Amenity, { each: true })
  amenities?: Amenity[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload images (1–5 files)',
  })
  @IsOptional()
  files?: any[];
}