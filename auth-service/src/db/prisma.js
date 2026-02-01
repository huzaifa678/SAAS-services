const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
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

module.exports = prisma;
