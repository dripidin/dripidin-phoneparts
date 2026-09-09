import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth/server';
import { DeliveryService } from '@/lib/services/delivery.service';
import { EcoTrackWebhookPayloadSchema } from '@/lib/validation/delivery.schema';

/**
 * Secure EcoTrack Webhook Handler
 * Ingests live tracking updates, normalizes statuses, and updates order & inventory records idempotently.
 */
export async function POST(req: Request) {
  try {
    // 1. Extract secret token from headers or query parameters
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token') || url.searchParams.get('secret');
    const headerToken =
      req.headers.get('x-ecotrack-secret') ||
      req.headers.get('x-webhook-token') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    const secretToken = headerToken || queryToken || undefined;

    // 2. Parse & Validate incoming JSON body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const parseResult = EcoTrackWebhookPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format de payload webhook invalide.',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // 3. Process webhook event via DeliveryService
    const supabase = await createServerClient();
    const deliveryService = new DeliveryService(supabase);

    const result = await deliveryService.processWebhookEvent(payload, secretToken);

    return NextResponse.json({
      success: true,
      message: result.message,
      status: result.statusNormalized,
      trackingNumber: result.trackingNumber,
    });
  } catch (err: any) {
    if (err.message?.includes('invalide')) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne lors du traitement du webhook.',
        message: err.message,
      },
      { status: 500 }
    );
  }
}
