import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const CSV_PATH = 'd:/Websites On Line/wordpress plugin/products/products.csv';
const IMAGES_DIR = 'd:/Websites On Line/wordpress plugin/products/images';

function auditSource() {
  console.log('--- AUDITING HAMZAPHONE CATALOG SOURCE ---');

  // 1. Audit Images Directory
  console.log('\n[1] Scanning Images Directory:', IMAGES_DIR);
  const imageFiles = fs.readdirSync(IMAGES_DIR);
  console.log('Total image files found in folder:', imageFiles.length);

  const imageStats = {
    total: imageFiles.length,
    byExtension: {},
    mainImages: 0,
    galleryImages: 0,
    zeroByteFiles: 0,
    invalidNames: [],
    productsWithMainImage: new Set(),
    productsWithGalleryImage: new Map(), // prodId -> array of filenames
    allImageProdIds: new Set(),
  };

  const imagePattern = /^prod_(\d+)_(main|gal_\d+)\.([a-zA-Z0-9]+)$/i;

  for (const filename of imageFiles) {
    const fullPath = path.join(IMAGES_DIR, filename);
    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      imageStats.zeroByteFiles++;
    }

    const ext = path.extname(filename).toLowerCase().replace('.', '');
    imageStats.byExtension[ext] = (imageStats.byExtension[ext] || 0) + 1;

    const match = filename.match(imagePattern);
    if (!match) {
      imageStats.invalidNames.push(filename);
      continue;
    }

    const [, prodIdStr, type, fileExt] = match;
    const prodId = parseInt(prodIdStr, 10);
    imageStats.allImageProdIds.add(prodId);

    if (type.toLowerCase() === 'main') {
      imageStats.mainImages++;
      imageStats.productsWithMainImage.add(prodId);
    } else {
      imageStats.galleryImages++;
      if (!imageStats.productsWithGalleryImage.has(prodId)) {
        imageStats.productsWithGalleryImage.set(prodId, []);
      }
      imageStats.productsWithGalleryImage.get(prodId).push(filename);
    }
  }

  console.log('Extensions:', imageStats.byExtension);
  console.log('Main images:', imageStats.mainImages);
  console.log('Gallery images:', imageStats.galleryImages);
  console.log('Unique products with main image:', imageStats.productsWithMainImage.size);
  console.log('Products with gallery images:', imageStats.productsWithGalleryImage.size);
  console.log('Zero byte files:', imageStats.zeroByteFiles);
  console.log('Invalid image filename count:', imageStats.invalidNames.length);

  // 2. Audit CSV File
  console.log('\n[2] Reading CSV File:', CSV_PATH);
  const fileBuffer = fs.readFileSync(CSV_PATH);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

  console.log('Total rows read from CSV:', rows.length);
  if (rows.length > 0) {
    console.log('Sample column names:', Object.keys(rows[0]));
  }

  const csvStats = {
    totalRows: rows.length,
    ids: new Set(),
    duplicateIds: [],
    skus: new Set(),
    duplicateSkus: [],
    emptySkus: 0,
    names: new Set(),
    emptyNames: 0,
    priceInvalid: 0,
    salePriceCount: 0,
    statusCounts: {},
    inStockCounts: {},
    categoriesSet: new Set(),
    categoryTree: new Map(),
    rowsWithArabic: 0,
    tagsSet: new Set(),
    rowsMissingImages: [],
    rowsWithGallery: [],
  };

  const arabicRegex = /[\u0600-\u06FF]/;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Find ID column (case-insensitive)
    const idKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'id') || 'ID';
    const skuKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'sku') || 'SKU';
    const nameKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'name' || k.trim().toLowerCase() === 'nom') || 'Name';
    const statusKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'status' || k.trim().toLowerCase() === 'statut') || 'Status';
    const priceKey = Object.keys(row).find(k => k.trim().toLowerCase().includes('regular') || k.trim().toLowerCase().includes('prix') || k.trim().toLowerCase() === 'price') || 'Regular price';
    const salePriceKey = Object.keys(row).find(k => k.trim().toLowerCase().includes('sale') || k.trim().toLowerCase().includes('promo')) || 'Sale price';
    const stockKey = Object.keys(row).find(k => k.trim().toLowerCase().includes('stock') && !k.trim().toLowerCase().includes('status')) || 'Stock';
    const inStockKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'in stock?' || k.trim().toLowerCase() === 'in_stock') || 'In stock?';
    const catKey = Object.keys(row).find(k => k.trim().toLowerCase().includes('categor')) || 'Categories';
    const tagKey = Object.keys(row).find(k => k.trim().toLowerCase().includes('tag')) || 'Tags';

    const sourceId = parseInt(row[idKey], 10);
    const sku = String(row[skuKey] || '').trim();
    const name = String(row[nameKey] || '').trim();
    const status = String(row[statusKey] || '').trim().toLowerCase();
    const priceRaw = String(row[priceKey] || '').trim();
    const salePriceRaw = String(row[salePriceKey] || '').trim();
    const inStock = String(row[inStockKey] || '').trim();
    const categories = String(row[catKey] || '').trim();
    const tags = String(row[tagKey] || '').trim();

    // Check ID
    if (!isNaN(sourceId)) {
      if (csvStats.ids.has(sourceId)) {
        csvStats.duplicateIds.push({ index: i, id: sourceId, sku, name });
      } else {
        csvStats.ids.add(sourceId);
      }
    }

    // Check SKU
    if (!sku) {
      csvStats.emptySkus++;
    } else {
      if (csvStats.skus.has(sku.toLowerCase())) {
        csvStats.duplicateSkus.push({ index: i, sku, sourceId, name });
      } else {
        csvStats.skus.add(sku.toLowerCase());
      }
    }

    // Check Name
    if (!name) {
      csvStats.emptyNames++;
    } else {
      if (arabicRegex.test(name)) {
        csvStats.rowsWithArabic++;
      }
    }

    // Status
    csvStats.statusCounts[status || 'empty'] = (csvStats.statusCounts[status || 'empty'] || 0) + 1;

    // In Stock
    csvStats.inStockCounts[inStock || 'empty'] = (csvStats.inStockCounts[inStock || 'empty'] || 0) + 1;

    // Price
    const numPrice = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));
    if (isNaN(numPrice) || numPrice < 0) {
      csvStats.priceInvalid++;
    }

    if (salePriceRaw) {
      const numSale = parseFloat(salePriceRaw.replace(/[^0-9.]/g, ''));
      if (!isNaN(numSale) && numSale > 0) {
        csvStats.salePriceCount++;
      }
    }

    // Categories
    if (categories) {
      const cats = categories.split(',').map(c => c.trim()).filter(Boolean);
      for (const c of cats) {
        csvStats.categoriesSet.add(c);
      }
    }

    // Tags
    if (tags) {
      const tg = tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const t of tg) {
        csvStats.tagsSet.add(t);
      }
    }

    // Image cross check
    const hasMainImg = imageStats.productsWithMainImage.has(sourceId);
    if (!hasMainImg) {
      csvStats.rowsMissingImages.push({ sourceId, sku, name });
    }

    if (imageStats.productsWithGalleryImage.has(sourceId)) {
      csvStats.rowsWithGallery.push({
        sourceId,
        sku,
        name,
        gallery: imageStats.productsWithGalleryImage.get(sourceId),
      });
    }
  }

  // 3. Find Orphan Images (Images without matching CSV row)
  const orphanImages = [];
  for (const imgProdId of imageStats.allImageProdIds) {
    if (!csvStats.ids.has(imgProdId)) {
      orphanImages.push(imgProdId);
    }
  }

  console.log('\n[3] Cross-Audit Results:');
  console.log('Unique Source IDs in CSV:', csvStats.ids.size);
  console.log('Duplicate IDs:', csvStats.duplicateIds.length);
  console.log('Unique SKUs:', csvStats.skus.size);
  console.log('Duplicate SKUs:', csvStats.duplicateSkus.length);
  console.log('Empty SKUs:', csvStats.emptySkus);
  console.log('Empty Names:', csvStats.emptyNames);
  console.log('Rows with Arabic text in Name:', csvStats.rowsWithArabic);
  console.log('Invalid prices (NaN or <0):', csvStats.priceInvalid);
  console.log('Products with active Sale Price:', csvStats.salePriceCount);
  console.log('Status breakdown:', csvStats.statusCounts);
  console.log('In-Stock breakdown:', csvStats.inStockCounts);
  console.log('Distinct Categories:', csvStats.categoriesSet.size);
  console.log('Distinct Tags:', csvStats.tagsSet.size);
  console.log('CSV Products WITH Main Image:', csvStats.ids.size - csvStats.rowsMissingImages.length);
  console.log('CSV Products WITHOUT Main Image:', csvStats.rowsMissingImages.length);
  console.log('Products WITH Gallery Images:', csvStats.rowsWithGallery.length);
  console.log('Orphan Image Product IDs (in images but not in CSV):', orphanImages.length);

  return {
    imageStats,
    csvStats,
    orphanImages,
    sampleRows: rows.slice(0, 3),
    sampleCategories: Array.from(csvStats.categoriesSet).slice(0, 20),
  };
}

const result = auditSource();
fs.writeFileSync('scripts/audit-output.json', JSON.stringify(result, null, 2));
console.log('\nAudit complete. Detailed stats written to scripts/audit-output.json');
