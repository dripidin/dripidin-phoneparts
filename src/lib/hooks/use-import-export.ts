// TanStack Query Hooks for Import / Export Pipeline, Supplier Mappings & Catalog Downloads

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadAndParseImportAction,
  updateJobMappingAction,
  getJobPreviewRowsAction,
  applyImportJobAction,
  cancelImportJobAction,
  downloadJobReportAction,
  getImportJobsHistoryAction,
  exportCatalogDataAction,
  getSupplierMappingTemplatesAction,
  saveSupplierMappingTemplateAction,
} from '@/lib/actions/import-export.actions';
import type {
  FileType,
  ImportMode,
  ColumnMappingConfig,
  CatalogExportFilter,
  SupplierMappingTemplate,
} from '@/lib/import-export/types';

export const IMPORT_EXPORT_KEYS = {
  history: ['import_jobs_history'] as const,
  previewRows: (jobId: string, filter?: string, page?: number, search?: string) =>
    ['import_preview_rows', jobId, filter, page, search] as const,
  supplierTemplates: ['supplier_mapping_templates'] as const,
};

/**
 * Query import jobs history
 */
export function useImportJobsHistory() {
  return useQuery({
    queryKey: IMPORT_EXPORT_KEYS.history,
    queryFn: () => getImportJobsHistoryAction(),
  });
}

/**
 * Query preview rows with pagination, filtering and search
 */
export function useImportPreviewRows(
  jobId: string,
  filter: 'ALL' | 'NEW' | 'UPDATED' | 'UNCHANGED' | 'WARNINGS' | 'ERRORS' | 'CONFLICTS' = 'ALL',
  page: number = 1,
  pageSize: number = 50,
  search: string = ''
) {
  return useQuery({
    queryKey: IMPORT_EXPORT_KEYS.previewRows(jobId, filter, page, search),
    queryFn: () => getJobPreviewRowsAction({ jobId, filter, page, pageSize, search }),
    enabled: Boolean(jobId),
  });
}

/**
 * Query saved supplier mapping templates
 */
export function useSupplierMappingTemplates() {
  return useQuery({
    queryKey: IMPORT_EXPORT_KEYS.supplierTemplates,
    queryFn: () => getSupplierMappingTemplatesAction(),
  });
}

/**
 * Mutation: Upload and parse import file
 */
export function useUploadAndParseImport() {
  return useMutation({
    mutationFn: (params: {
      fileName: string;
      fileType: FileType;
      fileContentBase64: string;
      supplierId?: string | null;
      supplierName?: string | null;
      importMode?: ImportMode;
      customMapping?: ColumnMappingConfig;
    }) => uploadAndParseImportAction(params),
  });
}

/**
 * Mutation: Revalidate mapping
 */
export function useUpdateJobMapping() {
  return useMutation({
    mutationFn: (params: { jobId: string; mapping: ColumnMappingConfig; mode: ImportMode }) =>
      updateJobMappingAction(params),
  });
}

/**
 * Mutation: Apply Import Job
 */
export function useApplyImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => applyImportJobAction({ jobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_EXPORT_KEYS.history });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Mutation: Cancel Import Job
 */
export function useCancelImportJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => cancelImportJobAction({ jobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_EXPORT_KEYS.history });
    },
  });
}

/**
 * Mutation: Download CSV Execution Report
 */
export function useDownloadJobReport() {
  return useMutation({
    mutationFn: (jobId: string) => downloadJobReportAction({ jobId }),
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

/**
 * Mutation: Export Catalog Data (CSV / XLSX)
 */
export function useExportCatalog() {
  return useMutation({
    mutationFn: (filter: CatalogExportFilter) => exportCatalogDataAction(filter),
    onSuccess: (data) => {
      if (data.dataBase64) {
        const byteCharacters = atob(data.dataBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    },
  });
}

/**
 * Mutation: Save Supplier Template
 */
export function useSaveSupplierTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: Omit<SupplierMappingTemplate, 'id' | 'createdAt' | 'updatedAt'>) =>
      saveSupplierMappingTemplateAction(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMPORT_EXPORT_KEYS.supplierTemplates });
    },
  });
}
