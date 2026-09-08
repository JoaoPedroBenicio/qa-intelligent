import { describe, it, expect } from 'vitest';
import { diffVersions, diffFields, diffSteps } from './diff';
import type { TestCaseVersion } from '@/types/domain';

const v1: TestCaseVersion = {
  id: 'a',
  createdAt: '2026-01-01',
  source: 'manual',
  title: 'Login',
  description: 'Fluxo de login',
  preconditions: 'Usuário cadastrado',
  priority: 'Alta',
  tags: ['auth', 'smoke'],
  environment: 'homologação',
  mode: 'video',
  verdict: 'NEEDS_REVIEW',
  steps: [
    { id: '1', action: 'Abrir login', expected: 'Form aparece' },
    { id: '2', action: 'Submeter', expected: 'Sucesso' },
  ],
  spec: '',
};

const v2: TestCaseVersion = {
  ...v1,
  id: 'b',
  title: 'Login com MFA',
  description: 'Fluxo de login com MFA',
  verdict: 'PASS',
  tags: ['auth', 'smoke', 'mfa'],
  steps: [
    { id: '1', action: 'Abrir login', expected: 'Form aparece' },
    { id: '3', action: 'Submeter MFA', expected: 'Código solicitado' },
  ],
};

describe('diff', () => {
  it('detects field changes', () => {
    const fields = diffFields(v1, v2);
    const title = fields.find((f) => f.field === 'Título');
    const verdict = fields.find((f) => f.field === 'Veredito');
    const env = fields.find((f) => f.field === 'Ambiente');

    expect(title?.kind).toBe('changed');
    expect(verdict?.kind).toBe('changed');
    expect(env?.kind).toBe('unchanged');
  });

  it('detects added/removed/changed steps', () => {
    const steps = diffSteps(v1, v2);
    expect(steps).toHaveLength(2);
    expect(steps[0]?.status).toBe('unchanged');
    expect(steps[1]?.status).toBe('changed');
    expect(steps[1]?.beforeAction).toBe('Submeter');
    expect(steps[1]?.afterAction).toBe('Submeter MFA');
  });

  it('detects added and removed tags', () => {
    const diff = diffVersions(v1, v2);
    expect(diff.tags.added).toEqual(['mfa']);
    expect(diff.tags.removed).toEqual([]);
  });

  it('full diff combines fields, steps, and tags', () => {
    const diff = diffVersions(v1, v2);
    expect(diff.fields.length).toBeGreaterThan(0);
    expect(diff.steps.length).toBe(2);
    expect(diff.tags.added.length + diff.tags.removed.length).toBeGreaterThan(0);
  });
});
