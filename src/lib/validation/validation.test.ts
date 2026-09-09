// Unit tests for Zod Validation Schemas across all HamzaPhone domains

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  LoginSchema,
  RegisterB2BSchema,
  CreateProductSchema,
  InventoryAdjustmentSchema,
  BulkPriceAdjustmentSchema,
  CheckoutOrderSchema,
  ApproveB2BApplicationSchema,
  ImportRowSchema,
} from './index';

describe('Validation Schemas', () => {
  describe('Auth Validation', () => {
    it('should validate correct B2B registration data', () => {
      const validB2B = {
        email: 'repair.shop@gmail.com',
        password: 'SecurePassword123!',
        fullName: 'Karim Brahimi',
        phone: '0550123456',
        companyName: 'Atelier Phone Express',
        rcNumber: '16/00-1234567B20',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Sidi M\'Hamed',
        addressLine: '12 Rue Didouche Mourad',
      };

      const result = RegisterB2BSchema.safeParse(validB2B);
      assert.strictEqual(result.success, true);
    });

    it('should sanitize and accept Algerian phone with international prefix and spaces', () => {
      const formattedPhoneB2B = {
        email: 'repair.shop@gmail.com',
        password: 'SecurePassword123!',
        fullName: 'Karim Brahimi',
        phone: '+213 550 12 34 56',
        companyName: 'Atelier Phone Express',
        rcNumber: '16/00-1234567B20',
        wilayaCode: 16,
        wilayaName: 'Alger',
        communeName: 'Sidi M\'Hamed',
        addressLine: '12 Rue Didouche Mourad',
      };

      const result = RegisterB2BSchema.safeParse(formattedPhoneB2B);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.phone, '0550123456');
      }
    });
  });

  describe('Product Validation', () => {
    it('should validate valid smartphone replacement product with structured compatibility', () => {
      const validProduct = {
        sku: 'HP-SCR-SAM-S21U-OLED',
        barcode: '6934177724123',
        supplierSku: 'GH82-26031A',
        name: 'Écran OLED Samsung Galaxy S21 Ultra Original Service Pack',
        slug: 'ecran-oled-samsung-s21-ultra',
        brandId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        productType: 'SERVICE_PACK',
        status: 'ACTIVE',
        isVisible: true,
        isFeatured: true,
        shortDescription: 'Écran AMOLED 120Hz Dynamic 2X',
        mainImage: 'https://cdn.hamzaphone.dz/products/s21u-screen.webp',
        gallery: ['https://cdn.hamzaphone.dz/products/s21u-back.webp'],
        costPriceDzd: 22000.0,
        b2cPriceDzd: 28500.0,
        b2cSalePriceDzd: 27000.0,
        b2bPriceDzd: 24500.0,
        stockQuantity: 15,
        lowStockThreshold: 3,
        weightGrams: 75.0,
        compatibility: [
          {
            brandName: 'Samsung',
            brandSlug: 'samsung',
            modelName: 'Galaxy S21 Ultra 5G',
            modelSlug: 'galaxy-s21-ultra',
            modelCode: 'SM-G998',
            variants: ['SM-G998B', 'SM-G998U', 'SM-G9980'],
            year: 2021,
          },
        ],
      };

      const result = CreateProductSchema.safeParse(validProduct);
      assert.strictEqual(result.success, true);
    });

    it('should accept relative catalog image paths and omitted slug for product creation', () => {
      const productWithRelativePath = {
        sku: 'HP-SAM-SCR-99999',
        name: 'Écran OLED Samsung Galaxy S22 Ultra',
        brandId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        productType: 'OEM_ORIGINAL',
        status: 'ACTIVE',
        mainImage: '/catalog-images/products/22180/main.jpg',
        costPriceDzd: 18000.0,
        b2cPriceDzd: 25000.0,
        b2bPriceDzd: 21000.0,
        stockQuantity: 10,
        lowStockThreshold: 2,
        weightGrams: 60.0,
      };

      const result = CreateProductSchema.safeParse(productWithRelativePath);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.mainImage, '/catalog-images/products/22180/main.jpg');
        assert.strictEqual(result.data.slug, undefined);
      }
    });

    it('should reject invalid image path formats', () => {
      const invalidProduct = {
        sku: 'HP-SAM-SCR-88888',
        name: 'Écran Test Invalide',
        brandId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        productType: 'OEM_ORIGINAL',
        mainImage: 'invalid_image_without_prefix',
        costPriceDzd: 1000,
        b2cPriceDzd: 2000,
        b2bPriceDzd: 1500,
      };

      const result = CreateProductSchema.safeParse(invalidProduct);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Inventory Adjustment Validation', () => {
    it('should reject quantity change of 0', () => {
      const invalidAdj = {
        productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        transactionType: 'MANUAL_ADJUSTMENT',
        quantityChange: 0,
      };

      const result = InventoryAdjustmentSchema.safeParse(invalidAdj);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Bulk Pricing Validation', () => {
    it('should validate bulk percentage price adjustment with rounding', () => {
      const validAdjustment = {
        scope: 'BRAND',
        scopeTargetId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        targetField: 'B2B_PRICE',
        percentageChange: 8.5,
        roundingUnitDzd: 10,
        justification: 'Ajustement suite à hausse tarifaire fournisseur Shenzhen',
      };

      const result = BulkPriceAdjustmentSchema.safeParse(validAdjustment);
      assert.strictEqual(result.success, true);
    });
  });

  describe('Order & Checkout Validation', () => {
    it('should validate Algerian 58-Wilaya checkout payload', () => {
      const validCheckout = {
        recipientName: 'Ali Hamidi',
        recipientPhone: '0661998877',
        shippingAddressLine: 'Cité 500 Logements, Bâtiment B, N° 14',
        wilayaCode: 31,
        wilayaName: 'Oran',
        communeName: 'Bir El Djir',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [
          {
            productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            quantity: 2,
          },
        ],
      };

      const result = CheckoutOrderSchema.safeParse(validCheckout);
      assert.strictEqual(result.success, true);
    });

    it('should reject invalid Wilaya code outside 1..58', () => {
      const invalidWilaya = {
        recipientName: 'Ali Hamidi',
        recipientPhone: '0661998877',
        shippingAddressLine: 'Address',
        wilayaCode: 99, // Invalid
        wilayaName: 'Invalid',
        communeName: 'Invalid',
        deliveryType: 'HOME',
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }],
      };

      const result = CheckoutOrderSchema.safeParse(invalidWilaya);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Import Row Validation', () => {
    it('should coerce and parse CSV spreadsheet import row', () => {
      const rawCsvRow = {
        sku: 'HP-BAT-IPH13-OEM',
        name: 'Batterie iPhone 13 Original 3227mAh',
        brand_name: 'Apple',
        category_name: 'Batteries',
        product_type: 'OEM_ORIGINAL',
        cost_price_dzd: '4200.00',
        b2c_price_dzd: '6500.00',
        b2b_price_dzd: '5200.00',
        stock_quantity: '25',
        low_stock_threshold: '5',
        weight_grams: '45',
      };

      const result = ImportRowSchema.safeParse(rawCsvRow);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.cost_price_dzd, 4200);
        assert.strictEqual(result.data.stock_quantity, 25);
      }
    });
  });
});
