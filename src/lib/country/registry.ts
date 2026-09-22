// DRIPIDIN Country Profile Registry
// Enforces dynamic country profile resolution without component-level branching.

import type { CountryProfile } from './types';
import { algeriaProfile } from './profiles/algeria';
import { franceProfile } from './profiles/france';

export class CountryRegistry {
  private static readonly profiles: Map<string, CountryProfile> = new Map([
    ['DZ', algeriaProfile],
    ['FR', franceProfile],
  ]);

  /**
   * Retrieves a CountryProfile by ISO 3166-1 alpha-2 code.
   * Deterministically falls back to Algeria if not found or empty.
   */
  static get(countryCode?: string | null): CountryProfile {
    if (!countryCode) return algeriaProfile;
    const cleanCode = countryCode.trim().toUpperCase();
    return this.profiles.get(cleanCode) || algeriaProfile;
  }

  /**
   * Registers a new CountryProfile at runtime.
   */
  static register(profile: CountryProfile): void {
    this.profiles.set(profile.code.toUpperCase(), profile);
  }

  /**
   * Lists all supported countries with their code and localized name.
   */
  static getSupportedCountries(): Array<{ code: string; name: string }> {
    return Array.from(this.profiles.values()).map(p => ({
      code: p.code,
      name: p.name,
    }));
  }
}
