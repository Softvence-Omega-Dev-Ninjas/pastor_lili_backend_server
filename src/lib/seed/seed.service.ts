import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly adminEmail: string;
  private readonly adminPass: string;
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.adminEmail = this.config.getOrThrow('ADMIN_EMAIL');
    this.adminPass = this.config.getOrThrow('ADMIN_PASS');
  }

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: this.adminEmail },
    });

    if (existingAdmin) {
      await this.prisma.user.update({
        where: {
          id: existingAdmin.id,
        },
        data: {
          role: 'SUPERADMIN',
        },
      });

      this.logger.log(`Admin already exists: ${this.adminEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(this.adminPass, 10);

    await this.prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: this.adminEmail,
        password: hashedPassword,
        verified: true,
        role: 'SUPERADMIN',
      },
    });

    this.logger.log(`Admin seeded successfully: ${this.adminEmail}`);
  }
}
