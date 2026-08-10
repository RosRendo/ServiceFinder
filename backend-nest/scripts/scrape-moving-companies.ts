import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import * as https from 'https';

const prisma = new PrismaClient();

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('Fetching CambodiaService moving companies...');
  const html = await fetchHtml('https://cambodiaservice.com/services/category/moving-service/');
  
  const $ = cheerio.load(html);
  const listings: any[] = [];
  
  $('.rtin-item').each((i, el) => {
    const name = $(el).find('.rtin-title a').text().trim();
    const phoneStr = $(el).find('.rtin-phn a').attr('data-phone') || $(el).find('.rtin-phn').text().trim();
    let phone = phoneStr ? phoneStr.replace('Show Phone No', '').trim() : null;
    if (phone && phone.includes(',')) {
      phone = phone.split(',')[0].trim();
    }
    if (phone && phone.length > 20) {
      phone = phone.substring(0, 20);
    }
    const addressStr = $(el).find('.rtin-meta li').filter((_, li) => $(li).find('.fa-map-marker').length > 0).text().trim();
    const logoUrl = $(el).find('.rtin-thumb img').attr('src');
    
    if (name) {
      listings.push({ name, phone, addressStr, logoUrl });
    }
  });

  console.log(`Found ${listings.length} moving companies on page.`);

  // 1. Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (!admin) {
    console.error('No admin user found to assign these companies to.');
    process.exit(1);
  }

  // 2. Ensure Category exists
  let category = await prisma.category.findUnique({
    where: { slug: 'home-services' }
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Home Services',
        slug: 'home-services',
        status: 'active',
      }
    });
    console.log('Created Category: Home Services');
  } else {
    console.log('Found existing Category: Home Services');
  }

  // 3. Ensure ServiceType exists
  let serviceType = await prisma.serviceType.findUnique({
    where: { slug: 'moving-service' }
  });
  if (!serviceType) {
    serviceType = await prisma.serviceType.create({
      data: {
        name: 'Moving Service',
        slug: 'moving-service',
        categoryId: category.id,
        status: 'active',
      }
    });
    console.log('Created ServiceType: Moving Service');
  } else {
    console.log('Found existing ServiceType: Moving Service');
  }

  console.log(`Assigning companies to admin user ID: ${admin.id}`);

  let added = 0;
  for (const listing of listings) {
    // 4. Upsert Company
    let company = await prisma.company.findFirst({
      where: { name: listing.name }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: listing.name,
          phone: listing.phone,
          city: listing.addressStr || 'Phnom Penh',
          logoUrl: listing.logoUrl,
          ownerId: admin.id,
          verificationStatus: 'verified',
          description: 'Imported from CambodiaService',
        }
      });
      console.log(`Created company: ${listing.name}`);
      added++;
    } else {
      console.log(`Skipping Company "${listing.name}" - already exists.`);
    }

    // 5. Ensure Service exists for this company
    const serviceName = `${listing.name} - Moving Service`;
    const existingService = await prisma.service.findFirst({
      where: { companyId: company.id, serviceTypeId: serviceType.id }
    });

    if (!existingService) {
      await prisma.service.create({
        data: {
          companyId: company.id,
          serviceTypeId: serviceType.id,
          name: serviceName,
          basePrice: 0,
          durationMin: 60,
          isActive: true,
          description: 'Standard moving and transport services.',
        }
      });
      console.log(` -> Created Service: ${serviceName}`);
    } else {
      console.log(` -> Service already mapped.`);
    }
  }

  console.log(`Successfully completed! Added ${added} new companies.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
