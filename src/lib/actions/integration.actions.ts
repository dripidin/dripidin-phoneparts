'use server';

// DRIPIDIN Integration & Secure Vault Server Actions
// Privileged administrative actions for Integration Center, encrypted credential vault,
// safe connectivity testing, and demo inventory seeding.
// Condition 6 Compliance: Decrypted secrets are NEVER returned by Server Actions.

import { IntegrationConfigService } from '@/lib/config/integration-config.service';
import { ConnectionTestService } from '@/lib/services/connection-test.service';
import { DemoInventoryService } from '@/lib/services/demo-inventory.service';
import { VaultService, type ActorContext } from '@/lib/vault/vault.service';
import { createServerClient } from '@/lib/auth/server';
import { requirePermission } from '@/lib/permissions/guards';
import type {
  IntegrationSummary,
  UpdateIntegrationSettingsInput,
  SafeConnectionTestResult,
  DemoInventorySeedInput,
  DemoInventorySeedResult,
  ConfigureSecretInput,
  RevokeSecretInput,
  RotateSecretsInput,
  SecretRotationResult,
} from '@/types/integrations.types';
import { revalidatePath } from 'next/cache';

/**
 * Helper to safely resolve actor context from the current session if available.
 */
async function resolveActorContext(): Promise<ActorContext | undefined> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      role: (user.user_metadata?.role as string) || 'STAFF',
    };
  } catch {
    return undefined;
  }
}

/**
 * Fetch all integrations summaries (Safe, zero credentials exposed)
 */
export async function getIntegrationsSummaryAction(): Promise<{
  success: boolean;
  integrations: IntegrationSummary[];
  isDemoMode: boolean;
}> {
  try {
    const integrations = await IntegrationConfigService.getAllIntegrationsSummaryAsync();
    const isDemoMode = IntegrationConfigService.isDemoMode();

    return {
      success: true,
      integrations,
      isDemoMode,
    };
  } catch (err: any) {
    return {
      success: false,
      integrations: IntegrationConfigService.getAllIntegrationsSummary(),
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
    // In production, enforce settings.manage permission
    if (process.env.NODE_ENV === 'production') {
      const supabase = await createServerClient();
      await requirePermission(supabase, 'settings.manage');
    }

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
 * Configure / replace an encrypted integration secret in the vault
 * Condition 6 Compliance: NEVER returns the secret value, only confirmation of configuration.
 */
export async function configureIntegrationSecretAction(
  input: ConfigureSecretInput
): Promise<{ success: boolean; keyVersion?: number; error?: string }> {
  try {
    let actor: ActorContext | undefined;

    // In production, enforce integrations.manage_secrets permission
    if (process.env.NODE_ENV === 'production') {
      const supabase = await createServerClient();
      const authCtx = await requirePermission(supabase, 'integrations.manage_secrets');
      actor = { id: authCtx.userId, email: authCtx.email, role: authCtx.role };
    } else {
      actor = await resolveActorContext();
    }

    const res = await VaultService.setSecret(
      input.integrationId,
      input.keyName,
      input.secretValue,
      actor
    );

    revalidatePath('/admin');
    return { success: true, keyVersion: res.keyVersion };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Échec de l\'enregistrement sécurisé du secret.',
    };
  }
}

/**
 * Revoke / delete an encrypted secret from the vault
 */
export async function revokeIntegrationSecretAction(
  input: RevokeSecretInput
): Promise<{ success: boolean; error?: string }> {
  try {
    let actor: ActorContext | undefined;

    if (process.env.NODE_ENV === 'production') {
      const supabase = await createServerClient();
      const authCtx = await requirePermission(supabase, 'integrations.manage_secrets');
      actor = { id: authCtx.userId, email: authCtx.email, role: authCtx.role };
    } else {
      actor = await resolveActorContext();
    }

    await VaultService.revokeSecret(input.integrationId, input.keyName, actor);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Échec de la révocation du secret.',
    };
  }
}

/**
 * Rotate all vault secrets to a new key version
 */
export async function rotateIntegrationSecretsAction(
  input: RotateSecretsInput
): Promise<{ success: boolean; result?: SecretRotationResult; error?: string }> {
  try {
    let actor: ActorContext | undefined;

    if (process.env.NODE_ENV === 'production') {
      const supabase = await createServerClient();
      const authCtx = await requirePermission(supabase, 'integrations.manage_secrets');
      actor = { id: authCtx.userId, email: authCtx.email, role: authCtx.role };
    } else {
      actor = await resolveActorContext();
    }

    const result = await VaultService.rotateSecrets(input.targetVersion, actor);
    revalidatePath('/admin');
    return { success: result.success, result };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Échec de la rotation des secrets.',
    };
  }
}

/**
 * Test integration connectivity safely (server-side only)
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
    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Échec de la génération du stock démo.',
    };
  }
}

/**
 * Reset demo inventory to zero or target stock level
 */
export async function resetDemoInventoryAction(
  targetQuantity: number = 0
): Promise<{ success: boolean; result?: DemoInventorySeedResult; error?: string }> {
  try {
    const result = DemoInventoryService.resetDemoInventory(targetQuantity);
    revalidatePath('/admin');
    revalidatePath('/products');
    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Échec de la réinitialisation du stock démo.',
    };
  }
}
