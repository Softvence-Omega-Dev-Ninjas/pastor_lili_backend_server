import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@local.com' },
    update: {},
    create: {
      fullName: 'Admin',
      email: 'admin@local.com',
      password,
      verified: true,
      role: 'ADMIN'
    }
  });

  await prisma.space.createMany({
    data: [
      {
        id: 'space-1',
        title: 'Commercial Kitchen',
        description: 'Perfect for cooking classes',
        price: 40,
        capacity: 10,
        images: ['kitchen1.jpg','kitchen2.jpg'],
        amenities: ['WiFi','AC']
      },
      {
        id: 'space-2',
        title: 'Fellowship Hall',
        description: 'Spacious hall for events',
        price: 60,
        capacity: 200,
        images: ['hall1.jpg'],
        amenities: ['Projector','Stage']
      }
    ]
  });

  console.log('Database seeded successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
