import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client"; // adjust path if needed

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
export const prisma = new PrismaClient({ adapter });

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
