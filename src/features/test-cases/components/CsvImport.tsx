import { useRef, useState } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { parseCsv, groupIntoTestCases, previewCsv } from '@/features/test-cases/lib/csvImport';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { useProjectStore } from '@/stores/projectStore';

interface CsvImportProps {
  open: boolean;
  onClose: () => void;
}

export function CsvImport({ open, onClose }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [preview, setPreview] = useState('');
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseCsv> | null>(null);
  const createFromVersion = useTestCaseStore((s) => s.createFromVersion);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createProject = useProjectStore((s) => s.createProject);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo maior que 10MB.');
      return;
    }
    const text = await file.text();
    setFilename(file.name);
    setPreview(previewCsv(text));
    setParseResult(parseCsv(text));
  };

  const handleApply = () => {
    if (!parseResult) return;
    const groups = groupIntoTestCases(parseResult.rows);
    if (groups.length === 0) {
      toast.error('Nenhum caso válido para importar.');
      return;
    }
    let projectId = activeProjectId;
    if (!projectId) projectId = createProject('Projeto padrão');

    let count = 0;
    for (const g of groups) {
      const version = g.versions[0];
      if (!version) continue;
      createFromVersion({ projectId, folderId: null, version });
      count++;
    }
    toast.success(`${count} caso${count > 1 ? 's' : ''} importado${count > 1 ? 's' : ''}.`);
    handleClose();
  };

  const handleClose = () => {
    setFilename(null);
    setPreview('');
    setParseResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importar CSV"
      description="Importe casos de teste a partir de uma planilha."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!parseResult || parseResult.rows.length === 0}
          >
            Importar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />

        {filename ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted p-3 text-xs">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
              <span className="font-medium text-foreground">{filename}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilename(null);
                setPreview('');
                setParseResult(null);
              }}
              aria-label="Remover arquivo"
              className="rounded p-1 text-foreground-subtle hover:bg-surface hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-muted p-8 text-center transition hover:border-accent hover:bg-surface"
          >
            <Upload className="h-8 w-8 text-foreground-subtle" aria-hidden="true" />
            <p className="text-sm font-bold text-foreground">Clique para selecionar um CSV</p>
            <p className="text-[10px] text-foreground-subtle">
              Cabeçalhos obrigatórios: Título, Ação, Resultado Esperado
            </p>
          </button>
        )}

        {parseResult ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-verdict-pass">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {parseResult.rows.length} linha{parseResult.rows.length !== 1 ? 's' : ''} válida
                {parseResult.rows.length !== 1 ? 's' : ''}
              </span>
              {parseResult.errors.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-verdict-fail">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {parseResult.errors.length} erro{parseResult.errors.length !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>

            {parseResult.errors.length > 0 ? (
              <ul className="rounded-md border border-verdict-fail/30 bg-verdict-fail/5 p-2 text-[10px] text-verdict-fail">
                {parseResult.errors.slice(0, 5).map((e) => (
                  <li key={e.line}>
                    Linha {e.line}: {e.message}
                  </li>
                ))}
                {parseResult.errors.length > 5 ? (
                  <li>...e mais {parseResult.errors.length - 5}.</li>
                ) : null}
              </ul>
            ) : null}

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                Preview (5 primeiras linhas)
              </p>
              <pre className="overflow-x-auto rounded-md bg-surface-muted p-3 font-mono text-[10px] text-foreground">
                {preview}
              </pre>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
