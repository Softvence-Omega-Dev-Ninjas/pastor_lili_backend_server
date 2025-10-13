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
  
  async sendOtp(to: string, otp: string, subject = 'Your Verification Code') {
    const html = `
    <div style="
      font-family: Arial, sans-serif;
      background-color: #f4f7fb;
      padding: 40px 0;
      text-align: center;
      color: #333;
    ">
      <div style="
        background-color: #ffffff;
        max-width: 480px;
        margin: auto;
        border-radius: 12px;
        padding: 30px 40px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      ">
        <h2 style="color: #2b6cb0; margin-bottom: 20px;">🔐 Email Verification</h2>
        <p style="font-size: 16px; margin-bottom: 10px;">
          Please use the OTP code below to verify your account:
        </p>
        <div style="
          background-color: #f0f4ff;
          display: inline-block;
          padding: 15px 30px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <span style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #2b6cb0;
          ">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #555;">
          This code will expire in <b>5 minutes</b>.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">
          If you didn’t request this code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

    await this.transporter.sendMail({
      to,
      subject,
      html,
      from: process.env.EMAIL_USER,
    });
  }

  async forgetPassOtp(to: string, otp: string, subject = 'Reset Your Password') {
    const html = `
    <div style="
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f5f7fb;
      padding: 40px 0;
      text-align: center;
      color: #333;
    ">
      <div style="
        background-color: #ffffff;
        max-width: 480px;
        margin: auto;
        border-radius: 12px;
        padding: 30px 40px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      ">
        <h2 style="color: #d97706; margin-bottom: 20px;">🔑 Password Reset Request</h2>
        <p style="font-size: 16px; margin-bottom: 10px;">
          We received a request to reset your password. Use the OTP below to proceed:
        </p>
        <div style="
          background-color: #fff7ed;
          display: inline-block;
          padding: 15px 30px;
          border-radius: 8px;
          margin: 20px 0;
        ">
          <span style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #d97706;
          ">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #555;">
          This code will expire in <b>5 minutes</b>. Please do not share it with anyone.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">
          Didn’t request a password reset? You can safely ignore this email.
        </p>
      </div>
    </div>
  `;

    await this.transporter.sendMail({
      to,
      subject,
      html,
      from: process.env.EMAIL_USER,
    });
  }

}
