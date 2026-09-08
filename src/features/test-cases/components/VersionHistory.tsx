import { useState } from 'react';
import { GitCompare, RotateCcw, X, Plus, Minus, Equal } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { useTestCaseStore, currentVersion } from '@/features/test-cases/stores/testCaseStore';
import { diffVersions } from '@/features/test-cases/lib/diff';

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  testCaseId: string | null;
}

export function VersionHistory({ open, onClose, testCaseId }: VersionHistoryProps) {
  const testCase = useTestCaseStore((s) =>
    s.testCases.find((tc) => tc.id === testCaseId),
  );
  const applyVersion = useTestCaseStore((s) => s.applyVersion);
  const setSelected = useTestCaseStore((s) => s.setSelected);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  if (!testCase) {
    return (
      <Sheet open={open} onClose={onClose} side="right" title="Histórico de versões">
        <div className="p-6 text-center text-xs text-foreground-muted">
          Selecione um caso de teste.
        </div>
      </Sheet>
    );
  }

  const versions = [...testCase.versions].reverse();
  const currentIdx = versions.findIndex((v) => v.id === testCase.currentVersionId);
  const compareTo = compareIdx !== null ? versions[compareIdx] : null;
  const current = currentVersion(testCase);
  const diff = compareTo ? diffVersions(compareTo, current) : null;

  const handleRestore = (versionIdx: number) => {
    const v = versions[versionIdx];
    if (!v) return;
    applyVersion(testCase.id, {
      source: v.source,
      title: v.title,
      description: v.description,
      preconditions: v.preconditions,
      priority: v.priority,
      tags: v.tags,
      environment: v.environment,
      mode: v.mode,
      verdict: v.verdict,
      steps: v.steps.map((s) => ({ ...s })),
      ...(v.spec !== undefined ? { spec: v.spec } : {}),
    });
    toast.success(`Versão restaurada como v${testCase.versions.length + 1}.`);
    setSelected(testCase.id);
  };

  return (
    <Sheet open={open} onClose={onClose} side="right" title="Histórico de versões">
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-3">
          <p className="text-xs text-foreground-muted">
            {testCase.versions.length} versão{testCase.versions.length !== 1 ? 'ões' : ''}.
            Clique em &ldquo;Comparar&rdquo; pra ver o diff com a versão atual.
          </p>
          {compareTo ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCompareIdx(null)}
              iconLeft={<X className="h-3.5 w-3.5" />}
              className="mt-2"
            >
              Limpar comparação
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {diff ? (
            <div className="space-y-3 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                Diff: v{testCase.versions.length - compareIdx!} → v{testCase.versions.length}
              </h3>
              {diff.fields
                .filter((f) => f.kind !== 'unchanged')
                .map((f) => (
                  <div key={f.field} className="rounded-md border border-border bg-surface p-2.5 text-xs">
                    <p className="font-bold text-foreground">{f.field}</p>
                    <p className="mt-1 text-verdict-fail line-through">{String(f.before ?? '')}</p>
                    <p className="mt-0.5 text-verdict-pass">{String(f.after ?? '')}</p>
                  </div>
                ))}
              {diff.tags.added.length || diff.tags.removed.length ? (
                <div className="rounded-md border border-border bg-surface p-2.5 text-xs">
                  <p className="font-bold text-foreground">Tags</p>
                  {diff.tags.added.map((t) => (
                    <p key={`a-${t}`} className="mt-0.5 inline-flex items-center gap-1 text-verdict-pass">
                      <Plus className="h-3 w-3" aria-hidden="true" /> {t}
                    </p>
                  ))}
                  {diff.tags.removed.map((t) => (
                    <p key={`r-${t}`} className="mt-0.5 inline-flex items-center gap-1 text-verdict-fail">
                      <Minus className="h-3 w-3" aria-hidden="true" /> {t}
                    </p>
                  ))}
                </div>
              ) : null}
              <ol className="space-y-1.5">
                {diff.steps.map((s, i) => (
                  <li
                    key={i}
                    className={cn(
                      'rounded-md border p-2 text-xs',
                      s.status === 'unchanged' && 'border-border bg-surface-muted',
                      s.status === 'added' && 'border-verdict-pass/40 bg-verdict-pass/5',
                      s.status === 'removed' && 'border-verdict-fail/40 bg-verdict-fail/5',
                      s.status === 'changed' && 'border-verdict-review/40 bg-verdict-review/5',
                    )}
                  >
                    <span className="font-mono text-[10px] font-bold text-foreground-subtle">
                      {i + 1}. {s.status}
                    </span>
                    {s.status === 'changed' ? (
                      <div className="mt-1">
                        <p className="text-verdict-fail line-through">{s.beforeAction}</p>
                        <p className="text-verdict-pass">{s.afterAction}</p>
                      </div>
                    ) : s.status === 'added' ? (
                      <p className="mt-1 text-verdict-pass">{s.afterAction}</p>
                    ) : s.status === 'removed' ? (
                      <p className="mt-1 text-verdict-fail line-through">{s.beforeAction}</p>
                    ) : (
                      <p className="mt-1 text-foreground-muted">{s.afterAction}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {versions.map((v, idx) => {
                const realIdx = testCase.versions.length - 1 - idx;
                const isCurrent = idx === currentIdx;
                const isCompared = idx === compareIdx;
                return (
                  <li key={v.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">
                          v{realIdx + 1}{' '}
                          {isCurrent ? (
                            <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-accent-fg">
                              atual
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[10px] text-foreground-subtle">
                          {formatDateTime(v.createdAt)} · {v.source}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<GitCompare className="h-3.5 w-3.5" />}
                          onClick={() => setCompareIdx(isCompared ? null : idx)}
                          aria-pressed={isCompared}
                          className={isCompared ? 'bg-accent text-accent-fg hover:opacity-90' : ''}
                        >
                          {isCompared ? <Equal className="h-3.5 w-3.5" /> : 'Comparar'}
                        </Button>
                        {!isCurrent ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<RotateCcw className="h-3.5 w-3.5" />}
                            onClick={() => handleRestore(idx)}
                            aria-label={`Restaurar v${realIdx + 1}`}
                          />
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
