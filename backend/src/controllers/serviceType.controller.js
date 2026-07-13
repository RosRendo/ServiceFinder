// controllers/serviceType.controller.js
const prisma = require('../config/database');

/**
 * GET /api/categories/:categorySlug/service-types
 * Fetch all service types for a category
 */

const getAllServiceTypes = async (req, res, next) => {
  try {
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        status: 'active'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    const formattedServiceTypes = serviceTypes.map(st => ({
      id: st.id.toString(),
      categoryId: st.categoryId.toString(),
      name: st.name,
      slug: st.slug,
      description: st.description,
      icon: st.icon,
      imageUrl: st.image,
      gradient: st.gradient,
      status: st.status,
      displayOrder: st.displayOrder,
      category: {
        id: st.category.id.toString(),
        name: st.category.name,
        slug: st.category.slug
      },
      createdAt: st.createdAt,
      updatedAt: st.updatedAt
    }));

    res.json({
      success: true,
      data: formattedServiceTypes
    });
  } catch (error) {
    next(error);
  }
};

const getServiceTypesByCategory = async (req, res, next) => {
  try {
    const { categorySlug } = req.params;

    // First get the category
    const category = await prisma.category.findUnique({
      where: {
        slug: categorySlug
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (category.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Category not available'
      });
    }

    // Get service types with company count
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        categoryId: category.id,
        status: 'active'
      },
      include: {
        services: {
          where: {
            isActive: true,
            company: {
              verificationStatus: 'verified'
            }
          },
          select: {
            companyId: true
          },
          distinct: ['companyId']
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    // Format response
    const formattedServiceTypes = serviceTypes.map(st => ({
      id: st.id.toString(),
      categoryId: st.categoryId.toString(),
      name: st.name,
      slug: st.slug,
      description: st.description,
      icon: st.icon,
      imageUrl: st.image,
      gradient: st.gradient,
      status: st.status,
      displayOrder: st.displayOrder,
      companiesCount: st.services.length,
      createdAt: st.createdAt,
      updatedAt: st.updatedAt
    }));

    res.json({
      success: true,
      data: {
        category: {
          id: category.id.toString(),
          name: category.name,
          slug: category.slug,
          icon: category.icon
        },
        serviceTypes: formattedServiceTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/service-types/:slug
 * Fetch single service type by slug
 */
const getServiceTypeBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const serviceType = await prisma.serviceType.findUnique({
      where: {
        slug: slug
      },
      include: {
        category: true
      }
    });

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found'
      });
    }

    if (serviceType.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Service type not available'
      });
    }

    res.json({
      success: true,
      data: {
        id: serviceType.id.toString(),
        categoryId: serviceType.categoryId.toString(),
        name: serviceType.name,
        slug: serviceType.slug,
        description: serviceType.description,
        icon: serviceType.icon,
        image: serviceType.image,
        gradient: serviceType.gradient,
        status: serviceType.status,
        displayOrder: serviceType.displayOrder,
        category: {
          id: serviceType.category.id.toString(),
          name: serviceType.category.name,
          slug: serviceType.category.slug
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/service-types
 * Create new service type (Admin only)
 */
const createServiceType = async (req, res, next) => {
  try {
    const {
      categoryId,
      name,
      slug,
      description,
      icon,
      image,
      displayOrder
    } = req.body;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: BigInt(categoryId) }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if slug already exists
    const existing = await prisma.serviceType.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Service type with this slug already exists'
      });
    }

    const serviceType = await prisma.serviceType.create({
      data: {
        categoryId: BigInt(categoryId),
        name,
        slug,
        description,
        icon,
        image,
        status: 'active',
        displayOrder: displayOrder || 0
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Service type created successfully',
      data: {
        id: serviceType.id.toString(),
        categoryId: serviceType.categoryId.toString(),
        name: serviceType.name,
        slug: serviceType.slug,
        description: serviceType.description,
        icon: serviceType.icon,
        image: serviceType.image,
        status: serviceType.status,
        displayOrder: serviceType.displayOrder,
        category: {
          id: serviceType.category.id.toString(),
          name: serviceType.category.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/service-types/:id
 * Update service type (Admin only)
 */
const updateServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const serviceType = await prisma.serviceType.findUnique({
      where: { id: BigInt(id) }
    });

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found'
      });
    }

    // If slug is being updated, check for duplicates
    if (updates.slug && updates.slug !== serviceType.slug) {
      const existing = await prisma.serviceType.findUnique({
        where: { slug: updates.slug }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Service type with this slug already exists'
        });
      }
    }

    const updatedServiceType = await prisma.serviceType.update({
      where: { id: BigInt(id) },
      data: updates,
      include: {
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Service type updated successfully',
      data: {
        id: updatedServiceType.id.toString(),
        categoryId: updatedServiceType.categoryId.toString(),
        name: updatedServiceType.name,
        slug: updatedServiceType.slug,
        description: updatedServiceType.description,
        icon: updatedServiceType.icon,
        image: updatedServiceType.image,
        gradient: updatedServiceType.gradient,
        status: updatedServiceType.status,
        displayOrder: updatedServiceType.displayOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/service-types/:id
 * Soft delete service type (Admin only)
 */
const deleteServiceType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const serviceType = await prisma.serviceType.findUnique({
      where: { id: BigInt(id) },
      include: {
        services: {
          where: { isActive: true }
        }
      }
    });

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found'
      });
    }

    // Check if service type has active services
    if (serviceType.services.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service type with active services'
      });
    }

    // Soft delete by setting status to inactive
    await prisma.serviceType.update({
      where: { id: BigInt(id) },
      data: { status: 'inactive' }
    });

    res.json({
      success: true,
      message: 'Service type deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServiceTypes,
  getServiceTypesByCategory,
  getServiceTypeBySlug,
  createServiceType,
  updateServiceType,
  deleteServiceType
};