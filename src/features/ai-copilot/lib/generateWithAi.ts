import { z } from 'zod';
import type { TestCaseVersion } from '@/types/domain';

const AiTestCaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  preconditions: z.string().max(2000).default(''),
  priority: z.enum(['Alta', 'Média', 'Baixa']),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  environment: z.string().max(80).default('homologação'),
  mode: z.enum(['polidor', 'video', 'autonomo']).default('video'),
  verdict: z.enum(['PASS', 'FAIL', 'BLOCKED', 'NEEDS_REVIEW']).default('NEEDS_REVIEW'),
  steps: z.array(z.object({ action: z.string().min(1).max(2000), expected: z.string().min(1).max(2000) })).min(1).max(50),
});

type GenerateInput = { text: string; attachments: { name: string; size: number; mimeType: string }[] };
type Fetcher = typeof fetch;

function normalizeAiPayload(payload: unknown): unknown {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;
  const priority = typeof record.priority === 'string' ? record.priority.trim().toLowerCase() : record.priority;
  const normalizedPriority = priority === 'p0' || priority === 'p1' || priority === 'high'
    ? 'Alta'
    : priority === 'p2' || priority === 'medium'
      ? 'Média'
      : priority === 'p3' || priority === 'low'
        ? 'Baixa'
        : record.priority;
  return { ...record, priority: normalizedPriority };
}

export async function generateTestCaseWithAi(input: GenerateInput, fetcher: Fetcher = fetch): Promise<Omit<TestCaseVersion, 'id' | 'createdAt'>> {
  const response = await fetcher('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(typeof payload === 'object' && payload !== null && 'error' in payload ? String(payload.error) : 'Não foi possível gerar o caso de teste.');
  }
  const generated = AiTestCaseSchema.parse(normalizeAiPayload(payload));
  return { ...generated, source: 'ai-video', steps: generated.steps.map((step) => ({ ...step, id: crypto.randomUUID() })) };
}
