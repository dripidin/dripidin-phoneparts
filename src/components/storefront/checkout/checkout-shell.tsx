'use client';

// HamzaPhone Checkout Shell
// Coordinates Step Components, Form State, Idempotency, and Server Order Submission

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { useCustomerContext, useCustomerAddresses } from '@/lib/hooks/use-customer-account';
import { useSubmitOrder } from '@/lib/hooks/use-checkout';
import { CustomerStep } from './customer-step';
import { ShippingStep } from './shipping-step';
import { DeliveryStep } from './delivery-step';
import { PaymentStep } from './payment-step';
import { OrderSummaryCard } from './order-summary-card';
import { ALGERIA_WILAYAS } from '@/lib/utils';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';
import type { DeliveryType, PaymentMethod } from '@/types/database.types';

export function CheckoutShell() {
  const router = useRouter();
  const { items, subtotalDzd, clearCart } = useCart();
  const { data: customerContext, isLoading: isContextLoading } = useCustomerContext();
  const { data: savedAddresses = [] } = useCustomerAddresses();
  const submitOrderMutation = useSubmitOrder();

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPhoneSecondary, setGuestPhoneSecondary] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingAddressLine, setShippingAddressLine] = useState('');
  const [wilayaCode, setWilayaCode] = useState<number>(16);
  const [wilayaName, setWilayaName] = useState('Alger');
  const [communeName, setCommuneName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Delivery & Payment
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('HOME');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [formError, setFormError] = useState<string | null>(null);

  // Generate Unique Idempotency Key on mount
  const idempotencyKey = useMemo(() => {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Set default address if authenticated user has saved addresses
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
      setShippingAddressLine(defaultAddr.addressLine);
      setWilayaCode(defaultAddr.wilayaCode);
      setWilayaName(defaultAddr.wilayaName);
      setCommuneName(defaultAddr.communeName);
    }
  }, [savedAddresses, selectedAddressId]);

  // Set profile info if authenticated
  useEffect(() => {
    if (customerContext) {
      if (!guestName && customerContext.fullName) {
        setGuestName(customerContext.fullName);
      }
      if (!guestPhone && customerContext.phone) {
        setGuestPhone(customerContext.phone);
      }
    }
  }, [customerContext, guestName, guestPhone]);

  // Calculate delivery price based on Wilaya & Delivery Type via Authoritative Pricing Service
  const shippingCostDzd = useMemo(() => {
    if (items.length === 0) return 0;
    return DeliveryPricingService.calculateDeliveryCost({
      wilayaCode,
      deliveryType,
      subtotalDzd,
    }).finalCostDzd;
  }, [items.length, deliveryType, wilayaCode, subtotalDzd]);

  const totalDzd = subtotalDzd + shippingCostDzd;

  // Handle Order Submit
  const handleSubmitOrder = async () => {
    setFormError(null);

    // Validate Contact
    const finalRecipientName = (customerContext?.fullName || guestName).trim();
    const finalRecipientPhone = (customerContext?.phone || guestPhone).trim();

    if (!finalRecipientName || finalRecipientName.length < 2) {
      setFormError('Veuillez renseigner le nom complet du destinataire.');
      return;
    }

    if (!finalRecipientPhone || !/^(0)(5|6|7)[0-9]{8}$/.test(finalRecipientPhone)) {
      setFormError('Veuillez renseigner un numéro de téléphone algérien valide (ex: 0550123456).');
      return;
    }

    // Validate Address
    if (!shippingAddressLine || shippingAddressLine.trim().length < 5) {
      setFormError('Veuillez renseigner une adresse de livraison détaillée.');
      return;
    }

    if (!communeName || communeName.trim().length < 2) {
      setFormError('Veuillez renseigner la commune de livraison.');
      return;
    }

    if (items.length === 0) {
      setFormError('Votre panier est vide.');
      return;
    }

    try {
      const payload = {
        customerId: customerContext?.userId || null,
        businessId: customerContext?.business?.id || null,
        isGuest: !customerContext,
        customerType: (customerContext?.userType === 'B2B' ? 'B2B' : 'B2C') as 'B2C' | 'B2B',
        recipientName: finalRecipientName,
        recipientPhone: finalRecipientPhone,
        recipientPhoneSecondary: guestPhoneSecondary?.trim() || null,
        shippingAddressLine: shippingAddressLine.trim(),
        wilayaCode,
        wilayaName,
        communeName: communeName.trim(),
        deliveryType,
        paymentMethod,
        customerNotes: customerNotes?.trim() || null,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const createdOrder = await submitOrderMutation.mutateAsync({
        input: payload,
        idempotencyKey,
      });

      // Clear local cart upon successful server creation
      clearCart();

      // Redirect to Order Confirmation
      router.push(
        `/checkout/confirmation?orderNumber=${encodeURIComponent(createdOrder.orderNumber)}&token=${encodeURIComponent(createdOrder.trackingToken)}`
      );
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création de la commande.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-6 px-4">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900">Votre panier est vide</h2>
          <p className="text-xs text-gray-500">
            Ajoutez des articles à votre panier avant de passer commande.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-extrabold text-xs shadow-md hover:bg-orange-600 transition-all"
        >
          Retourner au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-orange-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au panier</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Finalisation de la Commande
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Commande Sécurisée (COD)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Steps */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step 1: Customer Contact */}
          <CustomerStep
            customerContext={customerContext || null}
            guestEmail={guestEmail}
            setGuestEmail={setGuestEmail}
            guestName={guestName}
            setGuestName={setGuestName}
            guestPhone={guestPhone}
            setGuestPhone={setGuestPhone}
            guestPhoneSecondary={guestPhoneSecondary}
            setGuestPhoneSecondary={setGuestPhoneSecondary}
          />

          {/* Step 2: Shipping Address */}
          <ShippingStep
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            shippingAddressLine={shippingAddressLine}
            setShippingAddressLine={setShippingAddressLine}
            wilayaCode={wilayaCode}
            setWilayaCode={setWilayaCode}
            wilayaName={wilayaName}
            setWilayaName={setWilayaName}
            communeName={communeName}
            setCommuneName={setCommuneName}
            customerNotes={customerNotes}
            setCustomerNotes={setCustomerNotes}
          />

          {/* Step 3: Delivery Type */}
          <DeliveryStep
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            wilayaCode={wilayaCode}
            wilayaName={wilayaName}
          />

          {/* Step 4: Payment Method */}
          <PaymentStep
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isApprovedB2B={customerContext?.canAccessWholesalePrices}
          />

        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-4">
          <OrderSummaryCard
            items={items}
            subtotalDzd={subtotalDzd}
            shippingCostDzd={shippingCostDzd}
            totalDzd={totalDzd}
            wilayaName={wilayaName}
            isSubmitting={submitOrderMutation.isPending}
            onSubmitOrder={handleSubmitOrder}
            canSubmit={items.length > 0}
            errorMessage={formError}
          />
        </div>

      </div>

    </div>
  );
}
