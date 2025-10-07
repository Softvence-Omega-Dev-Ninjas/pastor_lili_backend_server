import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }

  async sendOtp(to: string, otp: string, subject = 'Your verification OTP') {
    const html = `<p>Your OTP code: <b>${otp}</b></p><p>It will expire in 10 minutes.</p>`;
    await this.transporter.sendMail({
      to,
      subject,
      html,
      from: process.env.EMAIL_USER
    });
  }

  async forgetPassOtp(to:string, otp: string, subject = "Your Forget Password OTP"){
     const html = `<p>Your OTP code: <b>${otp}</b></p><p>It will expire in 10 minutes.</p>`;
    await this.transporter.sendMail({
      to,
      subject,
      html,
      from: process.env.EMAIL_USER
    });
  }
}
