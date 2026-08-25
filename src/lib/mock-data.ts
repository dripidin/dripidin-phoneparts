// Seed and Mock Data for HamzaPhone Admin Dashboard

import type {
  ProductType,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryType,
  B2BStatus,
  InventoryTransactionType,
} from '@/types/database.types';
import type { DeviceCompatibilityItem } from '@/types/domain.types';

export interface AdminProduct {
  id: string;
  sku: string;
  barcode: string | null;
  supplierSku: string | null;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  productType: ProductType;
  status: ProductStatus;
  isVisible: boolean;
  isFeatured: boolean;
  shortDescription: string;
  description: string;
  mainImage: string;
  gallery: string[];
  costPriceDzd: number;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  b2bPriceDzd: number;
  stockQuantity: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  weightGrams: number;
  compatibility: DeviceCompatibilityItem[];
  supplierId: string;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerType: 'B2C' | 'B2B';
  businessName?: string;
  shippingAddress: string;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  deliveryType: DeliveryType;
  subtotalDzd: number;
  shippingCostDzd: number;
  totalDzd: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  courierCode: string;
  items: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPriceDzd: number;
    totalPriceDzd: number;
  }[];
  internalNotes?: string;
  createdAt: string;
}

export interface AdminB2BAccount {
  id: string;
  businessName: string;
  tradeName?: string;
  representativeName: string;
  email: string;
  phone: string;
  rcNumber: string;
  nif?: string;
  nis?: string;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  addressLine: string;
  status: B2BStatus;
  tierCode: string;
  creditLimitDzd: number;
  currentBalanceDzd: number;
  paymentTerms: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface AdminInventoryTx {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  previousReserved: number;
  newReserved: number;
  referenceType: string;
  referenceId: string;
  warehouseBin: string;
  notes: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  timestamp: string;
}

// Initial Mock Brands
export const MOCK_BRANDS = [
  { id: 'b-sam', name: 'Samsung', slug: 'samsung', logoUrl: '/brands/samsung.svg', is_active: true, display_order: 1 },
  { id: 'b-app', name: 'Apple', slug: 'apple', logoUrl: '/brands/apple.svg', is_active: true, display_order: 2 },
  { id: 'b-xia', name: 'Xiaomi', slug: 'xiaomi', logoUrl: '/brands/xiaomi.svg', is_active: true, display_order: 3 },
  { id: 'b-hua', name: 'Huawei', slug: 'huawei', logoUrl: '/brands/huawei.svg', is_active: true, display_order: 4 },
  { id: 'b-opp', name: 'Oppo', slug: 'oppo', logoUrl: '/brands/oppo.svg', is_active: true, display_order: 5 },
  { id: 'b-rea', name: 'Realme', slug: 'realme', logoUrl: '/brands/realme.svg', is_active: true, display_order: 6 },
  { id: 'b-inf', name: 'Infinix', slug: 'infinix', logoUrl: '/brands/infinix.svg', is_active: true, display_order: 7 },
  { id: 'b-tec', name: 'Tecno', slug: 'tecno', logoUrl: '/brands/tecno.svg', is_active: true, display_order: 8 },
];

// Initial Mock Categories
export const MOCK_CATEGORIES = [
  { id: 'c-scr', name: 'Écrans & Afficheurs OLED', slug: 'ecrans-afficheurs', parent_id: null, is_active: true, display_order: 1 },
  { id: 'c-bat', name: 'Batteries Haute Capacité', slug: 'batteries', parent_id: null, is_active: true, display_order: 2 },
  { id: 'c-chg', name: 'Connecteurs de Charge & Nappes', slug: 'connecteurs-charge', parent_id: null, is_active: true, display_order: 3 },
  { id: 'c-cam', name: 'Caméras & Lentilles', slug: 'cameras-lentilles', parent_id: null, is_active: true, display_order: 4 },
  { id: 'c-chs', name: 'Châssis & Vitres Arrières', slug: 'chassis-vitres', parent_id: null, is_active: true, display_order: 5 },
  { id: 'c-ics', name: 'Circuits Intégrés (IC) & Puces', slug: 'circuits-ic', parent_id: null, is_active: true, display_order: 6 },
  { id: 'c-tls', name: 'Outils & Consommables Soudure', slug: 'outils-reparation', parent_id: null, is_active: true, display_order: 7 },
];

// Initial Mock Suppliers
export const MOCK_SUPPLIERS = [
  { id: 'sup-1', name: 'Shenzhen LCD Master Tech', code: 'SUP-SHENZHEN-01', contactPerson: 'Chen Wei', phone: '+86 755 8829 1100', email: 'sales@lcdmaster.cn', country: 'China', leadTimeDays: 14, currency: 'USD', is_active: true },
  { id: 'sup-2', name: 'Guangzhou High Power Battery Co.', code: 'SUP-GZ-BAT-02', contactPerson: 'Lin Zhao', phone: '+86 20 3391 0022', email: 'orders@highpowergz.com', country: 'China', leadTimeDays: 16, currency: 'USD', is_active: true },
  { id: 'sup-3', name: 'Alger Import Pièces Détachées SARL', code: 'SUP-ALGER-03', contactPerson: 'Amine Benali', phone: '0550 44 33 22', email: 'contact@alger-pieces.dz', country: 'Algeria', leadTimeDays: 2, currency: 'DZD', is_active: true },
];

// Initial Mock Products
export const MOCK_PRODUCTS: AdminProduct[] = [
  {
    id: 'prod-001',
    sku: 'HP-SCR-SAM-S21U-SP',
    barcode: '6934177724123',
    supplierSku: 'GH82-26031A',
    name: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack Phantom Black',
    slug: 'ecran-oled-samsung-s21-ultra-service-pack',
    brandId: 'b-sam',
    brandName: 'Samsung',
    categoryId: 'c-scr',
    categoryName: 'Écrans & Afficheurs OLED',
    productType: 'SERVICE_PACK',
    status: 'ACTIVE',
    isVisible: true,
    isFeatured: true,
    shortDescription: 'Écran Dynamic AMOLED 2X 120Hz avec châssis intégré et film d\'origine.',
    description: 'Bloc écran complet Samsung Service Pack certifié d\'origine avec connecteurs flex pré-montés.',
    mainImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
    gallery: [],
    costPriceDzd: 23500,
    b2cPriceDzd: 31000,
    b2cSalePriceDzd: 29500,
    b2bPriceDzd: 26000,
    stockQuantity: 18,
    reservedStock: 2,
    availableStock: 16,
    lowStockThreshold: 4,
    weightGrams: 90,
    compatibility: [
      {
        brandName: 'Samsung',
        brandSlug: 'samsung',
        modelName: 'Galaxy S21 Ultra 5G',
        modelSlug: 'galaxy-s21-ultra',
        modelCode: 'SM-G998',
        variants: ['SM-G998B', 'SM-G998U', 'SM-G998W', 'SM-G9980'],
        year: 2021,
      },
    ],
    supplierId: 'sup-1',
    supplierName: 'Shenzhen LCD Master Tech',
    createdAt: '2026-01-10T09:30:00Z',
    updatedAt: '2026-02-20T14:15:00Z',
  },
  {
    id: 'prod-002',
    sku: 'HP-BAT-IPH13-OEM',
    barcode: '7426892019482',
    supplierSku: 'IP13-BAT-3227',
    name: 'Batterie iPhone 13 3227mAh Haute Capacité avec Puce TI',
    slug: 'batterie-iphone-13-haute-capacite',
    brandId: 'b-app',
    brandName: 'Apple',
    categoryId: 'c-bat',
    categoryName: 'Batteries Haute Capacité',
    productType: 'OEM_ORIGINAL',
    status: 'ACTIVE',
    isVisible: true,
    isFeatured: true,
    shortDescription: 'Cellule Li-ion 0 cycle avec adhésif de fixation inclus.',
    description: 'Batterie certifiée sans message d\'erreur après transfert BMS ou programmateur.',
    mainImage: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    gallery: [],
    costPriceDzd: 3800,
    b2cPriceDzd: 6200,
    b2cSalePriceDzd: null,
    b2bPriceDzd: 4700,
    stockQuantity: 45,
    reservedStock: 5,
    availableStock: 40,
    lowStockThreshold: 8,
    weightGrams: 48,
    compatibility: [
      {
        brandName: 'Apple',
        brandSlug: 'apple',
        modelName: 'iPhone 13',
        modelSlug: 'iphone-13',
        modelCode: 'A2633',
        variants: ['A2482', 'A2631', 'A2634', 'A2635'],
        year: 2021,
      },
    ],
    supplierId: 'sup-2',
    supplierName: 'Guangzhou High Power Battery Co.',
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-02-18T16:00:00Z',
  },
  {
    id: 'prod-003',
    sku: 'HP-CHG-XIA-RN10P',
    barcode: '6971239841029',
    supplierSku: 'XIA-RN10-SUB',
    name: 'Nappe Connecteur de Charge Sub-Board Xiaomi Redmi Note 10 Pro avec IC Charge Rapide 33W',
    slug: 'connecteur-charge-redmi-note-10-pro-ic-33w',
    brandId: 'b-xia',
    brandName: 'Xiaomi',
    categoryId: 'c-chg',
    categoryName: 'Connecteurs de Charge & Nappes',
    productType: 'OEM_ORIGINAL',
    status: 'ACTIVE',
    isVisible: true,
    isFeatured: false,
    shortDescription: 'Circuit sub-board complet avec prise Jack, microphone et support charge rapide.',
    description: 'Composant testé garantissant la détection microphone et la vitesse Turbo Charge Xiaomi.',
    mainImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    gallery: [],
    costPriceDzd: 950,
    b2cPriceDzd: 2200,
    b2cSalePriceDzd: null,
    b2bPriceDzd: 1400,
    stockQuantity: 3,
    reservedStock: 1,
    availableStock: 2, // Low stock triggered
    lowStockThreshold: 5,
    weightGrams: 15,
    compatibility: [
      {
        brandName: 'Xiaomi',
        brandSlug: 'xiaomi',
        modelName: 'Redmi Note 10 Pro',
        modelSlug: 'redmi-note-10-pro',
        modelCode: 'M2101K6G',
        variants: ['M2101K6R'],
        year: 2021,
      },
    ],
    supplierId: 'sup-3',
    supplierName: 'Alger Import Pièces Détachées SARL',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-22T08:30:00Z',
  },
  {
    id: 'prod-004',
    sku: 'HP-SCR-IPH14P-OLED',
    barcode: '7426892099182',
    supplierSku: 'IP14P-JK-OLED',
    name: 'Écran OLED iPhone 14 Pro JK Soft 120Hz ProMotion',
    slug: 'ecran-oled-iphone-14-pro-jk-soft',
    brandId: 'b-app',
    brandName: 'Apple',
    categoryId: 'c-scr',
    categoryName: 'Écrans & Afficheurs OLED',
    productType: 'HIGH_COPY',
    status: 'ACTIVE',
    isVisible: true,
    isFeatured: true,
    shortDescription: 'Dalle Soft OLED haute fidélité avec True Tone et 120Hz.',
    description: 'Technologie Soft OLED garantissant résistance aux chocs et colorimétrie exacte.',
    mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    gallery: [],
    costPriceDzd: 18500,
    b2cPriceDzd: 26000,
    b2cSalePriceDzd: 24900,
    b2bPriceDzd: 21500,
    stockQuantity: 0, // Out of stock
    reservedStock: 0,
    availableStock: 0,
    lowStockThreshold: 3,
    weightGrams: 85,
    compatibility: [
      {
        brandName: 'Apple',
        brandSlug: 'apple',
        modelName: 'iPhone 14 Pro',
        modelSlug: 'iphone-14-pro',
        modelCode: 'A2890',
        variants: ['A2650', 'A2889', 'A2892'],
        year: 2022,
      },
    ],
    supplierId: 'sup-1',
    supplierName: 'Shenzhen LCD Master Tech',
    createdAt: '2026-02-01T15:00:00Z',
    updatedAt: '2026-02-23T11:00:00Z',
  },
  {
    id: 'prod-005',
    sku: 'HP-CAM-SAM-S22-MAIN',
    barcode: '6934177799014',
    supplierSku: 'GH96-14902A',
    name: 'Module Caméra Arrière Principale 50MP Samsung Galaxy S22 5G Original',
    slug: 'camera-arriere-samsung-s22-50mp-original',
    brandId: 'b-sam',
    brandName: 'Samsung',
    categoryId: 'c-cam',
    categoryName: 'Caméras & Lentilles',
    productType: 'OEM_ORIGINAL',
    status: 'ACTIVE',
    isVisible: true,
    isFeatured: false,
    shortDescription: 'Capteur 50MP Dual Pixel avec stabilisation optique OIS.',
    description: 'Module optique d\'origine Samsung testé en laboratoire pour mise au point instantanée.',
    mainImage: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    gallery: [],
    costPriceDzd: 6800,
    b2cPriceDzd: 10500,
    b2cSalePriceDzd: null,
    b2bPriceDzd: 8200,
    stockQuantity: 12,
    reservedStock: 0,
    availableStock: 12,
    lowStockThreshold: 3,
    weightGrams: 20,
    compatibility: [
      {
        brandName: 'Samsung',
        brandSlug: 'samsung',
        modelName: 'Galaxy S22 5G',
        modelSlug: 'galaxy-s22',
        modelCode: 'SM-S901',
        variants: ['SM-S901B', 'SM-S901U', 'SM-S9010'],
        year: 2022,
      },
    ],
    supplierId: 'sup-1',
    supplierName: 'Shenzhen LCD Master Tech',
    createdAt: '2026-02-05T12:00:00Z',
    updatedAt: '2026-02-21T09:00:00Z',
  },
];

// Initial Mock Orders
export const MOCK_ORDERS: AdminOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'HP-2026-004921',
    customerName: 'Yacine Mansouri',
    customerPhone: '0550123456',
    customerType: 'B2B',
    businessName: 'Atelier Phone Master Oran',
    shippingAddress: '45 Boulevard Front de Mer, Maraval',
    wilayaCode: 31,
    wilayaName: 'Oran',
    communeName: 'Oran Centre',
    deliveryType: 'HOME',
    subtotalDzd: 78500,
    shippingCostDzd: 700,
    totalDzd: 79200,
    status: 'READY_FOR_SHIPMENT',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'UNPAID',
    trackingNumber: 'ECO-ORAN-99214',
    courierCode: 'ECOTRACK',
    items: [
      {
        productId: 'prod-001',
        sku: 'HP-SCR-SAM-S21U-SP',
        productName: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack',
        quantity: 2,
        unitPriceDzd: 26000,
        totalPriceDzd: 52000,
      },
      {
        productId: 'prod-002',
        sku: 'HP-BAT-IPH13-OEM',
        productName: 'Batterie iPhone 13 3227mAh Haute Capacité',
        quantity: 5,
        unitPriceDzd: 4700,
        totalPriceDzd: 23500,
      },
      {
        productId: 'prod-003',
        sku: 'HP-CHG-XIA-RN10P',
        productName: 'Nappe Connecteur de Charge Redmi Note 10 Pro',
        quantity: 2,
        unitPriceDzd: 1500,
        totalPriceDzd: 3000,
      },
    ],
    internalNotes: 'Client pro fidèle. Colis fragile emballé sous double bulle.',
    createdAt: '2026-02-23T14:30:00Z',
  },
  {
    id: 'ord-002',
    orderNumber: 'HP-2026-004922',
    customerName: 'Mohamed Belkacem',
    customerPhone: '0661889900',
    customerType: 'B2C',
    shippingAddress: 'Cité 1000 Logements, Bâtiment 4, Appt 12',
    wilayaCode: 16,
    wilayaName: 'Alger',
    communeName: 'Bab Ezzouar',
    deliveryType: 'HOME',
    subtotalDzd: 29500,
    shippingCostDzd: 500,
    totalDzd: 30000,
    status: 'CONFIRMED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'UNPAID',
    courierCode: 'ECOTRACK',
    items: [
      {
        productId: 'prod-001',
        sku: 'HP-SCR-SAM-S21U-SP',
        productName: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack',
        quantity: 1,
        unitPriceDzd: 29500,
        totalPriceDzd: 29500,
      },
    ],
    internalNotes: 'Appel de confirmation passé avec succès.',
    createdAt: '2026-02-24T05:45:00Z',
  },
  {
    id: 'ord-003',
    orderNumber: 'HP-2026-004919',
    customerName: 'Kamel Zerrouki',
    customerPhone: '0770334455',
    customerType: 'B2C',
    shippingAddress: 'Agence EcoTrack Sétif Ville (Stop Desk)',
    wilayaCode: 19,
    wilayaName: 'Sétif',
    communeName: 'Sétif',
    deliveryType: 'DESK',
    subtotalDzd: 6200,
    shippingCostDzd: 400,
    totalDzd: 6600,
    status: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PAID',
    trackingNumber: 'ECO-SETIF-8812',
    courierCode: 'ECOTRACK',
    items: [
      {
        productId: 'prod-002',
        sku: 'HP-BAT-IPH13-OEM',
        productName: 'Batterie iPhone 13 3227mAh Haute Capacité',
        quantity: 1,
        unitPriceDzd: 6200,
        totalPriceDzd: 6200,
      },
    ],
    createdAt: '2026-02-21T08:15:00Z',
  },
];

