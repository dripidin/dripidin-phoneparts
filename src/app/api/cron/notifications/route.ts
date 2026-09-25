// DRIPIDIN Scheduled Notification Sweep Worker Route
// Safety net for durable async notification queue.
// Runs periodically (e.g. every 60 seconds) to claim and dispatch pending or retry-ready notification jobs.
// Protected by CRON_SECRET for production safety.

import { NextResponse } from 'next/server';
import { QueueProcessor } from '@/lib/notifications/queue-processor';

export const dynamic = 'force-dynamic';

function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // If no secret configured in development, allow local invocation
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also check query param ?token=... for Vercel Cron or simple webhooks
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  return token === cronSecret;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    const summary = await QueueProcessor.processPendingNotifications();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Erreur lors du traitement de la file de notifications',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
