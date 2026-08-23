import { useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedProps {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Hide the label visually when the surrounding copy already names the group. */
  hideLabel?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A radio group drawn as a segmented control. One tab stop for the group, arrows move and select,
 * which is the native radio contract.
 */
export function Segmented({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
  disabled = false,
  className,
}: SegmentedProps): ReactNode {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const move = (next: number): void => {
    const i = (next + options.length) % options.length;
    const option = options[i];
    if (!option) return;
    onChange(option.value);
    refs.current[i]?.focus();
  };

  return (
    <div className={cn('fg-seg-wrap', className)}>
      <span className={cn('fg-field__label', hideLabel && 'fg-visually-hidden')} id={`${id}-label`}>
        {label}
      </span>
      <div className="fg-seg" role="radiogroup" aria-labelledby={`${id}-label`}>
        {options.map((o, i) => (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={i === index ? 0 : -1}
            disabled={disabled}
            className="fg-seg__opt"
            onClick={() => {
              onChange(o.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                move(i + 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                move(i - 1);
              } else if (e.key === 'Home') {
                e.preventDefault();
                move(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                move(options.length - 1);
              }
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
