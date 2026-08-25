// Zod Validation Schemas for B2B Business Onboarding, Verification & Terms

import { z } from 'zod';

export const ApproveB2BApplicationSchema = z.object({
  businessId: z.string().uuid(),
  tierCode: z.string().default('TIER_1'),
  creditLimitDzd: z.number().min(0).default(0.0),
  paymentTerms: z.enum(['CASH_ON_DELIVERY', 'NET_30', 'PREPAID']).default('CASH_ON_DELIVERY'),
  notes: z.string().max(500).optional(),
});

export const RejectB2BApplicationSchema = z.object({
  businessId: z.string().uuid(),
  rejectionReason: z.string().min(5, 'Une raison de rejet détaillée est requise'),
});

export const UpdateB2BTermsSchema = z.object({
  businessId: z.string().uuid(),
  tierCode: z.string().optional(),
  creditLimitDzd: z.number().min(0).optional(),
  paymentTerms: z.enum(['CASH_ON_DELIVERY', 'NET_30', 'PREPAID']).optional(),
  notes: z.string().optional(),
});

export type ApproveB2BApplicationInput = z.infer<typeof ApproveB2BApplicationSchema>;
export type RejectB2BApplicationInput = z.infer<typeof RejectB2BApplicationSchema>;
export type UpdateB2BTermsInput = z.infer<typeof UpdateB2BTermsSchema>;
