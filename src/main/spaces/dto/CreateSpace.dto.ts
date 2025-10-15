import { ApiProperty } from "@nestjs/swagger";
import { Amenity } from "@prisma/client";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSpaceDto {
  @ApiProperty({ example: 'Modern City Apartment' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Beautiful apartment with city view', required: false })
  @IsString()
  @IsOptional()
  subTitle?: string;

  @ApiProperty({ example: 'Spacious apartment with natural light', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'No smoking inside, keep noise low', required: false })
  @IsString()
  @IsOptional()
  guidelines?: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    example: [Amenity.WIFI, Amenity.PARKING_AVAILABLE, Amenity.AIR_CONDITIONING],
    description: 'List of amenities (enum values)',
    isArray: true,
    enum: Amenity,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Amenity, { each: true })
  amenities?: Amenity[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
    description: 'Upload images (1–5 files)',
  })
  @IsOptional()
  files?: any[];
}