import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';

@Injectable()
export class BookingsService {
    private stripe: Stripe;
    constructor(private prisma: PrismaService, private config: ConfigService) {
        const stripeSecret = this.config.get<string>('STRIPE_SECRET');
        if (!stripeSecret) throw new Error('Missing STRIPE_SECRET');

        this.stripe = new Stripe(stripeSecret, {
            apiVersion: '2025-09-30.clover', // <- updated version
        });
    }


    async createBooking(userId: string, dto: CreateBookingDto) {
        // check overlap simple
        const overlap = await this.prisma.booking.findFirst({
            where: {
                spaceId: dto.spaceId,
                AND: [
                    { startTime: { lt: new Date(dto.endTime) } },
                    { endTime: { gt: new Date(dto.startTime) } }
                ]
            }
        });
        if (overlap) throw new BadRequestException('Space already booked for selected time');

        const booking = await this.prisma.booking.create({
            data: {
                userId,
                spaceId: dto.spaceId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                amount: dto.amount,
                status: 'PENDING'
            }
        });

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(dto.amount * 100),
            currency: 'usd',
            metadata: { bookingId: booking.id }
        });

        await this.prisma.payment.create({
            data: {
                stripePaymentId: paymentIntent.id,
                bookingId: booking.id,
                amount: dto.amount,
                status: paymentIntent.status
            }
        });

        return { clientSecret: paymentIntent.client_secret, bookingId: booking.id };
    }

    async handleStripeWebhook(rawBody: Buffer, sig: string, endpointSecret: string) {
        console.log(rawBody, "Payload");
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
        } catch (err) {
            throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }

        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object as Stripe.PaymentIntent;
            const bookingId = pi.metadata?.bookingId;
            await this.prisma.payment.update({ where: { stripePaymentId: pi.id }, data: { status: 'succeeded' } });
            if (bookingId) await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'PENDING', paymentId: pi.id } });
        }

        return { received: true };
    }

    async adminConfirm(bookingId: string, approve: boolean) {
        const status = approve ? 'APPROVED' : 'REJECTED';
        return this.prisma.booking.update({ where: { id: bookingId }, data: { status } });
    }

    async listForUser(userId: string) {
        return this.prisma.booking.findMany({ where: { userId }, include: { space: true } });
    }
}
