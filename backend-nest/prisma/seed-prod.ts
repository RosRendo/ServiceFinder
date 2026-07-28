import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PRODUCTION database with Super Admin only...');
  const pw = await bcrypt.hash('password123', 10);

  // ── 1. Super Admin ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@example.com' }, update: {},
    create: { fullName: 'Super Admin', email: 'admin@example.com', passwordHash: pw, role: 'admin' },
  });

  console.log('Production seeding completed successfully.');
  console.log('You can now log in at /admin/login with admin@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
