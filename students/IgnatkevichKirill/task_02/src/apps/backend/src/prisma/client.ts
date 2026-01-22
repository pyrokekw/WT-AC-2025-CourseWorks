import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // гарантируем загрузку .env

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL отсутствует в .env файле');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Создаём один экземпляр PrismaClient с adapter
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'], // опционально, для дебага
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

export default prisma;