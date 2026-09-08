import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  sanitizeCsvCell,
  sanitizeHtml,
  isSafeUrl,
} from './sanitize';

describe('sanitize', () => {
  describe('sanitizeFilename', () => {
    it('removes invalid chars', () => {
      expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
    });

    it('blocks traversal attempts', () => {
      expect(sanitizeFilename('../../etc/passwd')).not.toContain('..');
    });

    it('returns fallback for empty input', () => {
      expect(sanitizeFilename('')).toBe('download');
      expect(sanitizeFilename('   ')).toBe('download');
      expect(sanitizeFilename('...')).toBe('download');
    });
  });

  describe('sanitizeCsvCell', () => {
    it('quotes cells with commas, quotes, or newlines', () => {
      expect(sanitizeCsvCell('a,b')).toBe('"a,b"');
      expect(sanitizeCsvCell('she said "hi"')).toBe('"she said ""hi"""');
      expect(sanitizeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    });

    it('leaves clean cells unquoted', () => {
      expect(sanitizeCsvCell('simple')).toBe('simple');
      expect(sanitizeCsvCell(42)).toBe('42');
    });

    it('handles null and undefined', () => {
      expect(sanitizeCsvCell(null)).toBe('');
      expect(sanitizeCsvCell(undefined)).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('escapes all html entities', () => {
      expect(sanitizeHtml('<script>alert("x")</script>')).toBe(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
      );
    });
  });

  describe('isSafeUrl', () => {
    it('allows http/https/blob', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://localhost:3000')).toBe(true);
      expect(isSafeUrl('blob:http://localhost/abc')).toBe(true);
    });

    it('blocks javascript: and data:', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>')).toBe(false);
    });

    it('rejects malformed urls', () => {
      expect(isSafeUrl('not a url')).toBe(false);
    });
  });
});


it.each(['=1+1', '+SUM(A1:A2)', '-2+3', '@SUM(A1:A2)', '  =1+1', '\t=1+1', '\r=1+1'])(
  'exports formula-like text as a spreadsheet text cell: %s', (value) => {
    const cell = sanitizeCsvCell(value);
    expect(cell.startsWith("'") || cell.startsWith('"\'')).toBe(true);
  },
);