// Initial Mock B2B Accounts
export const MOCK_B2B_ACCOUNTS: AdminB2BAccount[] = [
  {
    id: 'b2b-001',
    businessName: 'Atelier Phone Master Oran',
    tradeName: 'Phone Master Tech',
    representativeName: 'Yacine Mansouri',
    email: 'contact@phonemaster-oran.dz',
    phone: '0550123456',
    rcNumber: '31/00-098231B21',
    nif: '002131000982315',
    nis: '198200310029',
    wilayaCode: 31,
    wilayaName: 'Oran',
    communeName: 'Oran Centre',
    addressLine: '45 Boulevard Front de Mer, Maraval',
    status: 'APPROVED',
    tierCode: 'TIER_2',
    creditLimitDzd: 150000,
    currentBalanceDzd: 45000,
    paymentTerms: 'NET_30',
    verifiedAt: '2026-01-05T10:00:00Z',
    verifiedBy: 'Admin Principal',
    notes: 'Boutique certifiée avec 3 techniciens à plein temps.',
    createdAt: '2026-01-04T12:00:00Z',
  },
  {
    id: 'b2b-002',
    businessName: 'Clinique du Smartphone Constantine',
    tradeName: 'Smart Clinic 25',
    representativeName: 'Rachid Mebarki',
    email: 'rachid.smart25@gmail.com',
    phone: '0662334455',
    rcNumber: '25/00-881239A22',
    nif: '002125008812391',
    wilayaCode: 25,
    wilayaName: 'Constantine',
    communeName: 'Constantine Centre',
    addressLine: '14 Rue Larbi Ben M\'Hidi',
    status: 'PENDING',
    tierCode: 'TIER_1',
    creditLimitDzd: 0,
    currentBalanceDzd: 0,
    paymentTerms: 'CASH_ON_DELIVERY',
    notes: 'Dossier d\'inscription soumis avec scan du Registre de Commerce.',
    createdAt: '2026-02-23T16:20:00Z',
  },
];

