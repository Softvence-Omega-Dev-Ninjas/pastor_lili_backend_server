import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor(private readonly config: ConfigService) {
    this.client = new Twilio(
      this.config.get<string>('TWILIO_ACCOUNT_SID'),
      this.config.get<string>('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendOtp(phone: string, otp: string) {
    try {
      await this.client.messages.create({
        body: `Your OTP code is ${otp}. It expires in 5 minutes.`,
        from: this.config.get<string>('TWILIO_PHONE_NUMBER'),
        to: phone.startsWith('+') ? phone : `+${phone}`,
      });
      return true;
    } catch (error) {
      console.error('Twilio error:', error);
      throw new InternalServerErrorException('Failed to send OTP via SMS');
    }
  }
}
