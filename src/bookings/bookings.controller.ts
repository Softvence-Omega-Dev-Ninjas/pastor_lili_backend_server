import { Controller, Post, Body, UseGuards, Req, Headers, Res, Patch, Param, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { handleRequest } from 'src/common/utils/handle.request';

@ApiTags("Bookings")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
    constructor(private bookingsService: BookingsService, private config: ConfigService) { }

    @Post()
    create(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
        console.log(userId, dto)
          return handleRequest(
              () => this.bookingsService.createBooking(userId, dto),
              'Added Bookingd successfully',
            );
    }

    // Stripe webhook - expects raw body; route registered in main.ts as raw.
    @Post('webhook')
    async webhook(@Req() req: any, @Headers('stripe-signature') sig: string, @Res() res: Response) {
        const endpointSecret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            throw new Error("Missing Stripe Webhook Secret!");
        }
        const rawBody = req.body; // express.raw set in main.ts for this route
        const result = await this.bookingsService.handleStripeWebhook(rawBody, sig, endpointSecret);
        return res.json(result);
    }

    // admin confirm (protect with role guard in route in real project)
    @Patch(':id/confirm')
    adminConfirm(@Param('id') id: string, @Body('approve') approve: boolean) {
        return this.bookingsService.adminConfirm(id, approve);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    myBookings(@Req() req: any) {
        return this.bookingsService.listForUser(req.user.sub);
    }
}
