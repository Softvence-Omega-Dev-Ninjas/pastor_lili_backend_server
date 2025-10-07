import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(dto: { senderId: string; receiverId: string; content: string }) {
    return this.prisma.message.create({ data: dto });
  }

  async conversation(userA: string, userB: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
