import { useEffect, useState } from 'react';
import { Moon, Sun, Menu, Wand2, Sparkles, Upload, History } from 'lucide-react';
import { toast } from 'sonner';
import { useUiStore } from '@/stores/uiStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { useProjectStore } from '@/stores/projectStore';
import { Toast } from '@/components/Toast';
import { IconButton } from '@/components/IconButton';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/Button';
import { ConversationList } from '@/features/conversations/components/ConversationList';
import { TestCaseTable } from '@/features/test-cases/components/TestCaseTable';
import { TestCaseDetail } from '@/features/test-cases/components/TestCaseDetail';
import { CopilotPanel } from '@/features/ai-copilot/components/CopilotPanel';
import { HeroEmptyState } from '@/features/test-cases/components/HeroEmptyState';
import { TemplateGallery } from '@/features/test-cases/components/TemplateGallery';
import { VersionHistory } from '@/features/test-cases/components/VersionHistory';
import { CsvImport } from '@/features/test-cases/components/CsvImport';
import { generateSpec } from '@/features/test-cases/lib/specGenerator';
import { generateTestCaseWithAi } from '@/features/ai-copilot/lib/generateWithAi';
import type { OnboardingPath } from '@/features/test-cases/components/HeroEmptyState';
import type { TestCaseVersion } from '@/types/domain';

const PROJECT_ID = 'qa-fluxo-default';

function App() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const createConversation = useConversationStore((s) => s.createConversation);
  const activeConv = useConversationStore((s) =>
    s.conversations.find((c) => c.id === s.activeId),
  );
  const testCases = useTestCaseStore((s) => s.testCases);
  const selectedId = useTestCaseStore((s) => s.selectedId);
  const createFromVersion = useTestCaseStore((s) => s.createFromVersion);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const createProject = useProjectStore((s) => s.createProject);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copilotFocus, setCopilotFocus] = useState<OnboardingPath['id'] | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const { conversations, activeId } = useConversationStore.getState();
    if (activeId === null && conversations.length === 0) {
      createConversation();
    }
  }, [createConversation]);

  const ensureProject = (): string => {
    if (activeProjectId) return activeProjectId;
    return createProject('Projeto padrão');
  };

  const handleOnboardingPick = (path: OnboardingPath['id']) => {
    setCopilotFocus(path);
    if (path === 'template') {
      setTemplatesOpen(true);
      return;
    }
    if (path === 'paste') {
      setCopilotOpen(true);
      return;
    }
    setCopilotOpen(true);
  };

  const handleCopilotSend = async (
    text: string,
    attachments: { name: string; size: number; mimeType: string }[],
  ) => {
    const projectId = ensureProject();
    const generated = await generateTestCaseWithAi({ text, attachments });
    const version: Omit<TestCaseVersion, 'id' | 'createdAt'> = {
      ...generated,
      spec: generateSpec({ title: generated.title, steps: generated.steps }),
    };
    createFromVersion({ projectId, folderId: null, version });
    toast.success('Caso criado.');
  };

  const showHero = testCases.length === 0;
  const selectedTestCase = testCases.find((tc) => tc.id === selectedId);
  const hasVersions = (selectedTestCase?.versions.length ?? 0) > 1;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-accent-fg"
      >
        Pular para o conteúdo
      </a>

      <div className="flex h-[100dvh] w-full flex-col bg-surface-muted text-foreground">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <IconButton
              icon={<Menu className="h-4 w-4" />}
              label="Abrir conversas"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-extrabold text-accent-fg">
              QA
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-none">QA Fluxo</h1>
              <p className="mt-0.5 truncate text-[10px] text-foreground-subtle">
                {activeConv ? activeConv.title : 'Sem conversa ativa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasVersions ? (
              <IconButton
                icon={<History className="h-4 w-4" />}
                label="Histórico de versões"
                onClick={() => setHistoryOpen(true)}
                className="hidden sm:inline-flex"
              />
            ) : null}
            <IconButton
              icon={<Upload className="h-4 w-4" />}
              label="Importar CSV"
              onClick={() => setImportOpen(true)}
              className="hidden sm:inline-flex"
            />
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => setTemplatesOpen(true)}
              className="hidden sm:inline-flex"
            >
              Templates
            </Button>
            <IconButton
              icon={<Wand2 className="h-4 w-4" />}
              label="Abrir copiloto"
              onClick={() => setCopilotOpen(true)}
              className="lg:hidden"
            />
            <IconButton
              icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              onClick={toggleTheme}
            />
          </div>
        </header>

        <div id="main" className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr_360px]">
          <aside className="hidden border-r border-border bg-surface lg:block">
            <ConversationList />
          </aside>

          <main className="flex min-h-0 flex-col bg-surface-muted">
            {showHero ? (
              <HeroEmptyState onPick={handleOnboardingPick} testCaseCount={0} />
            ) : (
              <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="border-r border-border bg-surface">
                  <TestCaseTable />
                </div>
                <div className="min-w-0 bg-surface">
                  <TestCaseDetail />
                </div>
              </div>
            )}
          </main>

          <aside className="hidden lg:block">
            <CopilotPanel
              projectId={PROJECT_ID}
              initialFocus={copilotFocus}
              onSend={handleCopilotSend}
            />
          </aside>
        </div>
      </div>

      <Sheet
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        side="left"
        title="Conversas"
      >
        <ConversationList />
      </Sheet>

      <Sheet
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        side="right"
        title="Copiloto"
        description="Vídeo + voz → casos de teste"
      >
        <CopilotPanel
          projectId={PROJECT_ID}
          initialFocus={copilotFocus}
          onSend={(text, attachments) => {
            handleCopilotSend(text, attachments);
            setCopilotOpen(false);
          }}
        />
      </Sheet>

      <TemplateGallery open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <CsvImport open={importOpen} onClose={() => setImportOpen(false)} />
      <VersionHistory open={historyOpen} onClose={() => setHistoryOpen(false)} testCaseId={selectedId} />

      <Toast />
    </>
  );
}

export default App;
