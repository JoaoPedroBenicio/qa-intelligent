import { describe, it, expect } from 'vitest';
import { generateSpec } from './specGenerator';

describe('generateSpec', () => {
  it('produces valid Playwright test structure', () => {
    const spec = generateSpec({
      title: 'Login válido',
      steps: [
        { id: '1', action: 'Preencher email', expected: 'campo preenchido' },
        { id: '2', action: 'Clicar no botão Salvar', expected: 'salva' },
      ],
    });

    expect(spec).toMatch(/^import \{ test, expect \} from '@playwright\/test';/);
    expect(spec).toMatch(/test\('Login válido'/);
    expect(spec).toMatch(/page\.goto\('\/'\)/);
    expect(spec.trim().endsWith('});')).toBe(true);
  });

  it('generates spec even with empty steps', () => {
    const spec = generateSpec({ title: 'Vazio', steps: [] });
    expect(spec).toContain("test('Vazio'");
    expect(spec.trim().endsWith('});')).toBe(true);
  });

  it('extracts selectors from action keywords', () => {
    const spec = generateSpec({
      title: 'Exportação',
      steps: [{ id: '1', action: 'Clicar no botão de Exportar', expected: 'abre popup' }],
    });
    expect(spec).toMatch(/getByRole.*exportar/i);
  });

  it('falls back to TODO for unrecognized actions', () => {
    const spec = generateSpec({
      title: 'Custom',
      steps: [{ id: '1', action: 'Realizar uma operação mágica', expected: 'funciona' }],
    });
    expect(spec).toContain('TODO');
  });

  it('escapes single quotes in title', () => {
    const spec = generateSpec({ title: "Test's case", steps: [] });
    expect(spec).toMatch(/test\('Test\\'s case'/);
  });
});
