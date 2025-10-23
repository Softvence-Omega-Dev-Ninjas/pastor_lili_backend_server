import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Select 1 or more image files (png, jpg, jpeg, gif)',
    required: true,
  })
  @IsNotEmpty({ message: 'Files must be provided' })
  files: any[];
}
