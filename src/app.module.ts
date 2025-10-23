import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './main/auth/auth.module';
import { UsersModule } from './main/users/users.module';
import { SpacesModule } from './main/spaces/spaces.module';
import { BookingsModule } from './main/bookings/bookings.module';
import { ChatModule } from './main/chat/chat.module';
import { PrismaModule } from './lib/prisma/prisma.module';
import { CloudinaryModule } from './lib/cloudinary/cloudinary.module';
import { ReviewsModule } from './main/review/review.module';
import { AppController } from './app.controller';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SpacesModule,
    BookingsModule,
    ChatModule,
    CloudinaryModule,
    ReviewsModule,
  
  ],
  controllers: [AppController],
})
export class AppModule {}