// Initial Mock Inventory Transactions
export const MOCK_INVENTORY_TXS: AdminInventoryTx[] = [
  {
    id: 'tx-001',
    productId: 'prod-001',
    productSku: 'HP-SCR-SAM-S21U-SP',
    productName: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack',
    transactionType: 'RECEIVING',
    quantityChange: 20,
    previousStock: 0,
    newStock: 20,
    previousReserved: 0,
    newReserved: 0,
    referenceType: 'PURCHASE_ORDER',
    referenceId: 'PO-2026-SHENZHEN-01',
    warehouseBin: 'Bin A-04-1',
    notes: 'Réception cargaison Shenzhen par fret aérien',
    createdAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'tx-002',
    productId: 'prod-001',
    productSku: 'HP-SCR-SAM-S21U-SP',
    productName: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack',
    transactionType: 'RESERVATION',
    quantityChange: 2,
    previousStock: 20,
    newStock: 20,
    previousReserved: 0,
    newReserved: 2,
    referenceType: 'ORDER',
    referenceId: 'HP-2026-004921',
    warehouseBin: 'Bin A-04-1',
    notes: 'Réservation commande B2B Phone Master',
    createdAt: '2026-02-23T14:30:00Z',
  },
];

// Initial Mock Audit Logs
export const MOCK_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-001',
    actorEmail: 'admin@hamzaphone.dz',
    actorRole: 'OWNER',
    action: 'PRICING.BULK_ADJUST',
    entityType: 'PRICING',
    entityId: 'ALL_PRODUCTS',
    oldValues: { scope: 'ALL', target: 'B2B_PRICE' },
    newValues: { percentageChange: '+5%', roundedUnit: '10 DZD', totalAffected: 4200 },
    timestamp: '2026-02-22T18:00:00Z',
  },
  {
    id: 'log-002',
    actorEmail: 'sales@hamzaphone.dz',
    actorRole: 'SALES_MANAGER',
    action: 'B2B.APPROVE',
    entityType: 'BUSINESS',
    entityId: 'b2b-001',
    oldValues: { status: 'PENDING' },
    newValues: { status: 'APPROVED', tier: 'TIER_2', creditLimit: '150,000 DZD' },
    timestamp: '2026-01-05T10:00:00Z',
  },
];
