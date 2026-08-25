'use client';

// Centralized TanStack Query Hooks for HamzaPhone Admin Dashboard

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardOverviewStats,
  getProductsAdmin,
  getProductByIdAdmin,
  createProductAdmin,
  updateProductAdmin,
  duplicateProductAdmin,
  archiveProductAdmin,
  restoreProductAdmin,
  toggleProductStatusAdmin,
  toggleProductFeaturedAdmin,
  getCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getBrandsAdmin,
  createBrandAdmin,
  updateBrandAdmin,
  deleteBrandAdmin,
  getInventoryItemsAdmin,
  adjustInventoryAdmin,
  getInventoryHistoryAdmin,
  updateProductPriceDirectAdmin,
  previewBulkPriceAdjustmentAdmin,
  applyBulkPriceAdjustmentAdmin,
  getOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,
  updateOrderNotesAdmin,
  getB2CCustomersAdmin,
  getB2BAccountsAdmin,
  reviewB2BAccountAdmin,
  getSuppliersAdmin,
  createSupplierAdmin,
  updateSupplierAdmin,
  getActivityLogsAdmin,
} from '@/lib/actions';
import type { ProductFilterParams } from '@/lib/repositories/product.repository';
import type { OrderFilterParams } from '@/lib/repositories/order.repository';
import type { ProductStatus, OrderStatus, B2BStatus } from '@/types/database.types';

// ==================== QUERY KEYS ====================
export const adminQueryKeys = {
  overview: ['admin', 'overview'] as const,
  products: (params?: ProductFilterParams) => ['admin', 'products', params] as const,
  product: (id: string) => ['admin', 'product', id] as const,
  categories: ['admin', 'categories'] as const,
  brands: ['admin', 'brands'] as const,
  suppliers: ['admin', 'suppliers'] as const,
  inventory: (params?: any) => ['admin', 'inventory', params] as const,
  inventoryHistory: (productId?: string) => ['admin', 'inventory-history', productId] as const,
  orders: (params?: OrderFilterParams) => ['admin', 'orders', params] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  b2cCustomers: (params?: any) => ['admin', 'customers', 'b2c', params] as const,
  b2bAccounts: (status?: B2BStatus) => ['admin', 'b2b-accounts', status] as const,
  activityLogs: (params?: any) => ['admin', 'activity-logs', params] as const,
};

// ==================== QUERIES ====================

export function useDashboardOverview() {
  return useQuery({
    queryKey: adminQueryKeys.overview,
    queryFn: () => getDashboardOverviewStats(),
  });
}

export function useProducts(params: ProductFilterParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.products(params),
    queryFn: () => getProductsAdmin(params),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.product(id || ''),
    queryFn: () => (id ? getProductByIdAdmin(id) : null),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: () => getCategoriesAdmin(),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: adminQueryKeys.brands,
    queryFn: () => getBrandsAdmin(),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: adminQueryKeys.suppliers,
    queryFn: () => getSuppliersAdmin(),
  });
}

export function useInventory(params: { search?: string; lowStockOnly?: boolean; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: adminQueryKeys.inventory(params),
    queryFn: () => getInventoryItemsAdmin(params),
  });
}

export function useInventoryHistory(productId?: string, limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: adminQueryKeys.inventoryHistory(productId),
    queryFn: () => getInventoryHistoryAdmin(productId, limit, offset),
  });
}

export function useOrders(params: OrderFilterParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.orders(params),
    queryFn: () => getOrdersAdmin(params),
  });
}

export function useOrderDetails(orderId: string | null) {
  return useQuery({
    queryKey: adminQueryKeys.order(orderId || ''),
    queryFn: () => (orderId ? getOrderDetailsAdmin(orderId) : null),
    enabled: !!orderId,
  });
}

export function useB2CCustomers(params: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: adminQueryKeys.b2cCustomers(params),
    queryFn: () => getB2CCustomersAdmin(params),
  });
}

export function useB2BAccounts(status?: B2BStatus) {
  return useQuery({
    queryKey: adminQueryKeys.b2bAccounts(status),
    queryFn: () => getB2BAccountsAdmin(status),
  });
}

export function useActivityLogs(params: { entityType?: string; action?: string; actorEmail?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: adminQueryKeys.activityLogs(params),
    queryFn: () => getActivityLogsAdmin(params),
  });
}

// ==================== MUTATIONS ====================

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => createProductAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateProductAdmin(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.product(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateProductAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProductAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreProductAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) => toggleProductStatusAdmin(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useToggleProductFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => toggleProductFeaturedAdmin(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createCategoryAdmin>[0]) => createCategoryAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategoryAdmin>[1] }) => updateCategoryAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategoryAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createBrandAdmin>[0]) => createBrandAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.brands });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBrandAdmin>[1] }) => updateBrandAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.brands });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrandAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.brands });
    },
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => adjustInventoryAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useUpdateProductPriceDirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, prices }: { productId: string; prices: any }) =>
      updateProductPriceDirectAdmin(productId, prices),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useApplyBulkPriceAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => applyBulkPriceAdjustmentAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, newStatus, reason }: { orderId: string; newStatus: OrderStatus; reason?: string }) =>
      updateOrderStatusAdmin(orderId, newStatus, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.order(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
  });
}

export function useUpdateOrderNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, internalNotes }: { orderId: string; internalNotes: string }) =>
      updateOrderNotesAdmin(orderId, internalNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.order(variables.orderId) });
    },
  });
}

export function useReviewB2BAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => reviewB2BAccountAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'b2b-accounts'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createSupplierAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.suppliers });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSupplierAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.suppliers });
    },
  });
}
