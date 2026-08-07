import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Ensure BigInt can be serialized to JSON safely
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL +
            (process.env.DATABASE_URL?.includes('?') ? '&' : '?') +
            'connection_limit=5&pool_timeout=30',
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
