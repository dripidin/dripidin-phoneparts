'use client';

// Products Management & Catalog Datagrid View for HamzaPhone

import React, { useState } from 'react';
import {
  useProducts,
  useCategories,
  useBrands,
  useSuppliers,
  useCreateProduct,
  useUpdateProduct,
  useDuplicateProduct,
  useArchiveProduct,
  useToggleProductStatus,
} from '@/lib/hooks/use-admin-queries';
import { uploadProductImageAdmin } from '@/lib/actions/product.actions';
import { formatDZD, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import type { DeviceCompatibilityItem } from '@/types/domain.types';
import type { ProductType, ProductStatus } from '@/types/database.types';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Smartphone,
  CheckCircle2,
  X,
  Layers,
  Upload,
  Percent,
} from 'lucide-react';

export function ProductsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // React Query Hooks
  const { data: productsData, isLoading, error } = useProducts({
    search: searchTerm || undefined,
    brandId: brandFilter || undefined,
    categoryId: categoryFilter || undefined,
    status: (statusFilter as ProductStatus) || undefined,
    page,
    pageSize,
  });

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: suppliers = [] } = useSuppliers();

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const duplicateProductMutation = useDuplicateProduct();
  const archiveProductMutation = useArchiveProduct();
  const toggleStatusMutation = useToggleProductStatus();

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSupplierSku, setFormSupplierSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrandId, setFormBrandId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formProductType, setFormProductType] = useState<ProductType>('OEM_ORIGINAL');
  const [formStatus, setFormStatus] = useState<ProductStatus>('ACTIVE');
  const [formCostPrice, setFormCostPrice] = useState(10000);
  const [formB2cPrice, setFormB2cPrice] = useState(16000);
  const [formB2cSalePrice, setFormB2cSalePrice] = useState<number | undefined>(undefined);
  const [formB2bPrice, setFormB2bPrice] = useState(13500);
  const [formStock, setFormStock] = useState(20);
  const [formLowStock, setFormLowStock] = useState(5);
  const [formWeight, setFormWeight] = useState(60);
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400');
  const [formCompatibility, setFormCompatibility] = useState<DeviceCompatibilityItem[]>([]);

  // New Compatibility Row
  const [newBrandName, setNewBrandName] = useState('Samsung');
  const [newModelName, setNewModelName] = useState('Galaxy S22 5G');
  const [newModelCode, setNewModelCode] = useState('SM-S901B');
  const [newVariants, setNewVariants] = useState('SM-S901B, SM-S901U');

  const products = productsData?.products || [];
  const totalCount = productsData?.totalCount || 0;
  const totalPages = productsData?.totalPages || 1;

  const openCreateModal = () => {
    setEditingId(null);
    setFormSku(`HP-${Date.now().toString().slice(-6)}`);
    setFormBarcode('');
    setFormSupplierSku('');
    setFormName('');
    setFormBrandId(brands[0]?.id || '');
    setFormCategoryId(categories[0]?.id || '');
    setFormProductType('OEM_ORIGINAL');
    setFormStatus('ACTIVE');
    setFormCostPrice(8000);
    setFormB2cPrice(14000);
    setFormB2cSalePrice(undefined);
    setFormB2bPrice(11500);
    setFormStock(15);
    setFormLowStock(5);
    setFormWeight(50);
    setFormSupplierId(suppliers[0]?.id || '');
    setFormImage('https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400');
    setFormCompatibility([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.id);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormSupplierSku(p.supplier_sku || '');
    setFormName(p.name);
    setFormBrandId(p.brand_id || brands[0]?.id || '');
    setFormCategoryId(p.category_id || categories[0]?.id || '');
    setFormProductType(p.product_type || 'OEM_ORIGINAL');
    setFormStatus(p.status || 'ACTIVE');
    setFormCostPrice(Number(p.cost_price_dzd) || 0);
    setFormB2cPrice(Number(p.b2c_price_dzd) || 0);
    setFormB2cSalePrice(p.b2c_sale_price_dzd ? Number(p.b2c_sale_price_dzd) : undefined);
    setFormB2bPrice(Number(p.b2b_price_dzd) || 0);
    setFormStock(p.stock_quantity || 0);
    setFormLowStock(p.low_stock_threshold || 5);
    setFormWeight(p.weight_grams || 50);
    setFormSupplierId(p.primary_supplier_id || suppliers[0]?.id || '');
    setFormImage(p.main_image || '');
    setFormCompatibility(Array.isArray(p.compatibility) ? p.compatibility : []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddCompatibility = () => {
    if (!newModelName || !newModelCode) return;
    const variants = newVariants
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    setFormCompatibility([
      ...formCompatibility,
      {
        modelName: newModelName,
        modelSlug: slugify(newModelName),
        modelCode: newModelCode,
        brandName: newBrandName,
        brandSlug: slugify(newBrandName),
        variants,
      },
    ]);

    setNewModelName('');
    setNewModelCode('');
    setNewVariants('');
  };

  const handleRemoveCompatibility = (idx: number) => {
    setFormCompatibility(formCompatibility.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadProductImageAdmin(formData);
      setFormImage(url);
    } catch (err: any) {
      setFormError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    setFormError(null);
    try {
      if (editingId) {
        await updateProductMutation.mutateAsync({
          id: editingId,
          data: {
            name: formName,
            sku: formSku,
            barcode: formBarcode || undefined,
            supplierSku: formSupplierSku || undefined,
            brandId: formBrandId,
            categoryId: formCategoryId,
            productType: formProductType,
            status: formStatus,
            costPriceDzd: formCostPrice,
            b2cPriceDzd: formB2cPrice,
            b2cSalePriceDzd: formB2cSalePrice,
            b2bPriceDzd: formB2bPrice,
            lowStockThreshold: formLowStock,
            weightGrams: formWeight,
            mainImage: formImage,
            compatibility: formCompatibility,
          },
        });
        setActionSuccess(`Produit ${formSku} mis à jour avec succès.`);
      } else {
        await createProductMutation.mutateAsync({
          name: formName,
          sku: formSku,
          barcode: formBarcode || undefined,
          supplierSku: formSupplierSku || undefined,
          brandId: formBrandId,
          categoryId: formCategoryId,
          productType: formProductType,
          status: formStatus,
          costPriceDzd: formCostPrice,
          b2cPriceDzd: formB2cPrice,
          b2cSalePriceDzd: formB2cSalePrice,
          b2bPriceDzd: formB2bPrice,
          stockQuantity: formStock,
          lowStockThreshold: formLowStock,
          weightGrams: formWeight,
          mainImage: formImage,
          compatibility: formCompatibility,
          isVisible: true,
          isFeatured: false,
        });
        setActionSuccess(`Produit ${formSku} créé avec succès.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la sauvegarde du produit.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProductMutation.mutateAsync(id);
      setActionSuccess('Produit dupliqué avec succès.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erreur duplication: ${err.message}`);
    }
  };

  const handleArchive = async (id: string, sku: string) => {
    if (!confirm(`Confirmer le déplacement du produit ${sku} vers la corbeille ?`)) return;
    try {
      await archiveProductMutation.mutateAsync(id);
      setActionSuccess(`Produit ${sku} archivé.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erreur archivage: ${err.message}`);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: ProductStatus) => {
    const nextStatus: ProductStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      await toggleStatusMutation.mutateAsync({ id, status: nextStatus });
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Bar & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, SKU, code-barres..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <option value="">Toutes Marques</option>
            {brands.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <option value="">Toutes Catégories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <option value="">Tous Statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </div>

        <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
          <Plus className="w-3.5 h-3.5" />
          Ajouter Pièce
        </Button>
      </div>

      {/* Products Datagrid */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Produit & Réf</th>
                <th className="px-3 py-3">Marque / Catégorie</th>
                <th className="px-3 py-3">Prix B2C</th>
                <th className="px-3 py-3">Prix Pro B2B</th>
                <th className="px-3 py-3">Stock Dispo</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Chargement du catalogue Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">Aucun produit trouvé</p>
                    <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou ajoutez une nouvelle pièce détachée.</p>
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const available = (p.stock_quantity || 0) - (p.reserved_stock || 0);
                  const isLow = available <= (p.low_stock_threshold || 5);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.main_image || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                          />
                          <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                            <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500 mt-0.5">
                              <span>SKU: {p.sku}</span>
                              {p.barcode && <span>• EAN: {p.barcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-gray-800 block">{p.brands?.name || 'Générique'}</span>
                        <span className="text-[11px] text-gray-400">{p.categories?.name || 'Composant'}</span>
                      </td>
                      <td className="px-3 py-3 font-bold text-gray-900">
                        {p.b2c_sale_price_dzd ? (
                          <div>
                            <span className="text-emerald-700">{formatDZD(p.b2c_sale_price_dzd)}</span>
                            <span className="text-[10px] text-gray-400 line-through block font-normal">
                              {formatDZD(p.b2c_price_dzd)}
                            </span>
                          </div>
                        ) : (
                          formatDZD(p.b2c_price_dzd)
                        )}
                      </td>
                      <td className="px-3 py-3 font-bold text-purple-700">
                        {formatDZD(p.b2b_price_dzd)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            available <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {available} dispo ({p.stock_quantity || 0})
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleToggleStatus(p.id, p.status)}
                          className="focus:outline-hidden"
                          title="Cliquer pour basculer actif/brouillon"
                        >
                          <Badge variant={p.status === 'ACTIVE' ? 'success' : 'default'}>
                            {p.status === 'ACTIVE' ? 'Actif' : 'Brouillon'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Dupliquer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.sku)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Archiver"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Affichage de <strong>{products.length}</strong> sur <strong>{totalCount}</strong> pièces
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span className="px-2 font-bold text-gray-700">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Full Modal Product Editor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Modifier Produit (${formSku})` : 'Ajouter une Pièce Détachée'}
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {formError}
            </div>
          )}

          {/* Section 1: Identité & Classement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Nom du Produit *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Écran OLED Samsung S22 5G Service Pack"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">SKU Unique *</label>
              <Input
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="Ex: HP-SCR-SAM-S22"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Code-barres / EAN</label>
              <Input
                value={formBarcode}
                onChange={(e) => setFormBarcode(e.target.value)}
                placeholder="Ex: 613000000000"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Réf Fournisseur</label>
              <Input
                value={formSupplierSku}
                onChange={(e) => setFormSupplierSku(e.target.value)}
                placeholder="Ex: GH82-26031A"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Marque *</label>
              <Select value={formBrandId} onChange={(e) => setFormBrandId(e.target.value)}>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Catégorie *</label>
              <Select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)}>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Section 2: Tarification Algérie (DZD) */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-orange-600" />
              Tarification en Dinars Algériens (DZD)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Prix d'Achat (Coût)</label>
                <Input
                  type="number"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Prix Public (B2C)</label>
                <Input
                  type="number"
                  value={formB2cPrice}
                  onChange={(e) => setFormB2cPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Prix Promo B2C</label>
                <Input
                  type="number"
                  value={formB2cSalePrice ?? ''}
                  placeholder="Optionnel"
                  onChange={(e) => setFormB2cSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-purple-700 block mb-0.5">Prix Grossiste B2B</label>
                <Input
                  type="number"
                  value={formB2bPrice}
                  onChange={(e) => setFormB2bPrice(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Compatibilité Téléphones */}
          <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200">
            <h4 className="text-xs font-bold text-orange-900 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              Compatibilité Modèles & Variantes (Recherche Rapide)
            </h4>

            {formCompatibility.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {formCompatibility.map((c, i) => (
                  <div
                    key={i}
                    className="p-2 bg-white rounded-lg border border-orange-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">
                        {c.brandName} {c.modelName} ({c.modelCode})
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono block">
                        Variantes: {c.variants.join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveCompatibility(i)}
                      className="text-gray-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-orange-100">
              <Input
                placeholder="Marque (ex: Apple)"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
              <Input
                placeholder="Modèle (ex: iPhone 13 Pro)"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
              />
              <Input
                placeholder="Code (ex: A2638)"
                value={newModelCode}
                onChange={(e) => setNewModelCode(e.target.value)}
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Variantes (A2636, A2639)"
                  value={newVariants}
                  onChange={(e) => setNewVariants(e.target.value)}
                />
                <Button size="sm" onClick={handleAddCompatibility} type="button" className="shrink-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Section 4: Image & Médias (Supabase Storage) */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Image Principale (URL ou Upload)</label>
            <div className="flex items-center gap-3">
              <img
                src={formImage || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100'}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
              />
              <Input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="URL d'image Supabase Storage"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button variant="outline" size="sm" type="button" disabled={isUploading} className="pointer-events-none">
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {isUploading ? 'Upload...' : 'Téléverser'}
                </Button>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveProduct}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {createProductMutation.isPending || updateProductMutation.isPending
                ? 'Sauvegarde...'
                : editingId
                ? 'Enregistrer Modifications'
                : 'Créer Produit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
