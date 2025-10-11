import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/userUpdate.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
