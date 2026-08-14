import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, logoUrl: true }
  });
  console.log("=== COMPANIES ===");
  console.log(companies);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
