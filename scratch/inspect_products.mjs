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

async function inspectProducts() {
  const slugs = [
    'afficheur-samsung-a5-2016-a510-original-25710',
    'afficheur-iphone-11-pro-max-oled-zy-41484',
    'afficheur-oppo-reno-5-oled-35439',
    'batterie-xiaomi-redmi-note-8-pro-bm4j-28565',
    'afficheur-huawei-y9-prime-2019-avec-chassis-37651'
  ];

  for (const slug of slugs) {
    console.log(`\n================ Testing Slug: ${slug} ================`);
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

    if (error) {
      console.error('Database query error:', error);
      continue;
    }
    if (!product) {
      console.log('Product not found in Supabase.');
      continue;
    }

    console.log('Product Found:', {
      id: product.id,
      name: product.name,
      b2c_price_dzd: product.b2c_price_dzd,
      b2c_sale_price_dzd: product.b2c_sale_price_dzd,
      stock_quantity: product.stock_quantity,
      reserved_stock: product.reserved_stock,
      available_stock: product.available_stock,
      dimensions_cm: product.dimensions_cm,
      dimensions_cm_type: typeof product.dimensions_cm,
      weight_grams: product.weight_grams,
      gallery: product.gallery,
      brands: product.brands,
      categories: product.categories,
      product_images: product.product_images,
      product_compatibility: product.product_compatibility,
      compatibility_jsonb: product.compatibility,
    });

    // Check specifications table rendering values
    const specs = [
      { label: 'Type de Pièce', value: product.product_type },
      { label: 'Marque Fabricant', value: product.brands?.name || 'Universel' },
      { label: 'Catégorie', value: product.categories?.name || 'Pièce détachée' },
      { label: 'Référence Fabricant (SKU)', value: product.sku },
      { label: 'Code-Barres EAN', value: product.barcode || '—' },
      { label: 'Poids Estimé', value: product.weight_grams ? `${product.weight_grams} g` : 'Standard' },
      { label: 'Dimensions', value: product.dimensions_cm || 'Standard' },
      { label: 'État du Composant', value: '100% Neuf & Testé' },
      { label: 'Garantie SAV Algérie', value: 'Garantie fonctionnelle avant collage' },
    ];

    for (const spec of specs) {
      if (typeof spec.value === 'object' && spec.value !== null) {
        console.error(`🚨 FATAL REACT ERROR DETECTED for spec "${spec.label}": value is an object!`, spec.value);
      }
    }
  }
}

inspectProducts();
