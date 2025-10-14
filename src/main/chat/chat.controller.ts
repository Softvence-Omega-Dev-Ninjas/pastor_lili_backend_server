import { Controller, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/lib/cloudinary/cloudinary.service';
import { ApiConsumes, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UploadImageDto } from './dto/upload.image.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @ApiBearerAuth("JWT-auth")
  @UseGuards(JwtAuthGuard)
  @Post('upload-images')
  @UseInterceptors(FilesInterceptor('files', 20)) // max 20 files
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) throw new Error('No files uploaded');

    const urls = await Promise.all(
      files.map(async (file) => {
        const result: any = await this.cloudinaryService.uploadImage(file, 'chat_images');
        return result.secure_url;
      }),
    );

    return { imageUrls: urls };
  }
}


