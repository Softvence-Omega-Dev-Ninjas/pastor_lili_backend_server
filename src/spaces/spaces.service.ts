import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/CreateSpace.dto';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const user = await this.prisma.user.findUnique({where:{id:userId}})
    if(!user){
      throw new BadRequestException("Unauthorized Access.")
    }
    return this.prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.space.findUnique({ where: { id } });
  }

  async create(userId: string, dto:CreateSpaceDto) {
    const user = await this.prisma.user.findUnique({where: {id: userId}})
    if(!user){
      throw new BadRequestException("Your Account is Not Found")
    }
    const space = await this.prisma.space.create({ data:{
      ownerId: userId,
      ...dto
    } });

    return space
  }

  async update(id: string, data: any) {
    return this.prisma.space.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.space.delete({ where: { id } });
  }
}
