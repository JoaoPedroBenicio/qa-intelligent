import { Toaster as SonnerToaster } from 'sonner';

export function Toast() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'bg-surface text-foreground border border-border shadow-card rounded-lg text-sm',
          description: 'text-foreground-muted',
        },
      }}
    />
  );
}
