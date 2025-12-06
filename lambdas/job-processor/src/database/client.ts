import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client for Lambda
 * Design: Reuses connection across warm Lambda invocations
 *
 * Important: Lambda containers are reused, so we maintain a single
 * Prisma instance to avoid exhausting database connections
 */
let prisma: PrismaClient | undefined;

/**
 * Get or create Prisma client instance
 *
 * @returns Singleton PrismaClient instance
 */
export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    console.log('Prisma client initialized');
  }

  return prisma;
}

/**
 * Close database connection
 * Call during Lambda shutdown for graceful cleanup
 */
export async function closeDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
    console.log('Prisma client disconnected');
  }
}
