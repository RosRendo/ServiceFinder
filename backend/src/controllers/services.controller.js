// controllers/service.controller.js
const prisma = require("../config/database");

/**
 * GET /api/services
 * Get all services with filters
 */
const getAllServices = async (req, res, next) => {
  try {
    const {
      companyId,
      serviceTypeId,
      isActive,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (companyId) where.companyId = BigInt(companyId);
    if (serviceTypeId) where.serviceTypeId = BigInt(serviceTypeId); // Fixed: use serviceTypeId
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          company: {
            select: {
              id: true,
              name: true,
              city: true,
              verificationStatus: true,
            },
          },
          serviceType: {
            // Fixed: include serviceType instead of category
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.service.count({ where }),
    ]);

    // Format response
    const formattedServices = services.map((service) => ({
      id: service.id.toString(),
      companyId: service.companyId.toString(),
      serviceTypeId: service.serviceTypeId.toString(),
      name: service.name,
      description: service.description,
      basePrice: parseFloat(service.basePrice),
      platformFee: parseFloat(service.basePrice) * 0.1,
      durationMin: service.durationMin,
      durationMax: service.durationMax,
      isActive: service.isActive,
      image: service.image,
      company: {
        id: service.company.id.toString(),
        name: service.company.name,
        city: service.company.city,
        verificationStatus: service.company.verificationStatus,
      },
      serviceType: {
        id: service.serviceType.id.toString(),
        name: service.serviceType.name,
        slug: service.serviceType.slug,
        category: {
          id: service.serviceType.category.id.toString(),
          name: service.serviceType.category.name,
          slug: service.serviceType.category.slug,
        },
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedServices,
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

/**
 * GET /api/services/:id
 * Get service by ID
 */
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: BigInt(id) },
      include: {
        company: {
          include: {
            ratingSummary: true,
            serviceAreas: true,
          },
        },
        serviceType: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: service.id.toString(),
        companyId: service.companyId.toString(),
        serviceTypeId: service.serviceTypeId.toString(),
        name: service.name,
        description: service.description,
        basePrice: parseFloat(service.basePrice),
        platformFee: parseFloat(service.basePrice) * 0.1,
        durationMin: service.durationMin,
        durationMax: service.durationMax,
        image: service.image,
        features: service.features,
        isActive: service.isActive,
        company: {
          id: service.company.id.toString(),
          name: service.company.name,
          description: service.company.description,
          address: service.company.address,
          city: service.company.city,
          phone: service.company.phone,
          email: service.company.email,
          verificationStatus: service.company.verificationStatus,
          rating: service.company.ratingSummary?.averageRating
            ? parseFloat(service.company.ratingSummary.averageRating)
            : null,
          reviewCount: service.company.ratingSummary?.totalReviews || 0,
          serviceAreas: service.company.serviceAreas,
        },
        serviceType: {
          id: service.serviceType.id.toString(),
          name: service.serviceType.name,
          slug: service.serviceType.slug,
          category: {
            id: service.serviceType.category.id.toString(),
            name: service.serviceType.category.name,
            slug: service.serviceType.category.slug,
          },
        },
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/services
 * Create new service (Company admin only)
 */
const createService = async (req, res, next) => {
  try {
    const {
      companyId,
      serviceTypeId,
      name,
      description,
      basePrice,
      durationMin,
      durationMax,
      features,
      image,
    } = req.body;

    // Verify company ownership
    const company = await prisma.company.findUnique({
      where: { id: BigInt(companyId) },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (company.ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Verify service type exists
    const serviceType = await prisma.serviceType.findUnique({
      where: { id: BigInt(serviceTypeId) },
    });

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }

    const service = await prisma.service.create({
      data: {
        companyId: BigInt(companyId),
        serviceTypeId: BigInt(serviceTypeId),
        name,
        description,
        image,
        basePrice,
        durationMin,
        durationMax,
        features: features || [],
      },
      include: {
        company: true,
        serviceType: {
          include: {
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: {
        id: service.id.toString(),
        companyId: service.companyId.toString(),
        serviceTypeId: service.serviceTypeId.toString(),
        name: service.name,
        image: service.image,
        description: service.description,
        basePrice: parseFloat(service.basePrice),
        durationMinutes: service.durationMinutes,
        isActive: service.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/services/:id
 * Update service (Company admin only)
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await prisma.service.findUnique({
      where: { id: BigInt(id) },
      include: { company: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.company.ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If serviceTypeId is being updated, verify it exists
    if (updates.serviceTypeId) {
      const serviceType = await prisma.serviceType.findUnique({
        where: { id: BigInt(updates.serviceTypeId) },
      });

      if (!serviceType) {
        return res.status(404).json({
          success: false,
          message: "Service type not found",
        });
      }

      updates.serviceTypeId = BigInt(updates.serviceTypeId);
    }

    const updatedService = await prisma.service.update({
      where: { id: BigInt(id) },
      data: updates,
      include: {
        company: true,
        serviceType: {
          include: {
            category: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Service updated successfully",
      data: {
        id: updatedService.id.toString(),
        companyId: updatedService.companyId.toString(),
        serviceTypeId: updatedService.serviceTypeId.toString(),
        name: updatedService.name,
        image: updateService.image,
        description: updatedService.description,
        basePrice: parseFloat(updatedService.basePrice),
        durationMinutes: updatedService.durationMinutes,
        isActive: updatedService.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/services/:id
 * Delete service (Company admin only)
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: BigInt(id) },
      include: {
        company: true,
        bookings: {
          where: {
            status: {
              in: ["pending", "confirmed", "in_progress"],
            },
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.company.ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check for active bookings
    if (service.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete service with active bookings. Please complete or cancel them first.",
      });
    }

    await prisma.service.delete({
      where: { id: BigInt(id) },
    });

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getServicesByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const services = await prisma.service.findMany({
      where: {
        companyId: BigInt(companyId),
        isActive: true, // only active services
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            verificationStatus: true,
          },
        },
        serviceType: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedServices = services.map((service) => ({
      id: service.id.toString(),
      companyId: service.companyId.toString(),
      serviceTypeId: service.serviceTypeId.toString(),
      name: service.name,
      description: service.description,
      basePrice: parseFloat(service.basePrice),
      durationMin: service.durationMin,
      durationMax: service.durationMax,
      image: service.image,
      features: service.features,
      isActive: service.isActive,
      company: {
        id: service.company.id.toString(),
        name: service.company.name,
        city: service.company.city,
        verificationStatus: service.company.verificationStatus,
      },
      serviceType: {
        id: service.serviceType.id.toString(),
        name: service.serviceType.name,
        slug: service.serviceType.slug,
        category: {
          id: service.serviceType.category.id.toString(),
          name: service.serviceType.category.name,
          slug: service.serviceType.category.slug,
        },
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    }));

    res.json({
      success: true,
      data: formattedServices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/trending
 * Returns trending/most booked services
 */
const getTrendingServices = async (req, res, next) => {
  try {
    const { limit = 12, days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trendingServices = await prisma.service.findMany({
      where: {
        isActive: true,
        bookings: {
          some: {
            createdAt: { gte: daysAgo },
          },
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            logoUrl: true,
            verificationStatus: true,
          },
        },
        serviceType: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            bookings: true,
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

    const formatted = trendingServices.map((service) => ({
      id: service.id.toString(),
      companyId: service.companyId.toString(),
      serviceTypeId: service.serviceTypeId.toString(),
      name: service.name,
      description: service.description,
      basePrice: parseFloat(service.basePrice),
      platformFee: parseFloat(service.basePrice) * 0.1,
      durationMin: service.durationMin,
      durationMax: service.durationMax,
      image: service.image,
      company: {
        id: service.company.id.toString(),
        name: service.company.name,
        city: service.company.city,
        logoUrl: service.company.logoUrl,
        verified: service.company.verificationStatus === "verified",
      },
      serviceType: {
        id: service.serviceType.id.toString(),
        name: service.serviceType.name,
        slug: service.serviceType.slug,
        category: {
          id: service.serviceType.category.id.toString(),
          name: service.serviceType.category.name,
          slug: service.serviceType.category.slug,
        },
      },
      bookingCount: service._count.bookings,
      isTrending: true,
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
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCompany,
  getTrendingServices,
};
