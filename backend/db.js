import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Create the adapter with connection credentials
const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'weekly_reports_db',
    connectionLimit: 10
});

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

export default prisma;