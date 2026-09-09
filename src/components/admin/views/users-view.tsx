'use client';

// HamzaPhone Staff Directory & Employee Management View
// Features: Staff list, role assignment, status toggling, last-owner safeguards,
// detailed user audit activity view, and dangerous actions confirmation modal.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import {
  useStaffList,
  useStaffDetails,
  useCreateStaffUser,
  useUpdateStaffUser,
  useToggleStaffStatus,
  useRolesWithPermissions,
} from '@/lib/hooks/use-staff-roles';
import type { StaffUserSummary } from '@/types/staff-rbac.types';
import type { AppRoleCode } from '@/types/rbac.types';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  Edit2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  History,
  Check,
  X,
  Eye,
  Key,
} from 'lucide-react';

export function UsersView() {
  const { data: staffList = [], isLoading } = useStaffList();
  const { data: roles = [] } = useRolesWithPermissions();

  const createStaffMutation = useCreateStaffUser();
  const updateStaffMutation = useUpdateStaffUser();
  const toggleStatusMutation = useToggleStaffStatus();

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Selected User for Edit / Detail / Confirmation
  const [selectedStaff, setSelectedStaff] = useState<StaffUserSummary | null>(null);
  const [selectedStaffIdForDetail, setSelectedStaffIdForDetail] = useState<string | null>(null);
  const { data: staffDetail } = useStaffDetails(selectedStaffIdForDetail);

  // Create Form State
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRoleCode, setNewRoleCode] = useState<AppRoleCode>('SUPPORT');

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleCode, setEditRoleCode] = useState<string>('SUPPORT');

  // Dangerous Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    who: string;
    what: string;
    loss: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Filtered Staff
  const filteredStaff = staffList.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && !u.isActive) return false;
    if (statusFilter === 'SUSPENDED' && u.isActive) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  // Metrics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((u) => u.isActive).length;
  const adminAndOwners = staffList.filter((u) => u.role === 'OWNER' || u.role === 'ADMINISTRATOR').length;
  const suspendedStaff = staffList.filter((u) => !u.isActive).length;

  // Handlers
  const openCreateModal = () => {
    setNewEmail('');
    setNewFullName('');
    setNewPhone('');
    setNewRoleCode('SUPPORT');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFullName) return;

    try {
      await createStaffMutation.mutateAsync({
        email: newEmail,
        fullName: newFullName,
        phone: newPhone || undefined,
        roleCode: newRoleCode,
      });
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openEditModal = (staff: StaffUserSummary) => {
    setSelectedStaff(staff);
    setEditFullName(staff.fullName);
    setEditPhone(staff.phone || '');
    setEditRoleCode(staff.role);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    // If changing from OWNER to something else, prompt dangerous confirmation
    if (selectedStaff.role === 'OWNER' && editRoleCode !== 'OWNER') {
      setIsEditModalOpen(false);
      setConfirmConfig({
        title: 'Confirmation de Rétrogradation de Rôle',
        description: 'Vous êtes sur le point de retirer les privilèges Propriétaire (OWNER).',
        who: `${selectedStaff.fullName} (${selectedStaff.email})`,
        what: `Passage du rôle OWNER à ${editRoleCode}`,
        loss: 'Perte de l’accès superadministrateur total et de la gestion des secrets.',
        onConfirm: async () => {
          await updateStaffMutation.mutateAsync({
            staffId: selectedStaff.id,
            input: { fullName: editFullName, phone: editPhone, roleCode: editRoleCode },
          });
        },
      });
      setIsConfirmModalOpen(true);
      return;
    }

    try {
      await updateStaffMutation.mutateAsync({
        staffId: selectedStaff.id,
        input: { fullName: editFullName, phone: editPhone, roleCode: editRoleCode },
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleToggleStatusPrompt = (staff: StaffUserSummary) => {
    const nextStatus = !staff.isActive;

    if (!nextStatus) {
      // Suspending account: Dangerous action
      setConfirmConfig({
        title: 'Confirmation de Suspension de Compte Staff',
        description: 'La suspension bloquera immédiatement tout accès de cet utilisateur à l’espace d’administration.',
        who: `${staff.fullName} (${staff.email})`,
        what: `Suspension du compte (Statut : Inactif)`,
        loss: 'Toutes les permissions administratives seront révoquées instantanément.',
        onConfirm: async () => {
          await toggleStatusMutation.mutateAsync({ staffId: staff.id, isActive: false });
        },
      });
      setIsConfirmModalOpen(true);
    } else {
      // Reactivating account
      toggleStatusMutation.mutate({ staffId: staff.id, isActive: true });
    }
  };

  const openDetailModal = (staffId: string) => {
    setSelectedStaffIdForDetail(staffId);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-600" />
            Répertoire des Membres du Staff ({totalStaff})
          </h2>
          <p className="text-xs text-gray-500">
            Contrôle des accès collaborateurs, attribution des rôles opérationnels et traçabilité des actions
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nouveau Membre Staff
        </Button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Total Collaborateurs</span>
          <strong className="text-lg font-bold text-gray-900">{totalStaff} membres</strong>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Actifs & Opérationnels</span>
          <strong className="text-lg font-bold text-emerald-700">{activeStaff} connectables</strong>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Admins & Propriétaires</span>
          <strong className="text-lg font-bold text-orange-600">{adminAndOwners} comptes</strong>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <span className="text-gray-500 block text-[11px]">Comptes Suspendus</span>
          <strong className="text-lg font-bold text-red-600">{suspendedStaff} révoqués</strong>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <Input
            placeholder="Rechercher nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-bold">Rôle :</span>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-8"
            >
              <option value="ALL">Tous les rôles</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-bold">Statut :</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs h-8"
            >
              <option value="ALL">Tous</option>
              <option value="ACTIVE">Actifs uniquement</option>
              <option value="SUSPENDED">Suspendus uniquement</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[11px] uppercase">
            <tr>
              <th className="px-4 py-3">Membre du Personnel</th>
              <th className="px-4 py-3">Rôle Assigné</th>
              <th className="px-4 py-3">Permissions</th>
              <th className="px-4 py-3">État</th>
              <th className="px-4 py-3">Dernière Activité</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Chargement des membres du personnel...
                </td>
              </tr>
            ) : filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Aucun membre du personnel ne correspond aux critères.
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {staff.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">{staff.fullName}</span>
                        <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-300" />
                          {staff.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        staff.role === 'OWNER'
                          ? 'orange'
                          : staff.role === 'ADMINISTRATOR'
                          ? 'default'
                          : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {staff.roleName || staff.role}
                    </Badge>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      <Shield className="w-3 h-3 text-gray-500" />
                      {staff.role === 'OWNER' ? 'Toutes (Superadmin)' : `${staff.permissionsCount} permissions`}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {staff.isActive ? (
                      <Badge variant="success" className="text-[10px] flex items-center gap-1 w-fit">
                        <Check className="w-2.5 h-2.5" /> Actif
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] flex items-center gap-1 w-fit">
                        <X className="w-2.5 h-2.5" /> Suspendu
                      </Badge>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-[11px]">
                    {staff.lastLoginAt ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {new Date(staff.lastLoginAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-italic">Jamais connecté</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDetailModal(staff.id)}
                        className="h-7 px-2 text-[11px] text-gray-600 hover:text-gray-900"
                        title="Voir le profil et les logs d'activité"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Profil
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(staff)}
                        className="h-7 px-2 text-[11px]"
                        title="Changer de rôle ou d'informations"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>

                      <Button
                        size="sm"
                        variant={staff.isActive ? 'outline' : 'default'}
                        onClick={() => handleToggleStatusPrompt(staff)}
                        className={`h-7 px-2 text-[11px] ${
                          staff.isActive
                            ? 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={staff.isActive ? 'Suspendre l’accès' : 'Réactiver le compte'}
                      >
                        {staff.isActive ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE STAFF USER                                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un Nouveau Collaborateur Staff"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <p className="text-gray-500">
            Créez un compte pour un employé de DRIPIDIN et assignez-lui un rôle avec privilèges délimités.
          </p>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Nom et Prénom *</label>
            <Input
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="ex: Amina Touati"
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Adresse E-mail Professionnelle *</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="ex: amina.touati@dripidin.com"
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Téléphone de Contact</label>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+213 550..."
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Rôle Opérationnel *</label>
            <Select
              value={newRoleCode}
              onChange={(e) => setNewRoleCode(e.target.value as AppRoleCode)}
            >
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 text-[11px] space-y-1">
            <span className="font-bold block flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              Sécurité du Mot de Passe
            </span>
            <p>
              Un e-mail d'invitation sécurisé sera transmis pour permettre au collaborateur de définir son mot de passe en 2FA.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createStaffMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              {createStaffMutation.isPending ? 'Création...' : 'Créer le Membre Staff'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STAFF USER                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier le Profil : ${selectedStaff?.fullName}`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Nom et Prénom</label>
            <Input
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Téléphone</label>
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Rôle Opérationnel</label>
            <Select
              value={editRoleCode}
              onChange={(e) => setEditRoleCode(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateStaffMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              {updateStaffMutation.isPending ? 'Enregistrement...' : 'Mettre à Jour'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: STAFF DETAIL & RECENT AUDIT ACTIVITY                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Profil Collaborateur : ${staffDetail?.fullName || 'Détails'}`}
        size="lg"
      >
        {staffDetail && (
          <div className="space-y-6 text-xs">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-400 block text-[11px]">E-mail</span>
                <strong className="text-gray-900 font-mono">{staffDetail.email}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Rôle Actuel</span>
                <Badge variant="outline">{staffDetail.roleName}</Badge>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Statut</span>
                <Badge variant={staffDetail.isActive ? 'success' : 'destructive'}>
                  {staffDetail.isActive ? 'Actif' : 'Suspendu'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Création</span>
                <span className="text-gray-700 font-mono">
                  {new Date(staffDetail.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Permissions breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Permissions Effectives ({staffDetail.permissions.length})
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                {staffDetail.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-700 border border-gray-200"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Audit Activity Log */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-orange-600" />
                Activités & Événements Récents
              </h4>
              {staffDetail.recentActivity.length === 0 ? (
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center text-gray-400">
                  Aucune activité récente enregistrée pour ce compte.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {staffDetail.recentActivity.map((act) => (
                    <div key={act.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900 font-mono block">{act.action}</span>
                        <span className="text-gray-500 text-[11px]">{act.details || `${act.entityType} (${act.entityId})`}</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {new Date(act.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DANGEROUS ACTION CONFIRMATION                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmConfig?.title || 'Action Critique'}
        size="md"
      >
        {confirmConfig && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-900">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-900">Avertissement de Sécurité</p>
                <p className="mt-1 text-red-800">{confirmConfig.description}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-bold">Compte Cible :</span>
                <strong className="text-gray-900 font-mono">{confirmConfig.who}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-bold">Action Demandée :</span>
                <span className="text-gray-800">{confirmConfig.what}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-red-700 font-bold">Impact Immédiat :</span>
                <span className="text-red-700 font-medium">{confirmConfig.loss}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  await confirmConfig.onConfirm();
                  setIsConfirmModalOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Confirmer l'Action
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
