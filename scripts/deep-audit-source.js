import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const CSV_PATH = 'd:/Websites On Line/wordpress plugin/products/products.csv';
const IMAGES_DIR = 'd:/Websites On Line/wordpress plugin/products/images';

function deepAudit() {
  const fileBuffer = fs.readFileSync(CSV_PATH);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

  console.log('--- DEEP SOURCE ANALYSIS ---');
  
  // 1. Column analysis
  console.log('Columns in CSV:', Object.keys(rows[0]));

  // 2. Sample 5 products
  console.log('\n--- 5 Sample Records ---');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i];
    console.log(`[${i+1}] ID: ${r.ID} | Name: ${r.Name} | Price: ${r['Regular Price']} | Sale: ${r['Sale Price']} | Cat: ${r.Categories} | Status: ${r.Status}`);
  }

  // 3. Brand extraction analysis from Name and Categories
  const knownBrands = [
    'Samsung', 'Apple', 'iPhone', 'iPad', 'Xiaomi', 'Redmi', 'Poco',
    'Huawei', 'Honor', 'Oppo', 'Realme', 'Vivo', 'Infinix', 'Tecno',
    'OnePlus', 'Google', 'Pixel', 'Nokia', 'Motorola', 'Sony', 'ZTE', 'LG'
  ];

  const brandMatches = {};
  for (const b of knownBrands) brandMatches[b] = 0;
  let unmappedBrandCount = 0;

  for (const r of rows) {
    const text = `${r.Name} ${r.Categories}`.toLowerCase();
    let found = false;
    for (const b of knownBrands) {
      if (text.includes(b.toLowerCase())) {
        brandMatches[b]++;
        found = true;
        break;
      }
    }
    if (!found) unmappedBrandCount++;
  }

  console.log('\n--- Brand Detection from Name/Categories ---');
  console.log('Brand breakdown:', brandMatches);
  console.log('Products without matched known brand:', unmappedBrandCount);

  // 4. Categories structure analysis
  const catSet = new Set();
  const topLevelCats = new Set();
  const subCats = new Set();

  for (const r of rows) {
    if (r.Categories) {
      const parts = r.Categories.split(',').map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        catSet.add(p);
        if (p.includes('>')) {
          const split = p.split('>').map(x => x.trim());
          topLevelCats.add(split[0]);
          subCats.add(split[split.length - 1]);
        } else {
          topLevelCats.add(p);
        }
      }
    }
  }

  console.log('\n--- Category Structure ---');
  console.log('Total distinct category strings:', catSet.size);
  console.log('Top-level category roots:', Array.from(topLevelCats).slice(0, 15));

  // 5. Zero or missing prices
  const missingPriceRows = rows.filter(r => {
    const p = parseFloat(String(r['Regular Price']).replace(/[^0-9.]/g, ''));
    return isNaN(p) || p <= 0;
  });

  console.log('\n--- Price Audit ---');
  console.log('Products with 0 or missing price:', missingPriceRows.length);
  if (missingPriceRows.length > 0) {
    console.log('Sample missing price items:', missingPriceRows.slice(0, 5).map(r => ({ ID: r.ID, Name: r.Name, Price: r['Regular Price'], Status: r.Status })));
  }

  // 6. Draft / Private items
  const nonPublished = rows.filter(r => String(r.Status).trim().toLowerCase() !== 'publish');
  console.log('\n--- Non-Published Items ---');
  console.log('Non-published count:', nonPublished.length);
  console.log('Items:', nonPublished.map(r => ({ ID: r.ID, Name: r.Name, Status: r.Status })));

  // 7. Gallery Images Check
  const imageFiles = fs.readdirSync(IMAGES_DIR);
  const galleryFiles = imageFiles.filter(f => f.includes('_gal_'));
  console.log('\n--- Gallery Images Details ---');
  console.log('Total gallery files found:', galleryFiles.length);
  console.log('Gallery files list:', galleryFiles);

  // 8. Find orphan image details
  const csvIds = new Set(rows.map(r => parseInt(r.ID, 10)));
  const orphanFiles = imageFiles.filter(f => {
    const m = f.match(/^prod_(\d+)_/i);
    return m && !csvIds.has(parseInt(m[1], 10));
  });
  console.log('\n--- Orphan Images Details ---');
  console.log('Orphan files count:', orphanFiles.length);
  console.log('Orphan files:', orphanFiles);

  // 9. Short vs Full Descriptions
  let withDesc = 0;
  let withShortDesc = 0;
  let withHtmlDesc = 0;
  for (const r of rows) {
    if (r.Description && r.Description.trim()) {
      withDesc++;
      if (/<[a-z][\s\S]*>/i.test(r.Description)) withHtmlDesc++;
    }
    if (r['Short Description'] && r['Short Description'].trim()) withShortDesc++;
  }
  console.log('\n--- Descriptions & Content ---');
  console.log('Products with Description:', withDesc);
  console.log('Products with Short Description:', withShortDesc);
  console.log('Products with HTML tags in Description:', withHtmlDesc);

  fs.writeFileSync('scripts/deep-audit-output.json', JSON.stringify({
    totalRows: rows.length,
    columns: Object.keys(rows[0]),
    brandMatches,
    unmappedBrandCount,
    topLevelCats: Array.from(topLevelCats),
    missingPriceCount: missingPriceRows.length,
    missingPriceSamples: missingPriceRows.slice(0, 10),
    nonPublished,
    galleryFiles,
    orphanFiles,
    withDesc,
    withShortDesc,
    withHtmlDesc,
  }, null, 2));
}

deepAudit();
