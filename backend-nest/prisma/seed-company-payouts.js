const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding realistic Company Payouts...');

  const companies = await prisma.company.findMany({
    take: 4,
    orderBy: { id: 'asc' },
  });

  if (companies.length === 0) {
    console.log('No companies found to attach payouts to.');
    return;
  }

  const c1 = companies[0];
  const c2 = companies.length > 1 ? companies[1] : c1;
  const c3 = companies.length > 2 ? companies[2] : c1;
  const c4 = companies.length > 3 ? companies[3] : c1;

  // 1. Ensure KHQR and Payment Method for Company 1
  const khqrUrl =
    'https://res.cloudinary.com/dopn7ivcj/image/upload/v1788276282/service_finder/i2d7jqqi7yzhg8ppkubp.jpg';
  await prisma.company.update({
    where: { id: c1.id },
    data: { khqrImageUrl: khqrUrl },
  });

  const existingPm1 = await prisma.companyPaymentMethod.findFirst({
    where: { companyId: c1.id },
  });
  if (!existingPm1) {
    await prisma.companyPaymentMethod.create({
      data: {
        companyId: c1.id,
        type: 'ABA Bank',
        accountName: c1.name,
        accountNumber: '001 884 921',
        isDefault: true,
        isVerified: true,
        qrCodeUrl: khqrUrl,
      },
    });
  }

  const existingPm2 = await prisma.companyPaymentMethod.findFirst({
    where: { companyId: c2.id },
  });
  if (!existingPm2) {
    await prisma.companyPaymentMethod.create({
      data: {
        companyId: c2.id,
        type: 'Wing Bank',
        accountName: c2.name,
        accountNumber: '098 765 432',
        isDefault: true,
        isVerified: true,
      },
    });
  }

  // 2. Clear any old payout dummy rows if count is 0 or check
  const currentPayouts = await prisma.payout.count({ where: { payoutType: 'company' } });
  if (currentPayouts === 0) {
    const now = Date.now();
    const oneHour = 3600 * 1000;
    const oneDay = 24 * oneHour;

    await prisma.payout.createMany({
      data: [
        {
          companyId: c1.id,
          payoutType: 'company',
          amount: 450.00,
          status: 'pending',
          method: 'ABA KHQR',
          requestedAt: new Date(now - 2 * oneHour),
        },
        {
          companyId: c2.id,
          payoutType: 'company',
          amount: 1250.00,
          status: 'pending',
          method: 'Wing Bank',
          requestedAt: new Date(now - 1 * oneDay),
        },
        {
          companyId: c3.id,
          payoutType: 'company',
          amount: 890.00,
          status: 'completed',
          method: 'ABA Bank',
          transactionId: 'TXN-882941',
          requestedAt: new Date(now - 4 * oneDay),
          processedAt: new Date(now - 3 * oneDay),
        },
        {
          companyId: c4.id,
          payoutType: 'company',
          amount: 320.00,
          status: 'completed',
          method: 'Bakong Transfer',
          transactionId: 'TXN-719302',
          requestedAt: new Date(now - 7 * oneDay),
          processedAt: new Date(now - 6 * oneDay),
        },
      ],
    });
    console.log('Successfully seeded 4 realistic Company Payouts!');
  } else {
    console.log(`Company payouts already present: ${currentPayouts}`);
  }

  const finalCount = await prisma.payout.count({ where: { payoutType: 'company' } });
  console.log('Total Company Payouts in DB:', finalCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
