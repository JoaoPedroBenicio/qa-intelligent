import { describe, expect, it } from 'vitest';
import { createMigrations } from '@/lib/migrations';

describe('createMigrations', () => {
  it('returns state unchanged at target version', () => {
    const mig = createMigrations<{ a: number }>({});
    expect(mig({ a: 1 }, 0)).toEqual({ a: 1 });
  });

  it('applies migrations in order', () => {
    const mig = createMigrations<{ a: number; b?: number; c?: number }>({
      1: (s) => ({ ...(s as { a: number }), b: 2 }),
      2: (s) => ({ ...(s as { a: number; b: number }), c: 3 }),
    });
    const result = mig({ a: 1 }, 0);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('skips missing intermediate versions', () => {
    const mig = createMigrations<{ a: number; c?: number }>({
      2: (s) => ({ ...(s as { a: number }), c: 3 }),
    });
    const result = mig({ a: 1 }, 1);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('resets state if a migration throws', () => {
    const mig = createMigrations<{ a: number }>({
      1: () => {
        throw new Error('boom');
      },
    });
    expect(mig({ a: 1 }, 0)).toEqual({});
  });

  it('handles null/undefined persisted state', () => {
    const mig = createMigrations<{ a: number }>({
      1: (s) => ({ ...(s as { a: number }), a: 99 }),
    });
    expect(mig(null, 0)).toEqual({ a: 99 });
  });
});
