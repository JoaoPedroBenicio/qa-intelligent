import { Pin, PinOff, MessageSquare, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/Button';
import { useConversationStore } from '@/features/conversations/stores/conversationStore';
import { useTestCaseStore } from '@/features/test-cases/stores/testCaseStore';
import { formatRelative } from '@/lib/format';

export function ConversationList() {
  const conversations = useConversationStore((s) => s.conversations);
  const activeId = useConversationStore((s) => s.activeId);
  const setActive = useConversationStore((s) => s.setActive);
  const create = useConversationStore((s) => s.createConversation);
  const togglePin = useConversationStore((s) => s.togglePin);
  const deleteConv = useConversationStore((s) => s.deleteConversation);
  const setSelected = useTestCaseStore((s) => s.setSelected);

  const pinned = conversations.filter((c) => c.pinned);
  const others = conversations.filter((c) => !c.pinned);

  const handleNew = () => {
    const id = create();
    setActive(id);
    setSelected(null);
    toast.success('Nova conversa criada.');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          iconLeft={<Plus className="h-4 w-4" />}
          onClick={handleNew}
          fullWidth
        >
          Nova conversa
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversas">
        {pinned.length > 0 ? (
          <section>
            <h2 className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
              Fixadas
            </h2>
            <ul className="space-y-0.5">
              {pinned.map((c) => (
                <Item
                  key={c.id}
                  title={c.title}
                  updatedAt={c.updatedAt}
                  pinned
                  active={c.id === activeId}
                  onClick={() => {
                    setActive(c.id);
                    setSelected(null);
                  }}
                  onTogglePin={() => togglePin(c.id)}
                  onDelete={() => deleteConv(c.id)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
            Conversas
          </h2>
          {others.length === 0 ? (
            <p className="px-2 py-3 text-[11px] text-foreground-subtle">
              Nenhuma conversa. Crie uma acima.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {others.map((c) => (
                <Item
                  key={c.id}
                  title={c.title}
                  updatedAt={c.updatedAt}
                  active={c.id === activeId}
                  onClick={() => {
                    setActive(c.id);
                    setSelected(null);
                  }}
                  onTogglePin={() => togglePin(c.id)}
                  onDelete={() => deleteConv(c.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </nav>
    </div>
  );
}

interface ItemProps {
  title: string;
  updatedAt: string;
  pinned?: boolean;
  active: boolean;
  onClick: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

function Item({
  title,
  updatedAt,
  pinned,
  active,
  onClick,
  onTogglePin,
  onDelete,
}: ItemProps) {
  return (
    <li>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-2 transition',
          active
            ? 'bg-surface-muted text-foreground'
            : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
        )}
      >
        <button
          type="button"
          onClick={onClick}
          aria-current={active}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{title}</span>
        </button>
        <span className="shrink-0 text-[10px] text-foreground-subtle">
          {formatRelative(updatedAt)}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onTogglePin}
            aria-label={pinned ? 'Desafixar' : 'Fixar'}
            title={pinned ? 'Desafixar' : 'Fixar'}
            className="rounded p-1 hover:bg-surface"
          >
            {pinned ? (
              <PinOff className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Pin className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir conversa"
            title="Excluir"
            className="rounded p-1 text-verdict-fail/70 hover:bg-verdict-fail/10"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
