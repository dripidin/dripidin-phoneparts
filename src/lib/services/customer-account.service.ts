// HamzaPhone Customer Identity, Profile & Account Management Service

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserType, B2BStatus, AddressType } from '@/types/database.types';
import type { ProfileUpdateInput, AddressInput } from '@/lib/validation/account.schema';

export interface CustomerContext {
  userId: string;
  email: string;
  fullName: string;
  phone: string | null;
  phoneSecondary: string | null;
  userType: UserType;
  isActive: boolean;
  isB2B: boolean;
  b2bStatus: B2BStatus | 'NONE';
  business?: {
    id: string;
    name: string;
    tradeName: string | null;
    rcNumber: string | null;
    nif: string | null;
    nis: string | null;
    articleImposition: string | null;
    status: B2BStatus;
    tierCode: string;
    creditLimitDzd: number;
    currentBalanceDzd: number;
    wilayaCode: number;
    wilayaName: string;
    communeName: string;
    addressLine: string;
  } | null;
  canAccessWholesalePrices: boolean;
}

export interface CustomerAddressSummary {
  id: string;
  title: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary: string | null;
  addressLine: string;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  postalCode: string | null;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmountDzd: number;
  itemsCount: number;
  wilayaCode: number;
  trackingNumber: string | null;
  createdAt: string;
}

