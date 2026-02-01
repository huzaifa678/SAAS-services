import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({
    adapter,
    log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
    ],
});

prisma.$on('query', (e) => {
  console.log(`Prisma Query: ${e.query} — Params: ${e.params}`);
});
prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});
prisma.$on('warn', (e) => {
  console.warn('Prisma Warning:', e);
});
prisma.$on('info', (e) => {
  console.info('Prisma Info:', e);
});

export default prisma;
