import type { z } from 'zod';

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] failed to read "${key}":`, err);
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[storage] failed to write "${key}":`, err);
    return false;
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] failed to remove "${key}":`, err);
  }
}


export function persistedRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function readPersistedRecords<T>(
  key: string,
  persisted: unknown,
  field: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  fallback: T[],
): T[] {
  const value = persistedRecord(persisted)[field];
  if (value === undefined) return fallback;
  const valid: T[] = [];
  let invalid = !Array.isArray(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = schema.safeParse(item);
      if (result.success) valid.push(result.data);
      else invalid = true;
    }
  }
  if (invalid) {
    // Keep the original payload available before any later save replaces it.
    const recoveryKey = `${key}:recovery`;
    if (readStorage(recoveryKey, null) === null) writeStorage(recoveryKey, persisted);
    console.warn(`[storage] invalid records in "${key}"; original payload kept for recovery`);
  }
  return Array.isArray(value) ? valid : fallback;
}
