import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: '7d9f2a1b-e0f5-4a34-bc7a-42d0d9d887f4',
    description: 'ID of the space being booked',
  })
  @IsNotEmpty()
  @IsString()
  spaceId: string;

  @ApiProperty({
    example: '2025-10-10T10:00:00.000Z',
    description: 'Start time of the booking (ISO 8601 format)',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @ApiProperty({
    example: '2025-10-12T12:00:00.000Z',
    description: 'End time of the booking (ISO 8601 format)',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: Date;

  // @ApiProperty({
  //   example: 250.0,
  //   description: 'Total amount for this booking',
  // })
  // @IsNotEmpty()
  // @IsNumber()
  // amount: number;
}
