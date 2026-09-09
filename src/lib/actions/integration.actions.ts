'use server';

// HamzaPhone Integration & Demo Server Actions
// Privileged administrative actions for Integration Center and safe connectivity testing

import { IntegrationConfigService } from '@/lib/config/integration-config.service';
import { ConnectionTestService } from '@/lib/services/connection-test.service';
import { DemoInventoryService } from '@/lib/services/demo-inventory.service';
import type {
  IntegrationSummary,
  UpdateIntegrationSettingsInput,
  SafeConnectionTestResult,
  DemoInventorySeedInput,
  DemoInventorySeedResult,
} from '@/types/integrations.types';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all integrations summaries (Safe, zero credentials exposed)
 */
export async function getIntegrationsSummaryAction(): Promise<{
  success: boolean;
  integrations: IntegrationSummary[];
  isDemoMode: boolean;
}> {
  try {
    const integrations = IntegrationConfigService.getAllIntegrationsSummary();
    const isDemoMode = IntegrationConfigService.isDemoMode();

    return {
      success: true,
      integrations,
      isDemoMode,
    };
  } catch (err: any) {
    return {
      success: false,
      integrations: [],
      isDemoMode: true,
    };
  }
}

/**
 * Update non-secret integration parameters
 */
export async function updateIntegrationSettingsAction(
  input: UpdateIntegrationSettingsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    IntegrationConfigService.updateIntegrationSettings(input);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de la mise à jour des paramètres d\'intégration.',
    };
  }
}

/**
 * Run safe, non-destructive connection test
 */
export async function testIntegrationConnectionAction(
  integrationId: string
): Promise<{ success: boolean; result: SafeConnectionTestResult }> {
  try {
    const result = await ConnectionTestService.testIntegration(integrationId);
    revalidatePath('/admin');
    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      result: {
        integrationId,
        provider: integrationId.toUpperCase(),
        success: false,
        environment: 'sandbox',
        message: `Erreur critique: ${err.message}`,
        latencyMs: 0,
        testedAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Execute controlled demo inventory seeding
 */
export async function seedDemoInventoryAction(
  input: DemoInventorySeedInput
): Promise<{ success: boolean; result?: DemoInventorySeedResult; error?: string }> {
  try {
    const result = DemoInventoryService.seedDemoInventory(input);
    revalidatePath('/admin');
    revalidatePath('/products');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de l\'alimentation du stock démo.',
    };
  }
}

/**
 * Reset / clear demo inventory modifications
 */
export async function resetDemoInventoryAction(
  targetStock: number = 0
): Promise<{ success: boolean; result?: DemoInventorySeedResult; error?: string }> {
  try {
    const result = DemoInventoryService.resetDemoInventory(targetStock);
    revalidatePath('/admin');
    revalidatePath('/products');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erreur lors de la réinitialisation du stock démo.',
    };
  }
}
