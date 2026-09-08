import { describe, it, expect, vi } from 'vitest';
import { nanoid } from './nanoid';

describe('nanoid', () => {
  it('returns a unique id', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => nanoid()));
    expect(ids.size).toBe(1000);
  });

  it('returns a string', () => {
    expect(typeof nanoid()).toBe('string');
  });

  it('returns reasonable length', () => {
    expect(nanoid().length).toBeGreaterThan(8);
  });
});


it('produces a schema-compatible UUID without randomUUID', () => {
  const original = globalThis.crypto;
  vi.stubGlobal('crypto', { getRandomValues: original.getRandomValues.bind(original) });
  try {
    expect(nanoid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  } finally { vi.unstubAllGlobals(); }
});
