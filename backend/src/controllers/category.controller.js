// controllers/category.controller.js
const prisma = require('../config/database');

/**
 * GET /api/categories
 * Fetch all active categories with service type count
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        status: 'active'
      },
      include: {
        serviceTypes: {
          where: {
            status: 'active'
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    // Format response
    const formattedCategories = categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      imageUrl: cat.imageUrl,
      status: cat.status,
      displayOrder: cat.displayOrder,
      serviceTypesCount: cat.serviceTypes.length,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt
    }));

    res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:slug
 * Fetch single category by slug
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        slug: slug
      },
      include: {
        serviceTypes: {
          where: {
            status: 'active'
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
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

    // Format service types
    const formattedServiceTypes = category.serviceTypes.map(st => ({
      id: st.id.toString(),
      categoryId: st.categoryId.toString(),
      name: st.name,
      slug: st.slug,
      description: st.description,
      icon: st.icon,
      image: st.image,
      gradient: st.gradient,
      status: st.status,
      displayOrder: st.displayOrder
    }));

    res.json({
      success: true,
      data: {
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        imageUrl: category.imageUrl,
        status: category.status,
        serviceTypes: formattedServiceTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 * Create new category (Admin only)
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon, imageUrl, displayOrder } = req.body;

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        imageUrl,
        status: 'active',
        displayOrder: displayOrder || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        imageUrl: category.imageUrl,
        status: category.status,
        displayOrder: category.displayOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 * Update category (Admin only)
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await prisma.category.findUnique({
      where: { id: BigInt(id) }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If slug is being updated, check for duplicates
    if (updates.slug && updates.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: updates.slug }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Category with this slug already exists'
        });
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: BigInt(id) },
      data: updates
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: updatedCategory.id.toString(),
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        description: updatedCategory.description,
        icon: updatedCategory.icon,
        imageUrl: updatedCategory.imageUrl,
        status: updatedCategory.status,
        displayOrder: updatedCategory.displayOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Soft delete category (Admin only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: BigInt(id) },
      include: {
        serviceTypes: true
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has service types
    if (category.serviceTypes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing service types'
      });
    }

    // Soft delete by setting status to inactive
    await prisma.category.update({
      where: { id: BigInt(id) },
      data: { status: 'inactive' }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};