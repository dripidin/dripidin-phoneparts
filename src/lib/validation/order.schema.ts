// Zod Validation Schemas for Orders, Checkout & State Transitions

import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('La quantité commandée doit être au moins de 1'),
});

export const CheckoutOrderSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  businessId: z.string().uuid().optional().nullable(),
  isGuest: z.boolean().default(false),
  customerType: z.enum(['B2C', 'B2B']).default('B2C'),
  
  recipientName: z.string().min(2, 'Le nom du destinataire est requis'),
  recipientPhone: z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'Numéro de téléphone algérien invalide (ex: 0550123456)'),
  recipientPhoneSecondary: z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'Numéro de téléphone secondaire invalide').optional().nullable(),
  
  shippingAddressLine: z.string().min(5, 'L\'adresse de livraison détaillée est requise'),
  wilayaCode: z.number().int().min(1).max(58, 'Code de Wilaya algérienne invalide (1 à 58)'),
  wilayaName: z.string().min(2),
  communeName: z.string().min(2),
  deliveryType: z.enum(['HOME', 'DESK']).default('HOME'),
  stopdeskCode: z.string().optional().nullable(),
  
  paymentMethod: z.enum([
    'CASH_ON_DELIVERY',
    'CIB_EDAHABIA',
    'BANK_TRANSFER',
    'B2B_CREDIT_ACCOUNT',
  ]).default('CASH_ON_DELIVERY'),
  customerNotes: z.string().max(500).optional().nullable(),
  
  items: z.array(CreateOrderItemSchema).min(1, 'La commande doit contenir au moins un article'),
});

export const OrderStatusTransitionSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_SHIPMENT',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'FAILED',
    'RETURNED',
    'REFUNDED',
  ]),
  reason: z.string().max(255).optional(),
});

export type CheckoutOrderInput = z.input<typeof CheckoutOrderSchema>;
export type CheckoutOrderParsed = z.output<typeof CheckoutOrderSchema>;
export type OrderStatusTransitionInput = z.infer<typeof OrderStatusTransitionSchema>;
