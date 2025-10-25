import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  Res,
  Patch,
  Param,
  Get,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { handleRequest } from 'src/common/utils/handle.request';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApproveBookingDto } from './dto/approve.booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private config: ConfigService,
  ) { }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return handleRequest(
      () => this.bookingsService.createBooking(userId, dto),
      'Booking Created successfully',
    );
  }

  // admin confirm (protect with role guard in route in real project)
  @ApiOperation({ summary: 'Protected Route For (ADMIN)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('/')
  async findAllBooking() {
    return handleRequest(
      () => this.bookingsService.findAllBooking(),
      'Get All Booking successfully',
    );
  }


  // Stripe webhook - expects raw body; route registered in main.ts as raw.
  @Post('webhook')
  async webhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
    @Res() res: Response,
  ) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      console.error('❌ Missing Stripe Webhook Secret!');
      return res.status(500).send('Server configuration error');
    }

    const rawBody = req.body;

    try {
      const result = await this.bookingsService.handleStripeWebhook(
        rawBody,
        sig,
        endpointSecret,
      );
      return res.json(result);
    } catch (err) {
      console.error('❌ Webhook handler error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }


  // admin confirm (protect with role guard in route in real project)
  @ApiOperation({ summary: 'Protected Route For (ADMIN)' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id/confirm')
  adminConfirm(@Param('id') id: string, @Body() dto: ApproveBookingDto) {
    return this.bookingsService.adminConfirm(id, dto.approve);
  }

  // Booking list By Status category
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  @ApiOperation({
    summary: 'Get user bookings grouped as upcoming, completed, and pending',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns categorized bookings for the user.',
  })
  async getMyBookings(@GetUser('id') userId: string) {
    return handleRequest(
      () => this.bookingsService.getBookingsByCategory(userId),
      'Get Booking successfully',
    );
  }
}
