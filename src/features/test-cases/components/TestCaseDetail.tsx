import { useState } from 'react';
import { Download, Copy, Trash2, Check, History } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/Button';
import { useTestCaseStore, currentVersion } from '@/features/test-cases/stores/testCaseStore';
import { testCasesToCsv, downloadCsv } from '@/features/test-cases/lib/csv';
import { VERDICT_META, PRIORITY_META } from '@/lib/constants';
import { VersionHistory } from './VersionHistory';
import { sanitizeFilename } from '@/lib/sanitize';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Verdict, Priority } from '@/types/domain';

export function TestCaseDetail() {
  const selectedId = useTestCaseStore((s) => s.selectedId);
  const testCase = useTestCaseStore((s) =>
    s.testCases.find((tc) => tc.id === selectedId),
  );
  const updateVerdict = useTestCaseStore((s) => s.updateVerdict);
  const updatePriority = useTestCaseStore((s) => s.updatePriority);
  const updateStep = useTestCaseStore((s) => s.updateStep);
  const updateTitle = useTestCaseStore((s) => s.updateTitle);
  const deleteTestCase = useTestCaseStore((s) => s.deleteTestCase);
  const [specOpen, setSpecOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!testCase) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-xs text-foreground-muted">
        Selecione um caso de teste à esquerda para editar.
      </div>
    );
  }

  const v = currentVersion(testCase);
  const hasVersions = testCase.versions.length > 1;

  const handleExport = () => {
    const csv = testCasesToCsv([testCase]);
    const filename = `${sanitizeFilename(v.title, testCase.id.slice(0, 8))}.csv`;
    downloadCsv(filename, csv);
    toast.success('CSV exportado.');
  };

  const handleCopySpec = async () => {
    if (!v.spec) return;
    try {
      await navigator.clipboard.writeText(v.spec);
      toast.success('Spec copiada.');
    } catch {
      toast.error('Falha ao copiar.');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-surface">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-foreground-subtle">
              {testCase.id} · {v.environment}
            </p>
            <input
              value={v.title}
              onChange={(e) => updateTitle(testCase.id, e.target.value)}
              className="mt-1 w-full bg-transparent text-lg font-bold text-foreground outline-none focus:ring-1 focus:ring-accent"
              aria-label="Título do caso de teste"
            />
            <p className="mt-1 text-[11px] text-foreground-subtle">
              Atualizado {formatDateTime(testCase.updatedAt)} · v{testCase.versions.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {hasVersions ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconLeft={<History className="h-3.5 w-3.5" />}
                onClick={() => setHistoryOpen(true)}
                aria-label={`Histórico (${testCase.versions.length} versões)`}
              >
                v{testCase.versions.length}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconLeft={<Download className="h-3.5 w-3.5" />}
              onClick={handleExport}
            >
              CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconLeft={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => {
                if (confirm('Excluir este caso de teste?')) {
                  deleteTestCase(testCase.id);
                  toast.message('Caso excluído.');
                }
              }}
              aria-label="Excluir caso"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            id="verdict-label"
            className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted"
          >
            Veredito
          </span>
          <div role="radiogroup" aria-labelledby="verdict-label" className="flex gap-1">
            {Object.entries(VERDICT_META).map(([key, meta]) => {
              const active = v.verdict === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateVerdict(testCase.id, key as Verdict)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-bold transition',
                    active
                      ? meta.tone
                      : 'border-border bg-surface text-foreground-muted hover:bg-surface-muted',
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          <label
            htmlFor="priority-select"
            className="ml-3 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted"
          >
            Prioridade
          </label>
          <select
            id="priority-select"
            value={v.priority}
            onChange={(e) => updatePriority(testCase.id, e.target.value as Priority)}
            aria-label="Prioridade"
            className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-bold text-foreground focus:border-accent focus:outline-none"
          >
            {Object.entries(PRIORITY_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 p-6">
        {v.description ? (
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Descrição
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{v.description}</p>
          </section>
        ) : null}

        {v.preconditions ? (
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Pré-condições
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{v.preconditions}</p>
          </section>
        ) : null}

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
            Passos
          </h3>
          <ol className="mt-2 space-y-2">
            {v.steps.map((step, idx) => (
              <li
                key={step.id}
                className="rounded-md border border-border bg-surface p-3 text-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-bold text-foreground-subtle">
                    {idx + 1}.
                  </span>
                  <textarea
                    value={step.action}
                    onChange={(e) =>
                      updateStep(testCase.id, step.id, 'action', e.target.value)
                    }
                    aria-label={`Ação do passo ${idx + 1}`}
                    rows={2}
                    className="flex-1 resize-none bg-transparent font-medium text-foreground outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <textarea
                  value={step.expected}
                  onChange={(e) =>
                    updateStep(testCase.id, step.id, 'expected', e.target.value)
                  }
                  aria-label={`Resultado esperado do passo ${idx + 1}`}
                  rows={2}
                  className="ml-6 mt-1 w-[calc(100%-1.5rem)] resize-none bg-transparent text-xs text-foreground-muted outline-none focus:ring-1 focus:ring-accent"
                />
              </li>
            ))}
          </ol>
        </section>

        {v.spec ? (
          <section>
            <button
              type="button"
              onClick={() => setSpecOpen((o) => !o)}
              aria-expanded={specOpen}
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground underline-offset-2 hover:underline"
            >
              {specOpen ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {specOpen ? 'Ocultar spec Playwright' : 'Ver spec Playwright'}
            </button>
            {specOpen ? (
              <div className="relative mt-2 overflow-x-auto rounded-md bg-surface-muted p-3 font-mono text-[11px] text-foreground">
                <pre>{v.spec}</pre>
                <button
                  type="button"
                  onClick={handleCopySpec}
                  className="absolute right-2 top-2 rounded bg-accent px-2 py-1 text-[10px] font-semibold text-accent-fg hover:opacity-90"
                >
                  Copiar
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      <VersionHistory open={historyOpen} onClose={() => setHistoryOpen(false)} testCaseId={testCase.id} />
    </div>
  );
}
