import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/userUpdate.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CloudinaryService } from 'src/lib/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  // get user profile
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        fullName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Your Account is Not Found.');
    }
    return user;
  }

  // update user profile..
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('Your Account is Not Found.');
    }

    if (user.avatar) {
      try {
        const publicId = this.extractPublicId(user.avatar);

        if (publicId) {
          await this.cloudinary.deleteImage(publicId);
        }
      } catch (error) {
        console.log('Failed to delete old avatar: ', error);
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
      select: {
        fullName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
  }
  // user account delete
  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User Not Found")
    }
    // delete user logic
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: 'Account deleted successfully' };
  }
  // find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async uploadProfileImage(file: Express.Multer.File) {
    return await this.cloudinary.uploadImage(file, 'user_profiles');
  }

  private extractPublicId(url: string): string | null {
    try {
      // Split URL into parts
      const parts = url.split('/');

      // Remove the filename with extension
      const fileWithExt = parts.pop(); // e.g., "ejzkvpw47ozcgcp1iinp.png"
      if (!fileWithExt) return null;

      // Remove the file extension
      const fileName = fileWithExt.split('.')[0]; // "ejzkvpw47ozcgcp1iinp"

      // Find the index of 'upload' folder
      const uploadIndex = parts.findIndex((p) => p === 'upload');
      if (uploadIndex === -1) return null;

      // Slice the folder path after 'upload' and skip the version folder if present
      const folderParts = parts.slice(uploadIndex + 1); // ["v1760226970", "user_profiles"]
      if (folderParts[0].startsWith('v')) folderParts.shift(); // remove version if exists

      const folderPath = folderParts.join('/'); // "user_profiles"

      // Combine folder path and filename
      return folderPath ? `${folderPath}/${fileName}` : fileName; // "user_profiles/ejzkvpw47ozcgcp1iinp"
    } catch (err) {
      console.error('Failed to extract publicId:', err);
      return null;
    }
  }
}
