// HamzaPhone Column Mapping Engine & Supplier Template Manager
// Maps diverse supplier column naming variations to HamzaPhone canonical schema

import type { CanonicalFieldKey, ColumnMappingConfig, SupplierMappingTemplate } from './types';

export interface CanonicalFieldDefinition {
  key: CanonicalFieldKey;
  label: string;
  labelFr: string;
  requiredForModes: string[];
  aliases: string[];
  description: string;
}

export const CANONICAL_FIELDS: CanonicalFieldDefinition[] = [
  {
    key: 'sku',
    label: 'Internal SKU',
    labelFr: 'Code Article (SKU)',
    requiredForModes: ['CREATE_ONLY', 'UPDATE_ONLY', 'UPSERT', 'PRICE_ONLY', 'STOCK_ONLY'],
    aliases: ['sku', 'code', 'ref', 'reference', 'code_article', 'ref_interne', 'item_code', 'item_no', 'part_number', 'part_no'],
    description: 'Identifiant unique de la pièce dans le catalogue HamzaPhone',
  },
  {
    key: 'supplier_sku',
    label: 'Supplier SKU',
    labelFr: 'Réf Fournisseur',
    requiredForModes: [],
    aliases: ['supplier_sku', 'ref_fournisseur', 'code_fournisseur', 'supplier_ref', 'vendor_sku', 'vendor_code', 'fab_ref'],
    description: 'Code de référence donné par le fournisseur ou l’usine',
  },
  {
    key: 'barcode',
    label: 'Barcode (EAN-13)',
    labelFr: 'Code-Barres / EAN',
    requiredForModes: [],
    aliases: ['barcode', 'ean', 'ean13', 'upc', 'code_barre', 'code_barres', 'gtin'],
    description: 'Code-barres international ou interne scannable',
  },
  {
    key: 'name',
    label: 'Product Title',
    labelFr: 'Désignation / Nom',
    requiredForModes: ['CREATE_ONLY', 'UPSERT'],
    aliases: ['name', 'title', 'nom', 'designation', 'designation_article', 'product_name', 'nom_produit', 'libelle'],
    description: 'Nom commercial complet de la pièce détachée',
  },
  {
    key: 'brand_name',
    label: 'Brand / Manufacturer',
    labelFr: 'Marque',
    requiredForModes: ['CREATE_ONLY'],
    aliases: ['brand', 'brand_name', 'marque', 'constructeur', 'fabricant', 'manufacturer'],
    description: 'Marque cible (ex: Samsung, Apple, Xiaomi, Realme)',
  },
  {
    key: 'category_path',
    label: 'Category Path',
    labelFr: 'Catégorie',
    requiredForModes: ['CREATE_ONLY'],
    aliases: ['category', 'category_path', 'categorie', 'famille', 'rubrique', 'sous_famille', 'type_piece'],
    description: 'Arborescence (ex: Écrans > Samsung > Série Galaxy S)',
  },
  {
    key: 'product_type',
    label: 'Quality Grade / Type',
    labelFr: 'Type / Qualité',
    requiredForModes: [],
    aliases: ['product_type', 'type', 'qualite', 'grade', 'quality', 'condition', 'etat'],
    description: 'Grade qualité (OEM_ORIGINAL, SERVICE_PACK, REFURBISHED, HIGH_COPY, etc.)',
  },
  {
    key: 'cost_price_dzd',
    label: 'Supplier Cost Price (DZD)',
    labelFr: 'Prix d’Achat Fournisseur (DZD)',
    requiredForModes: ['PRICE_ONLY'],
    aliases: ['cost', 'cost_price', 'cost_price_dzd', 'prix_achat', 'cout', 'pa_dzd', 'cout_revient', 'achat_dzd', 'supplier_price'],
    description: 'Coût d’acquisition unitaire en Dinars Algériens',
  },
  {
    key: 'b2c_price_dzd',
    label: 'B2C Retail Price (DZD)',
    labelFr: 'Prix Public B2C (DZD)',
    requiredForModes: [],
    aliases: ['b2c_price', 'b2c_price_dzd', 'prix_public', 'pv_ttc', 'prix_vente', 'prix_b2c', 'retail_price', 'selling_price'],
    description: 'Tarif public pour clients particuliers',
  },
  {
    key: 'b2b_price_dzd',
    label: 'B2B Wholesale Price (DZD)',
    labelFr: 'Prix Grossiste B2B (DZD)',
    requiredForModes: [],
    aliases: ['b2b_price', 'b2b_price_dzd', 'prix_grossiste', 'prix_pro', 'prix_b2b', 'wholesale_price', 'tarif_pro'],
    description: 'Tarif de base pour réparateurs et revendeurs agréés',
  },
  {
    key: 'stock_quantity',
    label: 'Stock Quantity',
    labelFr: 'Quantité en Stock',
    requiredForModes: ['STOCK_ONLY'],
    aliases: ['stock', 'stock_quantity', 'quantite', 'qte', 'dispo', 'quantite_stock', 'inventory', 'qty', 'units'],
    description: 'Quantité physique disponible à réceptionner ou ajuster',
  },
  {
    key: 'low_stock_threshold',
    label: 'Low Stock Alert Threshold',
    labelFr: 'Seuil d’Alerte Stock',
    requiredForModes: [],
    aliases: ['low_stock_threshold', 'seuil_alerte', 'seuil_min', 'min_stock', 'safety_stock', 'alerte_stock'],
    description: 'Seuil déclenchant l’alerte de réapprovisionnement',
  },
  {
    key: 'weight_grams',
    label: 'Weight in Grams',
    labelFr: 'Poids (Grammes)',
    requiredForModes: [],
    aliases: ['weight', 'weight_grams', 'poids', 'poids_grammes', 'masse'],
    description: 'Poids du colis pour le calcul transporteur',
  },
  {
    key: 'description',
    label: 'Description',
    labelFr: 'Description Technique',
    requiredForModes: [],
    aliases: ['description', 'desc', 'details', 'specifications', 'notes', 'fiche_technique'],
    description: 'Description détaillée de la pièce',
  },
  {
    key: 'short_description',
    label: 'Short Summary',
    labelFr: 'Résumé Court',
    requiredForModes: [],
    aliases: ['short_description', 'resume', 'extrait', 'summary'],
    description: 'Bref extrait pour les listes',
  },
  {
    key: 'compatibility_raw',
    label: 'Compatibility List',
    labelFr: 'Modèles Compatibles',
    requiredForModes: [],
    aliases: ['compatibility', 'compatibility_raw', 'compatibilite', 'modeles', 'compatibles', 'compatible_models', 'devices'],
    description: 'Liste des modèles compatibles (ex: iPhone 13; iPhone 13 Pro)',
  },
];

