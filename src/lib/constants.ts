import type { Mode, Verdict, Priority } from '@/types/domain';

export const APP_NAME = 'QA Fluxo';
export const APP_TAGLINE = 'Da tela para os testes em 30 segundos.';

export const MODES = [
  {
    id: 'video' as const,
    label: 'Vídeo',
    short: 'Gravação de Tela',
    hint: 'Grave a tela e descreva o fluxo em voz. A gente gera os casos.',
    status: 'available' as const,
  },
  {
    id: 'polidor' as const,
    label: 'Polidor',
    short: 'Padronização',
    hint: 'Transforme rascunhos em casos padronizados.',
    status: 'coming_soon' as const,
  },
  {
    id: 'autonomo' as const,
    label: 'Autônomo',
    short: 'Navegação MCP',
    hint: 'Execução direta via Playwright.',
    status: 'coming_soon' as const,
  },
];

export const ACTIVE_MODE: Mode = 'video';

export const THINKING_LEVELS = [
  { id: 'baixo', label: 'Baixo', note: 'Resposta ultra-rápida' },
  { id: 'medio', label: 'Médio', note: 'Equilibrado' },
  { id: 'alto', label: 'Alto', note: 'Revisão aprofundada' },
] as const;

export const VERDICT_META: Record<Verdict, { label: string; tone: string }> = {
  PASS: { label: 'Pass', tone: 'bg-verdict-pass/10 text-verdict-pass border-verdict-pass/30' },
  FAIL: { label: 'Fail', tone: 'bg-verdict-fail/10 text-verdict-fail border-verdict-fail/30' },
  BLOCKED: {
    label: 'Blocked',
    tone: 'bg-verdict-blocked/10 text-verdict-blocked border-verdict-blocked/30',
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    tone: 'bg-verdict-review/10 text-verdict-review border-verdict-review/30',
  },
};

export const PRIORITY_META: Record<Priority, { label: string; order: number }> = {
  Alta: { label: 'Alta', order: 0 },
  Média: { label: 'Média', order: 1 },
  Baixa: { label: 'Baixa', order: 2 },
};

export const STORAGE_KEYS = {
  conversations: 'qa-fluxo:conversations',
  testCases: 'qa-fluxo:test-cases',
  folders: 'qa-fluxo:folders',
  projects: 'qa-fluxo:projects',
  theme: 'qa-fluxo:theme',
  ui: 'qa-fluxo:ui',
} as const;
