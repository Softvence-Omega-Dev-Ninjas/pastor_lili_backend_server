import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { ChatController } from './chat.controller';


@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
  ],
  controllers:[ChatController],
  providers: [ChatGateway, ChatService, PrismaService],
  exports:[ChatGateway]
})
export class ChatModule {}
