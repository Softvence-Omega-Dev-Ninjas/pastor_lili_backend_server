import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ApproveBookingDto {
  @ApiProperty({
    description: 'Indicates whether the booking is approved or rejected',
    example: true,
  })
  @IsBoolean()
  approve: boolean;
}
