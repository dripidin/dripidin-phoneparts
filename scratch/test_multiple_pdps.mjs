import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.production'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function formatDimensions(dims) {
  if (!dims) return 'Standard';
  if (typeof dims === 'string') return dims;
  if (typeof dims === 'object') {
    const { length, width, height } = dims;
    if (length !== undefined || width !== undefined || height !== undefined) {
      return `${length || '—'} × ${width || '—'} × ${height || '—'} cm`;
    }
    return JSON.stringify(dims);
  }
  return String(dims);
}

function formatSummary(p) {
  const b2cPrice = Number(p.b2c_price_dzd) || 0;
  const salePrice = p.b2c_sale_price_dzd ? Number(p.b2c_sale_price_dzd) : null;
  const isOnSale = Boolean(salePrice && salePrice > 0 && salePrice < b2cPrice);
  const effectivePrice = isOnSale ? salePrice : b2cPrice;
  const availableStock = Math.max(0, (p.stock_quantity || 0) - (p.reserved_stock || 0));

  const compatibilityList = Array.isArray(p.compatibility) 
    ? p.compatibility.map(c => typeof c === 'string' ? c : c?.model_name || c?.device_name || c?.model_code || c?.name).filter(Boolean)
    : [];

  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode || null,
    name: p.name,
    slug: p.slug,
    brandName: p.brands?.name || undefined,
    brandSlug: p.brands?.slug || undefined,
    categoryName: p.categories?.name || undefined,
    categorySlug: p.categories?.slug || undefined,
    productType: p.product_type || 'PART',
    mainImage: p.main_image || '/images/placeholder-product.webp',
    b2cPriceDzd: b2cPrice,
    b2cSalePriceDzd: salePrice,
    effectivePriceDzd: effectivePrice,
    isOnSale,
    stockQuantity: p.stock_quantity || 0,
    availableStock,
    isAvailable: availableStock > 0,
    isFeatured: Boolean(p.is_featured),
    compatibilityList,
    createdAt: p.created_at || new Date().toISOString(),
  };
}

async function testMultiplePDPs() {
  const slugsToTest = [
    'afficheur-samsung-a5-2016-a510-original-25710',
    'afficheur-condor-l3-smart-ace-clever-1-original-22180',
    'afficheur-ace-buzz-7-lite-buzz-7-prime-original-22181',
    'vis-iphone-xs-max-22195',
    'trappe-lcd-iphone-xs-max-22196',
    'nappe-de-charge-iphone-xr-max-22198',
    'nappe-de-charge-iphone-xs-max-22199',
    'glass-cam-iphone-xs-max-22200',
    'filtre-hp-iphone-xs-max-22201',
    'afficheur-ace-buzz-6-pro-plus-original-22182'
  ];

  console.log(`Testing ${slugsToTest.length} product slugs with simulated PDP serialization...`);

  for (const slug of slugsToTest) {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        barcode,
        name,
        slug,
        brand_id,
        category_id,
        product_type,
        status,
        is_visible,
        is_featured,
        short_description,
        description,
        main_image,
        gallery,
        b2c_price_dzd,
        b2c_sale_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock,
        weight_grams,
        dimensions_cm,
        compatibility,
        created_at,
        brands(id, name, slug, logo_url),
        categories(id, name, slug),
        product_images(id, image_url, alt_text, display_order, is_cover),
        product_compatibility(
          id,
          variant_codes,
          notes,
          device_models(id, name, slug, model_code, release_year)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .eq('is_visible', true)
      .maybeSingle();

    if (error || !product) {
      console.error(`Failed to fetch product for slug "${slug}":`, error);
      continue;
    }

    const baseSummary = formatSummary(product);
    const dimensionsStr = formatDimensions(product.dimensions_cm);

    const rawImages = product.product_images || [];
    const productImages = rawImages.map(img => ({
      id: img.id,
      imageUrl: img.image_url,
      altText: img.alt_text || null,
      displayOrder: img.display_order || 0,
      isCover: Boolean(img.is_cover),
    }));

    const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : productImages.map(img => img.imageUrl);

    if (gallery.length === 0 && product.main_image) {
      gallery.push(product.main_image);
    }

    const fullDetail = {
      ...baseSummary,
      shortDescription: product.short_description || null,
      description: product.description || null,
      gallery,
      productImages,
      weightGrams: product.weight_grams ? Number(product.weight_grams) : null,
      dimensionsCm: dimensionsStr,
      brand: product.brands ? {
        id: product.brands.id,
        name: product.brands.name,
        slug: product.brands.slug,
        logoUrl: product.brands.logo_url || null,
      } : null,
      category: product.categories ? {
        id: product.categories.id,
        name: product.categories.name,
        slug: product.categories.slug,
      } : null,
      compatibility: (product.product_compatibility || []).map(c => ({
        id: c.id,
        variantCodes: Array.isArray(c.variant_codes) ? c.variant_codes : [],
        notes: c.notes || null,
        deviceModel: c.device_models ? {
          id: c.device_models.id,
          name: c.device_models.name,
          slug: c.device_models.slug,
          modelCode: c.device_models.model_code,
          releaseYear: c.device_models.release_year,
        } : null,
      })),
      relatedProducts: [],
    };

    // Verify all specs entries are pure strings or numbers (no plain objects)
    const specs = [
      { label: 'Type de Pièce', value: fullDetail.productType },
      { label: 'Marque Fabricant', value: fullDetail.brand?.name || 'Universel' },
      { label: 'Catégorie', value: fullDetail.category?.name || 'Pièce détachée' },
      { label: 'Référence Fabricant (SKU)', value: fullDetail.sku },
      { label: 'Code-Barres EAN', value: fullDetail.barcode || '—' },
      { label: 'Poids Estimé', value: fullDetail.weightGrams ? `${fullDetail.weightGrams} g` : 'Standard' },
      { label: 'Dimensions', value: fullDetail.dimensionsCm || 'Standard' },
      { label: 'État du Composant', value: '100% Neuf & Testé' },
      { label: 'Garantie SAV Algérie', value: 'Garantie fonctionnelle avant collage' },
    ];

    let hasObject = false;
    for (const s of specs) {
      if (typeof s.value === 'object' && s.value !== null) {
        console.error(`ERROR: spec ${s.label} is an object:`, s.value);
        hasObject = true;
      }
    }

    if (!hasObject) {
      console.log(`✓ [${slug}] Success — Name: "${fullDetail.name}" | Price: ${fullDetail.effectivePriceDzd} DZD | Dimensions: "${fullDetail.dimensionsCm}" | Compatibility: [${fullDetail.compatibilityList.join(', ')}]`);
    }
  }
}

testMultiplePDPs();
