export function LoadingDots({ label = 'Processando' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-foreground-muted"
    >
      <span className="sr-only">{label}</span>
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-muted [animation-delay:-300ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-muted [animation-delay:-150ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground-muted" />
    </div>
  );
}
