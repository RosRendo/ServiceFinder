/**
 * Saved Items Controller
 * Handles saving/unsaving companies and services
 */

const prisma = require('../config/database');

/**
 * Get all saved items for the current user
 */
const getSavedItems = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (type && ['company', 'service'].includes(type)) {
      where.itemType = type;
    }

    const [items, total] = await Promise.all([
      prisma.savedItem.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savedItem.count({ where }),
    ]);

    const itemIds = items.map(i => i.itemId);
    const itemType = items[0]?.itemType || type;

    let enrichedItems = [];
    if (itemType === 'company' && itemIds.length > 0) {
      const companies = await prisma.company.findMany({
        where: { id: { in: itemIds.map(BigInt) } },
        select: {
          id: true,
          name: true,
          description: true,
          city: true,
          phone: true,
          email: true,
          logoUrl: true,
          coverImageUrl: true,
          verificationStatus: true,
          ratingSummary: true,
          services: {
            take: 3,
            select: { id: true, name: true },
          },
          _count: { select: { bookings: true } },
        },
      });
      const companyMap = new Map(companies.map(c => [c.id.toString(), c]));
      enrichedItems = items.map(saved => {
        const company = companyMap.get(saved.itemId.toString());
        if (!company) return null;
        return {
          id: saved.id.toString(),
          itemType: saved.itemType,
          itemId: saved.itemId.toString(),
          createdAt: saved.createdAt.toISOString(),
          item: {
            id: company.id.toString(),
            name: company.name,
            description: company.description,
            city: company.city,
            phone: company.phone,
            email: company.email,
            logoUrl: company.logoUrl,
            coverImageUrl: company.coverImageUrl,
            verified: company.verificationStatus === 'verified',
            rating: company.ratingSummary?.averageRating ? parseFloat(company.ratingSummary.averageRating) : 0,
            reviewCount: company.ratingSummary?.totalReviews || 0,
            jobsCount: company._count?.bookings || 0,
            services: company.services,
          },
        };
      }).filter(Boolean);
    } else if (itemType === 'service' && itemIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: itemIds.map(BigInt) } },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          durationMin: true,
          durationMax: true,
          image: true,
          company: {
            select: {
              id: true,
              name: true,
              city: true,
              logoUrl: true,
              verificationStatus: true,
              ratingSummary: true,
            },
          },
          serviceType: {
            select: { name: true, slug: true },
          },
        },
      });
      const serviceMap = new Map(services.map(s => [s.id.toString(), s]));
      enrichedItems = items.map(saved => {
        const service = serviceMap.get(saved.itemId.toString());
        if (!service) return null;
        return {
          id: saved.id.toString(),
          itemType: saved.itemType,
          itemId: saved.itemId.toString(),
          createdAt: saved.createdAt.toISOString(),
          item: {
            id: service.id.toString(),
            name: service.name,
            description: service.description,
            basePrice: parseFloat(service.basePrice),
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            company: service.company ? {
              id: service.company.id.toString(),
              name: service.company.name,
              city: service.company.city,
              logoUrl: service.company.logoUrl,
              verified: service.company.verificationStatus === 'verified',
              rating: service.company.ratingSummary?.averageRating ? parseFloat(service.company.ratingSummary.averageRating) : 0,
              reviewCount: service.company.ratingSummary?.totalReviews || 0,
            } : null,
            category: service.serviceType?.name || 'Service',
          },
        };
      }).filter(Boolean);
    }

    res.json({
      items: enrichedItems,
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
 * Save an item (company or service)
 */
const saveItem = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }

    if (!['company', 'service'].includes(itemType)) {
      return res.status(400).json({ error: 'itemType must be "company" or "service"' });
    }

    const item = itemType === 'company'
      ? await prisma.company.findUnique({ where: { id: BigInt(itemId) } })
      : await prisma.service.findUnique({ where: { id: BigInt(itemId) } });

    if (!item) {
      return res.status(404).json({ error: itemType + ' not found' });
    }

    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: req.user.id,
          itemType,
          itemId: BigInt(itemId),
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Item already saved' });
    }

    const savedItem = await prisma.savedItem.create({
      data: {
        userId: req.user.id,
        itemType,
        itemId: BigInt(itemId),
      },
    });

    res.status(201).json({ savedItem: { id: savedItem.id.toString() }, message: 'Item saved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsave (remove) an item
 */
const unsaveItem = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }

    const deleted = await prisma.savedItem.deleteMany({
      where: {
        userId: req.user.id,
        itemType,
        itemId: BigInt(itemId),
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Saved item not found' });
    }

    res.json({ message: 'Item removed from saved' });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if specific items are saved by the current user
 */
const checkSaved = async (req, res, next) => {
  try {
    const { itemType, itemIds } = req.query;

    if (!itemType || !itemIds) {
      return res.status(400).json({ error: 'itemType and itemIds are required' });
    }

    if (!['company', 'service'].includes(itemType)) {
      return res.status(400).json({ error: 'itemType must be "company" or "service"' });
    }

    const ids = itemIds.split(',').map(id => BigInt(id.trim()));

    const savedItems = await prisma.savedItem.findMany({
      where: {
        userId: req.user.id,
        itemType,
        itemId: { in: ids },
      },
    });

    const savedIds = new Set(savedItems.map(i => i.itemId.toString()));

    res.json({
      itemType,
      savedIds: itemIds.split(',').map(id => ({
        id: id.trim(),
        saved: savedIds.has(id.trim()),
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavedItems,
  saveItem,
  unsaveItem,
  checkSaved,
};