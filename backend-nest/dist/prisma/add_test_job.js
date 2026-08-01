"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.booking.updateMany({
        where: { status: { in: ['pending', 'confirmed', 'in_progress', 'arrived'] } },
        data: { status: 'completed' }
    });
    const staffMembers = await prisma.companyStaff.findMany({ include: { user: true } });
    if (staffMembers.length === 0) {
        console.error("No staff members found.");
        return;
    }
    for (const staff of staffMembers) {
        const service = await prisma.service.findFirst({ where: { companyId: staff.companyId } });
        const customer = await prisma.user.findFirst({ where: { role: 'customer' } });
        if (!service || !customer)
            continue;
        for (let i = 1; i <= 5; i++) {
            const booking = await prisma.booking.create({
                data: {
                    customerId: customer.id,
                    companyId: staff.companyId,
                    serviceId: service.id,
                    assignedStaffId: staff.id,
                    status: 'confirmed',
                    bookingDate: new Date(),
                    startTime: new Date(new Date().getTime() + (i * 2) * 60 * 60 * 1000),
                    endTime: new Date(new Date().getTime() + (i * 2 + 1) * 60 * 60 * 1000),
                    serviceAddress: `Test Job ${i} - ${i * 10} Tech St`,
                    latitude: 11.5564 + (i * 0.01),
                    longitude: 104.9282 + (i * 0.01),
                    totalPrice: 40.00 + (i * 5),
                    platformFee: 4.50,
                    companyEarnings: 20.00,
                    staffEarnings: 20.50
                }
            });
            console.log(`Created test job ${i} for ${staff.user.email} (ID: ${booking.id})`);
        }
    }
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
//# sourceMappingURL=add_test_job.js.map