import { Module } from '@nestjs/common';
import { ReviewsController } from './review.controller';
import { ReviewsService } from './review.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';


@Module({
    controllers: [ReviewsController],
    providers: [ReviewsService, PrismaService],
})
export class ReviewsModule { }
