'use client';

// HamzaPhone Roles & Granular Permissions Matrix View
// Features: Full role management, custom role creation/duplication, interactive permission editor,
// domain-grouped permission trees, and last-owner protection.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import {
  useRolesWithPermissions,
  useCreateRole,
  useUpdateRolePermissions,
  useDuplicateRole,
} from '@/lib/hooks/use-staff-roles';
import { PERMISSION_DOMAINS, SYSTEM_PERMISSIONS } from '@/lib/permissions/permission-registry';
import type { RoleDetail, PermissionDomain } from '@/types/staff-rbac.types';
import {
  ShieldCheck,
  Shield,
  Plus,
  Copy,
  Edit2,
  Check,
  X,
  Lock,
  Search,
  Layers,
  Save,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function RolesPermissionsView() {
  const { data: roles = [], isLoading } = useRolesWithPermissions();

  const createRoleMutation = useCreateRole();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const duplicateRoleMutation = useDuplicateRole();

  // Tab State
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'ROLES_EDITOR'>('MATRIX');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');

  // Modals State
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Selected Role for Editing / Duplicating
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');

  // Create Form State
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Set<string>>(new Set(['products.read']));

  // Duplicate Form State
  const [dupRoleCode, setDupRoleCode] = useState('');
  const [dupRoleName, setDupRoleName] = useState('');

  // Success Feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtered Permissions for Matrix
  const filteredPermissions = SYSTEM_PERMISSIONS.filter((perm) => {
    if (selectedDomainFilter !== 'ALL' && perm.domain !== selectedDomainFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = perm.code.toLowerCase().includes(q);
      const matchLabel = perm.labelFr.toLowerCase().includes(q);
      const matchDesc = perm.descriptionFr.toLowerCase().includes(q);
      if (!matchCode && !matchLabel && !matchDesc) return false;
    }
    return true;
  });

  // Handlers
  const openCreateModal = () => {
    setNewRoleCode('');
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRolePermissions(new Set(['products.read']));
    setIsCreateRoleModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode || !newRoleName) return;

    try {
      await createRoleMutation.mutateAsync({
        code: newRoleCode,
        name: newRoleName,
        description: newRoleDesc,
        permissionCodes: Array.from(newRolePermissions),
      });
      setIsCreateRoleModalOpen(false);
      setSuccessToast(`Rôle "${newRoleName}" créé avec succès.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openEditModal = (role: RoleDetail) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDesc(role.description || '');
    setSelectedPermissions(new Set(role.permissions));
    setIsEditRoleModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    try {
      await updatePermissionsMutation.mutateAsync({
        roleId: editingRole.id,
        input: {
          name: editRoleName,
          description: editRoleDesc,
          permissionCodes: Array.from(selectedPermissions),
        },
      });
      setIsEditRoleModalOpen(false);
      setSuccessToast(`Permissions du rôle "${editRoleName}" mises à jour.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openDuplicateModal = (role: RoleDetail) => {
    setEditingRole(role);
    setDupRoleCode(`${role.code}_COPY`);
    setDupRoleName(`${role.name} (Copie)`);
    setIsDuplicateModalOpen(true);
  };

  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !dupRoleCode || !dupRoleName) return;

    try {
      await duplicateRoleMutation.mutateAsync({
        sourceRoleId: editingRole.id,
        newRoleCode: dupRoleCode,
        newRoleName: dupRoleName,
      });
      setIsDuplicateModalOpen(false);
      setSuccessToast(`Rôle dupliqué sous "${dupRoleName}".`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const togglePermission = (permCode: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permCode)) next.delete(permCode);
      else next.add(permCode);
      return next;
    });
  };

  const toggleAllInDomain = (domain: PermissionDomain, isSelectAll: boolean) => {
    const domainPerms = SYSTEM_PERMISSIONS.filter((p) => p.domain === domain).map((p) => p.code);
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const p of domainPerms) {
        if (isSelectAll) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            Matrice des Rôles & Permissions Granulaires
          </h2>
          <p className="text-xs text-gray-500">
            Contrôle d'accès basé sur les ressources (RBAC) appliqué au niveau serveur et PostgreSQL RLS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'MATRIX' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Matrice Globale
            </button>
            <button
              onClick={() => setActiveTab('ROLES_EDITOR')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ROLES_EDITOR' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gestionnaire des Rôles ({roles.length})
            </button>
          </div>

          <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Créer un Rôle
          </Button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MATRICE GLOBALE (CROSS-RESOURCE AUDIT)                             */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <Input
                placeholder="Filtrer permission, ressource ou action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedDomainFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDomainFilter === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tous les Domaines
              </button>
              {PERMISSION_DOMAINS.map((dom) => (
                <button
                  key={dom.id}
                  onClick={() => setSelectedDomainFilter(dom.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDomainFilter === dom.id
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dom.labelFr.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 min-w-72">Ressource × Action</th>
                    {roles.map((r) => (
                      <th key={r.code} className="px-2 py-3 text-center min-w-24">
                        <span className="block truncate">{r.name.split(' ')[0]}</span>
                        <span className="font-mono text-[9px] text-gray-400 normal-case block">
                          ({r.userCount} memb.)
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PERMISSION_DOMAINS.filter((dom) => selectedDomainFilter === 'ALL' || selectedDomainFilter === dom.id).map((dom) => {
                    const domainPerms = filteredPermissions.filter((p) => p.domain === dom.id);
                    if (domainPerms.length === 0) return null;

                    return (
                      <React.Fragment key={dom.id}>
                        <tr className="bg-gray-50/80 font-bold text-gray-700 text-xs">
                          <td colSpan={roles.length + 1} className="px-4 py-2 flex items-center justify-between">
                            <span>{dom.labelFr}</span>
                            <span className="text-[10px] text-gray-400 font-normal">{dom.descriptionFr}</span>
                          </td>
                        </tr>

                        {domainPerms.map((perm) => (
                          <tr key={perm.code} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="font-semibold text-gray-900 block">{perm.labelFr}</span>
                              <span className="font-mono text-[10px] text-gray-400">{perm.code}</span>
                            </td>

                            {roles.map((role) => {
                              const isGranted = role.code === 'OWNER' || role.permissions.includes(perm.code) || role.permissions.includes('all');

                              return (
                                <td key={role.code} className="px-2 py-2.5 text-center">
                                  {isGranted ? (
                                    <div className="w-5 h-5 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 mx-auto rounded-full bg-gray-100 text-gray-300 flex items-center justify-center">
                                      <X className="w-3 h-3 stroke-[2]" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GESTIONNAIRE & ÉDITEUR DES RÔLES                                   */}
      {/* ========================================================================= */}
      {activeTab === 'ROLES_EDITOR' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => (
            <div key={r.code} className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{r.name}</h3>
                    <span className="font-mono text-[11px] text-gray-400 block">{r.code}</span>
                  </div>

                  <Badge variant={r.code === 'OWNER' ? 'orange' : r.isSystem ? 'secondary' : 'default'} className="text-[10px]">
                    {r.isSystem ? 'Système' : 'Personnalisé'}
                  </Badge>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    Membres assignés :
                  </span>
                  <strong className="text-gray-900 font-mono">{r.userCount} collaborateurs</strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    Permissions actives :
                  </span>
                  <strong className="text-emerald-700 font-mono">
                    {r.code === 'OWNER' ? 'Toutes (Superadmin)' : `${r.permissions.length} accordées`}
                  </strong>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                {r.code !== 'OWNER' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(r)}
                    className="h-8 text-xs font-bold"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Modifier Permissions
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openDuplicateModal(r)}
                  className="h-8 text-xs text-gray-600 hover:text-gray-900"
                  title="Dupliquer ce rôle"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Dupliquer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE CUSTOM ROLE                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        title="Créer un Nouveau Rôle Personnalisé"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Code Unique du Rôle *</label>
              <Input
                value={newRoleCode}
                onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                placeholder="ex: STOCK_CONTROLLER"
                required
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nom du Rôle *</label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="ex: Contrôleur Inventaire Belfort"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Description</label>
            <Input
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="Description des responsabilités opérationnelles..."
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="font-bold text-gray-900 block">
              Permissions Initiales Accordées ({newRolePermissions.size})
            </label>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50/50">
              {PERMISSION_DOMAINS.map((dom) => {
                const domPerms = SYSTEM_PERMISSIONS.filter((p) => p.domain === dom.id);
                return (
                  <div key={dom.id} className="space-y-1.5">
                    <span className="font-bold text-gray-800 text-[11px] block">{dom.labelFr}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {domPerms.map((p) => (
                        <label key={p.code} className="flex items-center gap-2 p-1.5 bg-white rounded border border-gray-200 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={newRolePermissions.has(p.code)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewRolePermissions((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(p.code);
                                else next.delete(p.code);
                                return next;
                              });
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span className="truncate">{p.labelFr}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateRoleModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              {createRoleMutation.isPending ? 'Création...' : 'Créer le Rôle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT ROLE PERMISSIONS                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        title={`Modifier les Permissions : ${editingRole?.name}`}
        size="lg"
      >
        {editingRole && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nom du Rôle</label>
                <Input
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Code Système (Immuable)</label>
                <Input value={editingRole.code} disabled className="bg-gray-100 font-mono" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Description</label>
              <Input
                value={editRoleDesc}
                onChange={(e) => setEditRoleDesc(e.target.value)}
              />
            </div>

            {/* Interactive Domain Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  Matrice des Permissions Accordées ({selectedPermissions.size} / {SYSTEM_PERMISSIONS.length})
                </span>
                <span className="text-[11px] text-gray-500">
                  Affecte immédiatement les {editingRole.userCount} utilisateurs assignés
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-4 bg-gray-50/50">
                {PERMISSION_DOMAINS.map((dom) => {
                  const domPerms = SYSTEM_PERMISSIONS.filter((p) => p.domain === dom.id);
                  const allSelected = domPerms.every((p) => selectedPermissions.has(p.code));

                  return (
                    <div key={dom.id} className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                        <span className="font-bold text-gray-800">{dom.labelFr}</span>
                        <button
                          type="button"
                          onClick={() => toggleAllInDomain(dom.id, !allSelected)}
                          className="text-[10px] text-orange-600 hover:underline font-semibold"
                        >
                          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {domPerms.map((p) => (
                          <label
                            key={p.code}
                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              selectedPermissions.has(p.code)
                                ? 'bg-orange-50/40 border-orange-200'
                                : 'bg-gray-50/50 border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(p.code)}
                              onChange={() => togglePermission(p.code)}
                              className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                            />
                            <div>
                              <span className="font-semibold text-gray-900 block text-[11px]">{p.labelFr}</span>
                              <span className="font-mono text-[9px] text-gray-400">{p.code}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" type="button" onClick={() => setIsEditRoleModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updatePermissionsMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 font-bold"
              >
                {updatePermissionsMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Permissions'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: DUPLICATE ROLE                                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title={`Dupliquer le Rôle : ${editingRole?.name}`}
        size="md"
      >
        {editingRole && (
          <form onSubmit={handleDuplicateSubmit} className="space-y-4 text-xs">
            <p className="text-gray-500">
              Crée un nouveau rôle personnalisé en clonant l'intégralité des {editingRole.permissions.length} permissions de "{editingRole.name}".
            </p>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Nouveau Code de Rôle *</label>
              <Input
                value={dupRoleCode}
                onChange={(e) => setDupRoleCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Nouveau Nom *</label>
              <Input
                value={dupRoleName}
                onChange={(e) => setDupRoleName(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" type="button" onClick={() => setIsDuplicateModalOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={duplicateRoleMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 font-bold"
              >
                {duplicateRoleMutation.isPending ? 'Duplication...' : 'Confirmer la Duplication'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
