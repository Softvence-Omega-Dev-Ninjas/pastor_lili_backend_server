import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/userUpdate.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import streamifier from 'streamifier';
import cloudinary from 'src/lib/cloudinary/cloudinary.config';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // get user profile
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }, select: {
        fullName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException("Your Account is Not Found.")
    }
    return user;
  }

  // update user profile..
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    })
    if (!user) {
      throw new NotFoundException("Your Account is Not Found.")
    }
    return this.prisma.user.update({
      where: { id }, data: { ...dto }, select: {
        fullName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
  }
  // find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // upload image......
  public async uploadImages(file: Express.Multer.File) {
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "my_uploads" }, // optional
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      // Convert buffer → stream and pipe it to Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
