// DRIPIDIN Capability Resolver
// Merges buyer store preferences with regional CountryProfile rules to produce
// an authoritative, strongly-typed capability set.

import type { CommerceCapabilities } from './types';
import type { StoreSettings } from '@/types/settings.types';
import type { CountryProfile } from '@/lib/country/types';
import { CountryRegistry } from '@/lib/country/registry';

export function resolveCommerceCapabilities(
  settings?: Partial<StoreSettings> | null,
  countryProfileOverride?: CountryProfile
): CommerceCapabilities {
  const s = settings || {};
  const country = countryProfileOverride || CountryRegistry.get(s.defaultCountryCode);

  // 1. COD requires both buyer enablement AND country legal/infrastructure support
  const codAllowedByCountry = country.commerceRules.codAvailable;
  const codEnabledByStore = (s as any).enableCashOnDelivery !== false; // Default true if unspecified
  const isCashOnDeliveryActive = codAllowedByCountry && codEnabledByStore;

  // 2. Commercial Cash Rounding is a policy (Rule 2)
  const isCommercialRoundingActive = Boolean((s as any).enableCommercialRounding);

  // 3. Tax inclusion policy
  const isTaxInclusive = (s as any).pricesIncludeTax !== false; // Default true (Retail TTC)

  return Object.freeze({
    b2bWholesale: Boolean(s.enableB2bWholesale ?? true),
    deviceCompatibility: true, // Native phone-parts capability
    qualityGrades: true,        // Native spare parts taxonomy
    productReviews: Boolean(s.enableProductReviews ?? true),
    cashOnDelivery: isCashOnDeliveryActive,
    guestCheckout: Boolean(s.enableGuestCheckout ?? true),
    whatsappOrdering: Boolean(s.enableWhatsappOrdering ?? true),
    commercialCashRounding: isCommercialRoundingActive,
    taxInclusivePricing: isTaxInclusive,
  });
}
