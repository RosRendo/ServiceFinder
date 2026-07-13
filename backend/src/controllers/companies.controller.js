const prisma = require("../config/database");
const bcrypt = require("bcryptjs");
const transporter = require("../config/email");
const { getStaffWelcomeEmail } = require("../utils/emailTemplates");

const getAllCompanies = async (req, res, next) => {
  try {
    const { status, city, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.verificationStatus = status;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          ratingSummary: true,
          services: {
            where: { isActive: true },
            include: { serviceType: { include: { category: true } } }
          },
          _count: {
            select: {
              services: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.count({ where }),
    ]);

    // Format companies to properly map services
    const formattedCompanies = companies.map(company => {
      // Create a shallow copy and convert BigInts to Strings
      return {
        ...company,
        id: company.id.toString(),
        ownerId: company.ownerId.toString(),
        services: company.services?.map(s => ({
          ...s,
          id: s.id.toString(),
          companyId: s.companyId.toString(),
          serviceTypeId: s.serviceTypeId.toString(),
          basePrice: Number(s.basePrice)
        })) || []
      };
    });

    res.json({
      companies: formattedCompanies,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: BigInt(id) },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        services: {
          where: { isActive: true },
          include: {
            serviceType: {
              include: {
                category: true,
              },
            },
          },
        },
        serviceAreas: {
          select: {
            city: true,
            coverageRadiusKm: true,
          },
        },
        ratingSummary: true,
        staff: {
          where: { status: "active" }, // Only count active staff
          select: {
            id: true,
          },
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Calculate years in business from createdAt or foundedYear
    const yearsInBusiness = company.foundedYear
      ? new Date().getFullYear() - company.foundedYear
      : company.createdAt
        ? new Date().getFullYear() - new Date(company.createdAt).getFullYear()
        : 0;

    // Format the response
    const formattedCompany = {
      id: company.id.toString(),
      name: company.name,
      slug: company.slug,
      description: company.description,

      // Media
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,

      // Contact info
      phone: company.phone,
      email: company.email,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      country: company.country,

      // Location
      coordinates: {
        latitude: company.latitude ? parseFloat(company.latitude) : null,
        longitude: company.longitude ? parseFloat(company.longitude) : null,
      },
      location: company.city || company.address,

      // Verification
      verified: company.verificationStatus === "verified",
      verificationStatus: company.verificationStatus,
      verifiedAt: company.verifiedAt,

      // Stats
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : null,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      yearsInBusiness,
      employeeCount: company.employeeCount || company.staff?.length || 0, // Use stored value or count staff

      // Service areas
      serviceAreas: company.serviceAreas || [],

      // Status
      status: company.status,
      Highlights: company.detailHighlights || [],
      service: company.services,

      // Timestamps
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };

    res.json({
      success: true,
      data: formattedCompany,
    });
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.id);
    const {
      name,
      description,
      registrationNumber,
      address,
      city,
      latitude,
      longitude,
      phone,
      email,
      logoUrl,
      coverImageUrl,
      foundedYear,
    } = req.body;

    // Check if user already has a company
    const existingCompany = await prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (existingCompany) {
      return res.status(400).json({ error: "User already has a company" });
    }

    const company = await prisma.company.create({
      data: {
        name,
        description,
        registrationNumber,
        address,
        city,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone,
        email,
        logoUrl,
        coverImageUrl,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        ownerId: userId,
        status: "active",
        verificationStatus: "pending",
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      company: {
        ...company,
        id: company.id.toString(),
        ownerId: company.ownerId.toString(),
        owner: {
          ...company.owner,
          id: company.owner.id.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership or admin role
    const company = await prisma.company.findUnique({
      where: { id: BigInt(id) },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (
      company.ownerId.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: BigInt(id) },
      data: updates,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: BigInt(id) },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (
      company.ownerId.toString() !== req.user.id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.company.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getCompaniesByServiceType = async (req, res, next) => {
  try {
    const { categorySlug, serviceTypeSlug } = req.params;
    const {
      search,
      city,
      minRating,
      sortBy = "rating",
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get category and service type
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category || category.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const serviceType = await prisma.serviceType.findUnique({
      where: { slug: serviceTypeSlug, categoryId: category.id },
    });

    if (!serviceType || serviceType.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }

    // Build where clause
    let whereClause = {
      verificationStatus: "verified",
      services: {
        some: {
          serviceTypeId: serviceType.id,
          isActive: true,
        },
      },
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add city filter
    if (city) {
      whereClause.city = city;
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        include: {
          ratingSummary: true,
          services: {
            where: {
              serviceTypeId: serviceType.id,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              basePrice: true,
              durationMin: true,
              durationMax: true,
            },
          },
          serviceAreas: {
            select: {
              city: true,
              coverageRadiusKm: true,
            },
          },
        },
      }),
      prisma.company.count({ where: whereClause }),
    ]);

    // Filter by rating if specified
    let filteredCompanies = companies;
    if (minRating) {
      filteredCompanies = companies.filter(
        (c) =>
          c.ratingSummary &&
          parseFloat(c.ratingSummary.averageRating) >= parseFloat(minRating),
      );
    }

    // Sort companies
    if (sortBy === "rating") {
      filteredCompanies.sort((a, b) => {
        const ratingA = a.ratingSummary?.averageRating || 0;
        const ratingB = b.ratingSummary?.averageRating || 0;
        return parseFloat(ratingB) - parseFloat(ratingA);
      });
    } else if (sortBy === "reviews") {
      filteredCompanies.sort((a, b) => {
        const reviewsA = a.ratingSummary?.totalReviews || 0;
        const reviewsB = b.ratingSummary?.totalReviews || 0;
        return reviewsB - reviewsA;
      });
    } else if (sortBy === "price_low") {
      filteredCompanies.sort((a, b) => {
        const priceA = a.services[0]?.basePrice || 0;
        const priceB = b.services[0]?.basePrice || 0;
        return parseFloat(priceA) - parseFloat(priceB);
      });
    } else if (sortBy === "price_high") {
      filteredCompanies.sort((a, b) => {
        const priceA = a.services[0]?.basePrice || 0;
        const priceB = b.services[0]?.basePrice || 0;
        return parseFloat(priceB) - parseFloat(priceA);
      });
    }

    // Format response
    const currentYear = new Date().getFullYear();

    const formattedCompanies = filteredCompanies.map((company) => {
      const prices = (company.services || []).map((s) => Number(s.basePrice));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      return {
        id: company.id.toString(),
        name: company.name,

        logoUrl: company.logoUrl,
        coverImageUrl: company.coverImageUrl,

        rating: company.ratingSummary?.averageRating
          ? Number(company.ratingSummary.averageRating)
          : null,

        reviews: company.ratingSummary?.totalReviews ?? 0,

        location: company.serviceAreas.length > 0 ? "All Areas" : company.city,

        coordinates: {
          latitude: company.latitude ? Number(company.latitude) : null,
          longitude: company.longitude ? Number(company.longitude) : null,
        },
        verified: company.verificationStatus === "verified",

        yearsInBusiness: company.establishedYear
          ? currentYear - company.establishedYear
          : null,

        priceRange: {
          min: minPrice,
          max: maxPrice,
        },

        description: company.description,

        highlights: Array.isArray(company.cardHighlights)
          ? company.cardHighlights
          : [],

        responseTime: "Usually responds in 1 hour",
      };
    });

    res.json({
      success: true,
      data: {
        category: {
          id: category.id.toString(),
          name: category.name,
          slug: category.slug,
        },
        serviceType: {
          id: serviceType.id.toString(),
          name: serviceType.name,
          slug: serviceType.slug,
          icon: serviceType.icon,
        },
        companies: formattedCompanies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCompaniesByCategory = async (req, res, next) => {
  try {
    const { categorySlug } = req.params;
    const {
      search,
      city,
      minRating,
      sortBy = "rating",
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get category
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category || category.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Build where clause
    let whereClause = {
      verificationStatus: "verified",
      services: {
        some: {
          isActive: true,
          serviceType: {
            categoryId: category.id,
          },
        },
      },
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add city filter
    if (city) {
      whereClause.city = city;
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        include: {
          ratingSummary: true,
          services: {
            where: {
              isActive: true,
              serviceType: {
                categoryId: category.id,
              },
            },
            select: {
              id: true,
              name: true,
              basePrice: true,
              durationMin: true,
              durationMax: true,
            },
          },
          serviceAreas: {
            select: {
              city: true,
              coverageRadiusKm: true,
            },
          },
        },
      }),
      prisma.company.count({ where: whereClause }),
    ]);

    // Filter by rating if specified
    let filteredCompanies = companies;
    if (minRating) {
      filteredCompanies = companies.filter(
        (c) =>
          c.ratingSummary &&
          parseFloat(c.ratingSummary.averageRating) >= parseFloat(minRating),
      );
    }

    // Sort companies
    if (sortBy === "rating") {
      filteredCompanies.sort((a, b) => {
        const ratingA = a.ratingSummary?.averageRating || 0;
        const ratingB = b.ratingSummary?.averageRating || 0;
        return parseFloat(ratingB) - parseFloat(ratingA);
      });
    } else if (sortBy === "reviews") {
      filteredCompanies.sort((a, b) => {
        const reviewsA = a.ratingSummary?.totalReviews || 0;
        const reviewsB = b.ratingSummary?.totalReviews || 0;
        return reviewsB - reviewsA;
      });
    } else if (sortBy === "price_low") {
      filteredCompanies.sort((a, b) => {
        const priceA = a.services[0]?.basePrice || 0;
        const priceB = b.services[0]?.basePrice || 0;
        return parseFloat(priceA) - parseFloat(priceB);
      });
    } else if (sortBy === "price_high") {
      filteredCompanies.sort((a, b) => {
        const priceA = a.services[0]?.basePrice || 0;
        const priceB = b.services[0]?.basePrice || 0;
        return parseFloat(priceB) - parseFloat(priceA);
      });
    }

    // Format response
    const currentYear = new Date().getFullYear();

    const formattedCompanies = filteredCompanies.map((company) => {
      const prices = (company.services || []).map((s) => Number(s.basePrice));
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      return {
        id: company.id.toString(),
        name: company.name,

        logoUrl: company.logoUrl,
        coverImageUrl: company.coverImageUrl,

        rating: company.ratingSummary?.averageRating
          ? Number(company.ratingSummary.averageRating)
          : null,

        reviews: company.ratingSummary?.totalReviews ?? 0,

        location: company.serviceAreas.length > 0 ? "All Areas" : company.city,

        coordinates: {
          latitude: company.latitude ? Number(company.latitude) : null,
          longitude: company.longitude ? Number(company.longitude) : null,
        },
        verified: company.verificationStatus === "verified",

        yearsInBusiness: company.establishedYear
          ? currentYear - company.establishedYear
          : null,

        priceRange: {
          min: minPrice,
          max: maxPrice,
        },

        description: company.description,

        highlights: Array.isArray(company.cardHighlights)
          ? company.cardHighlights
          : [],

        responseTime: "Usually responds in 1 hour",
      };
    });

    res.json({
      success: true,
      data: {
        category: {
          id: category.id.toString(),
          name: category.name,
          slug: category.slug,
        },
        companies: formattedCompanies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: {
        id: BigInt(id),
        verificationStatus: "verified",
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        services: {
          where: {
            isActive: true,
          },
          include: {
            serviceType: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            basePrice: "asc",
          },
        },
        ratingSummary: true,
        serviceAreas: true,
        bookings: {
          where: {
            status: "completed",
            review: {
              isNot: null,
            },
          },
          include: {
            review: {
              include: {
                customer: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Format services
    const formattedServices = company.services.map((service) => ({
      id: service.id.toString(),
      name: service.name,
      description: service.description,
      basePrice: parseFloat(service.basePrice),
      durationMinutes: service.durationMinutes,
      category: service.serviceType.category.name,
      categorySlug: service.serviceType.category.slug,
      serviceType: service.serviceType.name,
      serviceTypeSlug: service.serviceType.slug,
      isActive: service.isActive,
    }));

    // Format reviews
    const reviews = company.bookings
      .filter((booking) => booking.review)
      .map((booking) => ({
        id: booking.review.id.toString(),
        rating: booking.review.rating,
        comment: booking.review.comment,
        createdAt: booking.review.createdAt,
        service: booking.service?.name || "Service",
        customer: {
          id: booking.review.customer.id.toString(),
          name: booking.review.customer.fullName,
        },
      }));

    // Calculate years in business
    const yearsInBusiness =
      new Date().getFullYear() - new Date(company.createdAt).getFullYear();

    res.json({
      success: true,
      data: {
        id: company.id.toString(),
        name: company.name,
        description: company.description,
        registrationNumber: company.registrationNumber,
        address: company.address,
        city: company.city,
        coordinates: {
          latitude: company.latitude ? parseFloat(company.latitude) : null,
          longitude: company.longitude ? parseFloat(company.longitude) : null,
        },
        phone: company.phone,
        email: company.email,
        verificationStatus: company.verificationStatus,
        rating: company.ratingSummary?.averageRating
          ? parseFloat(company.ratingSummary.averageRating)
          : null,
        reviewCount: company.ratingSummary?.totalReviews || 0,
        yearsInBusiness,
        services: formattedServices,
        serviceAreas: company.serviceAreas,
        reviews: reviews,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/companies/me - Current user's company (for company_admin dashboard) */
const getCompanyMe = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const company = await prisma.company.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        verificationStatus: true,
        _count: {
          select: { staff: true, services: true },
        },
      },
    });
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }
    const { _count, ...rest } = company;
    res.json({
      company: {
        ...rest,
        id: company.id.toString(),
        staffCount: _count.staff,
        servicesCount: _count.services,
      },
    });
  } catch (error) {
    console.error("getCompanyMe error:", error);
    res.status(500).json({ error: "Failed to load company" });
  }
};

const getCompanyStaff = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Fetch all staff members
    const staffMembers = await prisma.companyStaff.findMany({
      where: {
        companyId: company.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get additional details for each staff member
    const staffWithDetails = await Promise.all(
      staffMembers.map(async (staffMember) => {
        // Count active service requests
        const activeRequests = await prisma.serviceRequest.count({
          where: {
            assignedStaffId: staffMember.id,
            status: {
              in: ["pending", "approved"],
            },
          },
        });

        // Count completed jobs (service requests that are completed)
        const completedJobs = await prisma.serviceRequest.count({
          where: {
            assignedStaffId: staffMember.id,
            status: "approved", // or add 'completed' if you have that status
          },
        });

        // Get all completed bookings for this staff to calculate average rating
        // Note: Reviews are for bookings, not individual staff
        // We'll get the average rating from bookings where this staff was assigned
        const completedBookings = await prisma.serviceRequest.findMany({
          where: {
            companyId: company.id,
            assignedStaffId: staffMember.id,
            status: "approved", // only approved/completed requests
          },
          include: {
            company: true, // optional
            service: true, // optional
            customer: true, // optional
            // include the booking and its review
            service: {
              include: {
                bookings: {
                  where: {
                    status: "completed",
                  },
                  include: {
                    review: true,
                  },
                },
              },
            },
          },
        });

        // Calculate average rating from completed bookings with reviews
        const reviewedBookings = completedBookings.filter((b) => b.review);
        const averageRating =
          reviewedBookings.length > 0
            ? reviewedBookings.reduce(
                (sum, b) => sum + (b.review?.rating || 0),
                0,
              ) / reviewedBookings.length
            : null;

        // Check availability today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAvailability = await prisma.availabilitySlot.findFirst({
          where: {
            staffId: staffMember.id,
            date: {
              gte: today,
              lt: tomorrow,
            },
            isAvailable: true,
          },
        });

        return {
          id: staffMember.id.toString(),
          userId: staffMember.user.id.toString(),
          fullName: staffMember.user.fullName,
          email: staffMember.user.email,
          avatar: staffMember.user.avatar,
          phone: staffMember.user.phone,
          role: staffMember.role,
          status: staffMember.status,
          activeRequests,
          completedJobs,
          averageRating: averageRating
            ? Number(averageRating.toFixed(1))
            : null,
          totalReviews: reviewedBookings.length,
          isAvailable: !!todayAvailability,
          joinedAt: staffMember.createdAt,
        };
      }),
    );

    res.json({
      success: true,
      staff: staffWithDetails,
    });
  } catch (error) {
    console.error("Error fetching company staff:", error);
    res.status(500).json({ error: "Failed to fetch staff members" });
  }
};

// POST /api/companies/assign-staff - Assign staff to a booking
const assignStaffToBooking = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const {
      bookingId,
      staffId, // This is CompanyStaff.id, not User.id
      notes,
    } = req.body;

    // Validate required fields
    if (!bookingId || !staffId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: bookingId and staffId" });
    }

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Verify the booking belongs to this company
    if (booking.companyId.toString() !== company.id.toString()) {
      return res.status(403).json({
        error: "Unauthorized: Booking does not belong to your company",
      });
    }

    // Verify staff member exists and belongs to this company
    const staffMember = await prisma.companyStaff.findFirst({
      where: {
        id: BigInt(staffId),
        companyId: company.id,
        status: "active",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!staffMember) {
      return res.status(404).json({
        error: "Staff member not found or not active in this company",
      });
    }
    // Update booking status to confirmed if it's pending, and set assignedStaffId
    const updatedBooking = await prisma.booking.update({
      where: { id: BigInt(bookingId) },
      data: {
        assignedStaffId: staffMember.id,
        status: booking.status === "pending" ? "confirmed" : booking.status,
        updatedAt: new Date(),
      },
      include: {
        assignedStaff: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Log status change if it changed
    if (booking.status === "pending") {
      await prisma.bookingStatusLog.create({
        data: {
          bookingId: BigInt(bookingId),
          oldStatus: "pending",
          newStatus: "confirmed",
          changedBy: userId,
          changedAt: new Date(),
        },
      });
    }

    // Convert BigInt to string for JSON response
    const response = {
      ...updatedBooking,
      id: updatedBooking.id.toString(),
      customerId: updatedBooking.customerId.toString(),
      companyId: updatedBooking.companyId.toString(),
      serviceId: updatedBooking.serviceId.toString(),
      assignedStaffId: updatedBooking.assignedStaffId?.toString(),
      assignedStaff: updatedBooking.assignedStaff
        ? {
            ...updatedBooking.assignedStaff.user,
            id: updatedBooking.assignedStaff.user.id.toString(),
          }
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Staff assigned successfully",
      booking: response,
    });
  } catch (error) {
    console.error("Error assigning staff to booking:", error);
    res.status(500).json({ error: "Failed to assign staff to booking" });
  }
};

// GET /api/companies/bookings - Get all bookings for company with assigned staff info
const getCompanyBookings = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { status, page = 1, limit = 10 } = req.query;

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Build where clause
    const where = {
      companyId: company.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch bookings with all related data
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              basePrice: true,
              image: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
            },
          },
          assignedStaff: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      id: booking.id.toString(),
      customerId: booking.customerId.toString(),
      companyId: booking.companyId.toString(),
      serviceId: booking.serviceId.toString(),
      assignedStaffId: booking.assignedStaffId
        ? booking.assignedStaffId.toString()
        : null,
      customer: {
        ...booking.customer,
        id: booking.customer.id.toString(),
      },
      service: {
        ...booking.service,
        id: booking.service.id.toString(),
      },
      payment: booking.payment
        ? {
            ...booking.payment,
            id: booking.payment.id.toString(),
          }
        : null,
      assignedStaff: booking.assignedStaff
        ? {
            id: booking.assignedStaff.user.id.toString(),
            fullName: booking.assignedStaff.user.fullName,
            avatar: booking.assignedStaff.user.avatar,
          }
        : null,
    }));

    res.json({
      success: true,
      bookings: formattedBookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching company bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// GET /api/companies/bookings/:id - Get single booking detail for company
const getCompanyBookingById = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) return res.status(404).json({ error: "Company not found" });

    const booking = await prisma.booking.findFirst({
      where: { id: BigInt(id), companyId: company.id },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        service: {
          select: { id: true, name: true, description: true, basePrice: true },
        },
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Find assigned staff via service requests
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        companyId: company.id,
        customerId: booking.customerId,
        serviceId: booking.serviceId,
      },
      include: {
        assignedStaff: {
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      booking: {
        ...booking,
        id: booking.id.toString(),
        customerId: booking.customerId.toString(),
        companyId: booking.companyId.toString(),
        serviceId: booking.serviceId.toString(),
        customer: { ...booking.customer, id: booking.customer.id.toString() },
        service: { ...booking.service, id: booking.service.id.toString() },
        assignedStaff: serviceRequest?.assignedStaff
          ? {
              id: serviceRequest.assignedStaff.id.toString(),
              fullName: serviceRequest.assignedStaff.user.fullName,
              role: serviceRequest.assignedStaff.role,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching company booking by ID:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

const addStaffMember = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const {
      email,
      fullName,
      phone,
      role, // 'cleaner' or 'supervisor'
      password, // Optional - if not provided, generate temporary password
    } = req.body;

    // Validate required fields
    if (!email || !fullName || !phone || !role) {
      return res.status(400).json({
        error: "Missing required fields: email, fullName, phone, role",
      });
    }

    // Validate role
    const validRoles = ["cleaner", "supervisor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be "cleaner" or "supervisor"',
      });
    }

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let newUser;

    if (existingUser) {
      // User exists - check if they're already staff in this company
      const existingStaff = await prisma.companyStaff.findFirst({
        where: {
          companyId: company.id,
          userId: existingUser.id,
        },
      });

      if (existingStaff) {
        return res.status(400).json({
          error: "This user is already a staff member in your company",
        });
      }

      // Add existing user as staff
      newUser = existingUser;
    } else {
      // Create new user account
      const tempPassword =
        password || `temp${Math.random().toString(36).slice(-8)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      newUser = await prisma.user.create({
        data: {
          email,
          fullName,
          phone,
          passwordHash: hashedPassword,
          role: "staff",
          status: "active",
        },
      });

      // Send welcome email with temporary password
      try {
        const loginUrl = `${process.env.FRONTEND_URL || "https://service-finder-five.vercel.app"}/auth/login`;
        const emailContent = getStaffWelcomeEmail(
          fullName,
          company.name,
          tempPassword,
          loginUrl,
        );

        await transporter.sendMail({
          from: `"Service Finder" <${process.env.SMTP_USER}>`,
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } catch (emailError) {
        console.error("❌ Failed to send staff welcome email:", emailError);
        // Continue execution even if email fails, as user is already created
      }
    }

    // Create CompanyStaff record
    const staffMember = await prisma.companyStaff.create({
      data: {
        companyId: company.id,
        userId: newUser.id,
        role: role,
        status: "active",
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Staff member added successfully",
      staff: {
        id: staffMember.id.toString(),
        userId: staffMember.user.id.toString(),
        fullName: staffMember.user.fullName,
        email: staffMember.user.email,
        avatar: staffMember.user.avatar,
        phone: staffMember.user.phone,
        role: staffMember.role,
        status: staffMember.status,
        joinedAt: staffMember.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding staff member:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "A staff member with this email already exists",
      });
    }

    res.status(500).json({ error: "Failed to add staff member" });
  }
};

/**
 * GET /api/companies/staff/:id
 * Get a single staff member details
 */
const getStaffMemberById = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { id } = req.params;

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Fetch staff member
    const staffMember = await prisma.companyStaff.findFirst({
      where: {
        id: BigInt(id),
        companyId: company.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Get service requests
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        assignedStaffId: staffMember.id,
      },
      include: {
        service: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        requestedDate: "desc",
      },
      take: 10,
    });

    res.json({
      success: true,
      staff: {
        id: staffMember.id.toString(),
        userId: staffMember.user.id.toString(),
        fullName: staffMember.user.fullName,
        email: staffMember.user.email,
        avatar: staffMember.user.avatar,
        phone: staffMember.user.phone,
        role: staffMember.role,
        status: staffMember.status,
        joinedAt: staffMember.createdAt,
        serviceRequests: serviceRequests.map((sr) => ({
          id: sr.id.toString(),
          status: sr.status,
          requestedDate: sr.requestedDate,
          serviceName: sr.service.name,
          customerName: sr.customer.fullName,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
};

/**
 * PUT /api/companies/staff/:id
 * Update a staff member
 */
const updateStaffMember = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { id } = req.params;
    const { fullName, phone, role, status } = req.body;

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if staff member exists
    const staffMember = await prisma.companyStaff.findFirst({
      where: {
        id: BigInt(id),
        companyId: company.id,
      },
      include: {
        user: true,
      },
    });

    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Update user info if provided
    if (fullName || phone) {
      await prisma.user.update({
        where: { id: staffMember.userId },
        data: {
          ...(fullName && { fullName }),
          ...(phone && { phone }),
        },
      });
    }

    // Update staff info
    const updatedStaff = await prisma.companyStaff.update({
      where: { id: BigInt(id) },
      data: {
        ...(role && { role }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Staff member updated successfully",
      staff: {
        id: updatedStaff.id.toString(),
        userId: updatedStaff.user.id.toString(),
        fullName: updatedStaff.user.fullName,
        email: updatedStaff.user.email,
        avatar: updatedStaff.user.avatar,
        phone: updatedStaff.user.phone,
        role: updatedStaff.role,
        status: updatedStaff.status,
      },
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
};

/**
 * DELETE /api/companies/staff/:id
 * Remove a staff member from the company
 */
const removeStaffMember = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { id } = req.params;

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Check if staff member exists
    const staffMember = await prisma.companyStaff.findFirst({
      where: {
        id: BigInt(id),
        companyId: company.id,
      },
    });

    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Check if staff has active service requests
    const activeRequests = await prisma.serviceRequest.count({
      where: {
        assignedStaffId: staffMember.id,
        status: {
          in: ["pending", "approved"],
        },
      },
    });

    if (activeRequests > 0) {
      return res.status(400).json({
        error: `Cannot remove staff member. They have ${activeRequests} active service request(s). Please reassign or complete them first.`,
      });
    }

    // Soft delete - set status to inactive
    await prisma.companyStaff.update({
      where: { id: BigInt(id) },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Staff member removed successfully",
    });
  } catch (error) {
    console.error("Error removing staff member:", error);
    res.status(500).json({ error: "Failed to remove staff member" });
  }
};

/**
 * POST /api/companies/staff/:id/reactivate
 * Reactivate an inactive staff member
 */
const reactivateStaffMember = async (req, res) => {
  try {
    const userId = BigInt(req.user.id);
    const { id } = req.params;

    // Find company owned by this user
    const company = await prisma.company.findFirst({
      where: {
        ownerId: userId,
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Update staff status
    const staffMember = await prisma.companyStaff.update({
      where: {
        id: BigInt(id),
      },
      data: {
        status: "active",
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Staff member reactivated successfully",
      staff: {
        id: staffMember.id.toString(),
        fullName: staffMember.user.fullName,
        status: staffMember.status,
      },
    });
  } catch (error) {
    console.error("Error reactivating staff member:", error);
    res.status(500).json({ error: "Failed to reactivate staff member" });
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - 7);
    const startOf30Days = new Date(now);
    startOf30Days.setDate(now.getDate() - 30);

    const [
      totalUsers,
      newUsersThisWeek,
      totalCompanies,
      pendingCompanies,
      totalBookings,
      activeBookings,
      totalRevenue,
      recentUsers,
      topCategories,
      bookingsByMonth,
      usersByMonth,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      // New users this week
      prisma.user.count({ where: { createdAt: { gte: startOfThisWeek } } }),
      // Total companies (verified)
      prisma.company.count({ where: { verificationStatus: "verified" } }),
      // Pending companies
      prisma.company.count({ where: { verificationStatus: "pending" } }),
      // Total bookings
      prisma.booking.count(),
      // Active bookings (confirmed / in_progress)
      prisma.booking.count({
        where: { status: { in: ["confirmed", "in_progress"] } },
      }),
      // Total revenue from completed payments
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "paid" },
      }),
      // 5 most recent users
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      // Top categories by booking count
      prisma.category.findMany({
        where: { status: "active" },
        take: 5,
        include: {
          serviceTypes: {
            include: {
              services: {
                include: {
                  _count: { select: { bookings: true } },
                },
              },
            },
          },
        },
      }),
      // Bookings per month (last 12 months) — aggregate by month
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
        FROM "Booking"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `.catch(() => []),
      // Users per month (last 12 months)
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `.catch(() => []),
    ]);

    // Process top categories
    const topCatsFormatted = topCategories
      .map((cat) => {
        const bookingCount = cat.serviceTypes.reduce(
          (sum, st) =>
            sum +
            st.services.reduce(
              (s2, svc) => s2 + (svc._count?.bookings || 0),
              0,
            ),
          0,
        );
        return { name: cat.name, slug: cat.slug, bookings: bookingCount };
      })
      .sort((a, b) => b.bookings - a.bookings);

    // Month labels
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formatMonthData = (rows) => {
      const map = {};
      (rows || []).forEach((r) => {
        const d = new Date(r.month);
        map[`${d.getFullYear()}-${d.getMonth()}`] = Number(r.count);
      });
      const result = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({
          month: monthNames[d.getMonth()],
          count: map[`${d.getFullYear()}-${d.getMonth()}`] || 0,
        });
      }
      return result;
    };

    res.json({
      success: true,
      stats: {
        totalUsers,
        newUsersThisWeek,
        totalCompanies,
        pendingCompanies,
        totalBookings,
        activeBookings,
        totalRevenue: Number(totalRevenue._sum?.amount || 0),
        recentUsers: recentUsers.map((u) => ({ ...u, id: u.id.toString() })),
        topCategories: topCatsFormatted,
        bookingsByMonth: formatMonthData(bookingsByMonth),
        usersByMonth: formatMonthData(usersByMonth),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── HOMEPAGE FEATURED ENDPOINTS ──────────────────────────────────────────────

/**
 * GET /api/companies/featured
 * Returns top-rated, verified companies for homepage featured section
 * Query: limit=6, sortBy=rating|bookings|verified
 */
const getCompaniesFeatured = async (req, res, next) => {
  try {
    const { limit = 6, sortBy = "rating" } = req.query;

    const orderBy =
      sortBy === "bookings"
        ? { _count: { bookings: "desc" } }
        : { ratingSummary: { averageRating: "desc" } };

    const companies = await prisma.company.findMany({
      where: {
        verificationStatus: "verified",
      },
      include: {
        ratingSummary: true,
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } }
        },
        _count: {
          select: {
            bookings: true,
            services: true,
          },
        },
        serviceAreas: {
          select: { city: true },
        },
      },
      orderBy,
      take: parseInt(limit),
    });

    const formatted = companies.map((company) => ({
      id: company.id.toString(),
      name: company.name,
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,
      verified: true,
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : 0,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      city: company.city,
      bookingCount: company._count.bookings,
      serviceCount: company._count.services,
      services: company.services?.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        basePrice: Number(s.basePrice),
        category: s.serviceType?.category?.name || "Service",
        categorySlug: s.serviceType?.category?.slug || ""
      })) || [],
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/trending
 * Returns most booked companies/services in last 7 days
 */
const getTrendingCompanies = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingCompanies = await prisma.company.findMany({
      where: {
        bookings: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
      include: {
        ratingSummary: true,
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } }
        },
        _count: {
          select: {
            bookings: true,
            services: true,
          },
        },
      },
      orderBy: {
        bookings: {
          _count: "desc",
        },
      },
      take: parseInt(limit),
    });

    const formatted = trendingCompanies.map((company) => ({
      id: company.id.toString(),
      name: company.name,
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,
      verified: company.verificationStatus === "verified",
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : 0,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      city: company.city,
      bookingCount: company._count.bookings,
      services: company.services?.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        basePrice: Number(s.basePrice),
        category: s.serviceType?.category?.name || "Service",
        categorySlug: s.serviceType?.category?.slug || ""
      })) || [],
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/recommended
 * Returns recommended companies based on ratings and engagement
 * Supports pagination
 */
const getRecommendedCompanies = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where: {
          verificationStatus: "verified",
        },
        include: {
          ratingSummary: true,
          services: {
            where: { isActive: true },
            include: { serviceType: { include: { category: true } } }
          },
          _count: {
            select: {
              bookings: true,
              services: true,
            },
          },
        },
        orderBy: [
          { ratingSummary: { averageRating: "desc" } },
          { createdAt: "desc" },
        ],
        skip,
        take: parseInt(limit),
      }),
      prisma.company.count({
        where: {
          verificationStatus: "verified",
        },
      }),
    ]);

    const formatted = companies.map((company) => ({
      id: company.id.toString(),
      name: company.name,
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,
      verified: true,
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : 0,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      city: company.city,
      bookingCount: company._count.bookings,
      services: company.services?.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        basePrice: Number(s.basePrice),
        category: s.serviceType?.category?.name || "Service",
        categorySlug: s.serviceType?.category?.slug || ""
      })) || [],
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + parseInt(limit) < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/nearby
 * Returns nearby companies based on latitude/longitude
 * Query: lat=X&lng=Y&radius=5 (in km), limit=12
 */
const getNearbyCompanies = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5, limit = 12 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Simple distance calculation (more sophisticated would use PostGIS)
    const companies = await prisma.company.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        ratingSummary: true,
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } }
        },
        _count: {
          select: {
            bookings: true,
            services: true,
          },
        },
      },
      take: parseInt(limit) * 2, // Get extra to filter
    });

    // Filter by distance using Haversine formula
    const nearby = companies
      .map((company) => {
        const lat1 = latitude;
        const lon1 = longitude;
        const lat2 = parseFloat(company.latitude);
        const lon2 = parseFloat(company.longitude);

        const R = 6371; // Earth radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return { company, distance };
      })
      .filter((item) => item.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    const formatted = nearby.map(({ company, distance }) => ({
      id: company.id.toString(),
      name: company.name,
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,
      verified: company.verificationStatus === "verified",
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : 0,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      city: company.city,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      bookingCount: company._count.bookings,
      services: company.services?.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        basePrice: Number(s.basePrice),
        category: s.serviceType?.category?.name || "Service",
        categorySlug: s.serviceType?.category?.slug || ""
      })) || [],
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/new
 * Returns recently created/joined companies
 * Query: limit=12, days=30
 */
const getNewCompanies = async (req, res, next) => {
  try {
    const { limit = 12, days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const companies = await prisma.company.findMany({
      where: {
        createdAt: { gte: daysAgo },
      },
      include: {
        ratingSummary: true,
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } }
        },
        _count: {
          select: {
            bookings: true,
            services: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    const formatted = companies.map((company) => ({
      id: company.id.toString(),
      name: company.name,
      logoUrl: company.logoUrl,
      coverImageUrl: company.coverImageUrl,
      verified: company.verificationStatus === "verified",
      rating: company.ratingSummary?.averageRating
        ? parseFloat(company.ratingSummary.averageRating)
        : 0,
      reviewCount: company.ratingSummary?.totalReviews || 0,
      city: company.city,
      createdAt: company.createdAt,
      isNew: true,
      bookingCount: company._count.bookings,
      services: company.services?.map((s) => ({
        id: s.id.toString(),
        name: s.name,
        basePrice: Number(s.basePrice),
        category: s.serviceType?.category?.name || "Service",
        categorySlug: s.serviceType?.category?.slug || ""
      })) || [],
    }));

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  getCompanyMe,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompaniesByCategory,
  getCompaniesByServiceType,
  getCompanyDetails,
  getCompanyStaff,
  assignStaffToBooking,
  getCompanyBookings,
  getCompanyBookingById,
  addStaffMember,
  getStaffMemberById,
  updateStaffMember,
  removeStaffMember,
  reactivateStaffMember,
  getAdminStats,
  getCompaniesFeatured,
  getTrendingCompanies,
  getRecommendedCompanies,
  getNearbyCompanies,
  getNewCompanies,
};
