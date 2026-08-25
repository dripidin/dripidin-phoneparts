// HamzaPhone React Query Hook for Analytics & Business Intelligence

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAnalyticsOverviewAction,
  exportAnalyticsReportAction,
  trackAnalyticsEventAction,
} from '@/lib/actions/analytics.actions';
import { AnalyticsFilterParams, AnalyticsEvent } from '@/types/analytics.types';

export const ANALYTICS_QUERY_KEYS = {
  overview: (params: AnalyticsFilterParams) => ['analytics', 'overview', params] as const,
};

export function useAnalyticsOverview(params: AnalyticsFilterParams = {}) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(params),
    queryFn: () => getAnalyticsOverviewAction(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useExportAnalyticsReport() {
  return useMutation({
    mutationFn: ({
      reportType,
      params,
    }: {
      reportType: 'SALES' | 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'DELIVERY' | 'PAYMENTS';
      params?: AnalyticsFilterParams;
    }) => exportAnalyticsReportAction(reportType, params),
    onSuccess: (data) => {
      // Trigger automatic browser download
      const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  });
}

export function useTrackAnalyticsEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: Omit<AnalyticsEvent, 'id' | 'createdAt'>) =>
      trackAnalyticsEventAction(event),
    onSuccess: () => {
      // Refresh active analytics cache if relevant
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
