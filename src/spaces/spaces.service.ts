import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.space.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.space.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.space.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.space.delete({ where: { id } });
  }
}
