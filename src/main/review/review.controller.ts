import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './review.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { handleRequest } from 'src/common/utils/handle.request';

@ApiTags('Reviews')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Create A Review.
  @Post()
  async createReview(
    @GetUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return handleRequest(
      () => this.reviewsService.createReview(userId, dto),
      'Review Created successfully',
    );
  }

  //  Get all reviews for a space
  @Get(':spaceId')
  async getSpaceReviews(@Param('spaceId') spaceId: string) {
    return handleRequest(
      () => this.reviewsService.getSpaceReviews(spaceId),
      'Get One Space All Review successfully',
    );
  }
}
