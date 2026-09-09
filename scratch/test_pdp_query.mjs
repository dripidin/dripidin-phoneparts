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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPDPQuery() {
  const slug = 'afficheur-samsung-a5-2016-a510-original-25710';
  console.log('\n--- 1. Simple product query ---');
  const simpleRes = await supabase.from('products').select('*').eq('slug', slug);
  console.log('Simple query:', simpleRes.error ? simpleRes.error : `Found ${simpleRes.data?.length} rows`);
  if (simpleRes.data?.[0]) {
    console.log('Product row:', {
      id: simpleRes.data[0].id,
      name: simpleRes.data[0].name,
      slug: simpleRes.data[0].slug,
      status: simpleRes.data[0].status,
      is_visible: simpleRes.data[0].is_visible,
      category_id: simpleRes.data[0].category_id,
      brand_id: simpleRes.data[0].brand_id,
      gallery: simpleRes.data[0].gallery,
      dimensions_cm: simpleRes.data[0].dimensions_cm,
      weight_grams: simpleRes.data[0].weight_grams,
      compatibility: simpleRes.data[0].compatibility,
    });
  }

  console.log('\n--- 2. Full PDP query from StorefrontService ---');
  const fullRes = await supabase
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

  console.log('Full PDP Query Result:');
  if (fullRes.error) {
    console.error('ERROR in Full PDP Query:', fullRes.error);
  } else {
    console.log('Success! product found:', fullRes.data ? fullRes.data.id : null);
  }

  console.log('\n--- 3. Testing StorefrontService method ---');
  const { StorefrontService } = await import('../src/lib/services/storefront.service.js');
  const service = new StorefrontService(supabase);
  try {
    const p = await service.getProductBySlug(slug);
    console.log('StorefrontService.getProductBySlug returned:', p ? {
      id: p.id,
      name: p.name,
      slug: p.slug,
      effectivePriceDzd: p.effectivePriceDzd,
      brand: p.brand,
      category: p.category,
      galleryLength: p.gallery?.length,
      productImagesLength: p.productImages?.length,
      compatibilityLength: p.compatibility?.length,
      relatedProductsLength: p.relatedProducts?.length,
    } : null);
  } catch (err) {
    console.error('StorefrontService.getProductBySlug threw:', err);
  }
}

testPDPQuery();
