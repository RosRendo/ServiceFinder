import { PrismaClient, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('password123', 10);

  // ── 1. Categories ────────────────────────────────────────────────────────
  const cats = [
    { name: 'Cleaning',   slug: 'cleaning',   icon: 'Sparkles',      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop', displayOrder: 1 },
    { name: 'Repair',     slug: 'repair',      icon: 'Wrench',        imageUrl: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop', displayOrder: 2 },
    { name: 'Garden',     slug: 'garden',      icon: 'TreeDeciduous', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop', displayOrder: 3 },
    { name: 'Painting',   slug: 'painting',    icon: 'Filter',        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop', displayOrder: 4 },
    { name: 'Electrical', slug: 'electrical',  icon: 'Zap',           imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45249ff9e?q=80&w=600&auto=format&fit=crop', displayOrder: 5 },
    { name: 'Plumbing',   slug: 'plumbing',    icon: 'Droplets',      imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600&auto=format&fit=crop', displayOrder: 6 },
  ];
  for (const c of cats) await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  const catMap = Object.fromEntries((await prisma.category.findMany()).map(c => [c.slug, c]));

  // ── 2. Service Types ──────────────────────────────────────────────────────
  const stypes = [
    { slug: 'deep-cleaning',     name: 'Deep Cleaning',        categoryId: catMap['cleaning'].id, imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff212f55bd9?q=80&w=600&auto=format&fit=crop' },
    { slug: 'regular-cleaning',  name: 'Regular Cleaning',     categoryId: catMap['cleaning'].id, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
    { slug: 'move-out-cleaning', name: 'Move-out Cleaning',    categoryId: catMap['cleaning'].id, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' },
    { slug: 'window-cleaning',   name: 'Window Cleaning',      categoryId: catMap['cleaning'].id, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
    { slug: 'lawn-care',         name: 'Lawn Care',            categoryId: catMap['garden'].id, imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop' },
    { slug: 'tree-trimming',     name: 'Tree Trimming',        categoryId: catMap['garden'].id, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' },
    { slug: 'landscaping',       name: 'Landscaping',          categoryId: catMap['garden'].id, imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop' },
    { slug: 'furniture-repair',  name: 'Furniture Repair',     categoryId: catMap['repair'].id, imageUrl: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop' },
    { slug: 'appliance-repair',  name: 'Appliance Repair',     categoryId: catMap['repair'].id, imageUrl: 'https://images.unsplash.com/photo-1626808642875-0aa54546506d?q=80&w=600&auto=format&fit=crop' },
    { slug: 'door-window-fix',   name: 'Door & Window Fix',    categoryId: catMap['repair'].id, imageUrl: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop' },
    { slug: 'interior-painting', name: 'Interior Painting',    categoryId: catMap['painting'].id, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop' },
    { slug: 'exterior-painting', name: 'Exterior Painting',    categoryId: catMap['painting'].id, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop' },
    { slug: 'wiring',            name: 'Wiring & Installation', categoryId: catMap['electrical'].id, imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45249ff9e?q=80&w=600&auto=format&fit=crop' },
    { slug: 'lighting',          name: 'Lighting Setup',       categoryId: catMap['electrical'].id, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop' },
    { slug: 'pipe-repair',       name: 'Pipe Repair',          categoryId: catMap['plumbing'].id, imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600&auto=format&fit=crop' },
    { slug: 'drain-cleaning',    name: 'Drain Cleaning',       categoryId: catMap['plumbing'].id, imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop' },
  ];
  for (const s of stypes) await prisma.serviceType.upsert({ where: { slug: s.slug }, update: {}, create: s });
  const stMap = Object.fromEntries((await prisma.serviceType.findMany()).map(s => [s.slug, s]));

  // ── 3. Users ──────────────────────────────────────────────────────────────
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer@example.com' }, update: {},
    create: { fullName: 'Alex Johnson', email: 'customer@example.com', passwordHash: pw, role: 'customer', phone: '+855 12 345 678' },
  });
  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' }, update: {},
    create: { fullName: 'Maria Santos', email: 'customer2@example.com', passwordHash: pw, role: 'customer', phone: '+855 17 234 567' },
  });
  const customer3 = await prisma.user.upsert({
    where: { email: 'customer3@example.com' }, update: {},
    create: { fullName: 'David Kim', email: 'customer3@example.com', passwordHash: pw, role: 'customer', phone: '+855 15 876 543' },
  });
  await prisma.user.upsert({
    where: { email: 'admin@example.com' }, update: {},
    create: { fullName: 'Super Admin', email: 'admin@example.com', passwordHash: pw, role: 'admin' },
  });

  const ownerDefs = [
    { email: 'owner1@example.com', fullName: 'Sara Cleaning' },
    { email: 'owner2@example.com', fullName: 'Tom Garden' },
    { email: 'owner3@example.com', fullName: 'Mike Woodworks' },
    { email: 'owner4@example.com', fullName: 'Lisa Electric' },
    { email: 'owner5@example.com', fullName: 'Ben Plumbing' },
    { email: 'owner6@example.com', fullName: 'Alex Roofing' },
    { email: 'owner7@example.com', fullName: 'Chris Handy' },
  ];
  const owners = await Promise.all(ownerDefs.map(o =>
    prisma.user.upsert({ where: { email: o.email }, update: {}, create: { ...o, passwordHash: pw, role: 'company_admin' } })
  ));

  // ── 4. Company definitions ────────────────────────────────────────────────
  const companyDefs = [
    {
      name: 'EcoClean Solutions', city: 'Phnom Penh',
      description: 'Professional eco-friendly cleaning for homes and offices.',
      logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1527515637462-cff212f55bd9?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.verified,
      cardHighlights: JSON.stringify(['Eco-friendly', 'Top Rated', 'Same-day']),
      latitude: 11.5625, longitude: 104.916, ownerId: owners[0].id,
      services: [
        { slug: 'deep-cleaning',     name: 'Deep Home Cleaning',      desc: 'Full deep clean of every room.', price: 85, min: 180, max: 240, discountPrice: 70, image: 'https://images.unsplash.com/photo-1527515637462-cff212f55bd9?q=80&w=600&auto=format&fit=crop' },
        { slug: 'regular-cleaning',  name: 'Regular Weekly Clean',    desc: 'Standard weekly cleaning.', price: 45, min: 90, max: 120, image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
        { slug: 'move-out-cleaning', name: 'Move-out Cleaning',       desc: 'Leave your old place spotless.', price: 120, min: 240, max: 300, discountPrice: 100, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' },
        { slug: 'window-cleaning',   name: 'Window & Glass Cleaning', desc: 'Streak-free window cleaning.', price: 35, min: 60, max: 90, image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop' },
      ],
      staff: [
        { name: 'Jake Cooper',   email: 'jake.eco@staff.com',   role: 'worker' as const },
        { name: 'Lily Nguyen',   email: 'lily.eco@staff.com',   role: 'supervisor' as const },
        { name: 'Mark Torres',   email: 'mark.eco@staff.com',   role: 'worker' as const },
      ],
    },
    {
      name: 'GreenThumb Pros', city: 'Phnom Penh',
      description: 'Expert landscaping and gardening services.',
      logoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.verified,
      cardHighlights: JSON.stringify(['Reliable', 'Affordable', 'Green']),
      latitude: 11.5564, longitude: 104.9282, ownerId: owners[1].id,
      services: [
        { slug: 'lawn-care',     name: 'Lawn Maintenance',      desc: 'Mowing, edging and trimming.', price: 45, min: 60, max: 90, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop' },
        { slug: 'tree-trimming', name: 'Tree & Hedge Trimming', desc: 'Professional pruning.', price: 65, min: 90, max: 150, discountPrice: 50, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' },
        { slug: 'landscaping',   name: 'Full Landscape Design', desc: 'Complete garden redesign.', price: 250, min: 480, max: 600, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop' },
      ],
      staff: [
        { name: 'Sam Green',  email: 'sam.garden@staff.com',  role: 'worker' as const },
        { name: 'Aria Lopez', email: 'aria.garden@staff.com', role: 'supervisor' as const },
      ],
    },
    {
      name: 'Elite Woodworks', city: 'Siem Reap',
      description: 'Custom furniture design, repair, and restoration.',
      logoUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.verified,
      cardHighlights: JSON.stringify(['Premium', 'Craftsmanship', 'Custom']),
      latitude: 13.3671, longitude: 103.8448, ownerId: owners[2].id,
      services: [
        { slug: 'furniture-repair', name: 'Furniture Repair & Restore', desc: 'Fix scratches and broken joints.', price: 55, min: 60, max: 120, image: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop' },
        { slug: 'appliance-repair', name: 'Cabinet Installation',       desc: 'Custom cabinet fitting.', price: 180, min: 240, max: 360, discountPrice: 150, image: 'https://images.unsplash.com/photo-1626808642875-0aa54546506d?q=80&w=600&auto=format&fit=crop' },
        { slug: 'door-window-fix',  name: 'Door & Window Frame Fix',   desc: 'Repair sticking doors.', price: 40, min: 45, max: 90, image: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop' },
      ],
      staff: [
        { name: 'Owen Park',    email: 'owen.wood@staff.com',   role: 'worker' as const },
        { name: 'Grace Lim',    email: 'grace.wood@staff.com',  role: 'supervisor' as const },
      ],
    },
    {
      name: 'BrightSpark Electrical', city: 'Phnom Penh',
      description: 'Licensed electricians for residential and commercial work.',
      logoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45249ff9e?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.verified,
      cardHighlights: JSON.stringify(['Licensed', 'Fast Response', 'Safe']),
      latitude: 11.5745, longitude: 104.9009, ownerId: owners[3].id,
      services: [
        { slug: 'wiring',   name: 'Full Wiring Installation',   desc: 'New wiring installation.', price: 150, min: 240, max: 480, discountPrice: 120, image: 'https://images.unsplash.com/photo-1621905251189-08b45249ff9e?q=80&w=600&auto=format&fit=crop' },
        { slug: 'lighting', name: 'Lighting Setup & Repair',    desc: 'Install and fix lighting.', price: 60, min: 90, max: 120, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop' },
      ],
      staff: [
        { name: 'Ethan Clark',  email: 'ethan.spark@staff.com',  role: 'worker' as const },
        { name: 'Nina Patel',   email: 'nina.spark@staff.com',   role: 'supervisor' as const },
      ],
    },
    {
      name: 'FlowMaster Plumbing', city: 'Battambang',
      description: 'Expert plumbers. 24/7 emergency service available.',
      logoUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.verified,
      cardHighlights: JSON.stringify(['24/7 Emergency', 'Licensed', 'Affordable']),
      latitude: 13.0957, longitude: 103.1977, ownerId: owners[4].id,
      services: [
        { slug: 'pipe-repair',    name: 'Pipe Leak Repair',  desc: 'Fix burst or leaking pipes.', price: 75, min: 60, max: 120, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600&auto=format&fit=crop' },
        { slug: 'drain-cleaning', name: 'Drain Unblocking',  desc: 'Clear any blockage fast.', price: 50, min: 45, max: 90, discountPrice: 35, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop' },
      ],
      staff: [
        { name: 'Leo Watts',   email: 'leo.flow@staff.com',   role: 'worker' as const },
        { name: 'Chloe Ross',  email: 'chloe.flow@staff.com', role: 'supervisor' as const },
      ],
    },
    {
      name: 'Skyline Roofing & Repair', city: 'Phnom Penh',
      description: 'Professional roofing services. New roofs, repairs, and inspections.',
      registrationNumber: 'REG-991204',
      email: 'contact@skylineroof.com',
      phone: '+855 12 998 877',
      address: '99 St 2004, Sen Sok, Phnom Penh',
      logoUrl: 'https://images.unsplash.com/photo-1632758808803-12a831e5f80b?q=80&w=400&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1628189871790-21f456c6c21e?q=80&w=800&auto=format&fit=crop',
      verificationStatus: VerificationStatus.pending,
      cardHighlights: JSON.stringify(['Insured', '10 Year Warranty']),
      latitude: 11.5600, longitude: 104.8800, ownerId: owners[5].id,
      services: [],
      staff: [],
    },
    {
      name: 'QuickFix Handyman', city: 'Siem Reap',
      description: 'General handyman services without proper licensing. Needs review.',
      registrationNumber: 'PENDING',
      email: 'quickfixsr@gmail.com',
      phone: '+855 10 223 344',
      logoUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop',
      verificationStatus: VerificationStatus.rejected,
      cardHighlights: JSON.stringify(['Cheap', 'Fast']),
      latitude: 13.3600, longitude: 103.8500, ownerId: owners[6].id,
      services: [],
      staff: [],
    },
  ];

  const customers = [customer1, customer2, customer3];
  const addresses = [
    { addr: '12 Norodom Blvd, Phnom Penh', lat: 11.5696, lng: 104.9210 },
    { addr: '45 Monivong Blvd, Phnom Penh', lat: 11.5566, lng: 104.9280 },
    { addr: '8 Street 271, Phnom Penh', lat: 11.5520, lng: 104.9180 },
    { addr: '101 National Road 6, Siem Reap', lat: 13.3617, lng: 103.8600 },
    { addr: '22 Street 7 Makara, Phnom Penh', lat: 11.5750, lng: 104.9230 },
  ];

  // ── 5. Destroy existing data & rebuild ────────────────────────────────────
  // Order matters for FK constraints
  await prisma.invoice.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingStatusLog.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.companyRatingSummary.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.staffPaymentMethod.deleteMany();
  await prisma.companyStaff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.complianceReport.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.company.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.moderationLog.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedItem.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();


  // ── 6. Create companies, staff, services, bookings ───────────────────────
  let totalBookings = 0;

  for (const def of companyDefs) {
    // Company
    const company = await prisma.company.create({
      data: {
        name: def.name, city: def.city, description: def.description,
        logoUrl: def.logoUrl, coverImageUrl: def.coverImageUrl,
        verificationStatus: def.verificationStatus,
        cardHighlights: def.cardHighlights,
        latitude: def.latitude, longitude: def.longitude,
        ownerId: def.ownerId,
      },
    });

    // Rating summary
    await prisma.companyRatingSummary.create({
      data: {
        companyId: company.id,
        averageRating: parseFloat((4.2 + Math.random() * 0.8).toFixed(2)) as any,
        totalReviews: Math.floor(Math.random() * 300) + 50,
      },
    });

    // Service areas
    await prisma.serviceArea.create({ data: { companyId: company.id, city: def.city, coverageRadiusKm: 15 } });

    // Services
    const services: any[] = [];
    for (const svc of def.services) {
      const st = stMap[svc.slug];
      if (!st) continue;
      const s = await prisma.service.create({
        data: {
          companyId: company.id, serviceTypeId: st.id,
          name: svc.name, description: svc.desc,
          basePrice: svc.price, durationMin: svc.min, durationMax: svc.max,
          isActive: true, discountPrice: (svc as any).discountPrice || null,
          image: svc.image || null,
        },
      });
      services.push(s);
    }

    // Staff
    const staffMembers: any[] = [];
    for (const sd of def.staff) {
      const u = await prisma.user.upsert({
        where: { email: sd.email }, update: {},
        create: { fullName: sd.name, email: sd.email, passwordHash: pw, role: 'staff', phone: '+855 1' + Math.floor(10000000 + Math.random() * 89999999) },
      });
      const cs = await prisma.companyStaff.create({
        data: { companyId: company.id, userId: u.id, role: sd.role, status: 'active' },
      });
      staffMembers.push({ ...cs, user: u });
    }

    // ── 7. Bookings: one of each status per company ────────────────────────
    if (services.length === 0) continue;

    const svc0 = services[0];
    const svc1 = services[Math.min(1, services.length - 1)];
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);
    const threeDaysAgo = new Date(today); threeDaysAgo.setDate(today.getDate() - 3);

    const feeRate = 0.10;
    const makeBooking = (svc: any, price: number) => {
      const fee = parseFloat((price * feeRate).toFixed(2));
      const staffEarnings = parseFloat((price * 0.59).toFixed(2));
      const companyEarnings = parseFloat((price - fee - staffEarnings).toFixed(2));
      return { 
        totalPrice: parseFloat((price + fee).toFixed(2)), 
        platformFee: fee, 
        companyEarnings,
        staffEarnings 
      };
    };

    const testCustomer = customers[0]; // customer@example.com
    const testStaff = staffMembers[0]; // first staff member (e.g. jake)

    // ── PENDING (new, no staff assigned - For Job Board) ─────────────────────────────────
    for (let i = 0; i < 8; i++) {
      const bPending = await prisma.booking.create({
        data: {
          customerId: testCustomer.id, companyId: company.id, serviceId: svc0.id,
          bookingDate: tomorrow,
          startTime: new Date('1970-01-01T09:00:00Z'),
          endTime: new Date('1970-01-01T11:00:00Z'),
          serviceAddress: addresses[i % addresses.length].addr, latitude: addresses[i % addresses.length].lat, longitude: addresses[i % addresses.length].lng,
          status: 'pending',
          ...makeBooking(svc0, Number(svc0.basePrice) + (i * 5)), // slightly vary the price
        },
      });
      await prisma.bookingStatusLog.create({ data: { bookingId: bPending.id, newStatus: 'pending', changedBy: testCustomer.id } });
      await prisma.payment.create({
        data: { bookingId: bPending.id, userId: testCustomer.id, method: 'cash', amount: bPending.totalPrice, status: 'pending' },
      });
      totalBookings++;
    }

    // ── CONFIRMED (staff assigned, waiting to start) ──────────────────────
    const bConfirmed = await prisma.booking.create({
      data: {
        customerId: testCustomer.id, companyId: company.id, serviceId: svc1.id,
        bookingDate: today,
        startTime: new Date('1970-01-01T14:00:00Z'),
        endTime: new Date('1970-01-01T16:00:00Z'),
        serviceAddress: addresses[1].addr, latitude: addresses[1].lat, longitude: addresses[1].lng,
        status: 'confirmed',
        ...makeBooking(svc1, Number(svc1.basePrice)),
      },
    });
    await prisma.bookingStatusLog.create({ data: { bookingId: bConfirmed.id, newStatus: 'pending', changedBy: testCustomer.id } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bConfirmed.id, oldStatus: 'pending', newStatus: 'confirmed', changedBy: def.ownerId } });
    await prisma.payment.create({
      data: { bookingId: bConfirmed.id, userId: testCustomer.id, method: 'cash', amount: bConfirmed.totalPrice, status: 'pending' },
    });

    // ── IN PROGRESS (staff is on-site) ───────────────────────────────────
    const bInProgress = await prisma.booking.create({
      data: {
        customerId: testCustomer.id, companyId: company.id, serviceId: svc0.id,
        bookingDate: today,
        startTime: new Date('1970-01-01T08:00:00Z'),
        endTime: new Date('1970-01-01T10:00:00Z'),
        serviceAddress: addresses[2].addr, latitude: addresses[2].lat, longitude: addresses[2].lng,
        status: 'pending', progressPercent: 0,
        actualStartTime: new Date(),
        ...makeBooking(svc0, Number(svc0.basePrice)),
      },
    });
    await prisma.bookingStatusLog.create({ data: { bookingId: bInProgress.id, newStatus: 'pending', changedBy: testCustomer.id } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bInProgress.id, oldStatus: 'pending', newStatus: 'confirmed', changedBy: def.ownerId } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bInProgress.id, oldStatus: 'confirmed', newStatus: 'in_progress', changedBy: def.ownerId } });
    await prisma.payment.create({
      data: { bookingId: bInProgress.id, userId: testCustomer.id, method: 'cash', amount: bInProgress.totalPrice, status: 'pending' },
    });

    // ── COMPLETED (done, reviewed, paid) ─────────────────────────────────
    const bCompleted = await prisma.booking.create({
      data: {
        customerId: testCustomer.id, companyId: company.id, serviceId: svc1.id,
        assignedStaffId: testStaff.id,
        bookingDate: yesterday,
        startTime: new Date('1970-01-01T10:00:00Z'),
        endTime: new Date('1970-01-01T12:00:00Z'),
        serviceAddress: addresses[3].addr, latitude: addresses[3].lat, longitude: addresses[3].lng,
        status: 'completed', progressPercent: 100,
        actualStartTime: twoDaysAgo,
        actualEndTime: yesterday,
        ...makeBooking(svc1, Number(svc1.basePrice)),
      },
    });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCompleted.id, newStatus: 'pending', changedBy: testCustomer.id } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCompleted.id, oldStatus: 'pending', newStatus: 'confirmed', changedBy: def.ownerId } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCompleted.id, oldStatus: 'confirmed', newStatus: 'in_progress', changedBy: def.ownerId } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCompleted.id, oldStatus: 'in_progress', newStatus: 'completed', changedBy: def.ownerId } });
    await prisma.payment.create({
      data: { bookingId: bCompleted.id, userId: testCustomer.id, method: 'cash', amount: bCompleted.totalPrice, status: 'paid', paidAt: yesterday },
    });
    await prisma.review.create({
      data: {
        bookingId: bCompleted.id, customerId: testCustomer.id,
        companyRating: 5, companyComment: 'Excellent service, very professional!',
        staffId: testStaff.id, staffRating: 5, staffComment: 'Friendly and efficient.',
      },
    });

    // ── CANCELLED ─────────────────────────────────────────────────────────
    const bCancelled = await prisma.booking.create({
      data: {
        customerId: testCustomer.id, companyId: company.id, serviceId: svc0.id,
        bookingDate: threeDaysAgo,
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T11:00:00Z'),
        serviceAddress: addresses[4].addr, latitude: addresses[4].lat, longitude: addresses[4].lng,
        status: 'cancelled',
        ...makeBooking(svc0, Number(svc0.basePrice)),
      },
    });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCancelled.id, newStatus: 'pending', changedBy: testCustomer.id } });
    await prisma.bookingStatusLog.create({ data: { bookingId: bCancelled.id, oldStatus: 'pending', newStatus: 'cancelled', changedBy: testCustomer.id } });
    await prisma.cancellation.create({
      data: { bookingId: bCancelled.id, cancelledBy: testCustomer.id, reason: 'Change of plans, rescheduling later.' },
    });
    await prisma.payment.create({
      data: { bookingId: bCancelled.id, userId: testCustomer.id, method: 'cash', amount: bCancelled.totalPrice, status: 'refunded' },
    });

    totalBookings += 5;
  }

  // ── 7. Admin Dashboard Seed Data (Support, Moderation, Compliance) ─────────
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (adminUser) {
    // Support Tickets
    await prisma.supportTicket.createMany({
      data: [
        { userId: customer1.id, subject: 'App crashes on booking screen', description: 'Every time I try to book a service, the app crashes.', status: 'open', priority: 'high' },
        { userId: customer2.id, subject: 'Payment not going through', description: 'My KHQR payment failed but money was deducted.', status: 'in_progress', priority: 'urgent' },
        { userId: customer3.id, subject: 'How to change my address?', description: 'I moved recently and want to update my default address.', status: 'resolved', priority: 'low' },
        { userId: owners[0].id, subject: 'Cannot update service price', description: 'The dashboard gives me an error when updating prices.', status: 'open', priority: 'medium' },
      ],
    });

    // Moderation Logs
    await prisma.moderationLog.createMany({
      data: [
        { adminId: adminUser.id, entityType: 'user', entityId: customer1.id, action: 'warn', reason: 'Inappropriate language in chat.', status: 'pending' },
        { adminId: adminUser.id, entityType: 'company', entityId: owners[1].id, action: 'suspend', reason: 'Multiple complaints about no-shows.', status: 'resolved' },
        { adminId: adminUser.id, entityType: 'review', entityId: BigInt(1), action: 'remove', reason: 'Review contained spam.', status: 'pending' },
      ],
    });


    // Compliance Reports
    const allCompanies = await prisma.company.findMany({ take: 3 });
    if (allCompanies.length >= 3) {
      await prisma.complianceReport.createMany({
        data: [
          { companyId: allCompanies[0].id, type: 'business_license', status: 'verified', documentUrl: 'https://example.com/doc1.pdf', notes: 'Looks good.' },
          { companyId: allCompanies[1].id, type: 'insurance', status: 'pending', documentUrl: 'https://example.com/doc2.pdf', notes: 'Waiting on third-party verification.' },
          { companyId: allCompanies[2].id, type: 'background_check', status: 'rejected', documentUrl: 'https://example.com/doc3.pdf', notes: 'Document is expired.' },
        ],
      });
    }

    // Disputes – link to real bookings to satisfy the unique bookingId constraint
    const completedBookings = await prisma.booking.findMany({ where: { status: 'completed' }, take: 3 });
    if (completedBookings.length >= 2) {
      for (let i = 0; i < Math.min(completedBookings.length, 3); i++) {
        const bk = completedBookings[i];
        const alreadyExists = await prisma.dispute.findUnique({ where: { bookingId: bk.id } });
        if (!alreadyExists) {
          await prisma.dispute.create({
            data: {
              bookingId: bk.id,
              customerId: bk.customerId,
              companyId: bk.companyId,
              type: i === 0 ? 'service_quality' : 'no_show',
              description: i === 0
                ? 'The cleaner did not show up at the agreed time.'
                : 'The service did not match the description in the listing.',
              status: i === 0 ? 'open' : 'resolved',
              adminDecision: i === 0 ? null : 'Partial refund approved.',
              refundAmount: i === 0 ? null : Number(bk.totalPrice) * 0.5,
            },
          });
        }
      }
    }

    // Payouts – for top companies
    const payoutCompanies = await prisma.company.findMany({ where: { verificationStatus: 'verified' }, take: 2 });
    for (const co of payoutCompanies) {
      const existing = await prisma.payout.findFirst({ where: { companyId: co.id } });
      if (!existing) {
        await prisma.payout.create({
          data: {
            companyId: co.id,
            payoutType: 'company',
            amount: 1200.00,
            status: 'pending',
            method: 'KHQR / ABA Bank',
          },
        });
      }
    }

    // ── 8. Richer Seeds for User Roles (Customer & Staff) ───────────────────
    // User Addresses for Customer
    await prisma.userAddress.createMany({
      data: [
        { userId: customer1.id, label: 'Home', address: '12 Norodom Blvd, Phnom Penh', isDefault: true, latitude: 11.5696, longitude: 104.9210 },
        { userId: customer1.id, label: 'Office', address: '45 Monivong Blvd, Phnom Penh', isDefault: false, latitude: 11.5566, longitude: 104.9280 },
        { userId: customer2.id, label: 'Home', address: '8 Street 271, Phnom Penh', isDefault: true, latitude: 11.5520, longitude: 104.9180 },
      ],
    });

    // Saved Items for Customer
    const firstCompany = await prisma.company.findFirst();
    const firstService = await prisma.service.findFirst();
    if (firstCompany && firstService) {
      await prisma.savedItem.createMany({
        data: [
          { userId: customer1.id, itemType: 'company', itemId: firstCompany.id },
          { userId: customer1.id, itemType: 'service', itemId: firstService.id },
        ],
      });
    }

    // Notifications
    await prisma.notification.createMany({
      data: [
        { userId: customer1.id, title: 'Booking Confirmed', body: 'Your cleaning booking has been confirmed by Sara Cleaning.', type: 'booking', isRead: false },
        { userId: customer1.id, title: 'Refund Completed', body: 'A manual KHQR refund of $22.50 has been recorded for your cancelled booking.', type: 'payment', isRead: true },
        { userId: customer2.id, title: 'New Message', body: 'You have a new message from GreenThumb Pros.', type: 'message', isRead: false },
      ],
    });

    // Staff Wallet, Payouts, Wallet Transactions, Payment Methods
    const allStaff = await prisma.companyStaff.findMany({ include: { user: true } });
    for (const staff of allStaff) {
      // Set wallet balance and credit limit
      await prisma.companyStaff.update({
        where: { id: staff.id },
        data: {
          walletBalance: 245.50,
          creditLimit: 100.00,
        },
      });

      // Staff Payment Method
      await prisma.staffPaymentMethod.create({
        data: {
          staffId: staff.id,
          type: 'ABA Bank',
          accountName: staff.user.fullName.toUpperCase(),
          accountNumber: '000 ' + Math.floor(100000 + Math.random() * 899999) + ' 123',
          isDefault: true,
          isVerified: true,
        },
      });

      // Wallet Transactions
      await prisma.walletTransaction.createMany({
        data: [
          { staffId: staff.id, amount: 80.00, type: 'credit', description: 'Earnings for Booking #1024' },
          { staffId: staff.id, amount: 120.00, type: 'credit', description: 'Earnings for Booking #1028' },
          { staffId: staff.id, amount: 50.00, type: 'debit', description: 'Payout Request Transferred' },
        ],
      });

      // Staff Payouts
      await prisma.payout.createMany({
        data: [
          { staffId: staff.id, payoutType: 'staff', amount: 50.00, status: 'completed', method: 'ABA Bank', processedAt: new Date() },
          { staffId: staff.id, payoutType: 'staff', amount: 35.00, status: 'pending', method: 'ABA Bank' },
        ],
      });
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
