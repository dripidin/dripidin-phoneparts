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

async function findSampleSlugs() {
  const { data: prods } = await supabase
    .from('products')
    .select('id, name, slug, brand_id, category_id, brands(name), categories(name), dimensions_cm, compatibility, gallery, main_image')
    .limit(20);

  console.log('Sample products from Supabase:');
  for (const p of prods || []) {
    console.log({
      slug: p.slug,
      name: p.name,
      brand: p.brands?.name,
      category: p.categories?.name,
      dimensions_cm: p.dimensions_cm,
      gallery: p.gallery,
      main_image: p.main_image,
    });
  }
}

findSampleSlugs();
