import { Controller, Post, Body, UseGuards, Req, Headers, Res, Patch, Param, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { handleRequest } from 'src/common/utils/handle.request';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags("Bookings")
@Controller('bookings')
export class BookingsController {
    constructor(private bookingsService: BookingsService, private config: ConfigService) { }

    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@GetUser('id') userId: string, @Body() dto: CreateBookingDto) {
        console.log(userId, dto)
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
    @ApiOperation({summary: "Protected Route For (ADMIN)"})
    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @Patch(':id/confirm')
    adminConfirm(@Param('id') id: string, @Body('approve') approve: boolean) {
        return this.bookingsService.adminConfirm(id, approve);
    }

    @ApiBearerAuth("JWT-auth")
    @UseGuards(JwtAuthGuard)
    @Get('me/')
    myBookings(@GetUser('id') userId:string) {
        return this.bookingsService.listForUser(userId);
    }
}
