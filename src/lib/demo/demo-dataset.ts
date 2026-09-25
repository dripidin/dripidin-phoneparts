// DRIPIDIN Deterministic Demo Dataset
// Fully isolated catalog fixtures with SKU namespace DEMO-* and is_demo = true.
// Used for local execution, tests, and demo mode fallbacks without touching real products.

export interface DemoProductFixture {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  product_type: string;
  status: 'ACTIVE';
  is_visible: boolean;
  is_featured: boolean;
  short_description: string;
  description: string;
  main_image: string;
  gallery: string[];
  cost_price_dzd: number;
  b2c_price_dzd: number;
  b2c_sale_price_dzd: number | null;
  b2b_price_dzd: number;
  stock_quantity: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  weight_grams: number;
  dimensions_cm: { length: number; width: number; height: number };
  is_demo: true;
  brands: {
    id: string;
    name: string;
    slug: string;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
  };
}

export const DEMO_PRODUCTS: DemoProductFixture[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    sku: 'DEMO-IP13-OLED',
    barcode: '613000000001',
    name: '[DEMO] Écran OLED Super Retina - iPhone 13',
    slug: 'demo-ecran-oled-iphone-13',
    brand_id: '223bdc42-272f-4395-88a9-999fba9e1e60',
    category_id: 'd20c5c7b-54bc-4adf-96fe-3ba2c1090927',
    product_type: 'ORIGINAL',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: true,
    short_description: 'Écran OLED Super Retina XDR de démonstration pour iPhone 13.',
    description: 'Bloc écran complet avec tactile et dalle OLED pour environnement de test sandbox.',
    main_image: '/images/products/demo-screen-ip13.jpg',
    gallery: ['/images/products/demo-screen-ip13.jpg'],
    cost_price_dzd: 14000,
    b2c_price_dzd: 24500,
    b2c_sale_price_dzd: 22000,
    b2b_price_dzd: 20000,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    low_stock_threshold: 5,
    weight_grams: 60,
    dimensions_cm: { length: 15, width: 8, height: 1 },
    is_demo: true,
    brands: {
      id: '223bdc42-272f-4395-88a9-999fba9e1e60',
      name: 'Apple',
      slug: 'apple',
    },
    categories: {
      id: 'd20c5c7b-54bc-4adf-96fe-3ba2c1090927',
      name: 'Écrans & Afficheurs',
      slug: 'ecrans-afficheurs',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    sku: 'DEMO-SAM-S21-BAT',
    barcode: '613000000002',
    name: '[DEMO] Batterie 4000mAh - Galaxy S21 5G',
    slug: 'demo-batterie-galaxy-s21',
    brand_id: '8347f2eb-339e-4a5e-b126-9f94697b982c',
    category_id: 'eea6122f-dbc8-4519-9ddd-d134c12d1d55',
    product_type: 'SERVICE_PACK',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: true,
    short_description: 'Batterie de démonstration Li-Po 4000mAh pour Galaxy S21.',
    description: 'Batterie de remplacement haute capacité pour tests de commande sandbox.',
    main_image: '/images/products/demo-bat-s21.jpg',
    gallery: ['/images/products/demo-bat-s21.jpg'],
    cost_price_dzd: 3200,
    b2c_price_dzd: 5500,
    b2c_sale_price_dzd: null,
    b2b_price_dzd: 4500,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    low_stock_threshold: 5,
    weight_grams: 55,
    dimensions_cm: { length: 8, width: 6, height: 1 },
    is_demo: true,
    brands: {
      id: '8347f2eb-339e-4a5e-b126-9f94697b982c',
      name: 'Samsung',
      slug: 'samsung',
    },
    categories: {
      id: 'eea6122f-dbc8-4519-9ddd-d134c12d1d55',
      name: 'Batteries',
      slug: 'batteries',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    sku: 'DEMO-XIA-RED10-PORT',
    barcode: '613000000003',
    name: '[DEMO] Connecteur de Charge USB-C - Redmi Note 10',
    slug: 'demo-connecteur-charge-redmi-note-10',
    brand_id: '541bbbe1-a693-41e9-b101-b495f8d99e32',
    category_id: '1a833807-7a1b-4054-94e6-01604c260165',
    product_type: 'HIGH_COPY',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: false,
    short_description: 'Nappe connecteur dock de charge USB-C pour Redmi Note 10.',
    description: 'Nappe sous-carte de charge avec microphone intégrée pour tests de commande sandbox.',
    main_image: '/images/products/demo-port-red10.jpg',
    gallery: ['/images/products/demo-port-red10.jpg'],
    cost_price_dzd: 800,
    b2c_price_dzd: 1800,
    b2c_sale_price_dzd: 1500,
    b2b_price_dzd: 1200,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    low_stock_threshold: 5,
    weight_grams: 15,
    dimensions_cm: { length: 6, width: 4, height: 1 },
    is_demo: true,
    brands: {
      id: '541bbbe1-a693-41e9-b101-b495f8d99e32',
      name: 'Xiaomi',
      slug: 'xiaomi',
    },
    categories: {
      id: '1a833807-7a1b-4054-94e6-01604c260165',
      name: 'Connecteurs de Charge',
      slug: 'connecteurs-charge',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    sku: 'DEMO-IP12-BOD',
    barcode: '613000000004',
    name: '[DEMO] Vitre Arrière Verre - iPhone 12 Bleu',
    slug: 'demo-vitre-arriere-iphone-12-bleu',
    brand_id: '223bdc42-272f-4395-88a9-999fba9e1e60',
    category_id: '22ad4371-9406-49b7-b9db-6f467b1ed66a',
    product_type: 'AFTERMARKET',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: false,
    short_description: 'Vitre arrière de remplacement grand trou pour iPhone 12.',
    description: 'Capot arrière en verre trempé bleu pacifique pour démonstration sandbox.',
    main_image: '/images/products/demo-back-ip12.jpg',
    gallery: ['/images/products/demo-back-ip12.jpg'],
    cost_price_dzd: 1100,
    b2c_price_dzd: 2400,
    b2c_sale_price_dzd: null,
    b2b_price_dzd: 1900,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    low_stock_threshold: 5,
    weight_grams: 30,
    dimensions_cm: { length: 14, width: 7, height: 1 },
    is_demo: true,
    brands: {
      id: '223bdc42-272f-4395-88a9-999fba9e1e60',
      name: 'Apple',
      slug: 'apple',
    },
    categories: {
      id: '22ad4371-9406-49b7-b9db-6f467b1ed66a',
      name: 'Vitres & Châssis',
      slug: 'vitres-chassis',
    },
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    sku: 'DEMO-TOOL-SET16',
    barcode: '613000000005',
    name: '[DEMO] Kit Tournevis de Précision 16-en-1',
    slug: 'demo-kit-tournevis-precision-16-en-1',
    brand_id: '1e2ed1d0-9f20-4ac4-b86e-35c23ef20d36',
    category_id: '6ca67417-6421-4f93-b68e-0f31a26d70d2',
    product_type: 'ACCESSORY',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: true,
    short_description: 'Set doutillage complet pour démontage smartphones et tablettes.',
    description: 'Ensemble magnétique en acier S2 avec embouts pentalobe, tri-wing, torx et cruciforme.',
    main_image: '/images/products/demo-tools-16.jpg',
    gallery: ['/images/products/demo-tools-16.jpg'],
    cost_price_dzd: 1800,
    b2c_price_dzd: 3800,
    b2c_sale_price_dzd: 3200,
    b2b_price_dzd: 2800,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    low_stock_threshold: 5,
    weight_grams: 180,
    dimensions_cm: { length: 18, width: 10, height: 3 },
    is_demo: true,
    brands: {
      id: '1e2ed1d0-9f20-4ac4-b86e-35c23ef20d36',
      name: 'Oppo',
      slug: 'oppo',
    },
    categories: {
      id: '6ca67417-6421-4f93-b68e-0f31a26d70d2',
      name: 'Outils & Consommables',
      slug: 'outils-consommables',
    },
  },
];
