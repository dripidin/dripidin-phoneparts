// HamzaPhone B2B Wholesale Service: Business Application Review, Tier Assignment, Credit Limits

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, B2BStatus, UserType } from '@/types/database.types';

export interface B2BApprovalInput {
  businessId: string;
  status: B2BStatus;
  tierCode: string;
  creditLimitDzd: number;
  paymentTerms: 'CASH_ON_DELIVERY' | 'NET_30' | 'PREPAID';
  rejectionReason?: string;
  reviewerId: string;
}

export class B2BService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Fetch all pending B2B applications with tax credentials (RC, NIF, NIS)
   */
  async getPendingApplications() {
    const { data, error } = await this.supabase
      .from('businesses')
      .select(`
        id,
        name,
        trade_name,
        rc_number,
        nif,
        nis,
        wilaya_name,
        commune_name,
        phone,
        email,
        status,
        document_urls,
        created_at
      `)
      .eq('status', 'PENDING');

    if (error) throw new Error(`Failed to fetch pending B2B applications: ${error.message}`);
    return data || [];
  }

  /**
   * Review and Approve / Reject a B2B repair shop application
   */
  async reviewApplication(input: B2BApprovalInput) {
    const { data: business, error: updateError } = await (this.supabase
      .from('businesses') as any)
      .update({
        status: input.status,
        tier_code: input.tierCode,
        credit_limit_dzd: input.creditLimitDzd,
        payment_terms: input.paymentTerms,
        notes: input.rejectionReason || null,
        verified_at: new Date().toISOString(),
        verified_by: input.reviewerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.businessId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update B2B business status: ${updateError.message}`);
    }

    // Update user profile status if approved
    if (input.status === 'APPROVED') {
      const { data: member } = await (this.supabase
        .from('business_members') as any)
        .select('user_id')
        .eq('business_id', input.businessId)
        .eq('is_primary_contact', true)
        .single();

      if (member) {
        await (this.supabase
          .from('profiles') as any)
          .update({ user_type: 'B2B' as UserType })
          .eq('id', (member as any).user_id);
      }
    }

    return business;
  }
}
