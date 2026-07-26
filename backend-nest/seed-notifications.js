const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { role: 'company_admin' }
  });

  if (!user) {
    console.log("No company admin found");
    return;
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: 'New Booking Request',
        body: 'John Doe has requested a standard cleaning service.',
        type: 'info',
        link: '/company/bookings'
      },
      {
        userId: user.id,
        title: 'Booking Cancelled',
        body: 'Booking #SF-041 has been cancelled by the customer.',
        type: 'alert'
      },
      {
        userId: user.id,
        title: 'Staff Verification Complete',
        body: 'Maria Chen has been successfully verified.',
        type: 'success',
        link: '/company/staff'
      },
      {
        userId: user.id,
        title: 'Payout Processed',
        body: 'Your payout of $450.00 has been successfully processed.',
        type: 'success',
        link: '/company/payouts'
      },
      {
        userId: user.id,
        title: 'System Maintenance',
        body: 'The platform will be undergoing scheduled maintenance tonight at 2AM.',
        type: 'system'
      }
    ]
  });

  console.log('Created notifications for user', user.id);
}

run().catch(console.error).finally(() => prisma.$disconnect());
