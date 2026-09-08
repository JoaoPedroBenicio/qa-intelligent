import { z } from 'zod';
import { nanoid } from '@/lib/nanoid';
import type { TestCaseVersion } from '@/types/domain';
import { sanitizeCsvCell } from '@/lib/sanitize';

const RowSchema = z.object({
  ID: z.string().optional(),
  Título: z.string().min(1),
  Descrição: z.string().optional().default(''),
  'Pré-condições': z.string().optional().default(''),
  Prioridade: z.enum(['Alta', 'Média', 'Baixa']).default('Média'),
  Tags: z.string().optional().default(''),
  Ambiente: z.string().optional().default('homologação'),
  Modo: z.enum(['polidor', 'video', 'autonomo']).default('video'),
  Veredito: z.enum(['PASS', 'FAIL', 'BLOCKED', 'NEEDS_REVIEW']).default('NEEDS_REVIEW'),
  Passo: z.string().optional(),
  Ação: z.string().min(1),
  'Resultado Esperado': z.string().min(1),
});

export type ImportRow = z.infer<typeof RowSchema>;

export interface ParsedCsv {
  headers: string[];
  rows: ImportRow[];
  errors: Array<{ line: number; message: string }>;
}

const REQUIRED_HEADERS = ['Título', 'Ação', 'Resultado Esperado'] as const;
const BOM = '﻿';

function stripBom(s: string): string {
  return s.startsWith(BOM) ? s.slice(1) : s;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        cells.push(cur);
        cur = '';
      } else if (ch === '"' && cur === '') {
        inQuote = true;
      } else {
        cur += ch;
      }
    }
  }
  cells.push(cur);
  return cells;
}

export function parseCsv(content: string): ParsedCsv {
  const stripped = stripBom(content);
  const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], errors: [{ line: 0, message: 'Arquivo vazio.' }] };
  }

  const headers = parseCsvLine(lines[0]!).map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      headers,
      rows: [],
      errors: [{ line: 1, message: `Cabeçalhos faltando: ${missing.join(', ')}` }],
    };
  }

  const rows: ImportRow[] = [];
  const errors: ParsedCsv['errors'] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = parseCsvLine(lines[i]!);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (raw[idx] ?? '').trim();
    });
    const result = RowSchema.safeParse(obj);
    if (result.success) {
      rows.push(result.data);
    } else {
      errors.push({
        line: i + 1,
        message: result.error.issues[0]?.message ?? 'Linha inválida.',
      });
    }
  }

  return { headers, rows, errors };
}

export interface GroupedTestCase {
  title: string;
  versions: Omit<TestCaseVersion, 'id' | 'createdAt'>[];
}

export function groupIntoTestCases(rows: ImportRow[]): GroupedTestCase[] {
  interface Accumulator {
    title: string;
    row: ImportRow;
    steps: Array<{ id: string; action: string; expected: string }>;
  }
  const groups = new Map<string, Accumulator>();

  for (const row of rows) {
    const key = row.ID || row.Título;
    const existing = groups.get(key);
    const step = {
      id: nanoid(),
      action: row.Ação,
      expected: row['Resultado Esperado'],
    };
    if (existing) {
      existing.steps.push(step);
    } else {
      groups.set(key, { title: row.Título, row, steps: [step] });
    }
  }

  return [...groups.values()].map(({ title, row, steps }) => ({
    title,
    versions: [
      {
        source: 'imported',
        title: row.Título,
        description: row['Descrição'] ?? '',
        preconditions: row['Pré-condições'] ?? '',
        priority: row.Prioridade,
        tags: row.Tags.split(/\s+/).filter(Boolean),
        environment: row.Ambiente,
        mode: row.Modo,
        verdict: row.Veredito,
        steps,
      },
    ],
  }));
}

export function previewCsv(content: string): string {
  const stripped = stripBom(content);
  const lines = stripped.split(/\r?\n/).filter(Boolean);
  return lines
    .slice(0, 6)
    .map((l) => {
      const cells = parseCsvLine(l).map(sanitizeCsvCell);
      return cells.join(',');
    })
    .join('\n');
}
