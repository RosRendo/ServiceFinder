// prisma/seed.js
const prisma = require("../src/config/database");
const bcrypt = require("bcryptjs");

async function main() {

  try {
    // ─── Clear existing data (reverse order of dependencies) ───────────────────
    await prisma.message.deleteMany();
    await prisma.conversationParticipant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.companyRatingSummary.deleteMany();
    await prisma.cancellation.deleteMany();
    await prisma.review.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.bookingStatusLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.serviceRequest.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.serviceArea.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceType.deleteMany();
    await prisma.category.deleteMany();
    await prisma.companyStaff.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // ─── USERS ─────────────────────────────────────────────────────────────────

    const adminUser = await prisma.user.create({
      data: {
        fullName: "Admin User",
        email: "admin@servicefinder.com",
        phone: "+1-800-000-0001",
        passwordHash: hashedPassword,
        role: "admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=50",
      },
    });

    // Company Owners
    const owner1 = await prisma.user.create({
      data: {
        fullName: "James Carter",
        email: "james@sparkclean.com",
        phone: "+1-555-0101",
        passwordHash: hashedPassword,
        role: "company_admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
    });
    const owner2 = await prisma.user.create({
      data: {
        fullName: "Sophia Rivera",
        email: "sophia@eliteclean.com",
        phone: "+1-555-0102",
        passwordHash: hashedPassword,
        role: "company_admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=47",
      },
    });
    const owner3 = await prisma.user.create({
      data: {
        fullName: "Daniel Kim",
        email: "daniel@greenclean.com",
        phone: "+1-555-0103",
        passwordHash: hashedPassword,
        role: "company_admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=33",
      },
    });
    const owner4 = await prisma.user.create({
      data: {
        fullName: "Amelia Thompson",
        email: "amelia@proflow.com",
        phone: "+1-555-0104",
        passwordHash: hashedPassword,
        role: "company_admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=48",
      },
    });
    const owner5 = await prisma.user.create({
      data: {
        fullName: "Marcus Reed",
        email: "marcus@voltpro.com",
        phone: "+1-555-0105",
        passwordHash: hashedPassword,
        role: "company_admin",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=15",
      },
    });

    // Staff Members
    const staff1 = await prisma.user.create({
      data: {
        fullName: "Rachel Morgan",
        email: "rachel@sparkclean.com",
        phone: "+1-555-0201",
        passwordHash: hashedPassword,
        role: "staff",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=44",
      },
    });
    const staff2 = await prisma.user.create({
      data: {
        fullName: "Carlos Mendez",
        email: "carlos@sparkclean.com",
        phone: "+1-555-0202",
        passwordHash: hashedPassword,
        role: "staff",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=12",
      },
    });
    const staff3 = await prisma.user.create({
      data: {
        fullName: "Priya Patel",
        email: "priya@eliteclean.com",
        phone: "+1-555-0203",
        passwordHash: hashedPassword,
        role: "staff",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=29",
      },
    });
    const staff4 = await prisma.user.create({
      data: {
        fullName: "Jake Williams",
        email: "jake@proflow.com",
        phone: "+1-555-0204",
        passwordHash: hashedPassword,
        role: "staff",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=7",
      },
    });
    const staff5 = await prisma.user.create({
      data: {
        fullName: "Nina Kovacs",
        email: "nina@greenclean.com",
        phone: "+1-555-0205",
        passwordHash: hashedPassword,
        role: "staff",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=41",
      },
    });

    // Customers
    const customer1 = await prisma.user.create({
      data: {
        fullName: "Emma Davis",
        email: "emma@example.com",
        phone: "+1-555-1001",
        passwordHash: hashedPassword,
        role: "customer",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=5",
      },
    });
    const customer2 = await prisma.user.create({
      data: {
        fullName: "Noah Johnson",
        email: "noah@example.com",
        phone: "+1-555-1002",
        passwordHash: hashedPassword,
        role: "customer",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=13",
      },
    });
    const customer3 = await prisma.user.create({
      data: {
        fullName: "Olivia Martinez",
        email: "olivia@example.com",
        phone: "+1-555-1003",
        passwordHash: hashedPassword,
        role: "customer",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=38",
      },
    });
    const customer4 = await prisma.user.create({
      data: {
        fullName: "Liam Wilson",
        email: "liam@example.com",
        phone: "+1-555-1004",
        passwordHash: hashedPassword,
        role: "customer",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
    });
    const customer5 = await prisma.user.create({
      data: {
        fullName: "Ava Brown",
        email: "ava@example.com",
        phone: "+1-555-1005",
        passwordHash: hashedPassword,
        role: "customer",
        status: "active",
        avatar: "https://i.pravatar.cc/150?img=49",
      },
    });

    // ─── CATEGORIES ────────────────────────────────────────────────────────────

    const catCleaning = await prisma.category.create({
      data: {
        name: "Cleaning Services",
        slug: "cleaning-services",
        description: "Professional cleaning services for homes, offices and more",
        icon: "Sparkles",
        imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=800",
        status: "active",
        displayOrder: 1,
      },
    });
    const catPlumbing = await prisma.category.create({
      data: {
        name: "Plumbing",
        slug: "plumbing",
        description: "Pipe repairs, drain cleaning, and full bathroom installations",
        icon: "Wrench",
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800",
        status: "active",
        displayOrder: 2,
      },
    });
    const catElectrical = await prisma.category.create({
      data: {
        name: "Electrical",
        slug: "electrical",
        description: "Certified electricians for wiring, repairs, and installations",
        icon: "Zap",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800",
        status: "active",
        displayOrder: 3,
      },
    });
    const catPainting = await prisma.category.create({
      data: {
        name: "Painting",
        slug: "painting",
        description: "Interior and exterior painting for homes and businesses",
        icon: "Paintbrush",
        imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800",
        status: "active",
        displayOrder: 4,
      },
    });
    const catLandscaping = await prisma.category.create({
      data: {
        name: "Landscaping",
        slug: "landscaping",
        description: "Garden maintenance, lawn care, and outdoor transformations",
        icon: "Trees",
        imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800",
        status: "active",
        displayOrder: 5,
      },
    });

    // ─── SERVICE TYPES ─────────────────────────────────────────────────────────

    // Cleaning
    const stResidential = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Residential Cleaning",
        slug: "residential",
        description: "Regular home cleaning — bedrooms, living areas, kitchens & bathrooms",
        icon: "Home",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
        status: "active",
        displayOrder: 1,
      },
    });
    const stCommercial = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Commercial Cleaning",
        slug: "commercial",
        description: "Professional cleaning for offices and business facilities",
        icon: "Building2",
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600",
        status: "active",
        displayOrder: 2,
      },
    });
    const stDeepClean = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Deep Cleaning",
        slug: "deep",
        description: "Intensive thorough cleaning that reaches every corner",
        icon: "Sparkles",
        imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600",
        status: "active",
        displayOrder: 3,
      },
    });
    const stMoveInOut = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Move-In / Move-Out",
        slug: "move",
        description: "Perfect for relocations — get your full deposit back",
        icon: "Truck",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
        status: "active",
        displayOrder: 4,
      },
    });
    const stCarpet = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Carpet & Upholstery",
        slug: "carpet",
        description: "Deep clean carpets, sofas, and fabric furniture",
        icon: "Waves",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600",
        status: "active",
        displayOrder: 5,
      },
    });
    const stKitchen = await prisma.serviceType.create({
      data: {
        categoryId: catCleaning.id,
        name: "Kitchen Deep Clean",
        slug: "kitchen",
        description: "Appliances, grease removal and full kitchen sanitization",
        icon: "ChefHat",
        imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600",
        status: "active",
        displayOrder: 6,
      },
    });
    // Plumbing
    const stPlumbing = await prisma.serviceType.create({
      data: {
        categoryId: catPlumbing.id,
        name: "General Plumbing",
        slug: "general",
        description: "Pipe repairs, leak fixing, and general maintenance",
        icon: "Wrench",
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600",
        status: "active",
        displayOrder: 1,
      },
    });
    const stBathroom = await prisma.serviceType.create({
      data: {
        categoryId: catPlumbing.id,
        name: "Bathroom Installation",
        slug: "bathroom",
        description: "Full bathroom plumbing and fixture installations",
        icon: "Bath",
        imageUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=600",
        status: "active",
        displayOrder: 2,
      },
    });
    // Electrical
    const stElectrical = await prisma.serviceType.create({
      data: {
        categoryId: catElectrical.id,
        name: "General Electrical",
        slug: "general-electrical",
        description: "Wiring, repairs, and electrical safety inspections",
        icon: "Zap",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600",
        status: "active",
        displayOrder: 1,
      },
    });
    // Painting
    const stInteriorPainting = await prisma.serviceType.create({
      data: {
        categoryId: catPainting.id,
        name: "Interior Painting",
        slug: "interior",
        description: "High-quality interior painting for any room",
        icon: "Paintbrush",
        imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600",
        status: "active",
        displayOrder: 1,
      },
    });
    // Landscaping
    const stLawnCare = await prisma.serviceType.create({
      data: {
        categoryId: catLandscaping.id,
        name: "Lawn Care",
        slug: "lawn",
        description: "Regular mowing, edging, and lawn health maintenance",
        icon: "Scissors",
        imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600",
        status: "active",
        displayOrder: 1,
      },
    });

    // ─── COMPANIES ─────────────────────────────────────────────────────────────

    const company1 = await prisma.company.create({
      data: {
        name: "Spark Clean Co.",
        description:
          "NYC's top-rated residential and commercial cleaning company. Our certified team uses eco-friendly products and state-of-the-art equipment to deliver spotless results every time.",
        registrationNumber: "REG-2020-001",
        address: "250 Park Avenue",
        city: "Phnom Penh",
        latitude: "11.5564",
        longitude: "104.9282",
        phone: "+1-555-0101",
        email: "hello@sparkclean.com",
        ownerId: owner1.id,
        verificationStatus: "verified",
        logoUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=200&h=200&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1200&h=400&fit=crop",
        establishedYear: 2020,
        cardHighlights: ["Eco-Friendly", "Background Checked", "Insured"],
        detailHighlights: [
          "100% Eco-Friendly Products",
          "Background-Checked Staff",
          "Fully Insured & Bonded",
          "Satisfaction Guarantee",
          "Flexible Scheduling",
        ],
      },
    });

    const company2 = await prisma.company.create({
      data: {
        name: "Elite Home Cleaners",
        description:
          "Premium cleaning services tailored for luxury homes and high-end offices in Los Angeles. We specialize in detailed, white-glove service with the highest standards of cleanliness.",
        registrationNumber: "REG-2018-002",
        address: "8500 Sunset Blvd",
        city: "Phnom Penh",
        latitude: "11.5621",
        longitude: "104.8885",
        phone: "+1-555-0102",
        email: "contact@eliteclean.com",
        ownerId: owner2.id,
        verificationStatus: "verified",
        logoUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=200&h=200&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&h=400&fit=crop",
        establishedYear: 2018,
        cardHighlights: ["Premium Service", "5-Star Rated", "Same-Day Available"],
        detailHighlights: [
          "White-Glove Service",
          "Certified Clean Team",
          "Premium Equipment",
          "Custom Cleaning Plans",
          "Priority Scheduling",
        ],
      },
    });

    const company3 = await prisma.company.create({
      data: {
        name: "Green & Clean Chicago",
        description:
          "Chicago's first 100% green certified cleaning company. We use only certified organic products that are safe for your family, pets, and the environment — without compromising on results.",
        registrationNumber: "REG-2021-003",
        address: "401 N Michigan Ave",
        city: "Phnom Penh",
        latitude: "11.5448",
        longitude: "104.8921",
        phone: "+1-555-0103",
        email: "info@greenclean.com",
        ownerId: owner3.id,
        verificationStatus: "verified",
        logoUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=200&h=200&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&h=400&fit=crop",
        establishedYear: 2021,
        cardHighlights: ["100% Green", "Pet Safe", "Child Safe"],
        detailHighlights: [
          "Certified Organic Products",
          "Zero Toxic Chemicals",
          "Safe for Pets & Kids",
          "Carbon-Neutral Operations",
          "Biodegradable Packaging",
        ],
      },
    });

    const company4 = await prisma.company.create({
      data: {
        name: "ProFlow Plumbing",
        description:
          "Reliable 24/7 plumbing services across Houston. From emergency pipe bursts to full bathroom renovations — our licensed plumbers get the job done fast and right the first time.",
        registrationNumber: "REG-2017-004",
        address: "1200 Westheimer Rd",
        city: "Phnom Penh",
        latitude: "11.5760",
        longitude: "104.9230",
        phone: "+1-555-0104",
        email: "service@proflow.com",
        ownerId: owner4.id,
        verificationStatus: "verified",
        logoUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=200&h=200&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=1200&h=400&fit=crop",
        establishedYear: 2017,
        cardHighlights: ["24/7 Emergency", "Licensed Plumbers", "Upfront Pricing"],
        detailHighlights: [
          "24/7 Emergency Response",
          "Licensed & Insured",
          "No Hidden Fees",
          "1-Year Workmanship Warranty",
          "Free Initial Estimates",
        ],
      },
    });

    const company5 = await prisma.company.create({
      data: {
        name: "VoltPro Electrical",
        description:
          "Phoenix's most trusted electrical contractor. We handle everything from simple outlet fixes to full commercial wiring projects. All work is code-compliant and inspected.",
        registrationNumber: "REG-2019-005",
        address: "2300 E Camelback Rd",
        city: "Phnom Penh",
        latitude: "11.5365",
        longitude: "104.9123",
        phone: "+1-555-0105",
        email: "service@voltpro.com",
        ownerId: owner5.id,
        verificationStatus: "verified",
        logoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&h=200&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&h=400&fit=crop",
        establishedYear: 2019,
        cardHighlights: ["Code Compliant", "Certified Electricians", "Fast Response"],
        detailHighlights: [
          "State-Licensed Electricians",
          "Fully Bonded & Insured",
          "Code-Compliant Work",
          "Free Electrical Inspections",
          "Emergency Services Available",
        ],
      },
    });

    // ─── COMPANY STAFF ─────────────────────────────────────────────────────────

    const cs1 = await prisma.companyStaff.create({
      data: { companyId: company1.id, userId: staff1.id, role: "supervisor", status: "active" },
    });
    const cs2 = await prisma.companyStaff.create({
      data: { companyId: company1.id, userId: staff2.id, role: "cleaner", status: "active" },
    });
    const cs3 = await prisma.companyStaff.create({
      data: { companyId: company2.id, userId: staff3.id, role: "supervisor", status: "active" },
    });
    const cs4 = await prisma.companyStaff.create({
      data: { companyId: company4.id, userId: staff4.id, role: "supervisor", status: "active" },
    });
    const cs5 = await prisma.companyStaff.create({
      data: { companyId: company3.id, userId: staff5.id, role: "cleaner", status: "active" },
    });

    // ─── SERVICES ──────────────────────────────────────────────────────────────

    // Spark Clean Co. services
    const svc1 = await prisma.service.create({
      data: {
        companyId: company1.id,
        serviceTypeId: stResidential.id,
        name: "Standard Home Clean",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
        description: "2–3 hour thorough cleaning covering all standard areas of your home",
        basePrice: "89.99",
        features: ["Vacuuming All Floors", "Mop Hard Floors", "Dust Surfaces", "Clean Bathrooms", "Wipe Kitchen Counters", "Empty Trash"],
        durationMin: 120,
        durationMax: 180,
        isActive: true,
      },
    });
    const svc2 = await prisma.service.create({
      data: {
        companyId: company1.id,
        serviceTypeId: stResidential.id,
        name: "Premium Home Clean",
        image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=600",
        description: "4–5 hour premium cleaning with windows, carpets, and inside appliances",
        basePrice: "179.99",
        features: ["All Standard Features", "Inside Oven & Fridge", "Window Sills", "Carpet Steam Clean", "Baseboards", "Light Fixtures"],
        durationMin: 240,
        durationMax: 300,
        isActive: true,
      },
    });
    const svc3 = await prisma.service.create({
      data: {
        companyId: company1.id,
        serviceTypeId: stDeepClean.id,
        name: "Full Deep Clean",
        image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600",
        description: "6+ hour intensive deep clean — ideal for spring cleaning or after events",
        basePrice: "319.99",
        features: ["All Premium Features", "Grout Scrubbing", "Cabinet Interiors", "Behind Appliances", "Air Vents", "Wall Wash"],
        durationMin: 360,
        durationMax: 480,
        isActive: true,
      },
    });
    const svc4 = await prisma.service.create({
      data: {
        companyId: company1.id,
        serviceTypeId: stCommercial.id,
        name: "Office Clean Package",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600",
        description: "Professional office cleaning for small to medium workplaces",
        basePrice: "139.99",
        features: ["Desk & Workstation Wipe", "Floor Cleaning", "Trash Removal", "Bathroom Sanitizing", "Break Room", "Reception Area"],
        durationMin: 120,
        durationMax: 180,
        isActive: true,
      },
    });
    const svc5 = await prisma.service.create({
      data: {
        companyId: company1.id,
        serviceTypeId: stMoveInOut.id,
        name: "Move-Out Clean",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
        description: "Comprehensive move-out clean to ensure full deposit return",
        basePrice: "249.99",
        features: ["Full Deep Clean", "Inside All Cabinets", "Appliance Clean", "Wall Scuff Removal", "Window Clean", "Garage Sweep"],
        durationMin: 300,
        durationMax: 420,
        isActive: true,
      },
    });

    // Elite Home Cleaners services
    const svc6 = await prisma.service.create({
      data: {
        companyId: company2.id,
        serviceTypeId: stResidential.id,
        name: "Luxury Home Service",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=600",
        description: "White-glove residential cleaning for premium homes — every detail attended to",
        basePrice: "249.99",
        features: ["Hand-Detailed Surfaces", "Crystal & Décor Polish", "Bed Linen Change", "Luxury Products", "Scent Treatment", "Post-Service Report"],
        durationMin: 300,
        durationMax: 360,
        isActive: true,
      },
    });
    const svc7 = await prisma.service.create({
      data: {
        companyId: company2.id,
        serviceTypeId: stKitchen.id,
        name: "Kitchen Restoration",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600",
        description: "Extreme kitchen deep clean — make it look factory fresh",
        basePrice: "189.99",
        features: ["Oven Degreasing", "Hood Filter Clean", "Sink Descale", "Tile & Grout Scrub", "Cabinet Degreasing", "Appliance Polish"],
        durationMin: 180,
        durationMax: 240,
        isActive: true,
      },
    });
    const svc8 = await prisma.service.create({
      data: {
        companyId: company2.id,
        serviceTypeId: stCarpet.id,
        name: "Carpet & Sofa Refresh",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600",
        description: "Hot-water extraction carpet cleaning plus upholstery treatment",
        basePrice: "219.99",
        features: ["Hot-Water Extraction", "Stain Treatment", "Deodorizer Application", "Sofa & Chairs", "Drying Assistance", "Protective Coating"],
        durationMin: 180,
        durationMax: 240,
        isActive: true,
      },
    });

    // Green & Clean services
    const svc9 = await prisma.service.create({
      data: {
        companyId: company3.id,
        serviceTypeId: stResidential.id,
        name: "Eco Home Clean",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600",
        description: "Full residential clean using 100% certified organic, non-toxic products",
        basePrice: "109.99",
        features: ["Organic Products Only", "Pet & Child Safe", "Allergy-Friendly", "Full Home Clean", "Natural Disinfectants", "Zero VOC"],
        durationMin: 150,
        durationMax: 210,
        isActive: true,
      },
    });
    const svc10 = await prisma.service.create({
      data: {
        companyId: company3.id,
        serviceTypeId: stDeepClean.id,
        name: "Green Deep Clean",
        image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=600",
        description: "Intensive top-to-bottom clean with zero-chemical green solutions",
        basePrice: "289.99",
        features: ["Enzyme Cleaners", "Non-Toxic Degreaser", "Bio-Based Polishes", "Airborne Toxin Removal", "Mold Prevention", "Post-Report"],
        durationMin: 360,
        durationMax: 480,
        isActive: true,
      },
    });

    // ProFlow Plumbing services
    const svc11 = await prisma.service.create({
      data: {
        companyId: company4.id,
        serviceTypeId: stPlumbing.id,
        name: "Emergency Pipe Repair",
        image: "https://images.unsplash.com/photo-1604754742629-3e5728249d73?q=80&w=600",
        description: "24/7 rapid response pipe burst and leak repair — anywhere in Houston",
        basePrice: "199.99",
        features: ["24/7 Response", "Burst Pipe Repair", "Leak Detection", "Pressure Test", "Water Damage Assessment", "Cleanup"],
        durationMin: 60,
        durationMax: 120,
        isActive: true,
      },
    });
    const svc12 = await prisma.service.create({
      data: {
        companyId: company4.id,
        serviceTypeId: stBathroom.id,
        name: "Full Bathroom Plumb",
        image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=600",
        description: "Complete bathroom plumbing installation — from piping to fixture fitting",
        basePrice: "599.99",
        features: ["Design Consultation", "Rough-In Plumbing", "Fixture Installation", "Water Heater Hook-up", "Pressure Testing", "1-Year Warranty"],
        durationMin: 480,
        durationMax: 600,
        isActive: true,
      },
    });

    // VoltPro services
    const svc13 = await prisma.service.create({
      data: {
        companyId: company5.id,
        serviceTypeId: stElectrical.id,
        name: "Safety Electrical Inspection",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600",
        description: "Full home electrical safety inspection with certified report",
        basePrice: "149.99",
        features: ["Panel Inspection", "Outlets & Switches Test", "GFCI Check", "Code Compliance", "Written Safety Report", "Fix Quote Included"],
        durationMin: 120,
        durationMax: 180,
        isActive: true,
      },
    });
    const svc14 = await prisma.service.create({
      data: {
        companyId: company5.id,
        serviceTypeId: stElectrical.id,
        name: "Full Home Wiring",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600",
        description: "Complete rewiring for older homes — fully code-compliant and inspected",
        basePrice: "1499.99",
        features: ["Full Rewire", "Panel Upgrade", "Modern Breakers", "Surge Protection", "Permit & Inspection", "3-Year Warranty"],
        durationMin: 720,
        durationMax: 1440,
        isActive: true,
      },
    });

    // ─── SERVICE AREAS ─────────────────────────────────────────────────────────
    await prisma.serviceArea.createMany({
      data: [
        { companyId: company1.id, city: "New York", coverageRadiusKm: 50 },
        { companyId: company1.id, city: "Brooklyn", coverageRadiusKm: 50 },
        { companyId: company1.id, city: "Queens", coverageRadiusKm: 50 },
        { companyId: company2.id, city: "Los Angeles", coverageRadiusKm: 50 },
        { companyId: company2.id, city: "Beverly Hills", coverageRadiusKm: 50 },
        { companyId: company3.id, city: "Chicago", coverageRadiusKm: 50 },
        { companyId: company4.id, city: "Houston", coverageRadiusKm: 50 },
        { companyId: company5.id, city: "Phoenix", coverageRadiusKm: 50 },
      ],
    });

    // ─── BOOKINGS ──────────────────────────────────────────────────────────────

    const bk1 = await prisma.booking.create({
      data: {
        customerId: customer1.id,
        serviceId: svc1.id,
        companyId: company1.id,
        assignedStaffId: cs1.id,
        bookingDate: new Date("2026-02-10"),
        startTime: new Date("2026-02-10T10:00:00"),
        endTime: new Date("2026-02-10T12:30:00"),
        status: "completed",
        totalPrice: "89.99",
        platformFee: "9.00",
        companyEarnings: "80.99",
        serviceAddress: "450 W 33rd St, New York, NY 10001",
        latitude: "40.7484",
        longitude: "-73.9967",
      },
    });
    const bk2 = await prisma.booking.create({
      data: {
        customerId: customer2.id,
        serviceId: svc2.id,
        companyId: company1.id,
        bookingDate: new Date("2026-03-15"),
        startTime: new Date("2026-03-15T14:00:00"),
        endTime: new Date("2026-03-15T18:00:00"),
        status: "confirmed",
        totalPrice: "179.99",
        platformFee: "18.00",
        companyEarnings: "161.99",
        serviceAddress: "200 Central Park W, New York, NY 10024",
        latitude: "40.7736",
        longitude: "-73.9799",
      },
    });
    const bk3 = await prisma.booking.create({
      data: {
        customerId: customer3.id,
        serviceId: svc6.id,
        companyId: company2.id,
        assignedStaffId: cs3.id,
        bookingDate: new Date("2026-02-18"),
        startTime: new Date("2026-02-18T09:00:00"),
        endTime: new Date("2026-02-18T14:00:00"),
        status: "completed",
        totalPrice: "249.99",
        platformFee: "25.00",
        companyEarnings: "224.99",
        serviceAddress: "910 Benedict Canyon Dr, Beverly Hills, CA 90210",
        latitude: "34.0928",
        longitude: "-118.4317",
      },
    });
    const bk4 = await prisma.booking.create({
      data: {
        customerId: customer4.id,
        serviceId: svc11.id,
        companyId: company4.id,
        assignedStaffId: cs4.id,
        bookingDate: new Date("2026-02-22"),
        startTime: new Date("2026-02-22T08:30:00"),
        endTime: new Date("2026-02-22T10:00:00"),
        status: "completed",
        totalPrice: "199.99",
        platformFee: "20.00",
        companyEarnings: "179.99",
        serviceAddress: "3200 Weslayan St, Houston, TX 77027",
        latitude: "29.7381",
        longitude: "-95.4322",
      },
    });
    const bk5 = await prisma.booking.create({
      data: {
        customerId: customer5.id,
        serviceId: svc9.id,
        companyId: company3.id,
        assignedStaffId: cs5.id,
        bookingDate: new Date("2026-03-08"),
        startTime: new Date("2026-03-08T11:00:00"),
        endTime: new Date("2026-03-08T13:30:00"),
        status: "pending",
        totalPrice: "109.99",
        platformFee: "11.00",
        companyEarnings: "98.99",
        serviceAddress: "875 N Michigan Ave, Chicago, IL 60611",
        latitude: "41.8975",
        longitude: "-87.6231",
      },
    });
    const bk6 = await prisma.booking.create({
      data: {
        customerId: customer1.id,
        serviceId: svc3.id,
        companyId: company1.id,
        assignedStaffId: cs2.id,
        bookingDate: new Date("2026-01-25"),
        startTime: new Date("2026-01-25T09:00:00"),
        endTime: new Date("2026-01-25T15:00:00"),
        status: "completed",
        totalPrice: "319.99",
        platformFee: "32.00",
        companyEarnings: "287.99",
        serviceAddress: "450 W 33rd St, New York, NY 10001",
        latitude: "40.7484",
        longitude: "-73.9967",
      },
    });
    const bk7 = await prisma.booking.create({
      data: {
        customerId: customer2.id,
        serviceId: svc7.id,
        companyId: company2.id,
        bookingDate: new Date("2026-03-20"),
        startTime: new Date("2026-03-20T10:00:00"),
        endTime: new Date("2026-03-20T14:00:00"),
        status: "confirmed",
        totalPrice: "189.99",
        platformFee: "19.00",
        companyEarnings: "170.99",
        serviceAddress: "1100 Glendon Ave, Los Angeles, CA 90024",
        latitude: "34.0605",
        longitude: "-118.4409",
      },
    });

    // ─── PAYMENTS ──────────────────────────────────────────────────────────────

    await prisma.payment.create({ data: { bookingId: bk1.id, userId: customer1.id, amount: "89.99", method: "card", status: "paid", transactionRef: "TXN-2026-001", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk2.id, userId: customer2.id, amount: "179.99", method: "card", status: "paid", transactionRef: "TXN-2026-002", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk3.id, userId: customer3.id, amount: "249.99", method: "card", status: "paid", transactionRef: "TXN-2026-003", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk4.id, userId: customer4.id, amount: "199.99", method: "card", status: "paid", transactionRef: "TXN-2026-004", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk5.id, userId: customer5.id, amount: "109.99", method: "wallet", status: "pending", transactionRef: "TXN-2026-005", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk6.id, userId: customer1.id, amount: "319.99", method: "card", status: "paid", transactionRef: "TXN-2026-006", currency: "USD" } });
    await prisma.payment.create({ data: { bookingId: bk7.id, userId: customer2.id, amount: "189.99", method: "card", status: "paid", transactionRef: "TXN-2026-007", currency: "USD" } });

    // ─── REVIEWS ───────────────────────────────────────────────────────────────

    await prisma.review.create({
      data: {
        bookingId: bk1.id,
        customerId: customer1.id,
        companyRating: 5,
        companyComment: "Spark Clean Co. is absolutely outstanding! The team arrived on time, were incredibly professional, and left my apartment spotless. Will definitely be a repeat customer!",
        staffId: cs1.id,
        staffRating: 5,
        staffComment: "Rachel was thorough, friendly, and worked quickly. My kitchen has never looked this clean!",
      },
    });
    await prisma.review.create({
      data: {
        bookingId: bk3.id,
        customerId: customer3.id,
        companyRating: 5,
        companyComment: "Elite Home Cleaners is worth every penny. They treated my home like a luxury hotel room. Exceptional attention to detail and they used amazing products.",
        staffId: cs3.id,
        staffRating: 5,
        staffComment: "Priya was an absolute professional — organized, thorough, and she even organized my pantry! Above and beyond.",
      },
    });
    await prisma.review.create({
      data: {
        bookingId: bk4.id,
        customerId: customer4.id,
        companyRating: 5,
        companyComment: "ProFlow saved the day! Pipe burst at 2am and they arrived within 45 minutes. Fantastic response and quality work. The repair was solid and they cleaned up everything after.",
        staffId: cs4.id,
        staffRating: 5,
        staffComment: "Jake was calm, knowledgeable, and worked fast. Even explained what caused the issue so I can prevent it in future.",
      },
    });
    await prisma.review.create({
      data: {
        bookingId: bk6.id,
        customerId: customer1.id,
        companyRating: 4,
        companyComment: "Great deep clean — my apartment feels completely refreshed. A small area behind the fridge was missed but overall excellent quality work.",
        staffId: cs2.id,
        staffRating: 4,
        staffComment: "Carlos was great — very hard working and friendly. Just one small area missed, but I would book again.",
      },
    });
    await prisma.review.create({
      data: {
        bookingId: bk7.id,
        customerId: customer2.id,
        companyRating: 5,
        companyComment: "My kitchen looks brand new after the Kitchen Restoration service! They removed built-up grease I thought was permanent. Incredibly skilled team.",
      },
    });

    // ─── COMPANY RATING SUMMARIES ──────────────────────────────────────────────
    await prisma.companyRatingSummary.create({
      data: { companyId: company1.id, averageRating: 4.5, totalReviews: 2 },
    });
    await prisma.companyRatingSummary.create({
      data: { companyId: company2.id, averageRating: 5.0, totalReviews: 2 },
    });
    await prisma.companyRatingSummary.create({
      data: { companyId: company4.id, averageRating: 5.0, totalReviews: 1 },
    });

  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
