import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'staff@servicefinder.com';
  const password = 'password123';
  const fullName = 'My Staff Account';

  console.log(`Checking if staff user ${email} exists...`);
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
    
    // Check if they are linked as company staff
    const staffLink = await prisma.companyStaff.findFirst({
      where: { userId: existingUser.id },
    });

    if (staffLink) {
      console.log(`Staff is already linked to Company ID: ${staffLink.companyId}`);
      return;
    }

    // Link to first company if not already linked
    const firstCompany = await prisma.company.findFirst();
    if (!firstCompany) {
      console.log('No company found to link staff to.');
      return;
    }

    await prisma.companyStaff.create({
      data: {
        companyId: firstCompany.id,
        userId: existingUser.id,
        role: 'worker' as any,
        status: 'active',
      },
    });
    console.log(`Linked existing user to company ${firstCompany.name}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const firstCompany = await prisma.company.findFirst();
  if (!firstCompany) {
    console.log('No company found to link staff to.');
    return;
  }

  // Create user and link inside a transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: 'staff',
        phone: '+1234567890',
        status: 'active',
      },
    });

    await tx.companyStaff.create({
      data: {
        companyId: firstCompany.id,
        userId: user.id,
        role: 'worker' as any,
        status: 'active',
      },
    });

    console.log(`Successfully created staff account ${email} and linked to company ${firstCompany.name}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
