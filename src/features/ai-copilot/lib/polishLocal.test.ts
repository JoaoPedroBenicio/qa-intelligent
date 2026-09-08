import { describe, it, expect } from 'vitest';
import { polishTestCaseLocally } from './polishLocal';

describe('polishTestCaseLocally', () => {
  it('extracts first line as title', () => {
    const result = polishTestCaseLocally({
      text: 'Login com sucesso\nClicar em Entrar\nVerificar redirecionamento',
    });
    expect(result.title).toBe('Validar login com sucesso');
  });

  it('produces structured steps from newlines', () => {
    const result = polishTestCaseLocally({
      text: 'Teste\nClicar em Salvar\nPreencher campo X',
    });
    expect(result.steps.length).toBe(2);
    expect(result.steps[0]?.action).toContain('Clicar');
    expect(result.steps[0]?.expected.length).toBeGreaterThan(0);
  });

  it('limits to 11 steps', () => {
    const text = Array.from({ length: 20 }, (_, i) => `Passo ${i + 1}`).join('\n');
    const result = polishTestCaseLocally({ text: `Title\n${text}` });
    expect(result.steps.length).toBeLessThanOrEqual(11);
  });

  it('uses NEEDS_REVIEW as default verdict (not PASS)', () => {
    const result = polishTestCaseLocally({ text: 'Login' });
    expect(result.verdict).toBe('NEEDS_REVIEW');
  });

  it('generates fallback step for empty text', () => {
    const result = polishTestCaseLocally({ text: '' });
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0]?.action).toBeTruthy();
  });

  it('derives steps from video filename when present', () => {
    const result = polishTestCaseLocally({
      text: '',
      attachments: [{ name: 'login-flow.mp4', size: 1024, mimeType: 'video/mp4' }],
    });
    expect(result.tags).toContain('with-evidence');
    expect(result.steps.some((s) => s.action.toLowerCase().includes('login'))).toBe(true);
  });

  it('preserves title prefix "Validar" if user already started with it', () => {
    const result = polishTestCaseLocally({ text: 'Validar fluxo de checkout' });
    expect(result.title).toBe('Validar fluxo de checkout');
  });
});
