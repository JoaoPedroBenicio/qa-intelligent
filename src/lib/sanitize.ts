const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g; // eslint-disable-line no-control-regex
const TRAVERSAL_PATTERN = /\.\./g;

export function sanitizeFilename(input: string, fallback = 'download'): string {
  if (typeof input !== 'string') return fallback;
  const stripped = input.replace(INVALID_FILENAME_CHARS, '_').trim();
  if (!stripped) return fallback;
  const safe = stripped.replace(TRAVERSAL_PATTERN, '_');
  const trimmed = safe.replace(/^[. ]+|[. ]+$/g, '');
  if (!trimmed || /^[._]+$/.test(trimmed)) return fallback;
  return trimmed;
}

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const str = typeof value === 'string' && /^(?:[\t\r\n]|\s*[=+\-@])/.test(raw)
    ? `'${raw}`
    : raw;
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  if (/[\s<>]/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'blob:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
