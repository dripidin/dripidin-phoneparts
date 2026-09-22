// DRIPIDIN Commerce Capabilities Architecture
// Enforces Mandatory Rule 4: Capability-oriented architecture replacing
// brittle component-wide if/else condition branching.

export interface CommerceCapabilities {
  /**
   * Whether B2B wholesale pricing, customer business tiers, and proformas are active.
   */
  readonly b2bWholesale: boolean;

  /**
   * Whether device model compatibility matrix & filtering is active (e.g. for phone parts).
   */
  readonly deviceCompatibility: boolean;

  /**
   * Whether technical spare-part quality grades (OEM, Service Pack, etc.) are displayed.
   */
  readonly qualityGrades: boolean;

  /**
   * Whether customer purchase reviews are enabled.
   */
  readonly productReviews: boolean;

  /**
   * Whether Cash On Delivery is permitted and offered at checkout.
   */
  readonly cashOnDelivery: boolean;

  /**
   * Whether unauthenticated customers can complete orders without an account.
   */
  readonly guestCheckout: boolean;

  /**
   * Whether one-click ordering via WhatsApp is enabled.
   */
  readonly whatsappOrdering: boolean;

  /**
   * Whether physical cash commercial rounding (e.g. nearest 10 DA) is active.
   */
  readonly commercialCashRounding: boolean;

  /**
   * Whether displayed storefront prices include tax (TTC) or exclude tax (HT).
   */
  readonly taxInclusivePricing: boolean;
}
