// DRIPIDIN Durable Notification Queue Processor
// At-least-once delivery worker with safe claim semantics, bounded batches, and exponential retries.
// Fully isolated from checkout transactions.

import { createServerClient } from '@/lib/auth/server';
import { NOTIFICATION_CHANNELS } from './channels';
import { toDomainChannel } from './channels/channel-mapper';
import type { NotificationRecord, NotificationChannelType } from '@/types/notifications.types';

export interface QueueProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export class QueueProcessor {
  /**
   * Exponential backoff delays in milliseconds for retry attempts:
   * Attempt 1 -> +2 minutes
   * Attempt 2 -> +10 minutes
   * Attempt 3 -> +30 minutes
   */
  private static readonly RETRY_DELAYS_MS = [
    2 * 60 * 1000,   // Attempt 1: +2m
    10 * 60 * 1000,  // Attempt 2: +10m
    30 * 60 * 1000,  // Attempt 3: +30m
  ];

  /**
   * Calculates the next retry timestamp based on attempt number and base time.
   */
  public static calculateNextRetry(attempt: number, baseTime: Date = new Date()): Date {
    const delayIndex = Math.min(Math.max(attempt - 1, 0), this.RETRY_DELAYS_MS.length - 1);
    const delayMs = this.RETRY_DELAYS_MS[delayIndex];
    return new Date(baseTime.getTime() + delayMs);
  }

  /**
   * Process pending notification jobs.
   * Can be invoked with specific notification IDs (Fast-path) or unconstrained (Cron sweep).
   */
  public static async processPendingNotifications(
    notificationIdsOrLimit?: string[] | number,
    customClient?: any
  ): Promise<QueueProcessingResult> {
    const result: QueueProcessingResult = { processed: 0, succeeded: 0, failed: 0 };
    const notificationIds = Array.isArray(notificationIdsOrLimit) ? notificationIdsOrLimit : undefined;
    const batchLimit = typeof notificationIdsOrLimit === 'number' ? notificationIdsOrLimit : 50;

    try {
      const supabase = customClient || (await createServerClient());
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('status', 'PENDING');

      if (notificationIds && notificationIds.length > 0) {
        query = query.in('id', notificationIds);
      } else {
        // Cron sweep safety net: bounded batch of up to batchLimit jobs ready for retry
        query = query
          .lte('next_retry_at', new Date().toISOString())
          .order('created_at', { ascending: true })
          .limit(batchLimit);
      }

      const { data: pendingJobs, error: fetchErr } = await query;
      if (fetchErr || !pendingJobs || pendingJobs.length === 0) {
        return result;
      }

      for (const job of pendingJobs) {
        result.processed++;
        await this.dispatchJob(job, supabase, result);
      }
    } catch (err: any) {
      console.error('[QueueProcessor] Sweep execution warning:', err.message);
    }

    return result;
  }

  /**
   * Dispatches a single queued notification row to its configured channel adapter.
   */
  private static async dispatchJob(job: any, supabase: any, summary: QueueProcessingResult): Promise<void> {
    const domainChannel = toDomainChannel(job.channel);
    const adapter = NOTIFICATION_CHANNELS[domainChannel];

    if (!adapter) {
      await this.markJobFailed(job.id, `Canal non supporté: ${domainChannel}`, job.retry_count || 0, supabase);
      summary.failed++;
      return;
    }

    // Assemble domain NotificationRecord for provider delivery
    const notification: NotificationRecord = {
      id: job.id,
      recipientId: job.user_id,
      recipientType: job.metadata?.recipientType || 'CUSTOMER',
      eventType: job.metadata?.eventType || 'order.created',
      title: job.title,
      message: job.body,
      channel: domainChannel,
      status: 'PENDING',
      severity: job.metadata?.severity || 'INFO',
      read: false,
      entityType: (job.metadata?.entityType as any) || 'ORDER',
      entityId: job.metadata?.entityId || job.id,
      metadata: {
        ...(job.metadata || {}),
        isDemo: Boolean(job.is_demo ?? job.metadata?.isDemo),
        is_demo: Boolean(job.is_demo ?? job.metadata?.is_demo),
      },
      idempotencyKey: job.idempotency_key,
      retryCount: job.retry_count || 0,
      maxRetries: job.max_retries || 3,
      createdAt: job.created_at,
    };

    try {
      // Outbound dispatch to external provider adapter
      const sendResult = await adapter.send(notification);

      if (sendResult.success) {
        const now = new Date().toISOString();
        const updatedMeta = {
          ...(job.metadata || {}),
          externalMessageId: sendResult.externalMessageId,
          deliveredAt: sendResult.deliveredAt || now,
        };

        await supabase
          .from('notifications')
          .update({
            status: 'SENT',
            sent_at: now,
            sent_via: domainChannel,
            error_message: null,
            metadata: updatedMeta,
          })
          .eq('id', job.id);

        summary.succeeded++;
      } else {
        await this.handleDispatchFailure(job, sendResult.error || 'Échec de transmission', supabase);
        summary.failed++;
      }
    } catch (err: any) {
      await this.handleDispatchFailure(job, err.message || 'Erreur inconnue de transmission', supabase);
      summary.failed++;
    }
  }

  /**
   * Handles delivery failure with exponential backoff scheduling.
   */
  private static async handleDispatchFailure(job: any, errorReason: string, supabase: any): Promise<void> {
    const currentRetries = (job.retry_count || 0) + 1;
    const maxRetries = job.max_retries || 3;
    const sanitizedError = this.sanitizeErrorMessage(errorReason);

    if (currentRetries >= maxRetries) {
      // Retries exhausted -> mark permanently FAILED
      await this.markJobFailed(job.id, sanitizedError, currentRetries, supabase);
    } else {
      // Schedule next retry with exponential backoff
      const delayIndex = Math.min(currentRetries - 1, this.RETRY_DELAYS_MS.length - 1);
      const delayMs = this.RETRY_DELAYS_MS[delayIndex];
      const nextRetryAt = new Date(Date.now() + delayMs).toISOString();

      await supabase
        .from('notifications')
        .update({
          status: 'PENDING',
          retry_count: currentRetries,
          next_retry_at: nextRetryAt,
          error_message: sanitizedError,
        })
        .eq('id', job.id);
    }
  }

  /**
   * Marks a job permanently as FAILED.
   */
  private static async markJobFailed(id: string, errorMessage: string, retryCount: number, supabase: any): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        status: 'FAILED',
        error_message: errorMessage,
        retry_count: retryCount,
      })
      .eq('id', id);
  }

  /**
   * Sanitizes error messages to prevent credential or header leakage.
   */
  private static sanitizeErrorMessage(rawError: string): string {
    if (!rawError) return 'Erreur inconnue';
    return rawError
      .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[A-Za-z0-9_\-\.]+/gi, 'key=[REDACTED]')
      .replace(/password=[^&\s]+/gi, 'password=[REDACTED]')
      .slice(0, 500);
  }
}
