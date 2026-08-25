import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const CSV_PATH = 'd:/Websites On Line/wordpress plugin/products/products.csv';
const IMAGES_DIR = 'd:/Websites On Line/wordpress plugin/products/images';

export interface SourceProductRow {
  ID: string;
  Type: string;
  SKU: string;
  Name: string;
  Status: string;
  'Is Featured': string;
  'Catalog Visibility': string;
  'Short Description': string;
  Description: string;
  'Regular Price': string;
  'Sale Price': string;
  'In Stock': string;
  'Stock Quantity': string;
  Weight: string;
  Dimensions: string;
  Categories: string;
  Tags: string;
  'Main Image File': string;
  'Gallery Image Files': string;
  'Date Created': string;
}

export interface NormalizedProduct {
  sourceId: number;
  sku: string;
  slug: string;
  name: string;
  nameArabic?: string;
  brand: string;
  category: string;
  componentType: string;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'OUT_OF_STOCK';
  isFeatured: boolean;
  shortDescription?: string;
  description?: string;
  mainImageFilename: string;
  mainImagePath: string;
  mainImageFormat: string;
  galleryImages: Array<{ filename: string; path: string; format: string }>;
  tags: string[];
  validationWarnings: string[];
  validationErrors: string[];
}

// Helper to normalize strings into slugs
export function generateSlug(name: string, sourceId: number): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u06ff]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'piece'}-${sourceId}`;
}

// Helper to extract brand
export function extractBrand(name: string, categories: string): string {
  const text = `${name} ${categories}`.toLowerCase();
  if (text.includes('samsung') || text.includes('galaxy')) return 'Samsung';
  if (text.includes('iphone') || text.includes('apple') || text.includes('ipad')) return 'Apple';
  if (text.includes('redmi') || text.includes('xiaomi') || text.includes('poco')) return 'Xiaomi';
  if (text.includes('huawei')) return 'Huawei';
  if (text.includes('honor')) return 'Honor';
  if (text.includes('oppo')) return 'Oppo';
  if (text.includes('realme')) return 'Realme';
  if (text.includes('infinix')) return 'Infinix';
  if (text.includes('tecno')) return 'Tecno';
  if (text.includes('oneplus')) return 'OnePlus';
  if (text.includes('google') || text.includes('pixel')) return 'Google';
  if (text.includes('nokia')) return 'Nokia';
  if (text.includes('vivo')) return 'Vivo';
  if (text.includes('condor')) return 'Condor';
  if (text.includes('ace')) return 'Ace';
  if (text.includes('motorola') || text.includes('moto')) return 'Motorola';
  if (text.includes('lg')) return 'LG';
  if (text.includes('zte')) return 'ZTE';
  return 'Générique / Autre';
}

// Helper to extract component type
export function extractComponentType(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('AFFICHEUR') || upper.includes('ECRAN') || upper.includes('OLED') || upper.includes('LCD')) return 'Écrans & Afficheurs';
  if (upper.includes('BATTERIE') || upper.includes('BATTERY')) return 'Batteries';
  if (upper.includes('CONNECTEUR') || upper.includes('NAPPE DE CHARGE') || upper.includes('SUB BOARD')) return 'Connecteurs de Charge';
  if (upper.includes('CAMERA') || upper.includes('LENTILLE') || upper.includes('CAPTEUR')) return 'Caméras & Capteurs';
  if (upper.includes('CACHE') || upper.includes('CHASSIS') || upper.includes('FRAME') || upper.includes('VITRE')) return 'Vitres & Châssis';
  if (upper.includes('NAPPE') || upper.includes('FLEX') || upper.includes('NFC')) return 'Nappes & Connectique';
  if (upper.includes('CARTE MERE') || upper.includes('LOGIC BOARD')) return 'Cartes Mères & Composants';
  if (upper.includes('OUTIL') || upper.includes('TOURNEVIS') || upper.includes('SEPARATEUR')) return 'Outillage & Consommables';
  return 'Pièces Détachées Diverses';
}

// Generate commercial SKU
export function generateSku(brand: string, componentType: string, sourceId: number): string {
  const cleanBrand = brand
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const brandCode = (cleanBrand.substring(0, 3) || 'GEN').padEnd(3, 'X');
  let compCode = 'PRD';
  if (componentType.includes('Écran')) compCode = 'SCR';
  else if (componentType.includes('Batterie')) compCode = 'BAT';
  else if (componentType.includes('Connecteur')) compCode = 'CHG';
  else if (componentType.includes('Caméra')) compCode = 'CAM';
  else if (componentType.includes('Vitre') || componentType.includes('Châssis')) compCode = 'BOD';
  else if (componentType.includes('Nappe')) compCode = 'FLX';
  else if (componentType.includes('Carte')) compCode = 'MB';

  return `HP-${brandCode}-${compCode}-${sourceId}`;
}

export function runDryRun() {
  console.log('=== RUNNING HAMZAPHONE CATALOG IMPORT DRY-RUN ===');

  const fileBuffer = fs.readFileSync(CSV_PATH);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: SourceProductRow[] = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

  const imageFiles = fs.readdirSync(IMAGES_DIR);
  const imageIndex = new Map<number, { main?: string; gallery: string[] }>();

  // Index images
  for (const filename of imageFiles) {
    const match = filename.match(/^prod_(\d+)_(main|gal_\d+)\.([a-zA-Z0-9]+)$/i);
    if (!match) continue;
    const prodId = parseInt(match[1], 10);
    const type = match[2].toLowerCase();

    if (!imageIndex.has(prodId)) {
      imageIndex.set(prodId, { gallery: [] });
    }
    const entry = imageIndex.get(prodId)!;
    if (type === 'main') {
      entry.main = filename;
    } else {
      entry.gallery.push(filename);
    }
  }

  const dryRunReport = {
    totalSourceRows: rows.length,
    willCreate: 0,
    willUpdate: 0,
    willSkip: 0,
    requiresManualReview: 0,
    matchedMainImages: 0,
    missingMainImages: 0,
    productsWithGallery: 0,
    totalGalleryImagesMatched: 0,
    orphanImagesCount: 0,
    orphanImagesList: [] as string[],
    statusBreakdown: {
      ACTIVE: 0,
      DRAFT: 0,
      ARCHIVED: 0,
    },
    brandBreakdown: {} as Record<string, number>,
    categoryBreakdown: {} as Record<string, number>,
    pricingAnalysis: {
      validPrices: 0,
      zeroOrMissingPrices: 0,
      salePricesActive: 0,
      minPriceDzd: Infinity,
      maxPriceDzd: -Infinity,
      avgPriceDzd: 0,
    },
    skuCollisions: 0,
    slugCollisions: 0,
    validationWarnings: [] as Array<{ sourceId: number; name: string; warnings: string[] }>,
    validationErrors: [] as Array<{ sourceId: number; name: string; errors: string[] }>,
  };

  const normalizedProducts: NormalizedProduct[] = [];
  const generatedSkus = new Set<string>();
  const generatedSlugs = new Set<string>();

  let totalPriceSum = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const sourceId = parseInt(r.ID, 10);
    const name = (r.Name || '').trim();
    const warnings: string[] = [];
    const errors: string[] = [];

    if (isNaN(sourceId)) {
      errors.push('Identifiant source invalide ou absent');
    }
    if (!name) {
      errors.push('Nom du produit manquant');
    }

    const brand = extractBrand(name, r.Categories || '');
    const componentType = extractComponentType(name);
    const sku = generateSku(brand, componentType, sourceId);
    const slug = generateSlug(name, sourceId);

    if (generatedSkus.has(sku)) {
      dryRunReport.skuCollisions++;
      errors.push(`Collision de SKU détectée: ${sku}`);
    } else {
      generatedSkus.add(sku);
    }

    if (generatedSlugs.has(slug)) {
      dryRunReport.slugCollisions++;
      errors.push(`Collision de Slug détectée: ${slug}`);
    } else {
      generatedSlugs.add(slug);
    }

    // Price
    const rawPrice = String(r['Regular Price'] || '').replace(/[^0-9.]/g, '');
    const numPrice = parseFloat(rawPrice);
    let finalPrice = 0;

    if (isNaN(numPrice) || numPrice <= 0) {
      dryRunReport.pricingAnalysis.zeroOrMissingPrices++;
      warnings.push('Prix régulier absent ou égal à 0 (Produit basculé en statut DRAFT)');
      finalPrice = 0;
    } else {
      dryRunReport.pricingAnalysis.validPrices++;
      finalPrice = numPrice;
      totalPriceSum += numPrice;
      if (numPrice < dryRunReport.pricingAnalysis.minPriceDzd) dryRunReport.pricingAnalysis.minPriceDzd = numPrice;
      if (numPrice > dryRunReport.pricingAnalysis.maxPriceDzd) dryRunReport.pricingAnalysis.maxPriceDzd = numPrice;
    }

    // Sale Price
    let finalSalePrice: number | null = null;
    if (r['Sale Price']) {
      const rawSale = String(r['Sale Price']).replace(/[^0-9.]/g, '');
      const numSale = parseFloat(rawSale);
      if (!isNaN(numSale) && numSale > 0 && numSale < finalPrice) {
        finalSalePrice = numSale;
        dryRunReport.pricingAnalysis.salePricesActive++;
      }
    }

    // Status
    const sourceStatus = String(r.Status || 'publish').trim().toLowerCase();
    let status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' = 'ACTIVE';

    if (sourceStatus === 'draft' || finalPrice === 0) {
      status = 'DRAFT';
    } else if (sourceStatus === 'private' || sourceStatus === 'trash') {
      status = 'ARCHIVED';
    } else {
      status = 'ACTIVE';
    }

    dryRunReport.statusBreakdown[status]++;
    dryRunReport.brandBreakdown[brand] = (dryRunReport.brandBreakdown[brand] || 0) + 1;
    dryRunReport.categoryBreakdown[componentType] = (dryRunReport.categoryBreakdown[componentType] || 0) + 1;

    // Image matching
    const imgData = imageIndex.get(sourceId);
    let mainImageFilename = '';
    let mainImagePath = '';
    let mainImageFormat = '';
    const galleryImages: Array<{ filename: string; path: string; format: string }> = [];

    if (imgData?.main) {
      dryRunReport.matchedMainImages++;
      mainImageFilename = imgData.main;
      mainImageFormat = path.extname(imgData.main).toLowerCase().replace('.', '');
      mainImagePath = `products/${sourceId}/main.${mainImageFormat}`;
    } else {
      dryRunReport.missingMainImages++;
      warnings.push(`Image principale absente dans le dossier images (prod_${sourceId}_main)`);
    }

    if (imgData?.gallery && imgData.gallery.length > 0) {
      dryRunReport.productsWithGallery++;
      dryRunReport.totalGalleryImagesMatched += imgData.gallery.length;
      for (const galFile of imgData.gallery) {
        const ext = path.extname(galFile).toLowerCase().replace('.', '');
        galleryImages.push({
          filename: galFile,
          format: ext,
          path: `products/${sourceId}/gallery/${galFile}`,
        });
      }
    }

    if (warnings.length > 0) {
      dryRunReport.validationWarnings.push({ sourceId, name, warnings });
    }
    if (errors.length > 0) {
      dryRunReport.validationErrors.push({ sourceId, name, errors });
    }

    if (errors.length === 0) {
      dryRunReport.willCreate++;
    } else {
      dryRunReport.willSkip++;
    }

    if (warnings.length > 0 || errors.length > 0) {
      dryRunReport.requiresManualReview++;
    }

    normalizedProducts.push({
      sourceId,
      sku,
      slug,
      name,
      brand,
      category: r.Categories || componentType,
      componentType,
      b2cPriceDzd: finalPrice,
      b2cSalePriceDzd: finalSalePrice,
      status,
      isFeatured: r['Is Featured'] === '1' || r['Is Featured'] === 'yes',
      shortDescription: r['Short Description'] || undefined,
      description: r.Description || undefined,
      mainImageFilename,
      mainImagePath,
      mainImageFormat,
      galleryImages,
      tags: r.Tags ? r.Tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      validationWarnings: warnings,
      validationErrors: errors,
    });
  }

  // Calculate average price
  if (dryRunReport.pricingAnalysis.validPrices > 0) {
    dryRunReport.pricingAnalysis.avgPriceDzd = Math.round(totalPriceSum / dryRunReport.pricingAnalysis.validPrices);
  }

  // Check Orphan Images
  const csvIds = new Set(rows.map(r => parseInt(r.ID, 10)));
  for (const filename of imageFiles) {
    const match = filename.match(/^prod_(\d+)_/i);
    if (match && !csvIds.has(parseInt(match[1], 10))) {
      dryRunReport.orphanImagesCount++;
      dryRunReport.orphanImagesList.push(filename);
    }
  }

  console.log('\n--- DRY-RUN SUMMARY RESULTS ---');
  console.log('Total Source Rows:', dryRunReport.totalSourceRows);
  console.log('Will Create:', dryRunReport.willCreate);
  console.log('Will Update:', dryRunReport.willUpdate);
  console.log('Will Skip:', dryRunReport.willSkip);
  console.log('Matched Main Images:', dryRunReport.matchedMainImages, `(${((dryRunReport.matchedMainImages / dryRunReport.totalSourceRows) * 100).toFixed(1)}%)`);
  console.log('Missing Main Images:', dryRunReport.missingMainImages);
  console.log('Products With Gallery Images:', dryRunReport.productsWithGallery);
  console.log('Total Gallery Images:', dryRunReport.totalGalleryImagesMatched);
  console.log('Orphan Images in Folder:', dryRunReport.orphanImagesCount, dryRunReport.orphanImagesList);
  console.log('SKU Collisions:', dryRunReport.skuCollisions);
  console.log('Slug Collisions:', dryRunReport.slugCollisions);
  console.log('Status Breakdown:', dryRunReport.statusBreakdown);
  console.log('Brand Breakdown:', dryRunReport.brandBreakdown);
  console.log('Category/Component Breakdown:', dryRunReport.categoryBreakdown);
  console.log('Pricing Analysis:', dryRunReport.pricingAnalysis);
  console.log('Validation Warnings Count:', dryRunReport.validationWarnings.length);
  console.log('Validation Errors Count:', dryRunReport.validationErrors.length);

  fs.writeFileSync('scripts/dry-run-report.json', JSON.stringify({
    summary: dryRunReport,
    sampleNormalizedProducts: normalizedProducts.slice(0, 10),
  }, null, 2));

  return { dryRunReport, normalizedProducts };
}

runDryRun();
