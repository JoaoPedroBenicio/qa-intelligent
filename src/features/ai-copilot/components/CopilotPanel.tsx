import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Square, Paperclip, Send, X, FileVideo, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/Button';
import { LoadingDots } from './LoadingDots';
import { useSpeechRecognition } from '@/features/video-capture/hooks/useSpeechRecognition';
import { useMediaRecorder } from '@/features/video-capture/hooks/useMediaRecorder';
import { polishTestCaseLocally } from '@/features/ai-copilot/lib/polishLocal';
import { generateSpec } from '@/features/test-cases/lib/specGenerator';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { sanitizeFilename } from '@/lib/sanitize';
import { formatBytes } from '@/lib/format';
import { nanoid } from '@/lib/nanoid';
import type { FileAttachment, TestCaseVersion } from '@/types/domain';

interface CopilotPanelProps {
  projectId: string;
  initialFocus?: 'record' | 'attach' | 'template' | 'paste' | null;
  onSend?: (text: string, attachments: { name: string; size: number; mimeType: string }[]) => void;
}

interface AttachedFile extends FileAttachment {
  file: File;
}

function detectKind(mime: string): FileAttachment['kind'] {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('text/') || mime === 'application/json') return 'document';
  return 'other';
}

export function CopilotPanel({
  projectId,
  initialFocus: _initialFocus,
  onSend,
}: CopilotPanelProps) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const createFromVersion = useTestCaseStore((s) => s.createFromVersion);
  const addMessage = useConversationStore((s) => s.addMessage);
  const activeId = useConversationStore((s) => s.activeId);
  const createConversation = useConversationStore((s) => s.createConversation);

  const speech = useSpeechRecognition((transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const recorder = useMediaRecorder();
  const { error: speechError, reset: resetSpeech } = speech;
  const { blob: recordedBlob, reset: resetRecorder } = recorder;
  const processedRecordingRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
      resetSpeech();
    }
  }, [resetSpeech, speechError]);

  useEffect(() => {
    return () => {
      abortRef.current?.();
      resetRecorder();
    };
  }, [resetRecorder]);

  useEffect(() => {
    const currentRecording = recordedBlob;
    if (!currentRecording || processedRecordingRef.current === currentRecording) return;

    processedRecordingRef.current = currentRecording;
    const file = new File([currentRecording], `gravacao-${Date.now()}.webm`, {
      type: currentRecording.type || 'video/webm',
    });
    const url = URL.createObjectURL(file);
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: nanoid(),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        url,
        kind: 'video',
        file,
      },
    ]);
    toast.success(`Gravação salva (${formatBytes(file.size)}).`);
  }, [recordedBlob]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const oversized = files.find((f) => f.size > 200 * 1024 * 1024);
    if (oversized) {
      toast.error(`Arquivo "${oversized.name}" excede 200MB.`);
      return;
    }
    setAttachedFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nanoid(),
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
        kind: detectKind(file.type),
        file,
      })),
    ]);
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (recorder.state === 'recording') return;
    try {
      await recorder.start();
      toast.success('Gravação iniciada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar gravação.';
      toast.error(msg);
    }
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    const recordedBlob = await recorder.stop();
    if (!recordedBlob) {
      toast.error('Gravação não gerou arquivo.');
    }
  }, [recorder]);

  const handleCancel = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
    setBusy(false);
    toast.message('Operação cancelada.');
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachedFiles.length === 0) return;

    let convId = activeId;
    if (!convId) {
      convId = createConversation();
    }

    addMessage(convId, {
      role: 'user',
      text: trimmed,
      attachments: attachedFiles.map(({ file: _f, ...rest }) => rest),
    });

    const snapshotText = trimmed;
    const snapshotAttachments = attachedFiles.map(({ file: _f, ...rest }) => rest);
    setText('');
    setAttachedFiles([]);

    if (onSend) {
      onSend(snapshotText, snapshotAttachments);
      return;
    }

    setBusy(true);

    const timer = setTimeout(() => {
      try {
        const polished = polishTestCaseLocally({
          text: snapshotText,
          attachments: snapshotAttachments,
        });
        const version: Omit<TestCaseVersion, 'id' | 'createdAt'> = {
          ...polished,
          spec: generateSpec({ title: polished.title, steps: polished.steps }),
        };
        createFromVersion({ projectId, folderId: null, version });
        toast.success('Caso de teste criado.');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao processar.';
        toast.error(msg);
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    }, 800);

    abortRef.current = () => {
      clearTimeout(timer);
    };
  }, [
    text,
    attachedFiles,
    activeId,
    createConversation,
    addMessage,
    createFromVersion,
    projectId,
    onSend,
  ]);

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Copiloto</h2>
          <p className="text-[10px] text-foreground-subtle">Vídeo + voz → casos de teste</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {attachedFiles.length === 0 && !text && !busy ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-xs text-foreground-muted">
            <FileVideo className="h-8 w-8 text-foreground-subtle" aria-hidden="true" />
            <p className="max-w-[220px]">
              Grave a tela, anexe um vídeo, ou descreva o fluxo em texto. O copiloto transforma em
              casos de teste editáveis.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-start gap-2 rounded-md border border-border bg-surface-muted p-2.5 text-xs"
              >
                <FileVideo
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-[10px] text-foreground-subtle">
                    {f.kind} · {formatBytes(f.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(f.id)}
                  aria-label={`Remover ${f.name}`}
                  className="rounded p-1 text-foreground-subtle hover:bg-surface hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {busy ? (
          <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2">
            <LoadingDots />
            <button
              type="button"
              onClick={handleCancel}
              className="text-[10px] font-semibold text-verdict-fail hover:underline"
            >
              Cancelar
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        <label htmlFor="copilot-text" className="sr-only">
          Descreva o fluxo ou cole um roteiro
        </label>
        <textarea
          id="copilot-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Descreva o fluxo ou cole um roteiro..."
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*,.txt,.md,.json"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            iconLeft={<Paperclip className="h-3.5 w-3.5" />}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Anexar arquivo"
          >
            Anexar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            iconLeft={
              speech.isRecording ? (
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Mic className="h-3.5 w-3.5" aria-hidden="true" />
              )
            }
            onClick={() => (speech.isRecording ? speech.stop() : speech.start())}
            aria-pressed={speech.isRecording}
            className={speech.isRecording ? 'border-verdict-fail text-verdict-fail' : ''}
          >
            {speech.isRecording ? 'Parar' : 'Voz'}
          </Button>

          {recorder.state === 'recording' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconLeft={<Square className="h-3.5 w-3.5" />}
              onClick={handleStopRecording}
              className="border-verdict-fail text-verdict-fail"
            >
              Parar tela
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconLeft={<FileVideo className="h-3.5 w-3.5" />}
              onClick={handleStartRecording}
              aria-label="Iniciar gravação de tela"
            >
              Gravar tela
            </Button>
          )}

          <div className="ml-auto">
            <Button
              type="button"
              size="sm"
              iconRight={<Send className="h-3.5 w-3.5" />}
              onClick={handleSend}
              disabled={busy}
            >
              Enviar
            </Button>
          </div>
        </div>

        {recorder.error ? (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-[10px] text-verdict-fail">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {recorder.error}
          </p>
        ) : null}

        <p className="mt-2 text-[10px] text-foreground-subtle">
          Ctrl/⌘ + Enter envia · Voz transcreve em pt-BR
        </p>
      </div>
    </aside>
  );
}

export function buildFilename(title: string): string {
  return `${sanitizeFilename(title, 'caso-de-teste')}.csv`;
}
