import { useMemo, useState } from 'react';
import { ChevronRight, Inbox, Tag, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/Input';
import { useTestCaseStore, currentVersion } from '@/features/test-cases/stores/testCaseStore';
import { VERDICT_META, PRIORITY_META } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import type { TestCase } from '@/types/domain';

export function TestCaseTable() {
  const testCases = useTestCaseStore((s) => s.testCases);
  const selectedId = useTestCaseStore((s) => s.selectedId);
  const setSelected = useTestCaseStore((s) => s.setSelected);
  const [query, setQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return testCases.filter((tc) => {
      const v = currentVersion(tc);
      if (verdictFilter !== 'all' && v.verdict !== verdictFilter) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [testCases, query, verdictFilter]);

  if (testCases.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou tag"
            className="pl-8"
            aria-label="Buscar casos de teste"
          />
        </div>
        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
          aria-label="Filtrar por veredito"
          className="h-10 rounded-md border border-border bg-surface px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">Todos os vereditos</option>
          {Object.entries(VERDICT_META).map(([k, m]) => (
            <option key={k} value={k}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-foreground-muted">
            Nenhum caso corresponde ao filtro.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((tc) => (
              <Row
                key={tc.id}
                tc={tc}
                selected={tc.id === selectedId}
                onSelect={() => setSelected(tc.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({
  tc,
  selected,
  onSelect,
}: {
  tc: TestCase;
  selected: boolean;
  onSelect: () => void;
}) {
  const v = currentVersion(tc);
  const verdictMeta = VERDICT_META[v.verdict];
  const priorityMeta = PRIORITY_META[v.priority];

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted',
          selected && 'bg-surface-muted',
        )}
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-foreground-subtle transition',
            selected && 'translate-x-0.5 text-foreground',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-foreground-subtle">
              {tc.id.slice(0, 8)}
            </span>
            <span className="truncate text-sm font-medium text-foreground">{v.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold',
                verdictMeta.tone,
              )}
            >
              {verdictMeta.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-foreground-muted">
              {priorityMeta.label}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-foreground-subtle">
              <Tag className="h-2.5 w-2.5" aria-hidden="true" />
              {v.steps.length} passos
            </span>
            <span className="text-[10px] text-foreground-subtle">
              {formatRelative(tc.updatedAt)}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="h-10 w-10 text-foreground-subtle" aria-hidden="true" />
      <div>
        <h3 className="text-sm font-bold text-foreground">Nenhum caso de teste ainda</h3>
        <p className="mt-1 max-w-sm text-xs text-foreground-muted">
          Use o copiloto à direita para gravar a tela, anexar um vídeo ou descrever o fluxo. O
          primeiro caso aparece aqui.
        </p>
      </div>
    </div>
  );
}
