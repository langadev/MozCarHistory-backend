import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const adapter = new PrismaPg({
      connectionString: dbUrl,
    });
    super({ adapter });
  }
}
