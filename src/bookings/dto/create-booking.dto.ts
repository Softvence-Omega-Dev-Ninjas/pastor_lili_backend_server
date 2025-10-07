import { IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateBookingDto {
  @IsString() spaceId: string;
  @IsDateString() startTime: string;
  @IsDateString() endTime: string;
  @IsNumber() amount: number;
}
