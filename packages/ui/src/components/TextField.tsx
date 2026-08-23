import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string | undefined;
  /** What went wrong and how to fix it. Never an apology. */
  error?: string | undefined;
  /** Rendered next to the label, for the info dot. */
  adornment?: ReactNode | undefined;
}

export function TextField({
  label,
  hint,
  error,
  adornment,
  id,
  className,
  ...rest
}: TextFieldProps): ReactNode {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const described = cn(hint !== undefined ? hintId : '', error !== undefined ? errorId : '');

  return (
    <div className={cn('fg-field', error !== undefined && 'fg-field--invalid', className)}>
      <div className="fg-field__head">
        <label className="fg-field__label" htmlFor={inputId}>
          {label}
        </label>
        {adornment}
      </div>
      {hint !== undefined && (
        <p className="fg-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <input
        {...rest}
        id={inputId}
        className="fg-input"
        aria-describedby={described.length > 0 ? described : undefined}
        aria-invalid={error !== undefined || undefined}
      />
      {error !== undefined && (
        <p className="fg-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
