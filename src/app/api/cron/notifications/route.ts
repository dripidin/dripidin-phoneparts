// DRIPIDIN Scheduled Notification Sweep Worker Route
// Safety net for durable async notification queue.
// Runs periodically (e.g. every 60 seconds) to claim and dispatch pending or retry-ready notification jobs.

import { NextResponse } from 'next/server';
import { QueueProcessor } from '@/lib/notifications/queue-processor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
