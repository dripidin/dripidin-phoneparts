'use client';

// Categories & Brands Hierarchy Management Views for HamzaPhone

import React, { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from '@/lib/hooks/use-admin-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { FolderTree, Plus, Tags, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export function CategoriesView() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDisplayOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setDisplayOrder(c.display_order || 0);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name) return;
    try {
      if (editingId) {
        await updateCategoryMutation.mutateAsync({
          id: editingId,
          data: { name, slug: slug || undefined, displayOrder },
        });
        setActionSuccess('Catégorie mise à jour avec succès.');
      } else {
        await createCategoryMutation.mutateAsync({
          name,
          slug: slug || undefined,
          displayOrder,
        });
        setActionSuccess('Catégorie créée avec succès.');
      }
      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Supprimer la catégorie "${catName}" ?`)) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
      setActionSuccess('Catégorie supprimée.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-orange-600" />
            Catégories & Arborescence Pièces ({categories.length})
          </h2>
          <p className="text-xs text-gray-500">
            Structure hiérarchique: Écrans, Batteries, Nappes, Connecteurs, Châssis, ICs et Outils
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
          <Plus className="w-3.5 h-3.5" />
          Nouvelle Catégorie
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[11px] uppercase">
            <tr>
              <th className="px-3 py-3">Ordre</th>
              <th className="px-3 py-3">Nom de Catégorie</th>
              <th className="px-3 py-3">Slug URL</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  Chargement des catégories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                  Aucune catégorie enregistrée.
                </td>
              </tr>
            ) : (
              categories.map((c: any, i: number) => (
                <tr key={c.id} className="hover:bg-gray-50/70">
                  <td className="px-3 py-3 font-mono font-bold text-gray-400">#{c.display_order || i + 1}</td>
                  <td className="px-3 py-3 font-bold text-gray-900">{c.name}</td>
                  <td className="px-3 py-3 font-mono text-gray-500">{c.slug}</td>
                  <td className="px-3 py-3">
                    <Badge variant={c.is_active ? 'success' : 'default'} className="text-[10px]">
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Nom de la Catégorie *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Écrans & Afficheurs" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Slug URL</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ecrans-afficheurs" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Ordre d'Affichage</label>
            <Input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 font-bold">
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function BrandsView() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingId(b.id);
    setName(b.name);
    setSlug(b.slug);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name) return;
    try {
      if (editingId) {
        await updateBrandMutation.mutateAsync({
          id: editingId,
          data: { name, slug: slug || undefined },
        });
        setActionSuccess('Marque mise à jour.');
      } else {
        await createBrandMutation.mutateAsync({
          name,
          slug: slug || undefined,
        });
        setActionSuccess('Marque créée.');
      }
      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, brandName: string) => {
    if (!confirm(`Supprimer la marque "${brandName}" ?`)) return;
    try {
      await deleteBrandMutation.mutateAsync(id);
      setActionSuccess('Marque supprimée.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tags className="w-5 h-5 text-orange-600" />
            Marques & Fabricants Smartphones ({brands.length})
          </h2>
          <p className="text-xs text-gray-500">
            Marques prises en charge: Samsung, Apple, Xiaomi, Realme, Oppo, Huawei, Tecno, Infinix
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
          <Plus className="w-3.5 h-3.5" />
          Nouvelle Marque
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-gray-400 text-xs">
            Chargement des marques...
          </div>
        ) : brands.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-400 text-xs">
            Aucune marque enregistrée.
          </div>
        ) : (
          brands.map((b: any) => (
            <div key={b.id} className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">{b.name}</span>
                <Badge variant={b.is_active ? 'orange' : 'default'} className="text-[10px]">
                  {b.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-gray-400">Slug: /{b.slug}</p>
              <div className="pt-2 flex items-center justify-end gap-1 text-xs border-t border-gray-50">
                <button
                  onClick={() => openEditModal(b)}
                  className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="p-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brand Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier Marque' : 'Nouvelle Marque'}
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Nom de la Marque *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Xiaomi" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">Slug URL</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="xiaomi" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 font-bold">
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
