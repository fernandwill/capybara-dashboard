import {PrismaClient} from '@prisma/client';

type PrismaGlobal = typeof globalThis & { prisma?: PrismaClient };

// SAFETY: dev hot reload re-evaluates this module per reload; only globalThis
// survives, so the singleton lives there and no other value ever assigns it.
const globalForPrisma = globalThis as PrismaGlobal;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
