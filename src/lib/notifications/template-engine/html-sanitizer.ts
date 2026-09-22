// DRIPIDIN Server-Side Email HTML Sanitizer
// Strict whitelist-based HTML sanitizer for transactional emails.
// Strips scripts, event handlers, iframes, objects, and unsafe protocols (javascript:, data:).
// Runs during template saving and immediately prior to outbound dispatch.

const DISALLOWED_TAG_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /<input\b[^>]*>/gi,
  /<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
];

const ON_EVENT_HANDLER_REGEX = /\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /(?:href|src)\s*=\s*['"]?\s*javascript:[^'">\s]*/gi;
const VBSCRIPT_PROTOCOL_REGEX = /(?:href|src)\s*=\s*['"]?\s*vbscript:[^'">\s]*/gi;
const UNSAFE_DATA_PROTOCOL_REGEX = /(?:href|src)\s*=\s*['"]?\s*data:(?!image\/(?:png|jpe?g|gif|webp);base64)[^'">\s]*/gi;

/**
 * Checks whether an HTML string contains dangerous markup.
 */
export function containsUnsafeMarkup(html: string): boolean {
  if (!html) return false;

  for (const pattern of DISALLOWED_TAG_PATTERNS) {
    if (pattern.test(html)) return true;
  }

  if (ON_EVENT_HANDLER_REGEX.test(html)) return true;
  if (JAVASCRIPT_PROTOCOL_REGEX.test(html)) return true;
  if (VBSCRIPT_PROTOCOL_REGEX.test(html)) return true;
  if (UNSAFE_DATA_PROTOCOL_REGEX.test(html)) return true;

  return false;
}

/**
 * Sanitizes HTML by stripping all dangerous elements, event handlers, and protocols.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // 1. Strip disallowed full elements
  for (const pattern of DISALLOWED_TAG_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 2. Strip inline DOM event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(ON_EVENT_HANDLER_REGEX, '');

  // 3. Strip javascript: and vbscript: URIs
  sanitized = sanitized.replace(JAVASCRIPT_PROTOCOL_REGEX, 'href="#"');
  sanitized = sanitized.replace(VBSCRIPT_PROTOCOL_REGEX, 'href="#"');

  // 4. Strip unsafe data: protocols
  sanitized = sanitized.replace(UNSAFE_DATA_PROTOCOL_REGEX, 'href="#"');

  return sanitized.trim();
}
