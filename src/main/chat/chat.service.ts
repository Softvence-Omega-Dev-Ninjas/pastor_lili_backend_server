import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';


@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  async saveMessage(data: {
    senderId: string;
    receiverId: string;
    content: string;
    imageUrl?: string; // optional
  }) {
   
    const senderExists = await this.prisma.user.findFirst({
      where: { id: data.senderId },
    })

    const receiverExists = await this.prisma.user.findFirst({
      where: { id: data.receiverId }
    })

    if (!senderExists || !receiverExists) {
      throw new Error('Sender or receiver docs not exist in User table');
    }
    const res = await this.prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        imageUrl: data.imageUrl,
      },
    })
    return res
  }


  // Get All messages that involve a user
  async getMessagesByUser(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    return messages
  }

  //  Get all messages between two users
  async getMessagesBetweenUsers(userA: string, userB: string) {
    return await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA }
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        senderId: true,
        receiverId: true,
        content: true
      }
    })
  }

  // Get unique chat partners and their last message
  async getChatPartnersWithUser(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId }, { receiverId: userId }
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
        content: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Extract unique partner Ids
    const partnerIds = new Set<string>();
    messages.forEach((msg) => {
      if (msg.senderId !== userId) partnerIds.add(msg.senderId);
      if (msg.receiverId !== userId) partnerIds.add(msg.receiverId);
    })

    // fetch partner details
    const partners = await this.prisma.user.findMany({
      where: { id: { in: Array.from(partnerIds) } },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
      }
    })

    // Attach last message for each partner
    const result = partners.map((p) => {
      const lastMessage = messages.find(
        (msg) => msg.senderId === p.id || msg.receiverId === p.id,
      );
      return { ...p, lastMessage };
    });
    return result
  }

  // Remove User message...
  async removeMessage(userId: string, messageId: string) {
    // find the message
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    // if not found, throw error
    if (!message) {
      throw new Error('Message not found');
    }
    // check if current user is either sender or receiver
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new Error('You are not allowed to delete this message');
    }
    // delete the message
    await this.prisma.message.delete({
      where: { id: messageId },
    });
    return null
  }
}
