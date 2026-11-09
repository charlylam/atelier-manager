import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Prisma 7 : l'adapter gère la connexion réelle à PostgreSQL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Instance unique du client, réutilisée dans toute l'application.
export const prisma = new PrismaClient({ adapter });
