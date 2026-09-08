import { describe, it, expect } from 'vitest';
import { TEMPLATES } from './templates';

describe('templates', () => {
  it('all templates return valid versions', () => {
    for (const t of TEMPLATES) {
      const versions = t.build();
      expect(versions.length).toBeGreaterThan(0);
      for (const v of versions) {
        expect(v.title).toBeTruthy();
        expect(v.steps.length).toBeGreaterThan(0);
        expect(v.steps.every((s) => s.action && s.expected)).toBe(true);
      }
    }
  });

  it('has at least one template per category', () => {
    const categories = new Set(TEMPLATES.map((t) => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it('template ids are unique', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
