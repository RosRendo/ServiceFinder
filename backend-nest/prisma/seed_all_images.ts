import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedAllWithImages() {
  console.log('🌟 Starting Comprehensive Image & Service Seed for ServiceFinder...');
  const pw = await bcrypt.hash('password123', 10);

  // ─── 1. SUPER ADMIN & USERS WITH AVATARS ──────────────────────────────
  console.log('👤 Ensuring Admin & Demo Users have professional avatars...');
  await prisma.user.upsert({
    where: { email: 'admin@servicefinder.com' },
    update: {
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      status: 'active',
    },
    create: {
      fullName: 'Super Admin',
      email: 'admin@servicefinder.com',
      passwordHash: pw,
      role: 'admin',
      phone: '+85512000001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
      status: 'active',
    },
  });

  // Ensure Customer Demo User
  const demoCustomer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
    },
    create: {
      fullName: 'Rendo Customer',
      email: 'customer@demo.com',
      passwordHash: pw,
      role: 'customer',
      phone: '+85512000002',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
      status: 'active',
    },
  });

  // Ensure Company Owners
  const ownerUsers: any[] = [];
  const ownerData = [
    { email: 'owner1@demo.com', name: 'Sophea Kem', phone: '+85512100001', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop' },
    { email: 'owner2@demo.com', name: 'Dara Chan', phone: '+85512100002', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop' },
    { email: 'owner3@demo.com', name: 'Bopha Vorn', phone: '+85512100003', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop' },
  ];
  for (const od of ownerData) {
    ownerUsers.push(await prisma.user.upsert({
      where: { email: od.email },
      update: { avatar: od.avatar },
      create: {
        fullName: od.name,
        email: od.email,
        passwordHash: pw,
        role: 'company_admin',
        phone: od.phone,
        avatar: od.avatar,
        status: 'active',
      },
    }));
  }

  // ─── 2. CATEGORIES WITH RICH COVERS & BADGES ─────────────────────────
  console.log('📁 Upserting Categories with High-Res Visuals...');
  const categoriesList = [
    {
      name: 'HVAC',
      slug: 'hvac',
      icon: 'air-conditioner',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Cleaning',
      slug: 'cleaning',
      icon: 'broom',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Plumbing',
      slug: 'plumbing',
      icon: 'pipe-wrench',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Electrical',
      slug: 'electrical',
      icon: 'lightning-bolt',
      imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Handyman',
      slug: 'handyman',
      icon: 'hammer-wrench',
      imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Moving Services',
      slug: 'moving-services',
      icon: 'truck-delivery',
      imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Car Wash',
      slug: 'car-wash',
      icon: 'car-wash',
      imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Pest Control',
      slug: 'pest-control',
      icon: 'bug',
      imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Painting',
      slug: 'painting',
      icon: 'brush',
      imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Appliance Repair',
      slug: 'appliance-repair',
      icon: 'wrench',
      imageUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Landscaping',
      slug: 'landscaping',
      icon: 'tree',
      imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f0f?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
    {
      name: 'Locksmith',
      slug: 'locksmith',
      icon: 'key',
      imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop',
      useImageAsBadge: false,
    },
  ];

  const categoryMap: Record<string, any> = {};
  for (let i = 0; i < categoriesList.length; i++) {
    const c = categoriesList[i];
    const record = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        icon: c.icon,
        imageUrl: c.imageUrl,
        displayOrder: i,
        status: 'active',
      },
      create: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        imageUrl: c.imageUrl,
        displayOrder: i,
        status: 'active',
      },
    });
    categoryMap[c.slug] = record;
  }

  // ─── 3. SERVICE TYPES ────────────────────────────────────────────────
  console.log('🏷️ Ensuring Service Types exist...');
  const serviceTypesData = [
    { catSlug: 'hvac', name: 'AC Cleaning & Wash', slug: 'ac-cleaning' },
    { catSlug: 'hvac', name: 'AC Repair & Gas Refill', slug: 'ac-repair' },
    { catSlug: 'hvac', name: 'AC Installation', slug: 'ac-installation' },
    { catSlug: 'cleaning', name: 'Deep Cleaning', slug: 'deep-cleaning' },
    { catSlug: 'cleaning', name: 'Standard Cleaning', slug: 'standard-cleaning' },
    { catSlug: 'cleaning', name: 'Sofa & Carpet Wash', slug: 'sofa-carpet-wash' },
    { catSlug: 'plumbing', name: 'Pipe Leak Repair', slug: 'pipe-leak' },
    { catSlug: 'plumbing', name: 'Drain & Clog Clearing', slug: 'drain-clearing' },
    { catSlug: 'plumbing', name: 'Water Heater Service', slug: 'water-heater-service' },
    { catSlug: 'electrical', name: 'Wiring & Short Circuit', slug: 'wiring-repair' },
    { catSlug: 'electrical', name: 'Fixture & Fan Install', slug: 'fixture-install' },
    { catSlug: 'electrical', name: 'Panel & EV Charger', slug: 'panel-ev-charger' },
    { catSlug: 'handyman', name: 'Furniture Assembly', slug: 'furniture-assembly' },
    { catSlug: 'handyman', name: 'TV Wall Mounting', slug: 'tv-wall-mounting' },
    { catSlug: 'handyman', name: 'Door & Lock Repair', slug: 'door-lock-repair' },
    { catSlug: 'moving-services', name: 'Residential Moving', slug: 'residential-moving' },
    { catSlug: 'car-wash', name: 'Mobile Car Wash & Detailing', slug: 'mobile-car-wash' },
    { catSlug: 'pest-control', name: 'Termite & Pest Fumigation', slug: 'pest-fumigation' },
  ];

  const serviceTypeMap: Record<string, any> = {};
  for (const st of serviceTypesData) {
    const parentCat = categoryMap[st.catSlug];
    if (parentCat) {
      const record = await prisma.serviceType.upsert({
        where: { slug: st.slug },
        update: { name: st.name, categoryId: parentCat.id, status: 'active' },
        create: {
          name: st.name,
          slug: st.slug,
          categoryId: parentCat.id,
          status: 'active',
        },
      });
      serviceTypeMap[st.slug] = record;
    }
  }

  // ─── 4. COMPANIES (Phnom Penh Metro with Real Logos & Covers) ────────
  console.log('🏢 Upserting Verified Companies with Covers & Ratings...');
  const companiesData = [
    {
      name: 'Phnom Penh Cool Pros',
      ownerId: ownerUsers[0].id,
      phone: '+85523880101',
      email: 'contact@phnompenhcool.com',
      address: 'Street 302, BKK1',
      city: 'Phnom Penh',
      latitude: 11.5514,
      longitude: 104.9254,
      logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['AC Deep Wash', 'Gas Refill', '24/7 Dispatch'],
      detailHighlights: ['Licensed HVAC Technicians', '90-Day Cooling Guarantee', 'Instant Bakong KHQR'],
      rating: 4.9,
      reviews: 245,
      bookingMode: 'dispatch',
    },
    {
      name: 'Sparkle Cleaning Co.',
      ownerId: ownerUsers[1].id,
      phone: '+85523880102',
      email: 'bookings@sparkleclean.com',
      address: 'Street 51, Daun Penh',
      city: 'Phnom Penh',
      latitude: 11.5681,
      longitude: 104.9228,
      logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['Home Deep Scrub', 'Sofa Steam Clean', 'Vetted Maids'],
      detailHighlights: ['Eco-friendly Detergents', 'Criminal Background Checked', 'Damage Insured'],
      rating: 4.9,
      reviews: 320,
      bookingMode: 'dispatch',
    },
    {
      name: 'Angkor Master Plumbers',
      ownerId: ownerUsers[2].id,
      phone: '+85523880103',
      email: 'help@angkorplumbers.com',
      address: 'Russian Blvd, Toul Kork',
      city: 'Phnom Penh',
      latitude: 11.5710,
      longitude: 104.8985,
      logoUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['Pipe Leak Repair', 'Drain Snake', 'Rapid 20m ETA'],
      detailHighlights: ['High-Pressure Diagnostic Camera', 'Zero Leaks Guarantee', 'Transparent Flat-Rate'],
      rating: 4.8,
      reviews: 185,
      bookingMode: 'open_pool',
    },
    {
      name: 'Royal Volt Electricians',
      ownerId: ownerUsers[0].id,
      phone: '+85523880104',
      email: 'service@royalvolt.kh',
      address: 'Street 271, Chamkarmon',
      city: 'Phnom Penh',
      latitude: 11.5385,
      longitude: 104.9120,
      logoUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['Main Breaker Trip', 'EV Home Charger', 'Certified Pro'],
      detailHighlights: ['Master Electrician Certified', 'Thermal Imaging Safety Check', 'Emergency Night Callout'],
      rating: 4.9,
      reviews: 210,
      bookingMode: 'dispatch',
    },
    {
      name: 'Urban Handyman Cambodia',
      ownerId: ownerUsers[1].id,
      phone: '+85523880105',
      email: 'hello@urbanhandyman.kh',
      address: 'Street 1986, Sen Sok',
      city: 'Phnom Penh',
      latitude: 11.5890,
      longitude: 104.8850,
      logoUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['TV Mounting', 'Furniture Build', 'Lock Swap'],
      detailHighlights: ['All Tools Provided', 'Clean Cleanup Guarantee', 'No Hidden Fees'],
      rating: 4.8,
      reviews: 145,
      bookingMode: 'dispatch',
    },
    {
      name: 'Swift Move Transport Cambodia',
      ownerId: ownerUsers[2].id,
      phone: '+85523880106',
      email: 'dispatch@swiftmove.com',
      address: 'National Road 6, Chroy Changvar',
      city: 'Phnom Penh',
      latitude: 11.6020,
      longitude: 104.9350,
      logoUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=300&auto=format&fit=crop',
      coverImageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
      cardHighlights: ['Apartment Moving', 'Heavy Packing', 'Protected Truck'],
      detailHighlights: ['Hydraulic Lift Tailgate', 'Free Bubble Wrap & Boxes', 'On-Time Departure'],
      rating: 4.8,
      reviews: 98,
      bookingMode: 'open_pool',
    },
  ];

  const companyMap: Record<string, any> = {};
  for (const cd of companiesData) {
    let comp = await prisma.company.findFirst({ where: { name: cd.name } });
    if (!comp) {
      comp = await prisma.company.create({
        data: {
          name: cd.name,
          ownerId: cd.ownerId,
          phone: cd.phone,
          email: cd.email,
          address: cd.address,
          city: cd.city,
          latitude: cd.latitude,
          longitude: cd.longitude,
          logoUrl: cd.logoUrl,
          coverImageUrl: cd.coverImageUrl,
          cardHighlights: cd.cardHighlights,
          detailHighlights: cd.detailHighlights,
          verificationStatus: 'verified',
          bookingMode: cd.bookingMode,
        },
      });
    } else {
      comp = await prisma.company.update({
        where: { id: comp.id },
        data: {
          logoUrl: cd.logoUrl,
          coverImageUrl: cd.coverImageUrl,
          address: cd.address,
          city: cd.city,
          cardHighlights: cd.cardHighlights,
          detailHighlights: cd.detailHighlights,
          verificationStatus: 'verified',
        },
      });
    }

    // Upsert Rating Summary
    await prisma.companyRatingSummary.upsert({
      where: { companyId: comp.id },
      update: { averageRating: cd.rating, totalReviews: cd.reviews },
      create: { companyId: comp.id, averageRating: cd.rating, totalReviews: cd.reviews },
    });

    companyMap[cd.name] = comp;
  }

  // ─── 5. SPONSORED MARKETING CAMPAIGNS ────────────────────────────────
  console.log('📢 Creating Active Sponsored Partner Campaigns...');
  for (const compName of ['Phnom Penh Cool Pros', 'Sparkle Cleaning Co.', 'Royal Volt Electricians']) {
    const comp = companyMap[compName];
    if (comp) {
      const existingCamp = await prisma.marketingCampaign.findFirst({ where: { companyId: comp.id, status: 'active' } });
      if (!existingCamp) {
        await prisma.marketingCampaign.create({
          data: {
            companyId: comp.id,
            name: `${compName} Spotlight Banner`,
            status: 'active',
            budget: 500.00,
            spent: 45.00,
            impressions: 1250,
            clicks: 180,
            conversions: 35,
          },
        });
      }
    }
  }

  // ─── 6. SERVICES (EVERY SINGLE SERVICE HAS A DEDICATED HIGH-RES IMAGE) 
  console.log('🛠️ Seeding Comprehensive Services with High-Res Images & Pricing...');
  const servicesData = [
    // ── HVAC & AC Services
    {
      companyName: 'Phnom Penh Cool Pros',
      typeSlug: 'ac-cleaning',
      name: 'AC Deep Chemical Wash & Coil Cleaning',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
      description: 'Complete disassembly, jet wash coil cleaning with antibacterial chemical flush, filter sanitization, and drainage test.',
      basePrice: 18.00,
      discountPrice: 15.00,
      durationMin: 60,
      durationMax: 90,
      features: ['High-pressure water jet flush', 'Kills 99.9% mildew & bacteria', 'Increases cooling efficiency up to 30%', '90-Day workmanship warranty'],
      checklist: ['Cover indoor furniture with protective plastic', 'Disassemble front casing and filters', 'Chemical flush evaporator coils', 'Blow out condensate drain line', 'Measure output temperature and gas pressure'],
    },
    {
      companyName: 'Phnom Penh Cool Pros',
      typeSlug: 'ac-repair',
      name: 'R32 / R410A Refrigerant Gas Refill & Pressure Test',
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=800&auto=format&fit=crop',
      description: 'Professional manifold gauge leak diagnosis and complete refrigerant gas top-up for peak cooling performance.',
      basePrice: 25.00,
      durationMin: 45,
      features: ['Genuine R32 / R410A refrigerant', 'Electronic leak detector scan', 'Amperage and compressor check', 'Full PSI test sheet provided'],
      checklist: ['Attach manifold gauges to service ports', 'Inspect brass flare nuts for oil residue', 'Purge service lines', 'Fill refrigerant to manufacturer spec PSI', 'Verify compressor amp draw'],
    },
    {
      companyName: 'Phnom Penh Cool Pros',
      typeSlug: 'ac-installation',
      name: 'Split AC Wall Mount Installation & Copper Piping',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
      description: 'Expert installation of 1.0HP–2.5HP wall mounted split inverter air conditioners including up to 4 meters of insulated copper tubing.',
      basePrice: 65.00,
      durationMin: 180,
      features: ['Includes heavy-duty wall bracket', 'Up to 4m insulated copper tubing', 'Vacuum pump air evacuation', '1-year installation warranty'],
      checklist: ['Level and bolt indoor mounting bracket', 'Core drill exterior wall sleeve', 'Flaring and insulated copper connections', 'Deep vacuum pump evacuation to 500 microns', 'Live cooling & drainage run test'],
    },

    // ── Cleaning & Housekeeping
    {
      companyName: 'Sparkle Cleaning Co.',
      typeSlug: 'deep-cleaning',
      name: '3-Hour Deep Home Sanitization & Dusting',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop',
      description: 'Meticulous whole-house deep cleaning by vetted maid staff. Includes kitchen degreasing, bathroom descaling, vacuuming, and mopping.',
      basePrice: 22.00,
      discountPrice: 20.00,
      durationMin: 180,
      features: ['Hospital-grade disinfectant', 'Kitchen grease & oven extraction', 'Limescale removal in shower & sinks', 'All equipment & cloths provided'],
      checklist: ['Dust high corners, ceiling fans & door frames', 'Deep scrub kitchen counters & stove top', 'Disinfect bathroom tiles, bowl & glass', 'Vacuum carpets, sofa seams & baseboards', 'Microfiber mop all hard floors'],
    },
    {
      companyName: 'Sparkle Cleaning Co.',
      typeSlug: 'sofa-carpet-wash',
      name: 'Luxury Fabric Sofa & Mattress Deep Steam Wash',
      image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop',
      description: 'Industrial hot water extraction shampoo and steam sterilization to remove tough food stains, pet odors, and dust mites.',
      basePrice: 40.00,
      durationMin: 90,
      features: ['140°C pressurized hot steam', 'Bio-enzyme stain dissolver', 'Fast drying in under 4 hours', 'Safe for sensitive skin & children'],
      checklist: ['Dry vacuum deep debris and pet hair', 'Pre-spray bio-active enzyme spot treatment', 'Rotary brush agitation on high-traffic areas', 'Hot water extraction rinsing', 'Deodorizing mist application'],
    },
    {
      companyName: 'Sparkle Cleaning Co.',
      typeSlug: 'standard-cleaning',
      name: 'Move-In / Move-Out Post Renovation Deep Scrub',
      image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=800&auto=format&fit=crop',
      description: 'Intensive post-construction paint splatter scraping, cement dust extraction, inside-cabinet wiping, and window squeegee wash.',
      basePrice: 95.00,
      durationMin: 240,
      features: ['Paint & plaster splatter removal', 'Inside all cupboards and drawers', 'Sliding glass door track vacuuming', 'Move-in certificate provided'],
      checklist: ['HEPA vacuum ultra-fine drywall dust', 'Razor-scrape paint flecks from glass & tile', 'Wipe interior shelves and closets', 'Machine polish tile flooring', 'Sanitize all handles, switches & fixtures'],
    },

    // ── Plumbing & Pipe Systems
    {
      companyName: 'Angkor Master Plumbers',
      typeSlug: 'pipe-leak',
      name: 'Emergency Pipe Leak & Concealed Wall Leak Fix',
      image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=800&auto=format&fit=crop',
      description: 'Rapid 20-minute dispatch for bursting pipes, high-pressure PPR welding, leaking flex tubes, and water meter spinning troubleshooting.',
      basePrice: 25.00,
      durationMin: 60,
      features: ['20-minute emergency arrival', 'PPR / PVC thermal fusion welding', 'Water pressure balancing', '90-Day leak-free guarantee'],
      checklist: ['Isolate main stopcock valve', 'Acoustic leak pinpointing behind tiles', 'Cut out damaged section and prep pipe', 'Heat weld replacement PPR fittings', 'Pressure test at 10 Bar'],
    },
    {
      companyName: 'Angkor Master Plumbers',
      typeSlug: 'drain-clearing',
      name: 'Hydro-Jet Main Drain & Toilet Clog Clearing',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop',
      description: 'Heavy duty motorized snake auger and high pressure hydro-jetting to clear kitchen grease clogs, roots, and toilet backups instantly.',
      basePrice: 28.00,
      durationMin: 60,
      features: ['Motorized 50ft steel drain auger', 'Eco-safe grease dissolving flush', 'Clears stubborn hair and wipes', 'No chemical damage to pipes'],
      checklist: ['Inspect drain entry and water level', 'Feed flexible auger cable into line', 'Rotate cutter head to snag blockage', 'High volume water flush test', 'Sanitize work area'],
    },
    {
      companyName: 'Angkor Master Plumbers',
      typeSlug: 'water-heater-service',
      name: 'Instant Water Heater Replacement & Thermostat Repair',
      image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop',
      description: 'Safe replacement of burned heating elements, ELCB earth leakage circuit breakers, shower head hoses, and thermal cutoffs.',
      basePrice: 32.00,
      durationMin: 75,
      features: ['Earth Leakage Circuit Breaker (ELCB) check', 'Scald prevention thermostat calibration', 'Descaling of internal copper tank', 'Includes new braided stainless hose'],
      checklist: ['Shut off electrical breaker and water inlet', 'Drain internal heater cylinder', 'Swap heating element with OEM spec', 'Test ELCB trip button response', 'Calibrate 42°C max scald limiter'],
    },

    // ── Electrical & Wiring
    {
      companyName: 'Royal Volt Electricians',
      typeSlug: 'wiring-repair',
      name: 'Main Breaker Trip & Short Circuit Emergency Fix',
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop',
      description: 'Emergency electrical troubleshooting for burning smells, tripping RCBOs, sparking outlets, and partial home blackouts.',
      basePrice: 30.00,
      durationMin: 60,
      features: ['Licensed master electrician', 'Digital multimeter & megger insulation test', 'Fire hazard safety check', 'Replacement breakers in van inventory'],
      checklist: ['Isolate distribution board circuits', 'Megger insulation test on neutral/earth', 'Trace overloaded or pinched wires', 'Replace faulty MCB/RCBO breaker', 'Verify full home load balance'],
    },
    {
      companyName: 'Royal Volt Electricians',
      typeSlug: 'fixture-install',
      name: 'Smart Ceiling Fan & Chandelier Ceiling Mount',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
      description: 'Reinforced concrete anchor ceiling mounting for modern smart ceiling fans, crystal chandeliers, track lighting, and dimmers.',
      basePrice: 28.00,
      durationMin: 75,
      features: ['Heavy concrete drop-in expansion anchors', 'Vibration-free blade balancing', 'Smart Wi-Fi / Remote control pairing', 'Zero dangling wire look'],
      checklist: ['Drill concrete ceiling for M8 expansion anchors', 'Secure heavy duty safety steel lanyard', 'Wire remote receiver and ground lead', 'Assemble fan blades and torque bolts', 'Dynamic balance test at speed 5'],
    },
    {
      companyName: 'Royal Volt Electricians',
      typeSlug: 'panel-ev-charger',
      name: 'Electric Vehicle (EV) Home Wallbox Charger Setup',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop',
      description: 'Dedicated 32A/40A high-capacity circuit installation from meter box with Type B RCD protection for EV home charging stations.',
      basePrice: 140.00,
      durationMin: 240,
      features: ['Dedicated 6mm² / 10mm² copper conduit cable', 'Type B RCD lightning & surge protection', 'Dedicated copper grounding rod', 'Approved for Tesla, BYD, Porsche & Hyundai'],
      checklist: ['Conduct load calculation on main EDC feed', 'Run armored cable in heavy PVC conduit', 'Install dedicated Type B RCCB in sub-panel', 'Drive copper ground rod to <5 ohms', 'Test vehicle communication and 7.4kW/11kW output'],
    },

    // ── Handyman & Furniture
    {
      companyName: 'Urban Handyman Cambodia',
      typeSlug: 'furniture-assembly',
      name: 'Flat Pack Furniture Assembly (Wardrobe, Bed & Desk)',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
      description: 'Precision assembly of IKEA, JYSK, or custom flat-pack beds, sliding door wardrobes, office desks, and ergonomic chairs.',
      basePrice: 20.00,
      durationMin: 90,
      features: ['Professional cordless impact tools', 'Hardware organizing and square alignment', 'Wall anchor tip-over prevention', 'Cardboard packaging flat-packing & disposal'],
      checklist: ['Inventory all bolts, dowels and cam locks', 'Assemble structural frame on protective fleece', 'Square diagonals with laser measure', 'Hang and align adjustable door hinges', 'Anchor tall units securely to masonry wall'],
    },
    {
      companyName: 'Urban Handyman Cambodia',
      typeSlug: 'tv-wall-mounting',
      name: 'Heavy TV Wall Mount with Concealed Cable Trunking',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop',
      description: 'Secure installation of 43"–85" OLED/QLED TVs on brick, concrete, or drywall using heavy-duty tilt or full-motion swivel brackets.',
      basePrice: 25.00,
      durationMin: 60,
      features: ['Includes premium steel tilt bracket', 'Supports up to 85-inch screens', 'Concealed clean cable management', 'Laser level calibrated alignment'],
      checklist: ['Scan wall for hidden pipes and live wires', 'Laser level bracket alignment at eye height', 'Bolt mounting plate with concrete sleeve anchors', 'Affix VESA bars to TV back with nylon spacers', 'Hook and lock TV, organize HDMI & power cords'],
    },
    {
      companyName: 'Urban Handyman Cambodia',
      typeSlug: 'door-lock-repair',
      name: 'Smart Biometric Door Lock & Closer Installation',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop',
      description: 'Upgrade wooden or aluminum doors to keyless fingerprint, PIN, and RFID card smart locks with soft-close hydraulic dampers.',
      basePrice: 35.00,
      durationMin: 90,
      features: ['Mortise lock hole chiseling & precision routing', 'Fingerprint & PIN app setup assistance', 'Smooth latching alignment', 'Emergency mechanical key test'],
      checklist: ['Remove old knob and mortise cylinder', 'Chisel door edge to accept new electronic mortise', 'Route wiring harness through door core', 'Mount front and rear touch panels', 'Register master fingerprint & mobile app'],
    },

    // ── Moving & Transport
    {
      companyName: 'Swift Move Transport Cambodia',
      typeSlug: 'residential-moving',
      name: 'Full Condo & Apartment Relocation Package',
      image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop',
      description: 'Door-to-door apartment moving with 2.5-ton closed box truck, 3 professional movers, furniture disassembly, and shrink-wrapping.',
      basePrice: 85.00,
      durationMin: 240,
      features: ['Covered weatherproof box truck', '3 experienced movers included', 'Heavy-duty moving blankets & stretch wrap', 'Elevator & stairway handling included'],
      checklist: ['Wrap mattresses and soft furniture in film', 'Blanket-wrap wooden tables and TVs', 'Dolly transport to truck and strap securely', 'Direct transit across Phnom Penh districts', 'Unload and place items into designated rooms'],
    },

    // ── Mobile Car Detailing
    {
      companyName: 'Urban Handyman Cambodia',
      typeSlug: 'mobile-car-wash',
      name: 'Waterless Doorstep Foam Car Wash & Interior Vacuum',
      image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=800&auto=format&fit=crop',
      description: 'We bring filtered water and power to your condo or villa parking slot. Includes pH-neutral snow foam wash and leather seat wipe down.',
      basePrice: 15.00,
      durationMin: 60,
      features: ['We supply our own water & power van', 'Scratch-free microfiber mitts', 'Tire shine & brake dust removal', 'Interior dashboard UV protection'],
      checklist: ['Pre-rinse loose sand and road grime', 'Apply thick pH-neutral snow foam cannon', 'Two-bucket hand wash with grit guards', 'Deep vacuum cabin carpet and trunk', 'Apply matte UV protectant to dashboard'],
    },

    // ── Pest Control
    {
      companyName: 'Phnom Penh Cool Pros',
      typeSlug: 'pest-fumigation',
      name: 'Whole Home Mosquito Fogging & Cockroach Gel Treatment',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop',
      description: 'Non-toxic indoor cockroach baiting plus outdoor thermal fogging targeting mosquito breeding sites for dengue prevention.',
      basePrice: 35.00,
      durationMin: 60,
      features: ['Odorless indoor bait gel', 'Safe around pets and children', 'Targeted outdoor drain fogging', 'Residual perimeter spray barrier'],
      checklist: ['Inspect drain inlets and dark cupboards', 'Apply micro-droplet cockroach gel in hinges', 'Spray perimeter baseboards with residual barrier', 'Thermal fog garden bushes and standing water drains', 'Issue 3-month protection report'],
    },
  ];

  for (const s of servicesData) {
    const comp = companyMap[s.companyName];
    const sType = serviceTypeMap[s.typeSlug];
    if (!comp || !sType) {
      console.warn(`Skipping service ${s.name} - company or type missing.`);
      continue;
    }

    const existingService = await prisma.service.findFirst({
      where: { companyId: comp.id, name: s.name },
    });

    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: {
          image: s.image,
          description: s.description,
          basePrice: s.basePrice,
          discountPrice: s.discountPrice || null,
          durationMin: s.durationMin,
          durationMax: s.durationMax || null,
          features: s.features,
          checklist: s.checklist,
          isActive: true,
        },
      });
    } else {
      await prisma.service.create({
        data: {
          companyId: comp.id,
          serviceTypeId: sType.id,
          name: s.name,
          image: s.image,
          description: s.description,
          basePrice: s.basePrice,
          discountPrice: s.discountPrice || null,
          durationMin: s.durationMin,
          durationMax: s.durationMax || null,
          features: s.features,
          checklist: s.checklist,
          isActive: true,
        },
      });
    }
  }

  // ─── 7. UPDATE ANY PRE-EXISTING SERVICES THAT HAD NULL IMAGES ────────
  console.log('🔄 Ensuring all legacy services have valid high-res images...');
  const nullImageServices = await prisma.service.findMany({ where: { image: null } });
  for (const leg of nullImageServices) {
    const n = (leg.name || '').toLowerCase();
    let img = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop';
    if (n.includes('ac') || n.includes('air') || n.includes('cool')) {
      img = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop';
    } else if (n.includes('plumb') || n.includes('leak') || n.includes('pipe') || n.includes('drain')) {
      img = 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=800&auto=format&fit=crop';
    } else if (n.includes('electric') || n.includes('wire') || n.includes('volt')) {
      img = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800&auto=format&fit=crop';
    } else if (n.includes('move') || n.includes('truck')) {
      img = 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop';
    } else if (n.includes('handy') || n.includes('furniture') || n.includes('repair')) {
      img = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop';
    }

    await prisma.service.update({
      where: { id: leg.id },
      data: { image: img },
    });
  }

  // ─── 8. UPDATE ANY LEGACY COMPANIES MISSING LOGO OR COVER ─────────────
  console.log('🔄 Ensuring all legacy companies have logos & covers...');
  const nullCovers = await prisma.company.findMany({
    where: { OR: [{ coverImageUrl: null }, { logoUrl: null }] },
  });
  for (const c of nullCovers) {
    await prisma.company.update({
      where: { id: c.id },
      data: {
        logoUrl: c.logoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=300&auto=format&fit=crop',
        coverImageUrl: c.coverImageUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
        cardHighlights: c.cardHighlights && (c.cardHighlights as any[]).length > 0 ? c.cardHighlights : ['Verified Provider', 'Top Rated', '24/7 Dispatch'],
      },
    });
  }

  console.log('🎉 ALL IMAGES & SERVICES SEEDED SUCCESSFULLY WITH 100% COMPLETE IMAGES!');
}

// Run directly if called from command line
if (require.main === module) {
  seedAllWithImages()
    .catch((err) => {
      console.error('❌ Seeding images failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
