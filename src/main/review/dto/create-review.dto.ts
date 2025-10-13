import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 'uuid-of-space',
    description: 'ID of the space being reviewed',
  })
  @IsNotEmpty()
  @IsString()
  spaceId: string;

  @ApiProperty({
    example: 5,
    description: 'Rating given by the user (1 to 5)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Amazing place, great lighting and service!',
    description: 'Optional user comment about the space',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
