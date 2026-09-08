import { describe, it, expect } from 'vitest';
import { testCasesToCsv } from './csv';
import type { TestCase } from '@/types/domain';

const baseVersion = {
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-09-01T10:00:00.000Z',
  source: 'manual' as const,
  title: 'Login válido',
  description: 'Validar login com credenciais corretas',
  preconditions: 'Usuário cadastrado',
  priority: 'Alta' as const,
  tags: ['auth', 'smoke'],
  environment: 'homologação',
  mode: 'video' as const,
  verdict: 'PASS' as const,
  steps: [
    {
      id: '00000000-0000-4000-8000-000000000010',
      action: 'Acessar /login',
      expected: 'Página carrega',
    },
    {
      id: '00000000-0000-4000-8000-000000000011',
      action: 'Submeter credenciais',
      expected: 'Redireciona para /home',
    },
  ],
};

const testCase: TestCase = {
  id: '00000000-0000-4000-8000-000000000100',
  currentVersionId: baseVersion.id,
  versions: [baseVersion],
  folderId: null,
  projectId: '00000000-0000-4000-8000-000000000200',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('csv', () => {
  it('produces header row', () => {
    const csv = testCasesToCsv([testCase]);
    const firstLine = csv.split('\r\n')[0];
    expect(firstLine).toContain('ID');
    expect(firstLine).toContain('Título');
    expect(firstLine).toContain('Resultado Esperado');
  });

  it('emits one row per step', () => {
    const csv = testCasesToCsv([testCase]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(1 + 2);
  });

  it('handles cells with commas/quotes/newlines', () => {
    const tc: TestCase = {
      ...testCase,
      versions: [
        {
          ...baseVersion,
          description: 'Descrição com "aspas" e vírgula, e\nquebra',
        },
      ],
    };
    const csv = testCasesToCsv([tc]);
    expect(csv).toContain('"Descrição com ""aspas"" e vírgula, e\nquebra"');
  });

  it('returns header-only csv for empty input', () => {
    const csv = testCasesToCsv([]);
    expect(csv.split('\r\n')).toHaveLength(1);
  });
});
