import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { Card, CardBody } from '@/components/Card';
import { TEMPLATES } from '@/features/test-cases/lib/templates';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { toast } from 'sonner';
import { useProjectStore } from '@/stores/projectStore';

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

export function TemplateGallery({ open, onClose }: TemplateGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const createFromVersion = useTestCaseStore((s) => s.createFromVersion);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createProject = useProjectStore((s) => s.createProject);

  const selected = TEMPLATES.find((t) => t.id === selectedId);

  const handleApply = () => {
    if (!selected) return;
    let projectId = activeProjectId;
    if (!projectId) {
      projectId = createProject('Projeto padrão');
    }
    const versions = selected.build();
    let count = 0;
    for (const v of versions) {
      createFromVersion({ projectId, folderId: null, version: v });
      count++;
    }
    toast.success(`${count} caso${count > 1 ? 's' : ''} criado${count > 1 ? 's' : ''}.`);
    onClose();
    setSelectedId(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Galeria de templates"
      description="Baterias prontas pra começar em segundos."
      size="lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const count = t.build().length;
          const active = t.id === selectedId;
          return (
            <Card
              key={t.id}
              interactive
              onClick={() => setSelectedId(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedId(t.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              className={active ? 'border-accent' : ''}
            >
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <Sparkles
                    className="h-4 w-4 shrink-0 text-foreground-muted"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                    {t.category}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-foreground">{t.name}</h3>
                <p className="mt-1 text-xs text-foreground-muted">{t.description}</p>
                <p className="mt-2 text-[10px] text-foreground-subtle">
                  {count} caso{count > 1 ? 's' : ''}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleApply} disabled={!selected} iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
          Aplicar
        </Button>
      </div>
    </Modal>
  );
}
