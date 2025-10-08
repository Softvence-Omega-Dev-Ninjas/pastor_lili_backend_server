import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/CreateSpace.dto';
import { UpdateSpaceDto } from './dto/UpdateSpace.dto';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) { }
  // create new space
  async create(userId: string, dto: CreateSpaceDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Your Account is Not Found")
    }
    const space = await this.prisma.space.create({
      data: {
        ownerId: userId,
        ...dto
      }
    });

    return space
  }
  //  find all space
  async list(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    return this.prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  }
  // find space by Id
  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    const space = await this.prisma.space.findUnique({ where: { id }, include: { reviews: true } })
    return space
  }

  async update(userId: string, id: string, data: UpdateSpaceDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    const existing = await this.prisma.space.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Space not found');

    return this.prisma.space.update({
      where: { id, ownerId: userId },
      data,
    });
  }

  async delete(userId:string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException("Unauthorized Access.")
    }
    const existing = await this.prisma.space.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Space not found');

    await this.prisma.space.delete({ where: { id } });
    return null
  }
}
