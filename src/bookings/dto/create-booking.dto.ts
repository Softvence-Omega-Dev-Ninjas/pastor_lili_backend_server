import { IsString, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID of the space to book',
    example: 'a1b2c3d4-5678-9101-1121-314151617181',
  })
  @IsString()
  spaceId: string;

  @ApiProperty({
    description: 'Booking start time (ISO 8601 format)',
    example: '2025-10-10T10:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Booking end time (ISO 8601 format)',
    example: '2025-10-10T12:00:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Total booking amount',
    example: 150.5,
  })
  @IsNumber()
  amount: number;
}
