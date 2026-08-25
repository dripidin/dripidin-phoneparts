// HamzaPhone Domain Interfaces & Business DTOs

import type {
  ProductType,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryType,
  DeliveryStatus,
  InventoryTransactionType,
  UserType,
  B2BStatus,
  AddressType,
} from './database.types';

export interface DeviceCompatibilityItem {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  modelCode: string;
  variants: string[];
  year?: number;
  notes?: string;
}

export interface ProductDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ProductSummary {
  id: string;
  sku: string;
  barcode: string | null;
  supplierSku: string | null;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  productType: ProductType;
  status: ProductStatus;
  isVisible: boolean;
  isFeatured: boolean;
  mainImage: string;
  costPriceDzd: number;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  b2bPriceDzd: number;
  stockQuantity: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  compatibility: DeviceCompatibilityItem[];
}

export interface PriceResolutionContext {
  userId?: string | null;
  businessId?: string | null;
  tierCode?: string | null;
  quantity: number;
}

export interface ResolvedPrice {
  unitPriceDzd: number;
  originalPriceDzd: number;
  discountPercentage: number;
  pricingTierApplied: 'CUSTOM_CONTRACT' | 'VOLUME_BREAK' | 'B2B_TIER' | 'B2B_BASE' | 'B2C_SALE' | 'B2C_RETAIL';
  savingsDzd: number;
}

export interface InventoryAdjustmentInput {
  productId: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  referenceType?: string;
  referenceId?: string;
  warehouseBin?: string;
  notes?: string;
}

export interface BulkPriceAdjustmentInput {
  scope: 'ALL' | 'SUPPLIER' | 'BRAND' | 'CATEGORY' | 'SELECTED_SKUS';
  scopeTargetId?: string;
  selectedSkus?: string[];
  targetField: 'B2C_PRICE' | 'B2B_PRICE' | 'BOTH';
  percentageChange: number; // e.g. +10 or -5
  roundingUnitDzd: 10 | 50 | 100;
  allowBelowCostOverride?: boolean;
  justification?: string;
}

export interface BulkPricePreviewItem {
  productId: string;
  sku: string;
  name: string;
  costPriceDzd: number;
  oldB2cPriceDzd: number;
  newB2cPriceDzd: number;
  oldB2bPriceDzd: number;
  newB2bPriceDzd: number;
  marginPercentage: number;
  isBelowCostWarning: boolean;
}

export interface CreateOrderInput {
  customerId?: string | null;
  businessId?: string | null;
  isGuest: boolean;
  customerType: UserType;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary?: string;
  shippingAddressLine: string;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  deliveryType: DeliveryType;
  stopdeskCode?: string;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}
