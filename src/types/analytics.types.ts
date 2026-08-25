// HamzaPhone Analytics & Business Intelligence Domain Types

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsFilterParams {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  customerType?: 'ALL' | 'B2C' | 'B2B';
  brandId?: string;
  categoryId?: string;
  wilayaCode?: number;
  courierCode?: string;
}

export interface SalesMetrics {
  grossSalesDzd: number;
  netSalesDzd: number;
  deliveryRevenueDzd: number;
  discountsDzd: number;
  refundedDzd: number;
  codCollectedDzd: number;
  codOutstandingDzd: number;
  reconciledDzd: number;
  // Shielded for staff lacking pricing.read
  costOfGoodsSoldDzd?: number | null;
  grossMarginDzd?: number | null;
  grossMarginPercentage?: number | null;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingCount: number;
  confirmedCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  failedCount: number;
  cancellationRate: number;
  returnRate: number;
  fulfillmentRate: number;
  averageOrderValueDzd: number;
  averageItemsPerOrder: number;
}

export interface ProductPerformanceItem {
  productId: string;
  sku: string;
  name: string;
  brandName: string;
  categoryName: string;
  viewsCount: number;
  cartAdditionsCount: number;
  purchasesCount: number;
  unitsSold: number;
  revenueDzd: number;
  conversionRate: number;
  currentStock: number;
}

export interface ProductAnalytics {
  topSellers: ProductPerformanceItem[];
  lowSellers: ProductPerformanceItem[];
  highRevenue: ProductPerformanceItem[];
  lowConversion: ProductPerformanceItem[];
  cartAbandonedProducts: ProductPerformanceItem[];
}

export interface CustomerSegmentMetrics {
  totalCustomers: number;
  b2cCustomersCount: number;
  b2bCustomersCount: number;
  newCustomersCount: number;
  activeCustomersCount: number;
  returningCustomersCount: number;
  repeatPurchaseRate: number;
  averageCustomerValueDzd: number;
}

export interface CustomerCohortStats {
  customerCount: number;
  orderCount: number;
  revenueDzd: number;
  aovDzd: number;
  itemsPerOrderAvg: number;
  cancellationRate: number;
  returnRate: number;
}

export interface B2CvsB2BComparison {
  b2c: CustomerCohortStats;
  b2b: CustomerCohortStats;
  b2bRevenueSharePercentage: number;
}

export interface InventoryAnalytics {
  totalStockUnits: number;
  availableStockUnits: number;
  reservedStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  turnoverRatio: number;
  // Shielded if lacking pricing.read
  totalStockValueRetailDzd: number;
  totalStockValueCostDzd?: number | null;
  fastMoving: ProductPerformanceItem[];
  slowMoving: ProductPerformanceItem[];
}

export interface WilayaDeliveryStat {
  wilayaCode: number;
  wilayaName: string;
  shipmentsCount: number;
  deliveredCount: number;
  failedCount: number;
  totalRevenueDzd: number;
  successRate: number;
}

export interface DeliveryAnalytics {
  totalShipments: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  deliverySuccessRate: number;
  averageDeliveryHours: number;
  domicileShipmentsCount: number;
  stopdeskShipmentsCount: number;
  domicilePercentage: number;
  wilayaDistribution: WilayaDeliveryStat[];
}

export interface PaymentAnalytics {
  codExpectedDzd: number;
  codCollectedDzd: number;
  codRemittedDzd: number;
  reconciledDzd: number;
  unreconciledDzd: number;
  discrepancyDzd: number;
  collectionRate: number;
  remittanceRate: number;
  discrepancyRate: number;
}

export interface SearchQueryStat {
  query: string;
  normalizedQuery: string;
  searchCount: number;
  resultCountAvg: number;
  clicksCount: number;
  purchasesCount: number;
  conversionRate: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  topSearches: SearchQueryStat[];
  noResultSearches: SearchQueryStat[];
  highIntentSearches: SearchQueryStat[];
}

export interface FunnelStep {
  name: string;
  count: number;
  percentageFromFirst: number;
  percentageFromPrevious: number;
}

export interface ConversionFunnel {
  productViews: number;
  cartAdditions: number;
  checkoutStarted: number;
  ordersCreated: number;
  ordersDelivered: number;
  steps: FunnelStep[];
  overallConversionRate: number;
}

export interface AnalyticsOverviewReport {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  timezone: string;
  sales: SalesMetrics;
  orders: OrderMetrics;
  products: ProductAnalytics;
  customers: CustomerSegmentMetrics;
  comparison: B2CvsB2BComparison;
  inventory: InventoryAnalytics;
  delivery: DeliveryAnalytics;
  payments: PaymentAnalytics;
  search: SearchAnalytics;
  funnel: ConversionFunnel;
}

export type AnalyticsEventType =
  | 'product_viewed'
  | 'search_performed'
  | 'search_result_clicked'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_created'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_returned';

export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  userId?: string | null;
  userType?: 'B2C' | 'B2B' | 'ANONYMOUS';
  sessionId?: string | null;
  productId?: string | null;
  searchQuery?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}
