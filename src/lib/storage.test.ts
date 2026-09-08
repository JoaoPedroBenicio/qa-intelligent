import { describe, it, expect, beforeEach } from 'vitest';
import { readStorage, writeStorage, removeStorage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns fallback when key missing', () => {
    expect(readStorage('missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('roundtrips values', () => {
    writeStorage('k', { foo: 'bar' });
    expect(readStorage('k', null)).toEqual({ foo: 'bar' });
  });

  it('removes keys', () => {
    writeStorage('k', 1);
    removeStorage('k');
    expect(readStorage('k', 'fallback')).toBe('fallback');
  });

  it('falls back gracefully on corrupted JSON', () => {
    window.localStorage.setItem('bad', '{not json');
    expect(readStorage('bad', 'safe')).toBe('safe');
  });
});
