import type { TestCaseVersion } from '@/types/domain';

const SELECTOR_KEYWORDS: Array<{ pattern: RegExp; selector: (m: string) => string }> = [
  {
    pattern: /bot(ão|ao)?\s+(?:de\s+)?["']?exportar["']?/i,
    selector: () => `page.getByRole('button', { name: /exportar/i })`,
  },
  {
    pattern: /bot(ão|ao)?\s+(?:de\s+)?["']?salvar["']?/i,
    selector: () => `page.getByRole('button', { name: /salvar/i })`,
  },
  {
    pattern: /bot(ão|ao)?\s+(?:de\s+)?["']?cancelar["']?/i,
    selector: () => `page.getByRole('button', { name: /cancelar/i })`,
  },
  {
    pattern: /bot(ão|ao)?\s+(?:de\s+)?["']?confirmar["']?/i,
    selector: () => `page.getByRole('button', { name: /confirmar/i })`,
  },
  {
    pattern: /bot(ão|ao)?\s+(?:de\s+)?["']?aplicar["']?/i,
    selector: () => `page.getByRole('button', { name: /aplicar/i })`,
  },
  {
    pattern: /campo\s+(?:de\s+)?["']?(email|senha|password)["']?/i,
    selector: (m) =>
      m.toLowerCase().includes('senha') || m.toLowerCase().includes('password')
        ? `page.getByLabel(/senha|password/i)`
        : `page.getByLabel(/email/i)`,
  },
  {
    pattern: /link\s+["']?([^"']+)["']?/i,
    selector: (m) => `page.getByRole('link', { name: /${escapeRegex(m)}/i })`,
  },
  {
    pattern: /checkbox\s+["']?(selecionar\s+todas?)["']?/i,
    selector: () => `page.getByLabel(/selecionar todas/i).check()`,
  },
  {
    pattern: /filtro\s+(?:de\s+)?["']?([^"']+)["']?/i,
    selector: (m) => `page.getByRole('button', { name: /${escapeRegex(m)}/i }).click()`,
  },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 40);
}

export function generateSpec(version: Pick<TestCaseVersion, 'title' | 'steps'>): string {
  const lines: string[] = [
    `import { test, expect } from '@playwright/test';`,
    '',
    `test('${version.title.replace(/'/g, "\\'")}', async ({ page }) => {`,
    `  await page.goto('/');`,
  ];

  version.steps.forEach((step, idx) => {
    const trimmed = step.action.trim();
    let matched = false;

    for (const kw of SELECTOR_KEYWORDS) {
      const m = trimmed.match(kw.pattern);
      if (m) {
        const call = kw.selector(m[1] ?? m[0]);
        lines.push(`  // ${idx + 1}. ${step.action}`);
        lines.push(`  await ${call};`);
        matched = true;
        break;
      }
    }

    if (!matched) {
      lines.push(`  // ${idx + 1}. ${step.action}`);
      lines.push(`  // TODO: extrair seletor automaticamente`);
    }
  });

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
