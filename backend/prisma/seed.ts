import { PrismaClient } from '@prisma/client';

import * as dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({ log: ['error'] });

// ── Helper ────────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Cleaning Services', slug: 'cleaning-services', description: 'Professional home & office cleaning', icon: 'Sparkles', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600' },
  { name: 'HVAC Services', slug: 'hvac-services', description: 'Heating, ventilation & AC', icon: 'Wind', imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600' },
  { name: 'Plumbing', slug: 'plumbing', description: 'Professional plumbing solutions', icon: 'Droplets', imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600' },
  { name: 'Electrical', slug: 'electrical', description: 'Electrical repair & installation', icon: 'Zap', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600' },
  { name: 'Landscaping', slug: 'landscaping', description: 'Lawn care & garden design', icon: 'TreeDeciduous', imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600' },
  { name: 'Automotive', slug: 'automotive', description: 'Car detailing & repair', icon: 'Car', imageUrl: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=600' },
];

const SERVICE_TYPES: Record<string, { name: string; slug: string; icon: string }[]> = {
  'cleaning-services': [
    { name: 'Home Cleaning', slug: 'home-cleaning', icon: 'Home' },
    { name: 'Office Cleaning', slug: 'office-cleaning', icon: 'Building2' },
    { name: 'Deep Cleaning', slug: 'deep-cleaning', icon: 'Sparkles' },
  ],
  'hvac-services': [
    { name: 'AC Repair', slug: 'ac-repair', icon: 'Wrench' },
    { name: 'AC Installation', slug: 'ac-installation', icon: 'PlusCircle' },
    { name: 'Maintenance', slug: 'hvac-maintenance', icon: 'Settings' },
  ],
  'plumbing': [
    { name: 'Leak Repair', slug: 'leak-repair', icon: 'Droplets' },
    { name: 'Pipe Installation', slug: 'pipe-installation', icon: 'Wrench' },
    { name: 'Drain Cleaning', slug: 'drain-cleaning', icon: 'Filter' },
  ],
  'electrical': [
    { name: 'Wiring', slug: 'wiring', icon: 'Cable' },
    { name: 'Light Installation', slug: 'light-installation', icon: 'Lightbulb' },
    { name: 'Electrical Repair', slug: 'electrical-repair', icon: 'Wrench' },
  ],
  'landscaping': [
    { name: 'Lawn Mowing', slug: 'lawn-mowing', icon: 'Scissors' },
    { name: 'Garden Design', slug: 'garden-design', icon: 'Flower2' },
    { name: 'Tree Trimming', slug: 'tree-trimming', icon: 'TreeDeciduous' },
  ],
  'automotive': [
    { name: 'Car Wash', slug: 'car-wash', icon: 'Droplets' },
    { name: 'Car Detailing', slug: 'car-detailing', icon: 'Sparkles' },
    { name: 'Oil Change', slug: 'oil-change', icon: 'Fuel' },
  ],
};

const COMPANIES = [
  { name: 'SparkleClean Pro', city: 'Phnom Penh', cat: 'cleaning-services', lat: 11.5564, lng: 104.9282, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=SC&backgroundColor=3B82F6', cover: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', highlights: ['Same-day booking', 'Eco-friendly products', 'Satisfaction guaranteed'] },
  { name: 'Crystal Clear Cleaners', city: 'Phnom Penh', cat: 'cleaning-services', lat: 11.5684, lng: 104.9210, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=CC&backgroundColor=8B5CF6', cover: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800', highlights: ['Licensed & insured', '24/7 availability', 'Free estimates'] },
  { name: 'CoolAir HVAC', city: 'Phnom Penh', cat: 'hvac-services', lat: 11.5500, lng: 104.9200, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=CA&backgroundColor=06B6D4', cover: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', highlights: ['Emergency service', 'All brands', '2-year warranty'] },
  { name: 'Arctic Breeze AC', city: 'Siem Reap', cat: 'hvac-services', lat: 13.3633, lng: 103.8564, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=AB&backgroundColor=0EA5E9', cover: 'https://images.unsplash.com/photo-1631545806609-e5ad11a1ca1e?w=800', highlights: ['Fast response', 'Certified technicians'] },
  { name: 'QuickFix Plumbing', city: 'Siem Reap', cat: 'plumbing', lat: 13.3671, lng: 103.8448, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=QF&backgroundColor=14B8A6', cover: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800', highlights: ['No call-out fee', '24/7 emergency', 'Upfront pricing'] },
  { name: 'PipeMaster Solutions', city: 'Phnom Penh', cat: 'plumbing', lat: 11.5450, lng: 104.9350, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=PM&backgroundColor=10B981', cover: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800', highlights: ['Licensed plumbers', 'Same-day service'] },
  { name: 'VoltPro Electric', city: 'Phnom Penh', cat: 'electrical', lat: 11.5600, lng: 104.9300, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=VP&backgroundColor=F59E0B', cover: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', highlights: ['Licensed electricians', 'Safety first', 'Free inspection'] },
  { name: 'BrightSpark Electrical', city: 'Battambang', cat: 'electrical', lat: 13.1023, lng: 103.1986, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=BS&backgroundColor=EAB308', cover: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', highlights: ['Commercial & residential', 'Certified'] },
  { name: 'GreenGarden Landscaping', city: 'Battambang', cat: 'landscaping', lat: 13.0957, lng: 103.2022, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=GG&backgroundColor=22C55E', cover: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800', highlights: ['Award-winning designs', 'Organic methods'] },
  { name: 'AutoShine Detailing', city: 'Phnom Penh', cat: 'automotive', lat: 11.5520, lng: 104.9180, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=AS&backgroundColor=EF4444', cover: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800', highlights: ['Premium products', 'Mobile service', 'Paint protection'] },
  { name: 'EcoClean Cambodia', city: 'Siem Reap', cat: 'cleaning-services', lat: 13.3580, lng: 103.8600, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=EC&backgroundColor=34D399', cover: 'https://images.unsplash.com/photo-1527515637462-cee1395c21ad?w=800', highlights: ['Green cleaning', 'Trained staff', 'Flexible scheduling'] },
  { name: 'TurboWrench Auto', city: 'Siem Reap', cat: 'automotive', lat: 13.3700, lng: 103.8500, logo: 'https://api.dicebear.com/9.x/initials/svg?seed=TW&backgroundColor=F97316', cover: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', highlights: ['All car brands', 'Quick turnaround'] },
];

const SERVICES_MAP: Record<string, { name: string; price: number; durMin: number; durMax: number }[]> = {
  'cleaning-services': [
    { name: 'Regular Home Cleaning', price: 50, durMin: 120, durMax: 180 },
    { name: 'Deep House Cleaning', price: 80, durMin: 180, durMax: 240 },
    { name: 'Move-in/Move-out Cleaning', price: 120, durMin: 240, durMax: 360 },
    { name: 'Office Cleaning', price: 100, durMin: 180, durMax: 240 },
  ],
  'hvac-services': [
    { name: 'AC Installation', price: 200, durMin: 240, durMax: 360 },
    { name: 'AC Repair', price: 60, durMin: 60, durMax: 120 },
    { name: 'AC Maintenance', price: 40, durMin: 60, durMax: 90 },
  ],
  'plumbing': [
    { name: 'Leak Repair', price: 45, durMin: 60, durMax: 120 },
    { name: 'Pipe Installation', price: 85, durMin: 120, durMax: 180 },
    { name: 'Drain Cleaning', price: 35, durMin: 45, durMax: 90 },
  ],
  'electrical': [
    { name: 'Wiring Installation', price: 100, durMin: 180, durMax: 240 },
    { name: 'Electrical Repair', price: 55, durMin: 60, durMax: 120 },
    { name: 'Switch & Outlet Install', price: 30, durMin: 30, durMax: 60 },
  ],
  'landscaping': [
    { name: 'Lawn Mowing', price: 30, durMin: 60, durMax: 90 },
    { name: 'Tree Trimming', price: 50, durMin: 90, durMax: 120 },
    { name: 'Garden Design', price: 150, durMin: 180, durMax: 240 },
  ],
  'automotive': [
    { name: 'Full Car Wash', price: 25, durMin: 30, durMax: 60 },
    { name: 'Interior Detailing', price: 60, durMin: 90, durMax: 120 },
    { name: 'Paint Correction', price: 120, durMin: 120, durMax: 180 },
  ],
};

const REVIEW_COMMENTS = [
  'Excellent service! Very professional and thorough.',
  'Great work, arrived on time and did a fantastic job.',
  'Very satisfied with the quality. Will book again.',
  'Professional team, fair pricing. Highly recommend.',
  'Good service overall. Minor delays but quality work.',
  'Outstanding! Exceeded my expectations completely.',
  'Reliable and efficient. The team was very friendly.',
  'Decent service for the price. Could improve communication.',
  'Top-notch quality. Very detail-oriented professionals.',
  'Fast, clean, and professional. Five stars!',
];

const CUSTOMER_NAMES = [
  'Sokha Pich', 'Chenda Keo', 'Vannak Ly', 'Srey Leak', 'Dara Sok',
  'Pheakdey Chan', 'Bopha Seng', 'Ratanak Vorn', 'Maly Tep', 'Thy Heng',
  'Sreymom Chea', 'Narith Prak', 'Kunthea Sar', 'Sambo Noun', 'Piseth Ros',
];

const CITIES = ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Sihanoukville'];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {

  // Delete in dependency order
  await prisma.savedItem.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.companyRatingSummary.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingStatusLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceType.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.companyStaff.deleteMany();
  await prisma.company.deleteMany();
  await prisma.category.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const pw = hash('Password123!');

  const adminUser = await prisma.user.create({
    data: { fullName: 'Admin User', email: 'admin@servifinder.com', phone: '+85512000000', passwordHash: pw, role: 'admin', status: 'active' },
  });

  // Company admin users (one per company)
  const companyAdminUsers = [];
  for (let i = 0; i < COMPANIES.length; i++) {
    const u = await prisma.user.create({
      data: {
        fullName: `${COMPANIES[i].name} Owner`,
        email: `owner${i + 1}@servifinder.com`,
        phone: `+8551200${String(i + 1).padStart(4, '0')}`,
        passwordHash: pw,
        role: 'company_admin',
        status: 'active',
      },
    });
    companyAdminUsers.push(u);
  }

  // Customer users
  const customerUsers = [];
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const u = await prisma.user.create({
      data: {
        fullName: CUSTOMER_NAMES[i],
        email: `customer${i + 1}@example.com`,
        phone: `+8559800${String(i + 1).padStart(4, '0')}`,
        passwordHash: pw,
        role: 'customer',
        status: 'active',
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(CUSTOMER_NAMES[i])}`,
      },
    });
    customerUsers.push(u);
  }

  // Staff users (2 per company = 24 staff)
  const staffUsers = [];
  for (let i = 0; i < COMPANIES.length * 2; i++) {
    const u = await prisma.user.create({
      data: {
        fullName: `Staff Member ${i + 1}`,
        email: `staff${i + 1}@servifinder.com`,
        phone: `+8551300${String(i + 1).padStart(4, '0')}`,
        passwordHash: pw,
        role: 'staff',
        status: 'active',
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=S${i + 1}&backgroundColor=6366F1`,
      },
    });
    staffUsers.push(u);
  }

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const catMap: Record<string, any> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = await prisma.category.create({
      data: { ...CATEGORIES[i], status: 'active', displayOrder: i },
    });
    catMap[CATEGORIES[i].slug] = cat;
  }

  // ── 3. Service Types ──────────────────────────────────────────────────────
  const stMap: Record<string, any[]> = {};
  for (const [catSlug, types] of Object.entries(SERVICE_TYPES)) {
    stMap[catSlug] = [];
    for (let i = 0; i < types.length; i++) {
      const st = await prisma.serviceType.create({
        data: {
          categoryId: catMap[catSlug].id,
          name: types[i].name,
          slug: types[i].slug,
          icon: types[i].icon,
          description: `Professional ${types[i].name.toLowerCase()} services`,
          status: 'active',
          displayOrder: i,
        },
      });
      stMap[catSlug].push(st);
    }
  }

  // ── 4. Companies + Services + Staff + Service Areas ───────────────────────
  const companyRecords: any[] = [];
  const allServices: any[] = [];

  for (let ci = 0; ci < COMPANIES.length; ci++) {
    const comp = COMPANIES[ci];
    const company = await prisma.company.create({
      data: {
        name: comp.name,
        description: `${comp.name} is a leading provider of professional ${comp.cat.replace('-', ' ')} in ${comp.city}. We pride ourselves on quality, reliability, and customer satisfaction.`,
        city: comp.city,
        address: `${randomBetween(100, 999)} ${comp.city} Main Road`,
        phone: `+855${randomBetween(10000000, 99999999)}`,
        email: `contact@${comp.name.toLowerCase().replace(/\s+/g, '')}.com`,
        ownerId: companyAdminUsers[ci].id,
        verificationStatus: 'verified',
        latitude: comp.lat,
        longitude: comp.lng,
        logoUrl: comp.logo,
        coverImageUrl: comp.cover,
        establishedYear: randomBetween(2015, 2023),
        cardHighlights: comp.highlights,
        detailHighlights: [...comp.highlights, 'Professional team', 'Competitive pricing'],
      },
    });
    companyRecords.push(company);

    // Service areas
    const areas = [comp.city];
    if (comp.city === 'Phnom Penh') areas.push('Kandal');
    for (const area of areas) {
      await prisma.serviceArea.create({
        data: { companyId: company.id, city: area, coverageRadiusKm: randomBetween(5, 20) },
      });
    }

    // Staff members (2 per company)
    const staffIdx = ci * 2;
    for (let si = 0; si < 2; si++) {
      await prisma.companyStaff.create({
        data: {
          companyId: company.id,
          userId: staffUsers[staffIdx + si].id,
          role: si === 0 ? 'supervisor' : 'cleaner',
          status: 'active',
        },
      });
    }

    // Services — use the matching category services, cycle through service types
    const svcList = SERVICES_MAP[comp.cat] || [];
    const serviceTypes = stMap[comp.cat] || [];
    for (let si = 0; si < svcList.length; si++) {
      const svc = svcList[si];
      const priceVariation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
      const service = await prisma.service.create({
        data: {
          companyId: company.id,
          serviceTypeId: serviceTypes[si % serviceTypes.length].id,
          name: svc.name,
          description: `Professional ${svc.name.toLowerCase()} service by ${comp.name}.`,
          basePrice: Math.round(svc.price * priceVariation),
          durationMin: svc.durMin,
          durationMax: svc.durMax,
          isActive: true,
        },
      });
      allServices.push({ ...service, companyIdx: ci });
    }
  }

  // ── 5. Bookings, Reviews, Payments ────────────────────────────────────────
  let bookingCount = 0;
  let reviewCount = 0;

  // Track ratings per company for summary
  const ratingAccum: Record<string, { sum: number; count: number }> = {};
  for (const c of companyRecords) {
    ratingAccum[c.id.toString()] = { sum: 0, count: 0 };
  }

  // Create 5-8 completed bookings per company
  for (let ci = 0; ci < companyRecords.length; ci++) {
    const company = companyRecords[ci];
    const companyServices = allServices.filter(s => s.companyIdx === ci);
    if (companyServices.length === 0) continue;

    const numBookings = randomBetween(5, 8);
    for (let bi = 0; bi < numBookings; bi++) {
      const customer = pick(customerUsers);
      const service = pick(companyServices);
      const daysAgo = randomBetween(1, 90);
      const bookingDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const price = Number(service.basePrice);
      const platformFee = Math.round(price * 0.1 * 100) / 100;
      const companyEarnings = Math.round((price - platformFee) * 100) / 100;

      const booking = await prisma.booking.create({
        data: {
          customerId: customer.id,
          companyId: company.id,
          serviceId: service.id,
          bookingDate: bookingDate,
          startTime: new Date('1970-01-01T09:00:00Z'),
          endTime: new Date('1970-01-01T12:00:00Z'),
          serviceAddress: `${randomBetween(1, 500)} Street ${randomBetween(1, 300)}, ${company.city}`,
          latitude: COMPANIES[ci].lat + (Math.random() * 0.01 - 0.005),
          longitude: COMPANIES[ci].lng + (Math.random() * 0.01 - 0.005),
          status: 'completed',
          totalPrice: price,
          platformFee: platformFee,
          companyEarnings: companyEarnings,
          progressPercent: 100,
        },
      });
      bookingCount++;

      // Payment
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: customer.id,
          method: pick(['cash', 'card', 'wallet'] as const),
          amount: price,
          status: 'paid',
          paidAt: bookingDate,
          transactionRef: `TXN-${Date.now()}-${randomBetween(1000, 9999)}`,
        },
      });

      // Review (80% chance)
      if (Math.random() < 0.8) {
        const rating = randomBetween(3, 5);
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            customerId: customer.id,
            companyRating: rating,
            companyComment: pick(REVIEW_COMMENTS),
            createdAt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000),
          },
        });
        ratingAccum[company.id.toString()].sum += rating;
        ratingAccum[company.id.toString()].count += 1;
        reviewCount++;
      }
    }
  }

  // ── 6. Company Rating Summaries ───────────────────────────────────────────
  for (const company of companyRecords) {
    const acc = ratingAccum[company.id.toString()];
    if (acc.count > 0) {
      const avg = Math.round((acc.sum / acc.count) * 100) / 100;
      await prisma.companyRatingSummary.create({
        data: {
          companyId: company.id,
          averageRating: avg,
          totalReviews: acc.count,
        },
      });
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
