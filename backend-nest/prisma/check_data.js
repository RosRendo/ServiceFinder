const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({where: {email: 'jake.eco@staff.com'}});
  const staff = await prisma.companyStaff.findFirst({where:{userId: user.id}});
  const bookings = await prisma.booking.findMany({where:{assignedStaffId: staff.id, status: 'confirmed'}});
  console.log("Bookings for Jake:", bookings.length);
  if (bookings.length > 0) {
    console.log("Booking ID:", bookings[0].id);
    console.log("Booking Status:", bookings[0].status);
  }
}
main().finally(()=>prisma.$disconnect());
