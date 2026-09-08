import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? `input-${Math.random().toString(36).slice(2, 8)}`;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-subtle',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-verdict-fail focus:border-verdict-fail focus:ring-verdict-fail',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-err`} className="text-xs text-verdict-fail">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-foreground-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
