import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runProductionSeed() {
  console.log('🌱 Starting PRODUCTION safe seed...');
  const pw = await bcrypt.hash('password123', 10);

  // 1. Check/Create Super Admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@servicefinder.com' } });
  if (!existingAdmin) {
    console.log('  -> Creating initial Super Admin account...');
    await prisma.user.create({
      data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
    });
  } else {
    console.log('  -> Super Admin already exists. Skipping.');
  }

  // 2. Check/Create Default Categories
  console.log('  -> Ensuring default categories exist...');
  const categoriesData = [
    { name: 'Cleaning', icon: 'broom', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop' },
    { name: 'Plumbing', icon: 'pipe-wrench', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop' },
    { name: 'Electrical', icon: 'lightning-bolt', imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop' },
    { name: 'Landscaping', icon: 'tree', imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f0f?q=80&w=800&auto=format&fit=crop' },
    { name: 'HVAC', icon: 'air-conditioner', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop' },
    { name: 'Car Wash', icon: 'car-wash', imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800&auto=format&fit=crop' },
    { name: 'Pest Control', icon: 'bug', imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop' },
    { name: 'Locksmith', icon: 'key', imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop' },
    { name: 'Handyman', icon: 'hammer-wrench', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop' },
    { name: 'Moving Services', icon: 'truck-delivery', imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop' },
    { name: 'Painting', icon: 'brush', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop' },
    { name: 'Appliance Repair', icon: 'wrench', imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop' },
    { name: 'Beauty & Salon', icon: 'face-woman', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop' },
    { name: 'IT Support', icon: 'laptop', imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop' }
  ];
  for (let i = 0; i < categoriesData.length; i++) {
    const slug = categoriesData[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: categoriesData[i].name,
          slug,
          icon: categoriesData[i].icon,
          imageUrl: categoriesData[i].imageUrl,
          displayOrder: i,
          status: 'active'
        }
      });
    }
  }

  // 3. Check/Create Default Service Types
  console.log('  -> Ensuring default service types exist...');
  const serviceTypesData = [
    { categorySlug: 'cleaning', name: 'Deep Cleaning', slug: 'deep-cleaning' },
    { categorySlug: 'cleaning', name: 'Standard Cleaning', slug: 'standard-cleaning' },
    { categorySlug: 'cleaning', name: 'Office Cleaning', slug: 'office-cleaning' },
    { categorySlug: 'cleaning', name: 'Carpet Cleaning', slug: 'carpet-cleaning' },

    { categorySlug: 'plumbing', name: 'Pipe Leak Repair', slug: 'pipe-leak' },
    { categorySlug: 'plumbing', name: 'Drain Cleaning', slug: 'drain-cleaning' },
    { categorySlug: 'plumbing', name: 'Water Heater Install/Repair', slug: 'water-heater' },
    { categorySlug: 'plumbing', name: 'Toilet Repair & Installation', slug: 'toilet-repair' },

    { categorySlug: 'electrical', name: 'Wiring & Rewiring', slug: 'wiring' },
    { categorySlug: 'electrical', name: 'Light Fixture Installation', slug: 'light-installation' },
    { categorySlug: 'electrical', name: 'Electrical Panel Upgrade', slug: 'panel-upgrade' },
    { categorySlug: 'electrical', name: 'Generator Services', slug: 'generator-services' },

    { categorySlug: 'landscaping', name: 'Lawn Mowing & Trimming', slug: 'lawn-mowing' },
    { categorySlug: 'landscaping', name: 'Garden Design & Planting', slug: 'garden-design' },
    { categorySlug: 'landscaping', name: 'Tree & Shrub Trimming', slug: 'tree-trimming' },
    { categorySlug: 'landscaping', name: 'Weed Control & Fertilization', slug: 'weed-control' },

    { categorySlug: 'hvac', name: 'AC Installation & Repair', slug: 'ac-services' },
    { categorySlug: 'hvac', name: 'Heating System Maintenance', slug: 'heating-maintenance' },
    { categorySlug: 'hvac', name: 'Air Duct Cleaning', slug: 'duct-cleaning' },
    { categorySlug: 'hvac', name: 'Thermostat Installation', slug: 'thermostat-install' },

    { categorySlug: 'car-wash', name: 'Exterior Car Wash', slug: 'exterior-wash' },
    { categorySlug: 'car-wash', name: 'Interior Car Detailing', slug: 'interior-detailing' },
    { categorySlug: 'car-wash', name: 'Full Detailing Package', slug: 'full-detailing' },
    { categorySlug: 'car-wash', name: 'Engine Bay Cleaning', slug: 'engine-cleaning' },

    { categorySlug: 'pest-control', name: 'Termite Treatment', slug: 'termite-treatment' },
    { categorySlug: 'pest-control', name: 'Bed Bug Extermination', slug: 'bed-bug-extermination' },
    { categorySlug: 'pest-control', name: 'General Pest Control', slug: 'general-pest' },
    { categorySlug: 'pest-control', name: 'Rodent Control & Removal', slug: 'rodent-removal' },

    { categorySlug: 'locksmith', name: 'Emergency Lockout Service', slug: 'emergency-lockout' },
    { categorySlug: 'locksmith', name: 'Lock Rekeying', slug: 'lock-rekeying' },
    { categorySlug: 'locksmith', name: 'Smart Lock Installation', slug: 'smart-lock-install' },
    { categorySlug: 'locksmith', name: 'Key Duplication', slug: 'key-duplication' },

    { categorySlug: 'handyman', name: 'Furniture Assembly', slug: 'furniture-assembly' },
    { categorySlug: 'handyman', name: 'TV Wall Mounting', slug: 'tv-mounting' },
    { categorySlug: 'handyman', name: 'Drywall Repair', slug: 'drywall-repair' },
    { categorySlug: 'handyman', name: 'General Home Repairs', slug: 'general-repairs' },

    { categorySlug: 'moving-services', name: 'Local Residential Moving', slug: 'residential-moving' },
    { categorySlug: 'moving-services', name: 'Long Distance Moving', slug: 'long-distance-moving' },
    { categorySlug: 'moving-services', name: 'Packing & Unpacking Services', slug: 'packing-services' },
    { categorySlug: 'moving-services', name: 'Furniture & Heavy Item Moving', slug: 'heavy-item-moving' },

    { categorySlug: 'painting', name: 'Interior Home Painting', slug: 'interior-painting' },
    { categorySlug: 'painting', name: 'Exterior House Painting', slug: 'exterior-painting' },
    { categorySlug: 'painting', name: 'Cabinet Painting & Refinishing', slug: 'cabinet-refinishing' },
    { categorySlug: 'painting', name: 'Wallpaper Removal & Hanging', slug: 'wallpaper-services' },

    { categorySlug: 'appliance-repair', name: 'Refrigerator Repair', slug: 'refrigerator-repair' },
    { categorySlug: 'appliance-repair', name: 'Washing Machine & Dryer Repair', slug: 'washer-dryer-repair' },
    { categorySlug: 'appliance-repair', name: 'Dishwasher Repair', slug: 'dishwasher-repair' },
    { categorySlug: 'appliance-repair', name: 'Oven & Stove Repair', slug: 'oven-stove-repair' },

    { categorySlug: 'beauty-salon', name: 'Haircut & Hair Styling', slug: 'hair-styling' },
    { categorySlug: 'beauty-salon', name: 'Manicure & Pedicure', slug: 'nail-services' },
    { categorySlug: 'beauty-salon', name: 'Facial & Skincare Treatments', slug: 'skincare-facials' },
    { categorySlug: 'beauty-salon', name: 'Professional Makeup Application', slug: 'professional-makeup' },

    { categorySlug: 'it-support', name: 'Computer & Laptop Repair', slug: 'computer-repair' },
    { categorySlug: 'it-support', name: 'Wi-Fi & Network Setup', slug: 'network-wifi-setup' },
    { categorySlug: 'it-support', name: 'Virus & Malware Removal', slug: 'virus-removal' },
    { categorySlug: 'it-support', name: 'Data Recovery & Backup', slug: 'data-recovery' }
  ];

  for (const st of serviceTypesData) {
    const category = await prisma.category.findUnique({ where: { slug: st.categorySlug } });
    if (category) {
      const existingSt = await prisma.serviceType.findUnique({ where: { slug: st.slug } });
      if (!existingSt) {
        await prisma.serviceType.create({
          data: {
            categoryId: category.id,
            name: st.name,
            slug: st.slug,
            status: 'active'
          }
        });
      }
    }
  }

  console.log('✅ PRODUCTION SEED COMPLETED SAFELY.');
}

async function runMassiveSeed() {
  console.log('🌱 Starting massive full-app database seed...');
  console.log('🧹 Clearing existing data... (This may take a few seconds)');
  
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public';
  `;
  for (const { tablename } of tables) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Failed to truncate ${tablename}`);
      }
    }
  }

  const pw = await bcrypt.hash('password123', 10);

  // 1. CREATE USERS
  console.log('👥 Creating Users (Admin, Staff, Customers)...');
  const admin = await prisma.user.create({
    data: { fullName: 'Super Admin', email: 'admin@servicefinder.com', passwordHash: pw, role: 'admin', phone: '+1000000000', status: 'active' }
  });

  const owners: any[] = [];
  for (let i = 1; i <= 3; i++) {
    owners.push(await prisma.user.create({
      data: { fullName: `Company Owner ${i}`, email: `owner${i}@demo.com`, passwordHash: pw, role: 'company_admin', phone: `+111111111${i}`, status: 'active' }
    }));
  }

  const staff: any[] = [];
  for (let i = 1; i <= 15; i++) {
    staff.push(await prisma.user.create({
      data: { fullName: `Staff Member ${i}`, email: `staff${i}@demo.com`, passwordHash: pw, role: 'staff', phone: `+22222222${i.toString().padStart(2, '0')}`, status: 'active', workingStatus: i % 3 === 0 ? 'offline' : 'active' }
    }));
  }

  const customers: any[] = [];
  for (let i = 1; i <= 30; i++) {
    customers.push(await prisma.user.create({
      data: { fullName: `Customer ${i}`, email: `customer${i}@demo.com`, passwordHash: pw, role: 'customer', phone: `+33333333${i.toString().padStart(2, '0')}`, status: 'active' }
    }));
  }

  // 2. CREATE COMPANIES (Phnom Penh Metro Area)
  console.log('🏢 Creating Companies & Staff Links...');
  const companies: any[] = [];
  companies.push(await prisma.company.create({
    data: { name: 'Cleaning Solutions LLC', ownerId: owners[0].id, phone: '555-0101', email: 'hello@cleaningsolutions.com', address: '123 Sparkle Ave, BKK1', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'dispatch' as any, latitude: 11.5564, longitude: 104.9282 }
  }));
  companies.push(await prisma.company.create({
    data: { name: 'Elite Plumbers', ownerId: owners[1].id, phone: '555-0102', email: 'hello@eliteplumbers.com', address: '456 Pipe St, Toul Kork', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'open_pool' as any, latitude: 11.5681, longitude: 104.9083 }
  }));
  companies.push(await prisma.company.create({
    data: { name: 'Quick Fix Electricians', ownerId: owners[2].id, phone: '555-0103', email: 'hello@quickfix.com', address: '789 Wire Blvd, Daun Penh', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'dispatch' as any, latitude: 11.5720, longitude: 104.9238 }
  }));
  companies.push(await prisma.company.create({
    data: { name: 'Sparkle & Shine Cleaning', ownerId: owners[0].id, phone: '555-0104', email: 'hello@sparkle.com', address: '101 Glow Dr, Chamkarmon', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'dispatch' as any, latitude: 11.5450, longitude: 104.9150 }
  }));
  companies.push(await prisma.company.create({
    data: { name: 'Eco Plumbers & Rooters', ownerId: owners[1].id, phone: '555-0105', email: 'hello@ecoplumbers.com', address: '202 Green Way, Sen Sok', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'open_pool' as any, latitude: 11.5858, longitude: 104.8864 }
  }));
  companies.push(await prisma.company.create({
    data: { name: 'Volt Masters Electrical', ownerId: owners[2].id, phone: '555-0106', email: 'hello@voltmasters.com', address: '303 Power Rd, 7 Makara', city: 'Phnom Penh', verificationStatus: 'verified', bookingMode: 'dispatch' as any, latitude: 11.5649, longitude: 104.9194 }
  }));

  // Link Staff to Companies (distributed among all 6 companies)
  const companyStaffLinks: any[] = [];
  for (let i = 0; i < staff.length; i++) {
    companyStaffLinks.push(await prisma.companyStaff.create({
      data: { companyId: companies[i % companies.length].id, userId: staff[i].id, role: 'worker' as any, status: 'active' }
    }));
  }

  // 3. CREATE CATEGORIES & SERVICES
  console.log('📦 Creating Categories & Services...');
  const categoriesData = [
    { name: 'Cleaning', icon: 'broom', imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop' },
    { name: 'Plumbing', icon: 'pipe-wrench', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop' },
    { name: 'Electrical', icon: 'lightning-bolt', imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop' },
    { name: 'Landscaping', icon: 'tree', imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f0f?q=80&w=800&auto=format&fit=crop' },
    { name: 'HVAC', icon: 'air-conditioner', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop' },
    { name: 'Car Wash', icon: 'car-wash', imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800&auto=format&fit=crop' },
    { name: 'Pest Control', icon: 'bug', imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop' },
    { name: 'Locksmith', icon: 'key', imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop' },
    { name: 'Handyman', icon: 'hammer-wrench', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop' },
    { name: 'Moving Services', icon: 'truck-delivery', imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop' },
    { name: 'Painting', icon: 'brush', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop' },
    { name: 'Appliance Repair', icon: 'wrench', imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop' },
    { name: 'Beauty & Salon', icon: 'face-woman', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop' },
    { name: 'IT Support', icon: 'laptop', imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop' }
  ];
  
  const categories: any[] = [];
  for (let i = 0; i < categoriesData.length; i++) {
    categories.push(await prisma.category.create({
      data: { 
        name: categoriesData[i].name, 
        slug: categoriesData[i].name.toLowerCase(), 
        icon: categoriesData[i].icon,
        imageUrl: categoriesData[i].imageUrl,
        displayOrder: i, 
        status: 'active' 
      }
    }));
  }

  // Create all service types
  const serviceTypesData = [
    { categorySlug: 'cleaning', name: 'Deep Cleaning', slug: 'deep-cleaning' },
    { categorySlug: 'cleaning', name: 'Standard Cleaning', slug: 'standard-cleaning' },
    { categorySlug: 'cleaning', name: 'Office Cleaning', slug: 'office-cleaning' },
    { categorySlug: 'cleaning', name: 'Carpet Cleaning', slug: 'carpet-cleaning' },

    { categorySlug: 'plumbing', name: 'Pipe Leak Repair', slug: 'pipe-leak' },
    { categorySlug: 'plumbing', name: 'Drain Cleaning', slug: 'drain-cleaning' },
    { categorySlug: 'plumbing', name: 'Water Heater Install/Repair', slug: 'water-heater' },
    { categorySlug: 'plumbing', name: 'Toilet Repair & Installation', slug: 'toilet-repair' },

    { categorySlug: 'electrical', name: 'Wiring & Rewiring', slug: 'wiring' },
    { categorySlug: 'electrical', name: 'Light Fixture Installation', slug: 'light-installation' },
    { categorySlug: 'electrical', name: 'Electrical Panel Upgrade', slug: 'panel-upgrade' },
    { categorySlug: 'electrical', name: 'Generator Services', slug: 'generator-services' },

    { categorySlug: 'landscaping', name: 'Lawn Mowing & Trimming', slug: 'lawn-mowing' },
    { categorySlug: 'landscaping', name: 'Garden Design & Planting', slug: 'garden-design' },
    { categorySlug: 'landscaping', name: 'Tree & Shrub Trimming', slug: 'tree-trimming' },
    { categorySlug: 'landscaping', name: 'Weed Control & Fertilization', slug: 'weed-control' },

    { categorySlug: 'hvac', name: 'AC Installation & Repair', slug: 'ac-services' },
    { categorySlug: 'hvac', name: 'Heating System Maintenance', slug: 'heating-maintenance' },
    { categorySlug: 'hvac', name: 'Air Duct Cleaning', slug: 'duct-cleaning' },
    { categorySlug: 'hvac', name: 'Thermostat Installation', slug: 'thermostat-install' },

    { categorySlug: 'car-wash', name: 'Exterior Car Wash', slug: 'exterior-wash' },
    { categorySlug: 'car-wash', name: 'Interior Car Detailing', slug: 'interior-detailing' },
    { categorySlug: 'car-wash', name: 'Full Detailing Package', slug: 'full-detailing' },
    { categorySlug: 'car-wash', name: 'Engine Bay Cleaning', slug: 'engine-cleaning' },

    { categorySlug: 'pest-control', name: 'Termite Treatment', slug: 'termite-treatment' },
    { categorySlug: 'pest-control', name: 'Bed Bug Extermination', slug: 'bed-bug-extermination' },
    { categorySlug: 'pest-control', name: 'General Pest Control', slug: 'general-pest' },
    { categorySlug: 'pest-control', name: 'Rodent Control & Removal', slug: 'rodent-removal' },

    { categorySlug: 'locksmith', name: 'Emergency Lockout Service', slug: 'emergency-lockout' },
    { categorySlug: 'locksmith', name: 'Lock Rekeying', slug: 'lock-rekeying' },
    { categorySlug: 'locksmith', name: 'Smart Lock Installation', slug: 'smart-lock-install' },
    { categorySlug: 'locksmith', name: 'Key Duplication', slug: 'key-duplication' },

    { categorySlug: 'handyman', name: 'Furniture Assembly', slug: 'furniture-assembly' },
    { categorySlug: 'handyman', name: 'TV Wall Mounting', slug: 'tv-mounting' },
    { categorySlug: 'handyman', name: 'Drywall Repair', slug: 'drywall-repair' },
    { categorySlug: 'handyman', name: 'General Home Repairs', slug: 'general-repairs' },

    { categorySlug: 'moving-services', name: 'Local Residential Moving', slug: 'residential-moving' },
    { categorySlug: 'moving-services', name: 'Long Distance Moving', slug: 'long-distance-moving' },
    { categorySlug: 'moving-services', name: 'Packing & Unpacking Services', slug: 'packing-services' },
    { categorySlug: 'moving-services', name: 'Furniture & Heavy Item Moving', slug: 'heavy-item-moving' },

    { categorySlug: 'painting', name: 'Interior Home Painting', slug: 'interior-painting' },
    { categorySlug: 'painting', name: 'Exterior House Painting', slug: 'exterior-painting' },
    { categorySlug: 'painting', name: 'Cabinet Painting & Refinishing', slug: 'cabinet-refinishing' },
    { categorySlug: 'painting', name: 'Wallpaper Removal & Hanging', slug: 'wallpaper-services' },

    { categorySlug: 'appliance-repair', name: 'Refrigerator Repair', slug: 'refrigerator-repair' },
    { categorySlug: 'appliance-repair', name: 'Washing Machine & Dryer Repair', slug: 'washer-dryer-repair' },
    { categorySlug: 'appliance-repair', name: 'Dishwasher Repair', slug: 'dishwasher-repair' },
    { categorySlug: 'appliance-repair', name: 'Oven & Stove Repair', slug: 'oven-stove-repair' },

    { categorySlug: 'beauty-salon', name: 'Haircut & Hair Styling', slug: 'hair-styling' },
    { categorySlug: 'beauty-salon', name: 'Manicure & Pedicure', slug: 'nail-services' },
    { categorySlug: 'beauty-salon', name: 'Facial & Skincare Treatments', slug: 'skincare-facials' },
    { categorySlug: 'beauty-salon', name: 'Professional Makeup Application', slug: 'professional-makeup' },

    { categorySlug: 'it-support', name: 'Computer & Laptop Repair', slug: 'computer-repair' },
    { categorySlug: 'it-support', name: 'Wi-Fi & Network Setup', slug: 'network-wifi-setup' },
    { categorySlug: 'it-support', name: 'Virus & Malware Removal', slug: 'virus-removal' },
    { categorySlug: 'it-support', name: 'Data Recovery & Backup', slug: 'data-recovery' }
  ];

  const serviceTypesMap: { [slug: string]: any } = {};
  for (const st of serviceTypesData) {
    const category = categories.find(c => c.slug === st.categorySlug);
    if (category) {
      serviceTypesMap[st.slug] = await prisma.serviceType.create({
        data: {
          categoryId: category.id,
          name: st.name,
          slug: st.slug,
          status: 'active'
        }
      });
    }
  }

  const sType1 = serviceTypesMap['deep-cleaning'];
  const sType2 = serviceTypesMap['standard-cleaning'];
  const sType3 = serviceTypesMap['pipe-leak'];

  const companyServices: any[] = [];
  // Deep Cleaning providers
  companyServices.push(await prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType1.id, name: 'Premium Deep Clean', description: 'Top to bottom clean', basePrice: 150, durationMin: 180, isActive: true } }));
  companyServices.push(await prisma.service.create({ data: { companyId: companies[3].id, serviceTypeId: sType1.id, name: 'Sanitized House Deep Clean', description: 'Disinfectant clean', basePrice: 120, durationMin: 150, isActive: true } }));
  companyServices.push(await prisma.service.create({ data: { companyId: companies[1].id, serviceTypeId: sType1.id, name: 'Standard Commercial Deep Clean', description: 'Commercial scrubbing', basePrice: 140, durationMin: 160, isActive: true } }));

  // Standard Cleaning providers
  companyServices.push(await prisma.service.create({ data: { companyId: companies[0].id, serviceTypeId: sType2.id, name: 'Weekly Standard Clean', description: 'Maintenance clean', basePrice: 80, durationMin: 120, isActive: true } }));
  companyServices.push(await prisma.service.create({ data: { companyId: companies[3].id, serviceTypeId: sType2.id, name: 'Basic Home Cleaning Service', description: 'Simple sweep and dust', basePrice: 70, durationMin: 90, isActive: true } }));

  // Pipe Leak Repair providers
  companyServices.push(await prisma.service.create({ data: { companyId: companies[1].id, serviceTypeId: sType3.id, name: 'Emergency Leak Repair', description: '24/7 pipe repair', basePrice: 200, durationMin: 60, isActive: true } }));
  companyServices.push(await prisma.service.create({ data: { companyId: companies[4].id, serviceTypeId: sType3.id, name: 'Professional Leak Detection & Repair', description: 'Expert pipe repair and diagnostics', basePrice: 180, durationMin: 90, isActive: true } }));

  // 4. CREATE PROMO CODES
  console.log('🎟️ Creating Promo Codes...');
  await prisma.promoCode.create({ data: { code: 'SUMMER20', discountPercent: 20, maxUses: 100, expiresAt: new Date(Date.now() + 30*24*60*60*1000), isActive: true } });
  await prisma.promoCode.create({ data: { code: 'WELCOME50', discountPercent: 50, maxUses: 50, expiresAt: new Date(Date.now() + 30*24*60*60*1000), isActive: true } });

  // 5. CREATE MASSIVE BOOKINGS
  console.log('📅 Generating 60+ Bookings, Payments, and Reviews...');
  const now = new Date();
  
  for (let i = 0; i < 60; i++) {
    const cust = customers[i % customers.length];
    const srv = companyServices[i % companyServices.length];
    const comp = companies.find(c => c.id === srv.companyId);
    const stf = staff[i % 5]; // Assign mostly to the first 5 staff

    // Determine status and dates
    let status = 'completed';
    let bookingDate = new Date(now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Past 60 days
    if (i < 20) {
      status = 'pending';
      bookingDate = new Date(now.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000); // Future 5 days
    } else if (i < 28) {
      status = 'confirmed';
      bookingDate = new Date(now.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    } else if (i < 35) {
      status = 'in_progress';
      bookingDate = new Date(); // Today
    } else if (i < 40) {
      status = 'cancelled';
      bookingDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
    }

    const baseLat = Number(comp?.latitude) || 11.5564;
    const baseLng = Number(comp?.longitude) || 104.9282;
    const latitude = baseLat + (Math.random() * 0.04 - 0.02);
    const longitude = baseLng + (Math.random() * 0.04 - 0.02);

    const price = Number(srv.basePrice) || 100;
    const fee = price * 0.10;
    
    const cStaff = companyStaffLinks.find(cs => cs.userId === stf.id);

    const b = await prisma.booking.create({
      data: {
        customerId: cust.id,
        companyId: comp.id,
        serviceId: srv.id,
        assignedStaffId: (status === 'pending' || status === 'cancelled' || !cStaff) ? null : cStaff.id,
        status: status as any,
        bookingDate: bookingDate,
        startTime: new Date(bookingDate.setHours(10, 0, 0, 0)),
        endTime: new Date(bookingDate.setHours(12, 0, 0, 0)),
        totalPrice: price,
        platformFee: fee,
        companyEarnings: price - fee,
        serviceAddress: `${100 + i} Random Street, City`,
        staffNotes: i % 4 === 0 ? 'Please call upon arrival.' : null,
        latitude,
        longitude
      }
    });

    // Create Booking Status Log
    await prisma.bookingStatusLog.create({
      data: { bookingId: b.id, oldStatus: 'pending', newStatus: status, changedBy: admin.id }
    });

    if (status === 'completed' || status === 'in_progress') {
      await prisma.payment.create({
        data: { bookingId: b.id, userId: cust.id, amount: price, status: status === 'completed' ? 'paid' : 'pending', method: 'card' as any, transactionRef: `pi_test_${b.id}` }
      });
      await prisma.invoice.create({
        data: { bookingId: b.id, invoiceNumber: `INV-${b.id}-${now.getFullYear()}`, totalAmount: price, issuedAt: b.createdAt }
      });

      // 6. CREATE REVIEWS FOR COMPLETED
      if (status === 'completed' && i % 2 === 0) {
        const rating = Math.floor(Math.random() * 3) + 3; // 3 to 5
        await prisma.review.create({
          data: { bookingId: b.id, customerId: cust.id, companyRating: rating, companyComment: `Great service, very professional! (Rating: ${rating})` }
        });
      }
    }
  }

  // 7. CREATE DISPUTES, MODERATION, COMPLIANCE
  console.log('⚖️ Creating Disputes & Moderation Logs...');
  const firstCompleted = await prisma.booking.findFirst({ where: { status: 'completed' }});
  if (firstCompleted) {
    await prisma.dispute.create({
      data: { bookingId: firstCompleted.id, customerId: customers[0].id, companyId: companies[0].id, type: 'incomplete', description: 'Service was incomplete', status: 'open' }
    });
  }

  for (let i = 0; i < 10; i++) {
    await prisma.moderationLog.create({
      data: { adminId: admin.id, entityType: 'review', entityId: BigInt(i + 1), action: 'flagged', reason: 'Inappropriate language detected' }
    });
    
    await prisma.supportTicket.create({
      data: { userId: customers[i].id, subject: `Help with booking ${i}`, description: 'I need to reschedule.', status: i % 2 === 0 ? 'open' : 'closed', priority: 'medium' }
    });
  }

  await prisma.complianceReport.create({
    data: { companyId: companies[0].id, type: 'kyb_verification', status: 'approved', notes: 'All business documents verified.' }
  });
  await prisma.complianceReport.create({
    data: { companyId: companies[2].id, type: 'kyb_verification', status: 'pending', notes: 'Awaiting business license.' }
  });

  // 8. CREATE TRANSACTIONS & PAYOUTS
  console.log('💰 Creating Wallet Transactions & Payouts...');
  for (let i = 0; i < 5; i++) {
    await prisma.payoutRequest.create({
      data: { ownerType: 'company', ownerId: companies[0].id, amount: 500 + (i * 100), status: i === 0 ? 'pending' : 'paid', destinationBank: 'Bank of America', accountName: 'John Doe', accountNumber: '123456789' }
    });
  }

  for (let i = 0; i < 20; i++) {
    await prisma.transaction.create({
      data: { ownerType: 'company', ownerId: companies[0].id, type: 'earning', amount: 135.00, category: `earning`, description: 'Booking Earning' }
    });
  }

  // 9. CREATE AUDIT LOGS
  console.log('📝 Creating Admin Audit Logs...');
  for (let i = 0; i < 15; i++) {
    await prisma.auditLog.create({
      data: { userId: admin.id, action: 'UPDATE_SETTINGS', entityType: 'SystemSetting', entityId: BigInt(1) }
    });
  }

  console.log('✅ MASSIVE SEED COMPLETED SUCCESSFULLY! Your app is fully populated.');
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    await runProductionSeed();
  } else {
    // Optionally we can look for an env var to force safe seed in dev, but usually default to massive
    if (process.env.SAFE_SEED === 'true') {
      await runProductionSeed();
    } else {
      await runMassiveSeed();
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
