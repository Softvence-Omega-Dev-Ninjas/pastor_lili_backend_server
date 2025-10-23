import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private stripe: Stripe;
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const stripeSecret = this.config.get<string>('STRIPE_SECRET');
    if (!stripeSecret) throw new Error('Missing STRIPE_SECRET');

    this.stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-09-30.clover', // <- updated version
    });
  }
  // create booking
  async createBooking(userId: string, dto: CreateBookingDto) {
    // check overlap simple
    const overlap = await this.prisma.booking.findFirst({
      where: {
        spaceId: dto.spaceId,
        AND: [
          { startTime: { lt: new Date(dto.endTime) } },
          { endTime: { gt: new Date(dto.startTime) } },
        ],
      },
    });
    if (overlap)
      throw new BadRequestException('Space already booked for selected time');

    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space is Not Found.');
    }
    // Ensure capacity is available
    if (space.capacity === null || space.capacity <= 0) {
      throw new BadRequestException('Space is full — no capacity available.');
    }
    // calculate booking amount(business logic)
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end <= start)
      throw new BadRequestException('End time must be after start time');

    // duration in hours (fractional hours allowed)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Total amount = price per hour * duration
    const totalAmount = durationHours * space.price;

    // create booking
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        amount: totalAmount,
        status: 'PENDING',
      },
    });

    //  reduce space capacity
    await this.prisma.space.update({
      where: { id: dto.spaceId },
      data: { capacity: { decrement: 1 } }, // reduce by 1 seat
    });

    // create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects cents
      currency: 'usd',
      metadata: { bookingId: booking.id },
    });
    // save payment info in database
    await this.prisma.payment.create({
      data: {
        stripePaymentId: paymentIntent.id,
        bookingId: booking.id,
        amount: totalAmount,
        status: paymentIntent.status,
      },
    });
    // prepare return data..
    const fullBooking = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        space: {
          select: { id: true, title: true, price: true, capacity: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
        Payment: {
          select: {
            id: true,
            stripePaymentId: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    return { clientSecret: paymentIntent.client_secret, booking: fullBooking };
  }

  // web hook.....
  async handleStripeWebhook(
    rawBody: Buffer,
    sig: string,
    endpointSecret: string,
  ) {
    console.log(rawBody, 'Payload');
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = pi.metadata?.bookingId;
      await this.prisma.payment.update({
        where: { stripePaymentId: pi.id },
        data: { status: 'succeeded' },
      });
      if (bookingId)
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'COMPLETED', paymentId: pi.id },
        });
    }
    return { received: true };
  }

  //    Admin Accept booking.
  async adminConfirm(bookingId: string, approve: boolean) {
    const status = approve ? 'APPROVED' : 'REJECTED';
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // DONE -------upcoming, past , complete
  // users booking list
  async getBookingsByCategory(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User is Not Found.');
    }
    const now = new Date();

    const [upcoming, completed, pending] = await Promise.all([
      // UPCOMING BOOKINGS
      this.prisma.booking.findMany({
        where: {
          userId,
          status: BookingStatus.APPROVED,
          startTime: { gt: now },
        },
        include: {
          space: true,
          Payment: true,
        },
        orderBy: { startTime: 'asc' },
      }),

      // COMPLETED BOOKINGS
      this.prisma.booking.findMany({
        where: {
          userId,
          OR: [
            { status: BookingStatus.COMPLETED },
            {
              status: BookingStatus.APPROVED,
              endTime: { lt: now },
            },
          ],
        },
        include: {
          space: true,
          Payment: true,
        },
        orderBy: { endTime: 'desc' },
      }),

      // PENDING BOOKINGS
      this.prisma.booking.findMany({
        where: {
          userId,
          status: BookingStatus.PENDING,
        },
        include: {
          space: true,
          Payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { upcoming, completed, pending };
  }
}
