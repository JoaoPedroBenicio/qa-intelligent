import { FileVideo, FileText, Sparkles, ClipboardList, Wand2 } from 'lucide-react';
import { Card, CardBody } from '@/components/Card';
import { cn } from '@/lib/cn';

export interface OnboardingPath {
  id: 'record' | 'attach' | 'template' | 'paste';
  icon: typeof FileVideo;
  title: string;
  description: string;
  primary?: boolean;
}

export const ONBOARDING_PATHS: OnboardingPath[] = [
  {
    id: 'record',
    icon: FileVideo,
    title: 'Gravar a tela',
    description: 'Capture o fluxo enquanto fala. O copiloto extrai os passos.',
    primary: true,
  },
  {
    id: 'attach',
    icon: ClipboardList,
    title: 'Anexar um vídeo',
    description: 'Já tem um vídeo? Envie e descreva o que acontece.',
  },
  {
    id: 'paste',
    icon: FileText,
    title: 'Colar um roteiro',
    description: 'Cole ticket, transcript ou bullet points. Polimos pra você.',
  },
  {
    id: 'template',
    icon: Sparkles,
    title: 'Usar um template',
    description: 'Baterias prontas: smoke, regressão, mobile, a11y.',
  },
];

interface HeroEmptyStateProps {
  onPick: (path: OnboardingPath['id']) => void;
  testCaseCount: number;
}

export function HeroEmptyState({ onPick, testCaseCount }: HeroEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-2 text-foreground-subtle">
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider">Copiloto</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {testCaseCount === 0
            ? 'Como você quer começar?'
            : 'Comece um novo caso'}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Quatro caminhos. Escolha um e o copiloto faz o resto.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ONBOARDING_PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Card
                key={p.id}
                interactive
                onClick={() => onPick(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPick(p.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Começar com: ${p.title}`}
                className={cn(p.primary && 'border-accent')}
              >
                <CardBody className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                      p.primary
                        ? 'bg-accent text-accent-fg'
                        : 'bg-surface-muted text-foreground-muted',
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <p className="mt-1 text-xs text-foreground-muted">{p.description}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
