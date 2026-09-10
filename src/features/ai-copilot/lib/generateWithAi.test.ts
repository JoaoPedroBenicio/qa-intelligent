import { describe, expect, it, vi } from 'vitest';
import { generateTestCaseWithAi } from './generateWithAi';

describe('generateTestCaseWithAi', () => {
  it('returns the structured test case produced by the protected API route', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'Validar login',
          description: 'Confere o acesso.',
          preconditions: 'Usuário cadastrado.',
          priority: 'Alta',
          tags: ['login'],
          environment: 'homologação',
          mode: 'video',
          verdict: 'NEEDS_REVIEW',
          steps: [{ action: 'Preencher credenciais.', expected: 'A conta é acessada.' }],
        }),
        { status: 200 },
      ),
    );

    const result = await generateTestCaseWithAi(
      { text: 'Login\nPreencher credenciais.', attachments: [] },
      fetcher,
    );

    expect(result.title).toBe('Validar login');
    expect(result.steps).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
