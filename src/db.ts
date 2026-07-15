import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

/**
 * Returns a Prisma client instance extended to set request.jwt.claims in PostgreSQL.
 * This is used to make Prisma operations respect Supabase RLS policies.
 */
export function getPrismaForUser(userId: string, role = 'authenticated') {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const claims = JSON.stringify({ sub: userId, role });
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

/**
 * Returns a Prisma client instance extended to set the role claim only.
 * Useful for public content reads like categories, words, and badges.
 */
export function getPrismaForRole(role: 'authenticated' | 'admin' | 'anon') {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const claims = JSON.stringify({ role });
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

export default prisma;
