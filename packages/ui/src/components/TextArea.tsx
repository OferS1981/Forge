import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  adornment?: ReactNode | undefined;
  /** Shows a live count, and marks it as over when a maximum is given and passed. */
  showCount?: boolean | undefined;
}

export function TextArea({
  label,
  hint,
  error,
  adornment,
  showCount = false,
  id,
  className,
  value,
  maxLength,
  rows = 3,
  ...rest
}: TextAreaProps): ReactNode {
  const auto = useId();
  const areaId = id ?? auto;
  const hintId = `${areaId}-hint`;
  const errorId = `${areaId}-error`;
  const countId = `${areaId}-count`;
  const count = typeof value === 'string' ? value.length : 0;
  const over = maxLength !== undefined && count > maxLength;
  const described = cn(
    hint !== undefined ? hintId : '',
    error !== undefined ? errorId : '',
    showCount ? countId : '',
  );

  return (
    <div className={cn('fg-field', error !== undefined && 'fg-field--invalid', className)}>
      <div className="fg-field__head">
        <label className="fg-field__label" htmlFor={areaId}>
          {label}
        </label>
        {adornment}
      </div>
      {hint !== undefined && (
        <p className="fg-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <textarea
        {...rest}
        id={areaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        className="fg-input fg-input--area"
        aria-describedby={described.length > 0 ? described : undefined}
        aria-invalid={error !== undefined || over || undefined}
      />
      {showCount && (
        <p className={cn('fg-field__count', over && 'fg-field__count--over')} id={countId}>
          {maxLength === undefined
            ? `${String(count)} characters`
            : `${String(count)} of ${String(maxLength)} characters`}
        </p>
      )}
      {error !== undefined && (
        <p className="fg-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