export class ColumnMapperService {
  // In-memory registry of supplier templates for rapid retrieval
  private static supplierTemplates = new Map<string, SupplierMappingTemplate>();

  /**
   * Automatically generate intelligent column mapping guesses based on file headers
   */
  public static autoDetectMapping(headers: string[]): ColumnMappingConfig {
    const mapping: ColumnMappingConfig = {};
    const assignedCanonicalKeys = new Set<CanonicalFieldKey>();

    for (const header of headers) {
      const normalized = this.normalizeHeader(header);
      let bestMatch: CanonicalFieldKey | 'IGNORE' = 'IGNORE';

      // 1. Pass 1: Exact matches on field key or aliases
      for (const field of CANONICAL_FIELDS) {
        if (assignedCanonicalKeys.has(field.key)) continue;

        if (normalized === field.key.toLowerCase()) {
          bestMatch = field.key;
          break;
        }

        const exactAlias = field.aliases.some((alias) => this.normalizeHeader(alias) === normalized);
        if (exactAlias) {
          bestMatch = field.key;
          break;
        }
      }

      // 2. Pass 2: Partial matches if no exact match was found (sorting by alias length desc)
      if (bestMatch === 'IGNORE') {
        let longestMatchedLength = 0;
        for (const field of CANONICAL_FIELDS) {
          if (assignedCanonicalKeys.has(field.key)) continue;

          for (const alias of field.aliases) {
            const normAlias = this.normalizeHeader(alias);
            if (normAlias.length >= 3 && (normalized.includes(normAlias) || normAlias.includes(normalized))) {
              if (normAlias.length > longestMatchedLength) {
                longestMatchedLength = normAlias.length;
                bestMatch = field.key;
              }
            }
          }
        }
      }

      mapping[header] = bestMatch;
      if (bestMatch !== 'IGNORE') {
        assignedCanonicalKeys.add(bestMatch);
      }
    }

    return mapping;
  }

  /**
   * Retrieve saved mapping template for a supplier, or auto-detect if none exists
   */
  public static getMappingForSupplier(supplierId: string, headers: string[]): ColumnMappingConfig {
    const template = this.supplierTemplates.get(supplierId);
    if (!template) {
      return this.autoDetectMapping(headers);
    }

    // Blend saved template with current file headers
    const mapping: ColumnMappingConfig = {};
    for (const header of headers) {
      if (template.mapping[header]) {
        mapping[header] = template.mapping[header];
      } else {
        // Fallback auto-detection for unrecognized columns
        const auto = this.autoDetectMapping([header]);
        mapping[header] = auto[header] || 'IGNORE';
      }
    }
    return mapping;
  }

  /**
   * Save or update a mapping template for a supplier
   */
  public static saveSupplierTemplate(template: Omit<SupplierMappingTemplate, 'id' | 'createdAt' | 'updatedAt'>): SupplierMappingTemplate {
    const existing = this.supplierTemplates.get(template.supplierId);
    const now = new Date().toISOString();
    const saved: SupplierMappingTemplate = {
      id: existing?.id || `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      supplierId: template.supplierId,
      supplierName: template.supplierName,
      templateName: template.templateName,
      mapping: template.mapping,
      hasHeaderRow: template.hasHeaderRow,
      delimiter: template.delimiter,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.supplierTemplates.set(template.supplierId, saved);
    return saved;
  }

  /**
   * List all registered supplier mapping templates
   */
  public static listSupplierTemplates(): SupplierMappingTemplate[] {
    return Array.from(this.supplierTemplates.values());
  }

  /**
   * Clean and normalize header strings for comparison
   */
  private static normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Strip accents
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
