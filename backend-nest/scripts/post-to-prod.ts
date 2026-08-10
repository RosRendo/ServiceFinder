import * as cheerio from 'cheerio';
import * as https from 'https';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiaWF0IjoxNzg2Mzc5NTIzLCJleHAiOjE3ODYzODA0MjN9.Vc_TkVWifdOf2R_I8dHsRAhZuLj76vd0oOf7cgmHAyA';
const PROD_URL = 'https://api-servicefinder.xyz/api/admin/companies';

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function generateEmail(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `contact@${clean || Math.random().toString(36).substring(7)}.com`;
}

async function main() {
  console.log('Fetching CambodiaService moving companies...');
  const html = await fetchHtml('https://cambodiaservice.com/services/category/moving-service/');
  
  const $ = cheerio.load(html);
  const listings: any[] = [];
  
  $('.rtin-item').each((i: any, el: any) => {
    const name = $(el).find('.rtin-title a').text().trim();
    const phoneStr = $(el).find('.rtin-phn a').attr('data-phone') || $(el).find('.rtin-phn').text().trim();
    let phone = phoneStr ? phoneStr.replace('Show Phone No', '').trim() : null;
    if (phone && phone.includes(',')) phone = phone.split(',')[0].trim();
    if (phone && phone.length > 20) phone = phone.substring(0, 20);
    const addressStr = $(el).find('.rtin-meta li').filter((_: any, li: any) => $(li).find('.fa-map-marker').length > 0).text().trim();
    const logoUrl = $(el).find('.rtin-thumb img').attr('src');
    
    if (name) listings.push({ name, phone, addressStr, logoUrl });
  });

  console.log(`Found ${listings.length} moving companies. Posting to production...`);

  let added = 0;
  for (const listing of listings) {
    const email = generateEmail(listing.name);
    const payload = {
      ownerName: listing.name + ' Admin',
      ownerEmail: email,
      ownerPassword: 'Password123!',
      companyName: listing.name,
      companyCity: listing.addressStr || 'Phnom Penh',
      companyPhone: listing.phone || '',
      logoUrl: listing.logoUrl || '',
      companyDescription: 'Imported from CambodiaService',
    };

    try {
      const response = await fetch(PROD_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`✅ Success: ${listing.name}`);
        added++;
      } else {
        const err = await response.text();
        console.error(`❌ Failed: ${listing.name} - ${response.status} ${err}`);
      }
    } catch (e: any) {
      console.error(`❌ Error posting ${listing.name}:`, e.message);
    }
  }

  console.log(`Finished posting ${added} companies to production!`);
}

main().catch(console.error);
