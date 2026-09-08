import type { TestCase, TestCaseVersion } from '@/types/domain';
import { sanitizeCsvCell } from '@/lib/sanitize';

const CSV_HEADER = [
  'ID',
  'Título',
  'Descrição',
  'Pré-condições',
  'Prioridade',
  'Tags',
  'Ambiente',
  'Modo',
  'Veredito',
  'Passo',
  'Ação',
  'Resultado Esperado',
  'Versão',
  'Criado em',
] as const;

function pickCurrentVersion(tc: TestCase): TestCaseVersion {
  const found = tc.versions.find((v) => v.id === tc.currentVersionId);
  return found ?? tc.versions[tc.versions.length - 1]!;
}

export function testCasesToCsv(cases: TestCase[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADER.map(sanitizeCsvCell).join(','));

  for (const tc of cases) {
    const v = pickCurrentVersion(tc);
    for (let i = 0; i < v.steps.length; i++) {
      const step = v.steps[i];
      if (!step) continue;
      lines.push(
        [
          tc.id,
          v.title,
          v.description,
          v.preconditions,
          v.priority,
          v.tags.join(' '),
          v.environment,
          v.mode,
          v.verdict,
          String(i + 1),
          step.action,
          step.expected,
          v.id,
          v.createdAt,
        ]
          .map(sanitizeCsvCell)
          .join(','),
      );
    }
  }
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
