import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // create reviews...
  async createReview(userId: string, dto: CreateReviewDto) {
    //  Check if space exists
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });
    if (!space) throw new NotFoundException('Space not found.');

    if (space.ownerId === userId) {
      throw new BadRequestException('You cannot review your own space.');
    }

    //  Check if user has completed a paid booking
    const completedBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        spaceId: dto.spaceId,
        status: 'COMPLETED',
        Payment: {
          some: {
            status: 'succeeded', // Stripe payment success
          },
        },
      },
      include: { Payment: true },
    });

    if (!completedBooking)
      throw new BadRequestException(
        'You can only review after completing and paying for a booking.',
      );

    //  Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        space: {
          select: { id: true, title: true },
        },
      },
    });

    return {
      message: 'Review added successfully',
      review,
    };
  }

  // get space reviews
  async getSpaceReviews(spaceId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { spaceId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      spaceId,
      totalReviews: reviews.length,
      reviews,
    };
  }
}
