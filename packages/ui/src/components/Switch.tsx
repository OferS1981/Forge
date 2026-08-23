import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * A real checkbox carries the state and the keyboard behaviour, role="switch" names the pattern,
 * and the track is drawn by us. Styled control, real input behind it, exactly as section 7 asks.
 */
export function Switch({
  label,
  checked,
  onChange,
  hint,
  disabled = false,
  id,
  className,
}: SwitchProps): ReactNode {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn('fg-switch', className)}>
      <input
        id={inputId}
        className="fg-switch__input fg-visually-hidden"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={hint !== undefined ? hintId : undefined}
        onChange={(e) => {
          onChange(e.currentTarget.checked);
        }}
      />
      <label className="fg-switch__label" htmlFor={inputId}>
        <span className="fg-switch__track" aria-hidden="true">
          <span className="fg-switch__thumb" />
        </span>
        <span className="fg-switch__text">{label}</span>
      </label>
      {hint !== undefined && (
        <p className="fg-field__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
