import { Controller, Post, Body, UseGuards, Req, Headers, Res, Patch, Param, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { handleRequest } from 'src/common/utils/handle.request';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApproveBookingDto } from './dto/approve.booking.dto';

@ApiTags("Bookings")
@Controller('bookings')
export class BookingsController {
    constructor(private bookingsService: BookingsService, private config: ConfigService) { }

    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
        return handleRequest(
            () => this.bookingsService.createBooking(userId, dto),
            'Booking Created successfully',
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
    @ApiOperation({ summary: "Protected Route For (ADMIN)" })
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @Patch(':id/confirm')
    adminConfirm(@Param('id') id: string, @Body() dto: ApproveBookingDto) {
        console.log(dto.approve)
        return this.bookingsService.adminConfirm(id, dto.approve);
    }

    // Booking list By Status category
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    @Get('my-bookings')
    @ApiOperation({ summary: 'Get user bookings grouped as upcoming, completed, and pending' })
    @ApiResponse({ status: 200, description: 'Returns categorized bookings for the user.' })
    async getMyBookings(@GetUser('id') userId: string) {
        return handleRequest(
            () => this.bookingsService.getBookingsByCategory(userId),
            'Get Booking successfully',
        );
    }
}
