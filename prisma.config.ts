import dotenv from 'dotenv';
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

dotenv.config();

export default {
  schema: path.join('prisma', 'models'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  views: {
    path: path.join('prisma', 'views'),
  },
  typedSql: {
    path: path.join('prisma', 'queries'),
  },
  experimental: {
    studio: true,
    adapter: true,
    externalTables: true,
  },
} satisfies PrismaConfig;
