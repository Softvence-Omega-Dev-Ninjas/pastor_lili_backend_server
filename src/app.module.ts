import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './main/prisma/prisma.module';
import { AuthModule } from './main/auth/auth.module';
import { UsersModule } from './main/users/users.module';
import { SpacesModule } from './main/spaces/spaces.module';
import { BookingsModule } from './main/bookings/bookings.module';
import { ChatModule } from './main/chat/chat.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SpacesModule,
    BookingsModule,
    ChatModule
  ]
})
export class AppModule {}
