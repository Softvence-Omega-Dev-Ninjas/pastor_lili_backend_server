import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({})
  ],
  providers: [ChatGateway, ChatService, PrismaService],
  exports:[ChatGateway]
})
export class ChatModule {}
