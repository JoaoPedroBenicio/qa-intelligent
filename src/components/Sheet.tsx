import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type Side = 'left' | 'right' | 'bottom';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title: string;
  description?: string;
  children: ReactNode;
}

const slideClasses: Record<Side, { container: string; enter: string }> = {
  left: {
    container: 'inset-y-0 left-0 w-80 max-w-[85vw] flex flex-col border-r border-border',
    enter: 'animate-fade-in',
  },
  right: {
    container: 'inset-y-0 right-0 w-96 max-w-[90vw] flex flex-col border-l border-border',
    enter: 'animate-fade-in',
  },
  bottom: {
    container: 'inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-2xl border-t border-border',
    enter: 'animate-fade-in',
  },
};

export function Sheet({ open, onClose, side = 'right', title, description, children }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const first = ref.current?.querySelector<HTMLElement>('button, [href], input, select, textarea');
    first?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const cls = slideClasses[side];

  return createPortal(
    <div className="fixed inset-0 z-40 bg-black/40" aria-hidden="true">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby={description ? 'sheet-desc' : undefined}
        className={cn(
          'fixed bg-surface shadow-modal',
          side === 'bottom' ? cls.container : cls.container,
          cls.enter,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 id="sheet-title" className="text-sm font-bold text-foreground">
              {title}
            </h2>
            {description ? (
              <p id="sheet-desc" className="mt-0.5 text-xs text-foreground-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="rounded-md p-1.5 text-foreground-subtle hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
