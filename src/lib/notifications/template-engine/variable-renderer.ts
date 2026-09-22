// DRIPIDIN Deterministic Variable Renderer
// Pure string interpolation with strict data-only boundaries.
// Zero eval, zero Function execution, zero prototype traversal.

export interface RenderOptions {
  stripUnmatchedTokens?: boolean;
}

const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const FORBIDDEN_TOKENS = new Set(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf']);

/**
 * Extracts all unique token names from a template string.
 */
export function extractTokens(template: string): string[] {
  if (!template) return [];
  const tokens = new Set<string>();
  let match: RegExpExecArray | null;

  const regex = new RegExp(TOKEN_REGEX.source, 'g');
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      tokens.add(match[1]);
    }
  }

  return Array.from(tokens);
}

/**
 * Validates template syntax for balanced braces and forbidden tokens.
 */
export function validateTemplateSyntax(template: string): { valid: boolean; error?: string } {
  if (typeof template !== 'string') {
    return { valid: false, error: 'Le modèle doit être une chaîne de caractères.' };
  }

  // Check for expressions, methods, or prototype chains like {{obj.prop}} or {{fn()}}
  const expressionCheck = /\{\{[^}]*[\.()+\-*\/\\=<>!&|;][^}]*\}\}/;
  if (expressionCheck.test(template)) {
    return {
      valid: false,
      error: 'Les expressions complexes, méthodes et accès imbriqués (.) sont interdits dans les modèles.',
    };
  }

  // Check for forbidden prototype / built-in tokens
  for (const forbidden of FORBIDDEN_TOKENS) {
    const forbiddenRegex = new RegExp(`\\{\\{\\s*${forbidden}\\s*\\}\\}`, 'i');
    if (forbiddenRegex.test(template)) {
      return { valid: false, error: `Accès non autorisé au token réservé : ${forbidden} (interdits)` };
    }
  }

  // Check for unbalanced braces
  let openCount = 0;
  for (let i = 0; i < template.length; i++) {
    if (template[i] === '{' && template[i + 1] === '{') {
      openCount++;
      i++;
    } else if (template[i] === '}' && template[i + 1] === '}') {
      openCount--;
      i++;
      if (openCount < 0) {
        return { valid: false, error: 'Accolade fermante sans accolade ouvrante correspondante.' };
      }
    }
  }

  if (openCount !== 0) {
    return { valid: false, error: 'Accolade ouvrante non fermée dans le modèle.' };
  }

  return { valid: true };
}

/**
 * Deterministically renders a template string with provided variable values.
 * Pure substitution only. Zero eval, zero code execution.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>,
  options: RenderOptions = { stripUnmatchedTokens: true }
): string {
  if (!template) return '';

  const syntaxCheck = validateTemplateSyntax(template);
  if (!syntaxCheck.valid) {
    throw new Error(syntaxCheck.error || 'Erreur de syntaxe dans le modèle.');
  }

  return template.replace(TOKEN_REGEX, (fullMatch, token) => {
    // Prevent prototype traversal
    if (FORBIDDEN_TOKENS.has(token) || !Object.prototype.hasOwnProperty.call(variables, token)) {
      return options.stripUnmatchedTokens ? '' : fullMatch;
    }

    const value = variables[token];
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  });
}