export class CustomerAccountService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  private get db(): any {
    return this.supabase;
  }

  /**
   * Resolve customer identity context, account type, B2B status and wholesale privileges
   */
  async getCustomerContext(userId: string): Promise<CustomerContext | null> {
    const { data: profile, error: profileError } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) return null;

    let b2bStatus: B2BStatus | 'NONE' = 'NONE';
    let businessData: CustomerContext['business'] = null;

    if (profile.user_type === 'B2B') {
      const { data: member } = await this.db
        .from('business_members')
        .select(`
          role_in_business,
          businesses (
            id, name, trade_name, rc_number, nif, nis, article_imposition,
            status, tier_code, credit_limit_dzd, current_balance_dzd,
            wilaya_code, wilaya_name, commune_name, address_line
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();

      const b = member?.businesses;
      if (b) {
        b2bStatus = b.status as B2BStatus;
        businessData = {
          id: b.id,
          name: b.name,
          tradeName: b.trade_name,
          rcNumber: b.rc_number,
          nif: b.nif,
          nis: b.nis,
          articleImposition: b.article_imposition,
          status: b.status,
          tierCode: b.tier_code || 'TIER_1',
          creditLimitDzd: Number(b.credit_limit_dzd) || 0,
          currentBalanceDzd: Number(b.current_balance_dzd) || 0,
          wilayaCode: b.wilaya_code || 16,
          wilayaName: b.wilaya_name || 'Alger',
          communeName: b.commune_name || 'Belfort',
          addressLine: b.address_line,
        };
      } else {
        b2bStatus = 'PENDING';
      }
    }

    const canAccessWholesalePrices = profile.user_type === 'B2B' && b2bStatus === 'APPROVED';

    return {
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name || '',
      phone: profile.phone,
      phoneSecondary: profile.phone_secondary,
      userType: profile.user_type,
      isActive: profile.is_active,
      isB2B: profile.user_type === 'B2B',
      b2bStatus,
      business: businessData,
      canAccessWholesalePrices,
    };
  }

  /**
   * Update customer profile info
   */
  async updateProfile(userId: string, input: ProfileUpdateInput) {
    const { data, error } = await this.db
      .from('profiles')
      .update({
        full_name: input.fullName,
        phone: input.phone || null,
        phone_secondary: input.phoneSecondary || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(`Échec de la mise à jour du profil: ${error.message}`);
    return data;
  }

  /**
   * List saved addresses for authenticated user
   */
  async getAddresses(userId: string): Promise<CustomerAddressSummary[]> {
    const { data, error } = await this.db
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erreur de chargement des adresses: ${error.message}`);

    return (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      recipientName: a.recipient_name,
      recipientPhone: a.recipient_phone,
      recipientPhoneSecondary: a.recipient_phone_secondary,
      addressLine: a.address_line,
      wilayaCode: a.wilaya_code,
      wilayaName: a.wilaya_name,
      communeName: a.commune_name,
      postalCode: a.postal_code,
      addressType: a.address_type,
      isDefault: a.is_default,
      createdAt: a.created_at,
    }));
  }

  /**
   * Save a new address with default logic
   */
  async createAddress(userId: string, input: AddressInput): Promise<CustomerAddressSummary> {
    // Check if user has any existing addresses
    const { count } = await this.db
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isFirstAddress = (count || 0) === 0;
    const shouldBeDefault = input.isDefault || isFirstAddress;

    if (shouldBeDefault) {
      // Unset previous defaults
      await this.db
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.db
      .from('addresses')
      .insert({
        user_id: userId,
        title: input.title,
        recipient_name: input.recipientName,
        recipient_phone: input.recipientPhone,
        recipient_phone_secondary: input.recipientPhoneSecondary || null,
        address_line: input.addressLine,
        wilaya_code: input.wilayaCode,
        wilaya_name: input.wilayaName,
        commune_name: input.communeName,
        postal_code: input.postalCode || null,
        address_type: input.addressType,
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (error) throw new Error(`Impossible d'enregistrer l'adresse: ${error.message}`);

    return {
      id: data.id,
      title: data.title,
      recipientName: data.recipient_name,
      recipientPhone: data.recipient_phone,
      recipientPhoneSecondary: data.recipient_phone_secondary,
      addressLine: data.address_line,
      wilayaCode: data.wilaya_code,
      wilayaName: data.wilaya_name,
      communeName: data.commune_name,
      postalCode: data.postal_code,
      addressType: data.address_type,
      isDefault: data.is_default,
      createdAt: data.created_at,
    };
  }

  /**
   * Update existing address with ownership check
   */
  async updateAddress(userId: string, addressId: string, input: AddressInput): Promise<CustomerAddressSummary> {
    // Verify ownership
    const { data: existing, error: checkError } = await this.db
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      throw new Error('Adresse introuvable ou non autorisée');
    }

    if (input.isDefault) {
      await this.db
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await this.db
      .from('addresses')
      .update({
        title: input.title,
        recipient_name: input.recipientName,
        recipient_phone: input.recipientPhone,
        recipient_phone_secondary: input.recipientPhoneSecondary || null,
        address_line: input.addressLine,
        wilaya_code: input.wilayaCode,
        wilaya_name: input.wilayaName,
        commune_name: input.communeName,
        postal_code: input.postalCode || null,
        address_type: input.addressType,
        is_default: input.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(`Échec de modification de l'adresse: ${error.message}`);

    return {
      id: data.id,
      title: data.title,
      recipientName: data.recipient_name,
      recipientPhone: data.recipient_phone,
      recipientPhoneSecondary: data.recipient_phone_secondary,
      addressLine: data.address_line,
      wilayaCode: data.wilaya_code,
      wilayaName: data.wilaya_name,
      communeName: data.commune_name,
      postalCode: data.postal_code,
      addressType: data.address_type,
      isDefault: data.is_default,
      createdAt: data.created_at,
    };
  }

  /**
   * Delete address and reassign default if needed
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const { data: address, error: checkError } = await this.db
      .from('addresses')
      .select('id, is_default')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (checkError || !address) {
      throw new Error('Adresse introuvable ou non autorisée');
    }

    const { error } = await this.db
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw new Error(`Erreur lors de la suppression de l'adresse: ${error.message}`);

    // If deleted address was default, set another address as default
    if (address.is_default) {
      const { data: nextAddress } = await this.db
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (nextAddress) {
        await this.db
          .from('addresses')
          .update({ is_default: true })
          .eq('id', nextAddress.id);
      }
    }
  }

  /**
   * Set target address as default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const { data: existing, error: checkError } = await this.db
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existing) {
      throw new Error('Adresse introuvable ou non autorisée');
    }

    await this.db
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    await this.db
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);
  }

  /**
   * List customer orders scoped to authenticated user ID
   */
  async getOrders(userId: string): Promise<CustomerOrderSummary[]> {
    const { data, error } = await this.db
      .from('orders')
      .select(`
        id, order_number, status, payment_status, payment_method,
        total_dzd, wilaya_code, tracking_number, created_at,
        order_items (id)
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erreur de chargement des commandes: ${error.message}`);

    return (data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      totalAmountDzd: Number(o.total_dzd || 0),
      itemsCount: Array.isArray(o.order_items) ? o.order_items.length : 1,
      wilayaCode: o.wilaya_code,
      trackingNumber: o.tracking_number,
      createdAt: o.created_at,
    }));
  }

  /**
   * Get single order details with item breakdown strictly scoped to owner
   */
  async getOrderById(userId: string, orderId: string) {
    const { data: order, error: orderError } = await this.db
      .from('orders')
      .select(`
        *,
        order_items (
          id, product_id, product_name, sku, unit_price_dzd, quantity,
          total_price_dzd, products (main_image, slug)
        )
      `)
      .eq('id', orderId)
      .eq('customer_id', userId)
      .single();

    if (orderError || !order) {
      return null;
    }

    const items = (order.order_items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      sku: item.sku,
      unitPriceDzd: Number(item.unit_price_dzd),
      quantity: item.quantity,
      totalPriceDzd: Number(item.total_price_dzd),
      mainImage: item.products?.main_image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=120&q=80',
      slug: item.products?.slug || '',
    }));

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      subtotalDzd: Number(order.subtotal_dzd || order.total_dzd),
      shippingCostDzd: Number(order.shipping_cost_dzd || 0),
      discountAmountDzd: Number(order.discount_dzd || 0),
      totalAmountDzd: Number(order.total_dzd || 0),
      wilayaCode: order.wilaya_code,
      wilayaName: order.wilaya_name,
      shippingAddress: {
        recipient_name: order.recipient_name,
        recipient_phone: order.recipient_phone,
        address_line: order.shipping_address_line,
        commune_name: order.commune_name,
      },
      trackingNumber: order.tracking_number,
      notes: order.customer_notes,
      createdAt: order.created_at,
      items,
    };
  }

  /**
   * Get B2B Wholesale Pricing List
   * STRICT SECURITY GUARD: Only accessible if business status is APPROVED!
   */
  async getB2BPricingList(userId: string) {
    const context = await this.getCustomerContext(userId);
    if (!context || !context.canAccessWholesalePrices || !context.business) {
      throw new Error('Accès refusé : la grille tarifaire grossiste est réservée aux comptes B2B approuvés.');
    }

    const tierCode = context.business.tierCode;

    // Fetch active products with tier prices
    const { data: products, error } = await this.db
      .from('products')
      .select(`
        id, sku, name, slug, main_image, b2c_price_dzd, b2b_price_dzd,
        available_stock, brands (name), categories (name),
        b2b_tier_prices (tier_code, tier_price_dzd, min_quantity)
      `)
      .eq('status', 'ACTIVE')
      .eq('is_visible', true)
      .order('name');

    if (error) throw new Error(`Erreur lors du chargement des tarifs B2B: ${error.message}`);

    return (products || []).map((p: any) => {
      const tierOverride = (p.b2b_tier_prices || []).find((t: any) => t.tier_code === tierCode);
      const b2bPrice = tierOverride ? Number(tierOverride.tier_price_dzd) : Number(p.b2b_price_dzd);
      const b2cPrice = Number(p.b2c_price_dzd);
      const savingsDzd = Math.max(0, b2cPrice - b2bPrice);
      const savingsPercent = b2cPrice > 0 ? Math.round((savingsDzd / b2cPrice) * 100) : 0;

      return {
        id: p.id,
        productId: p.id,
        sku: p.sku,
        productName: p.name,
        slug: p.slug,
        mainImage: p.main_image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=120&q=80',
        brandName: p.brands?.name || 'Générique',
        categoryName: p.categories?.name || 'Pièce détachée',
        b2cPriceDzd: b2cPrice,
        b2bPriceDzd: b2bPrice,
        savingsDzd,
        savingsPercent,
        minQuantity: tierOverride ? tierOverride.min_quantity : 1,
        availableStock: p.available_stock || 0,
      };
    });
  }
}
