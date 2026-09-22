// DRIPIDIN Template Validator
// Validates template syntax, variable boundaries, channel constraints, and HTML safety.

import type { DomainEventType, NotificationChannelType } from '@/types/notifications.types';
import { extractTokens, validateTemplateSyntax } from './variable-renderer';
import { getAllowedTokensForEvent } from './variable-registry';
import { containsUnsafeMarkup, sanitizeEmailHtml } from './html-sanitizer';

export interface TemplateValidationInput {
  eventType: DomainEventType | string;
  channel: NotificationChannelType;
  subject?: string | null;
  bodyText: string;
  bodyHtml?: string | null;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedHtml?: string | null;
}

export class TemplateValidator {
  /**
   * Validates a notification template before storage or activation.
   */
  public static validate(input: TemplateValidationInput): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Mandatory Body Text
    if (!input.bodyText || input.bodyText.trim().length === 0) {
      errors.push('Le corps du message (texte brut) est obligatoire.');
    }

    // 2. Syntax Validation for Body Text
    const bodySyntax = validateTemplateSyntax(input.bodyText || '');
    if (!bodySyntax.valid && bodySyntax.error) {
      errors.push(`Erreur de syntaxe dans le corps : ${bodySyntax.error}`);
    }

    // 3. Subject validation for Email and Dashboard
    if (input.channel === 'EMAIL') {
      if (!input.subject || input.subject.trim().length === 0) {
        errors.push('L\'objet de l\'email est obligatoire.');
      } else {
        const subjectSyntax = validateTemplateSyntax(input.subject);
        if (!subjectSyntax.valid && subjectSyntax.error) {
          errors.push(`Erreur de syntaxe dans l'objet : ${subjectSyntax.error}`);
        }
      }
    }

    // 4. Token validation against Event Registry
    const allowedTokens = getAllowedTokensForEvent(input.eventType);
    const bodyTokens = extractTokens(input.bodyText || '');
    const subjectTokens = input.subject ? extractTokens(input.subject) : [];
    const allUsedTokens = new Set([...bodyTokens, ...subjectTokens]);

    for (const token of allUsedTokens) {
      if (!allowedTokens.has(token)) {
        errors.push(`La variable {{${token}}} n'est pas autorisée pour l'événement "${input.eventType}".`);
      }
    }

    // 5. Channel-Specific Length & Formatting Constraints
    if (input.channel === 'SMS') {
      if (input.bodyHtml && input.bodyHtml.trim().length > 0) {
        errors.push('Le format HTML n\'est pas supporté pour le canal SMS.');
      }
      if (input.bodyText && input.bodyText.length > 160) {
        warnings.push(
          `Le message SMS dépasse 160 caractères (${input.bodyText.length} caractères). Il sera facturé en plusieurs segments.`
        );
      }
    }

    // 6. Email HTML Sanitization & Safety
    let sanitizedHtml: string | null = null;
    if (input.channel === 'EMAIL' && input.bodyHtml) {
      if (containsUnsafeMarkup(input.bodyHtml)) {
        warnings.push('Des balises ou scripts non sécurisés ont été détectés et nettoyés du HTML.');
      }
      sanitizedHtml = sanitizeEmailHtml(input.bodyHtml);
      const htmlSyntax = validateTemplateSyntax(sanitizedHtml);
      if (!htmlSyntax.valid && htmlSyntax.error) {
        errors.push(`Erreur de syntaxe dans le HTML : ${htmlSyntax.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedHtml: sanitizedHtml ?? input.bodyHtml ?? null,
    };
  }
}

/**
 * Convenience helper function to validate a template directly.
 */
export function validateTemplate(
  bodyText: string,
  eventType: DomainEventType | string,
  channel: NotificationChannelType,
  subject?: string | null,
  bodyHtml?: string | null
): TemplateValidationResult {
  return TemplateValidator.validate({ eventType, channel, bodyText, subject, bodyHtml });
}

