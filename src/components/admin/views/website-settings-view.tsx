'use client';

// HamzaPhone Global Website Settings & Structured Homepage CMS Console
// Manage Store Identity, Contact details, Social channels, Storefront messaging,
// Homepage sections reordering, and versioned audit history.

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/card';
import { formatDate, ALGERIA_WILAYAS } from '@/lib/utils';
import { uploadStoreLogoAdmin } from '@/lib/actions/settings-cms.actions';
import {
  useWebsiteSettings,
  useUpdateWebsiteSettings,
  useSettingsHistory,
  useHomepageSections,
  useUpdateHomepageSection,
  useToggleHomepageSection,
  useReorderHomepageSections,
} from '@/lib/hooks/use-settings-cms';
import type {
  WebsiteSettings,
  HomepageSection,
  UpdateWebsiteSettingsInput,
  UpdateHomepageSectionInput,
} from '@/types/settings-cms.types';
import {
  Globe,
  Settings,
  Save,
  CheckCircle2,
  Share2,
  Search,
  ShieldCheck,
  Layout,
  History,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  Smartphone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Truck,
  DollarSign,
  Layers,
  Upload,
  Loader2,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';

export function WebsiteSettingsView() {
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'THEME' | 'COMMERCE' | 'SOCIAL_SEO' | 'MESSAGING' | 'CMS_HOMEPAGE' | 'HISTORY'>('IDENTITY');

  // Queries
  const { data: settings, isLoading: isSettingsLoading } = useWebsiteSettings();
  const { data: history = [] } = useSettingsHistory();
  const { data: sections = [], isLoading: isSectionsLoading } = useHomepageSections(true);

  // Mutations
  const updateSettingsMutation = useUpdateWebsiteSettings();
  const updateSectionMutation = useUpdateHomepageSection();
  const toggleSectionMutation = useToggleHomepageSection();
  const reorderSectionsMutation = useReorderHomepageSections();

  // Local Form State for Website Settings
  const [formData, setFormData] = useState<UpdateWebsiteSettingsInput>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const uploadedUrl = await uploadStoreLogoAdmin(data);
      setFormData((p) => ({ ...p, logoUrl: uploadedUrl }));
    } catch (err: any) {
      setLogoUploadError(err.message || 'Erreur lors du téléversement du logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Section Edit Modal State
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [sectionCtaLabel, setSectionCtaLabel] = useState('');
  const [sectionCtaUrl, setSectionCtaUrl] = useState('');
  const [sectionBadge, setSectionBadge] = useState('');

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation.mutateAsync(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const openSectionModal = (sec: HomepageSection) => {
    setEditingSection(sec);
    setSectionTitle(sec.title);
    setSectionSubtitle(sec.subtitle);
    setSectionCtaLabel(sec.ctaLabel || '');
    setSectionCtaUrl(sec.ctaUrl || '');
    setSectionBadge(sec.badgeText || '');
  };

  const handleSectionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      await updateSectionMutation.mutateAsync({
        sectionId: editingSection.id,
        input: {
          title: sectionTitle,
          subtitle: sectionSubtitle,
          ctaLabel: sectionCtaLabel || null,
          ctaUrl: sectionCtaUrl || null,
          badgeText: sectionBadge || null,
        },
      });
      setEditingSection(null);
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleMoveSection = (index: number, direction: 'UP' | 'DOWN') => {
    const newSections = [...sections];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    reorderSectionsMutation.mutate({
      orderedSectionIds: newSections.map((s) => s.id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-600" />
            Paramètres du Site, Vitrine & Gestionnaire CMS
          </h2>
          <p className="text-xs text-gray-500">
            Coordonnées Belfort, liens réseaux sociaux, bannières de réassurance, ordonnancement des sections d'accueil et historique d'audit
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('IDENTITY')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'IDENTITY' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Identité & Contact
          </button>

          <button
            onClick={() => setActiveTab('THEME')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'THEME' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Thème & Couleurs
          </button>

          <button
            onClick={() => setActiveTab('COMMERCE')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'COMMERCE' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Devise & Commerce
          </button>

          <button
            onClick={() => setActiveTab('SOCIAL_SEO')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'SOCIAL_SEO' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Réseaux & SEO
          </button>

          <button
            onClick={() => setActiveTab('MESSAGING')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'MESSAGING' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Messages Vitrine
          </button>

          <button
            onClick={() => setActiveTab('CMS_HOMEPAGE')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'CMS_HOMEPAGE' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            CMS Page d'Accueil ({sections.length})
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'HISTORY' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historique (v{settings?.version ?? 1})
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Paramètres enregistrés avec succès ! La vitrine a été mise à jour dynamiquement.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: IDENTITÉ & CONTACT MAGASIN                                         */}
      {/* ========================================================================= */}
      {activeTab === 'IDENTITY' && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-600" />
              Identité de la Boutique & Logo
            </h3>
            <p className="text-gray-500 text-[11px]">Informations officielles affichées dans l'en-tête, le pied de page et les factures.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nom Officiel du Magasin *</label>
              <Input
                value={formData.storeName || ''}
                onChange={(e) => setFormData((p) => ({ ...p, storeName: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Logo Principal de la Boutique</label>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-xs p-1">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo du Magasin"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold border border-gray-300 transition-colors">
                      {isUploadingLogo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-orange-600" />
                      )}
                      <span>{isUploadingLogo ? 'Téléversement...' : 'Téléverser Logo'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleLogoFileChange}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    {formData.logoUrl && formData.logoUrl !== '/logo.png' && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, logoUrl: '/logo.png' }))}
                        className="text-[11px] text-gray-500 hover:text-red-600 underline"
                      >
                        Par défaut
                      </button>
                    )}
                  </div>
                  <Input
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="URL directe ou chemin (ex: /logo.png)"
                    className="text-[11px] font-mono"
                  />
                  {logoUploadError && (
                    <p className="text-[11px] text-red-600 font-medium">{logoUploadError}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Slogan / Tagline Vitrine</label>
              <Input
                value={formData.tagline || ''}
                onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="ex. N°1 des Pièces Détachées Smartphones en Algérie"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Icône du Navigateur / Favicon (URL)</label>
              <Input
                value={formData.faviconUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, faviconUrl: e.target.value }))}
                placeholder="/favicon.ico ou URL personnalisée"
                className="font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-3">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              Coordonnées de Support Client & Commandes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Téléphone Principal Magasin *</label>
                <Input
                  value={formData.supportPhone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, supportPhone: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Numéro WhatsApp Support</label>
                <Input
                  value={formData.whatsappPhone || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, whatsappPhone: e.target.value }))}
                  placeholder="+213550000000"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">E-mail de Contact / Facturation</label>
                <Input
                  type="email"
                  value={formData.supportEmail || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, supportEmail: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-orange-600" />
              Localisation du Magasin & Entrepôt Central
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Wilaya de l'Entrepôt / Magasin *</label>
                <Select
                  value={formData.wilayaCode ? String(formData.wilayaCode) : '16'}
                  onChange={(e) => {
                    const code = parseInt(e.target.value, 10);
                    const found = ALGERIA_WILAYAS.find((w) => w.code === code);
                    setFormData((p) => ({
                      ...p,
                      wilayaCode: code,
                      wilayaName: found ? found.name : 'Alger',
                    }));
                  }}
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code.toString().padStart(2, '0')} - {w.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Commune / Ville *</label>
                <Input
                  value={formData.commune || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, commune: e.target.value }))}
                  placeholder="ex. El Harrach, Belfort"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Adresse Complète *</label>
                <Input
                  value={formData.addressLine || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder="Rue de Belfort, Centre Commercial"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="font-bold text-gray-700 block mb-1">Horaires d'Ouverture</label>
              <Input
                value={formData.openingHours || ''}
                onChange={(e) => setFormData((p) => ({ ...p, openingHours: e.target.value }))}
                placeholder="Samedi - Jeudi : 08h30 - 18h00"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending || isUploadingLogo}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB: THÈME & CHARTE GRAPHIQUE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'THEME' && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-600" />
              Charte Graphique & Tokens de Style (Tailwind CSS v4)
            </h3>
            <p className="text-gray-500 text-[11px]">
              Personnalisez les couleurs maîtresses de votre marque. Ces tokens sont injectés dynamiquement dans les variables CSS et consommés par toute la vitrine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Couleur Primaire (Marque) *</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor || '#ea580c'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <Input
                  value={formData.primaryColor || '#ea580c'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                  placeholder="#ea580c"
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Boutons d&apos;action, badges actifs, accents majeurs.</p>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Couleur Primaire Hover *</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColorHover || '#c2410c'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColorHover: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <Input
                  value={formData.primaryColorHover || '#c2410c'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColorHover: e.target.value }))}
                  placeholder="#c2410c"
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">État survol des boutons et liens primaires.</p>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Couleur Accent / Secondaire</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accentColor || '#f97316'}
                  onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <Input
                  value={formData.accentColor || '#f97316'}
                  onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                  placeholder="#f97316"
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Éléments de réassurance, notifications, tags.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100 pt-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Arrondi des Bordures (Border Radius)</label>
              <Select
                value={formData.borderRadiusToken || '0.75rem'}
                onChange={(e) => setFormData((p) => ({ ...p, borderRadiusToken: e.target.value }))}
              >
                <option value="0.25rem">Très Léger (4px - 0.25rem)</option>
                <option value="0.5rem">Subtil (8px - 0.5rem)</option>
                <option value="0.75rem">Moderne Arrondi (12px - 0.75rem)</option>
                <option value="1rem">Généreux (16px - 1rem)</option>
                <option value="1.5rem">Ultra Courbé (24px - 1.5rem)</option>
              </Select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Police d&apos;Écriture (Font Family)</label>
              <Select
                value={formData.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => setFormData((p) => ({ ...p, fontFamily: e.target.value }))}
              >
                <option value="Inter, sans-serif">Inter (Moderne & Technique)</option>
                <option value="Outfit, sans-serif">Outfit (Design & Élégant)</option>
                <option value="Roboto, sans-serif">Roboto (Neutre & E-commerce)</option>
                <option value="system-ui, sans-serif">Système Natif (Performance)</option>
              </Select>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/70 space-y-3">
            <span className="font-bold text-gray-700 text-xs block">Aperçu Visuel des Tokens de Marque :</span>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                style={{
                  backgroundColor: formData.primaryColor || '#ea580c',
                  color: '#ffffff',
                  borderRadius: formData.borderRadiusToken || '0.75rem',
                }}
                className="px-4 py-2 font-bold text-xs shadow-sm transition-all"
              >
                Bouton Principal
              </button>

              <span
                style={{
                  backgroundColor: `${formData.primaryColor || '#ea580c'}15`,
                  color: formData.primaryColor || '#ea580c',
                  borderRadius: formData.borderRadiusToken || '0.75rem',
                  borderColor: `${formData.primaryColor || '#ea580c'}40`,
                }}
                className="px-3 py-1 text-xs font-bold border"
              >
                Badge Vitrine
              </span>

              <span className="text-xs text-gray-500 font-mono">
                Variables CSS : --color-primary: {formData.primaryColor || '#ea580c'}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer la Charte Graphique'}
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB: DEVISE, COMMERCE & PAIEMENT                                          */}
      {/* ========================================================================= */}
      {activeTab === 'COMMERCE' && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Paramètres Monétaires, Devise & Politiques Commerciales
            </h3>
            <p className="text-gray-500 text-[11px]">
              Configuration centralisée de la monnaie, de l'affichage des prix vitrine, des préfixes de commande et des politiques de caisse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Code Devise ISO (ex: DZD, EUR, USD)</label>
              <Input
                value={formData.currencyCode || 'DZD'}
                onChange={(e) => setFormData((p) => ({ ...p, currencyCode: e.target.value.toUpperCase() }))}
                placeholder="DZD"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Symbole Monétaire (ex: DA, €, $)</label>
              <Input
                value={formData.currencySymbol || 'DA'}
                onChange={(e) => setFormData((p) => ({ ...p, currencySymbol: e.target.value }))}
                placeholder="DA"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Décimales Affichées</label>
              <select
                value={formData.currencyDecimals ?? 0}
                onChange={(e) => setFormData((p) => ({ ...p, currencyDecimals: parseInt(e.target.value, 10) }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value={0}>0 (ex: 1 500 DA / Dinars, Yen)</option>
                <option value={2}>2 (ex: 15.00 € / Euros, Dollars)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Position du Symbole</label>
              <select
                value={formData.currencyPosition || 'AFTER'}
                onChange={(e) => setFormData((p) => ({ ...p, currencyPosition: e.target.value as 'BEFORE' | 'AFTER' }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                <option value="AFTER">Après le montant (ex: 1 500 DA)</option>
                <option value="BEFORE">Avant le montant (ex: $ 1,500)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Préfixe des Numéros de Commande</label>
              <Input
                value={formData.orderPrefix || 'DRP'}
                onChange={(e) => setFormData((p) => ({ ...p, orderPrefix: e.target.value.toUpperCase() }))}
                placeholder="DRP"
                required
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Exemple généré : {formData.orderPrefix || 'DRP'}-2026-0001</span>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Seuil Livraison Gratuite ({formData.currencySymbol || 'DA'})</label>
              <Input
                type="number"
                min="0"
                value={formData.freeShippingThresholdDzd ?? 50000}
                onChange={(e) => setFormData((p) => ({ ...p, freeShippingThresholdDzd: parseInt(e.target.value, 10) || 0 }))}
                placeholder="50000"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">0 = désactivé (livraison toujours payante)</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Politiques Commerciales & de Caisse</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50">
                <input
                  type="checkbox"
                  checked={formData.enableCashOnDelivery ?? true}
                  onChange={(e) => setFormData((p) => ({ ...p, enableCashOnDelivery: e.target.checked }))}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Paiement en Espèces à la Livraison (COD)</span>
                  <span className="text-gray-500 text-[11px]">Permet aux clients de régler leur commande directement au coursier à la réception.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50">
                <input
                  type="checkbox"
                  checked={formData.pricesIncludeTax ?? true}
                  onChange={(e) => setFormData((p) => ({ ...p, pricesIncludeTax: e.target.checked }))}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Prix Affichés TTC (Toutes Taxes Comprises)</span>
                  <span className="text-gray-500 text-[11px]">Les montants saisis et présentés sur la vitrine incluent déjà la fiscalité.</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer bg-gray-50/50">
                <input
                  type="checkbox"
                  checked={formData.enableCommercialRounding ?? false}
                  onChange={(e) => setFormData((p) => ({ ...p, enableCommercialRounding: e.target.checked }))}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Arrondi Commercial pour Espèces (Cash Rounding)</span>
                  <span className="text-gray-500 text-[11px]">Arrondit les totaux d'espèces à l'unité de coupure configurée ci-contre.</span>
                </div>
              </label>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Unité d'arrondi commercial</label>
                <select
                  value={formData.commercialRoundingUnit ?? 10}
                  onChange={(e) => setFormData((p) => ({ ...p, commercialRoundingUnit: parseInt(e.target.value, 10) as 10 | 50 | 100 }))}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  disabled={!formData.enableCommercialRounding}
                >
                  <option value={10}>10 (ex: 10 DA)</option>
                  <option value={50}>50 (ex: 50 DA)</option>
                  <option value={100}>100 (ex: 100 DA)</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">Ex: 10 pour arrondir aux 10 DA les plus proches.</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer les Paramètres Commerciaux'}
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RÉSEAUX SOCIAUX & SEO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'SOCIAL_SEO' && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Liens des Réseaux Sociaux Officiels
            </h3>
            <p className="text-gray-500 text-[11px]">Affichés dans le pied de page et le bandeau de contact de la vitrine.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Page Facebook</label>
              <Input
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, facebookUrl: e.target.value }))}
                placeholder="https://facebook.com/votre-boutique"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Compte Instagram</label>
              <Input
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, instagramUrl: e.target.value }))}
                placeholder="https://instagram.com/votre-boutique"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Compte TikTok</label>
              <Input
                value={formData.tiktokUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, tiktokUrl: e.target.value }))}
                placeholder="https://tiktok.com/@votre-boutique"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Chaîne YouTube</label>
              <Input
                value={formData.youtubeUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, youtubeUrl: e.target.value }))}
                placeholder="https://youtube.com/@votre-boutique"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Canal Telegram</label>
              <Input
                value={formData.telegramUrl || ''}
                onChange={(e) => setFormData((p) => ({ ...p, telegramUrl: e.target.value }))}
                placeholder="https://t.me/votre-boutique"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-5">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-purple-600" />
                Référencement Naturel (SEO) & Identité Web White-Label
              </h3>
              <p className="text-gray-500 text-[11px]">
                Configurez les métadonnées globales de votre boutique. Les moteurs de recherche et les plateformes de partage social consomment ces directives automatiquement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">URL Canonique Publique de la Boutique</label>
                <Input
                  value={formData.canonicalBaseUrl || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, canonicalBaseUrl: e.target.value }))}
                  placeholder="https://votre-boutique.com"
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Domaine de production utilisé pour <code>rel=&quot;canonical&quot;</code>, OpenGraph et le sitemap XML.
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Identifiant Twitter / X Officiel</label>
                <Input
                  value={formData.twitterHandle || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, twitterHandle: e.target.value }))}
                  placeholder="@votre_boutique"
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Utilisé pour les balises <code>twitter:site</code> et <code>twitter:creator</code>.
                </span>
              </div>
            </div>

            {/* Directives Robots */}
            <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Politique d&apos;Indexation des Moteurs de Recherche (Robots Policy)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.seoIndexable ?? true}
                    onChange={(e) => setFormData((p) => ({ ...p, seoIndexable: e.target.checked }))}
                    className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      Autoriser l&apos;Indexation Publique (INDEX)
                    </span>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      {formData.seoIndexable !== false
                        ? 'La vitrine et le catalogue sont indexés par Google, Bing et les moteurs de recherche.'
                        : 'Balise noindex active : la boutique est masquée des résultats de recherche.'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.seoFollowLinks ?? true}
                    onChange={(e) => setFormData((p) => ({ ...p, seoFollowLinks: e.target.checked }))}
                    className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      Suivre les Liens Internes (FOLLOW)
                    </span>
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      {formData.seoFollowLinks !== false
                        ? 'Les robots explorent l&apos;arborescence des catégories et des produits.'
                        : 'Balise nofollow active : les robots n&apos;explorent pas les liens internes.'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Balise Titre par Défaut (Meta Title)</label>
                <Input
                  value={formData.metaTitle || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, metaTitle: e.target.value }))}
                  placeholder={`${formData.storeName || 'Ma Boutique'} — Boutique en Ligne Officielle`}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description Globale (Meta Description)</label>
                <textarea
                  rows={2}
                  value={formData.metaDescription || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, metaDescription: e.target.value }))}
                  placeholder={`Découvrez les produits et pièces détachées sur la boutique ${formData.storeName || 'officielle'}.`}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mots-clés Principaux (séparés par des virgules)</label>
                <Input
                  value={formData.metaKeywords || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, metaKeywords: e.target.value }))}
                  placeholder="e-commerce, boutique en ligne, livraison express"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Image de Partage Réseaux Sociaux (Open Graph URL)</label>
                <Input
                  value={formData.ogImageUrl || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, ogImageUrl: e.target.value }))}
                  placeholder="/og-image.jpg ou URL absolue"
                  className="font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Live SERP & Social Sharing Previews */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                Aperçus en Direct (Google & Réseaux Sociaux)
              </h4>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Google Snippet Preview */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Aperçu Google Search
                    </span>
                    {formData.seoIndexable === false && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        NOINDEX
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate font-mono">
                    {formData.canonicalBaseUrl || 'https://votre-boutique.com'}/
                  </p>
                  <p className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
                    {formData.metaTitle || `${formData.storeName || 'Boutique en Ligne'} — Accueil`}
                  </p>
                  <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {formData.metaDescription ||
                      'Bienvenue sur notre boutique en ligne officielle. Découvrez notre sélection avec expédition rapide et service client dédié.'}
                  </p>
                </div>

                {/* Social Share Card Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                  <div className="h-28 bg-gray-100 flex items-center justify-center text-gray-400 relative overflow-hidden">
                    {formData.ogImageUrl ? (
                      <img
                        src={formData.ogImageUrl}
                        alt="Aperçu OG"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-[10px] text-gray-400">Aucune image OG configurée</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50/70 border-t border-gray-200 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">
                      {formData.canonicalBaseUrl
                        ? formData.canonicalBaseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
                        : 'votre-boutique.com'}
                    </p>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {formData.metaTitle || formData.storeName || 'DRIPIDIN'}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {formData.metaDescription || formData.tagline || 'Boutique en ligne officielle'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Enregistrer Réseaux & SEO
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MESSAGES VITRINE & RÉASSURANCE                                     */}
      {/* ========================================================================= */}
      {activeTab === 'MESSAGING' && (
        <form onSubmit={handleSettingsSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              Barre d'Annonce Supérieure de la Vitrine
            </h3>
            <p className="text-gray-500 text-[11px]">Bannière d'alerte ou promotionnelle visible tout en haut de chaque page.</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.announcementBarEnabled ?? true}
                onChange={(e) => setFormData((p) => ({ ...p, announcementBarEnabled: e.target.checked }))}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="font-bold text-gray-900">Activer la barre d'annonce sur la vitrine</span>
            </label>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Texte de l'Annonce</label>
              <Input
                value={formData.announcementBarText || ''}
                onChange={(e) => setFormData((p) => ({ ...p, announcementBarText: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Textes des 4 Piliers de Réassurance & Garanties
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-orange-500" /> Pilier 1 : Livraison Express
                </label>
                <Input
                  value={formData.deliveryBadgeText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, deliveryBadgeText: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> Pilier 2 : Paiement à la Livraison
                </label>
                <Input
                  value={formData.paymentBadgeText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, paymentBadgeText: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Pilier 3 : Pièces 100% Testées
                </label>
                <Input
                  value={formData.warrantyBadgeText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, warrantyBadgeText: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" /> Pilier 4 : Espace Grossiste B2B
                </label>
                <Input
                  value={formData.supportBadgeText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, supportBadgeText: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-3">
              Politique de Retour & Mentions du Pied de Page
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Texte d'Engagement Retour / SAV Ateliers</label>
                <Input
                  value={formData.returnPolicyText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, returnPolicyText: e.target.value }))}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Texte de Copyright Pied de Page</label>
                <Input
                  value={formData.footerCopyrightText || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, footerCopyrightText: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Enregistrer les Messages Vitrine
            </Button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CMS PAGE D'ACCUEIL                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'CMS_HOMEPAGE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-orange-600" />
                Agencement & Contenus de la Page d'Accueil
              </h3>
              <p className="text-gray-500 text-[11px]">
                Activez, désactivez ou réordonnez les sections visibles par vos clients sur la page d'accueil.
              </p>
            </div>
            <Badge variant="outline" className="text-gray-600">
              {sections.filter((s) => s.enabled).length} actives sur {sections.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`p-4 bg-white rounded-xl border transition-all flex items-center justify-between gap-4 text-xs ${
                  section.enabled ? 'border-gray-200 shadow-xs' : 'border-gray-200 bg-gray-50/70 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center font-mono font-bold text-gray-400 w-6">
                    #{section.orderIndex}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-gray-900">{section.name}</strong>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {section.sectionKey}
                      </Badge>
                      {section.badgeText && (
                        <Badge variant="default" className="text-[10px] bg-orange-100 text-orange-800 border-none">
                          {section.badgeText}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs font-medium">{section.title}</p>
                    <p className="text-gray-400 text-[11px] line-clamp-1">{section.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveSection(index, 'UP')}
                    disabled={index === 0}
                    className="h-7 w-7 p-0"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveSection(index, 'DOWN')}
                    disabled={index === sections.length - 1}
                    className="h-7 w-7 p-0"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openSectionModal(section)}
                    className="h-7 px-2 text-[11px]"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>

                  <Button
                    size="sm"
                    variant={section.enabled ? 'ghost' : 'outline'}
                    onClick={() => toggleSectionMutation.mutate({ sectionId: section.id, enabled: !section.enabled })}
                    className={`h-7 px-2 text-[11px] font-bold ${
                      section.enabled ? 'text-emerald-700 hover:bg-emerald-50' : 'text-gray-500'
                    }`}
                  >
                    {section.enabled ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                    {section.enabled ? 'Actif' : 'Désactivé'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HISTORIQUE DES VERSIONS & AUDIT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-600" />
              Journal des Modifications & Versions des Paramètres
            </h3>
            <p className="text-gray-500 text-[11px]">
              Traçabilité certifiée de chaque mise à jour de coordonnées, réseaux sociaux et contenus vitrine.
            </p>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="font-mono text-[10px]">
                      Version {item.version}
                    </Badge>
                    <strong className="text-gray-900">{item.changesSummary}</strong>
                  </div>
                  <span className="text-gray-400 text-[11px]">{formatDate(item.changedAt)}</span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1 border-t border-gray-100">
                  <span>Modifié par :</span>
                  <strong className="text-gray-700">{item.changedBy}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Edit Modal */}
      <Modal
        isOpen={Boolean(editingSection)}
        onClose={() => setEditingSection(null)}
        title={`Modifier la section : ${editingSection?.name || ''}`}
        size="lg"
      >
        <form onSubmit={handleSectionSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Titre Principal *</label>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Sous-titre / Description</label>
            <textarea
              rows={2}
              value={sectionSubtitle}
              onChange={(e) => setSectionSubtitle(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Texte du Bouton d'Action (CTA)</label>
              <Input
                value={sectionCtaLabel}
                onChange={(e) => setSectionCtaLabel(e.target.value)}
                placeholder="ex: Explorer le catalogue"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">URL de Redirection (Lien CTA)</label>
              <Input
                value={sectionCtaUrl}
                onChange={(e) => setSectionCtaUrl(e.target.value)}
                placeholder="ex: /products"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Badge Moteur / Tag d'Accroche</label>
            <Input
              value={sectionBadge}
              onChange={(e) => setSectionBadge(e.target.value)}
              placeholder="ex: N°1 en Algérie"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => setEditingSection(null)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateSectionMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 font-bold text-white"
            >
              {updateSectionMutation.isPending ? 'Enregistrement...' : 'Enregistrer la Section'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function SystemSettingsView() {
  const [currency] = useState('DZD');
  const [roundingUnit, setRoundingUnit] = useState('10');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          Paramètres Système & Règles Commerciales
        </h2>
        <p className="text-xs text-gray-500">
          Devise par défaut (DZD), règles d'arrondi monétaire et clés de configuration API
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Paramètres système sauvegardés avec succès.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Devise Principale</label>
            <Input value="Dinar Algérien (DZD / DA)" disabled />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Règle Arrondi par Défaut</label>
            <Select value={roundingUnit} onChange={(e) => setRoundingUnit(e.target.value)}>
              <option value="10">Arrondir aux 10 DA les plus proches</option>
              <option value="50">Arrondir aux 50 DA les plus proches</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 font-bold">
            <Save className="w-3.5 h-3.5 mr-1" />
            Enregistrer les Règles
          </Button>
        </div>
      </form>
    </div>
  );
}
