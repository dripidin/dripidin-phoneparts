'use server';

// HamzaPhone Analytics & Reporting Server Actions with RBAC Protection

import { AnalyticsService } from '@/lib/analytics/analytics.service';
import {
  AnalyticsFilterParams,
  AnalyticsOverviewReport,
  AnalyticsEvent,
} from '@/types/analytics.types';
import { requirePermission } from '@/lib/permissions/guards';
import { APP_PERMISSIONS } from '@/types/rbac.types';
import { createServerClient } from '@/lib/auth/server';

/**
 * Retrieves full Business Intelligence and Commerce Analytics Report
 * Requires 'analytics.read' or 'reports.read' permission
 */
export async function getAnalyticsOverviewAction(
  params: AnalyticsFilterParams = {},
  personaClient?: any
): Promise<AnalyticsOverviewReport> {
  const supabase = personaClient || await createServerClient();
  const authContext = await requirePermission(
    supabase,
    APP_PERMISSIONS.ANALYTICS_READ
  );

  return AnalyticsService.getOverviewReport(params, authContext);
}

/**
 * Public/Internal tracking action for commerce funnel events
 */
export async function trackAnalyticsEventAction(
  event: Omit<AnalyticsEvent, 'id' | 'createdAt'>
): Promise<AnalyticsEvent> {
  return AnalyticsService.trackEvent(event);
}

/**
 * Generates and downloads sanitized CSV report
 * Requires 'reports.export' permission and writes audit entry
 */
export async function exportAnalyticsReportAction(
  reportType: 'SALES' | 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'DELIVERY' | 'PAYMENTS',
  params: AnalyticsFilterParams = {},
  personaClient?: any
): Promise<{ filename: string; csvContent: string }> {
  const supabase = personaClient || await createServerClient();
  const authContext = await requirePermission(
    supabase,
    APP_PERMISSIONS.REPORTS_EXPORT
  );

  const csvContent = AnalyticsService.generateExportCsv(reportType, params, authContext);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `hamzaphone-rapport-${reportType.toLowerCase()}-${timestamp}.csv`;

  // Audit log the export
  await supabase.from('audit_logs').insert({
    actor_id: authContext.userId,
    actor_email: authContext.email,
    action: 'EXPORT_ANALYTICS_REPORT',
    entity_type: 'REPORT',
    entity_id: reportType,
    details: { reportType, period: params.period || '30d', filename },
    created_at: new Date().toISOString(),
  });

  return { filename, csvContent };
}
