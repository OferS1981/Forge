import { useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface Chip {
  value: string;
  label: string;
  hint?: string | undefined;
}

export interface ChipGroupProps {
  label: string;
  chips: Chip[];
  /** One value for a single-choice group, a list for a multi-choice one. */
  value: string | string[];
  onChange: (value: string | string[]) => void;
  /** The most that can be chosen. Past it, the rest go quiet rather than silently failing. */
  max?: number | undefined;
  hint?: string | undefined;
  hideLabel?: boolean | undefined;
  /** Rendered against the label, for the info dot. */
  adornment?: ReactNode | undefined;
  /** Called when the user presses i on a chip, which is how the explain layer opens. */
  onExplain?: ((value: string) => void) | undefined;
  className?: string | undefined;
}

/**
 * Chips are checkboxes or radios in appearance only when they are a single choice; the group keeps
 * the native contract either way. One tab stop, arrows move, space or enter toggles, and a chip
 * says whether it is pressed. Choosing and explaining are never the same gesture: pressing i on a
 * focused chip explains it, which costs no tab stop.
 */
export function ChipGroup({
  label,
  chips,
  value,
  onChange,
  max,
  hint,
  hideLabel = false,
  adornment,
  onExplain,
  className,
}: ChipGroupProps): ReactNode {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const multi = Array.isArray(value);
  const selected = Array.isArray(value) ? value : value.length > 0 ? [value] : [];
  const full = multi && max !== undefined && selected.length >= max;
  const hintId = `${id}-hint`;

  const firstSelected = chips.findIndex((c) => selected.includes(c.value));
  const activeIndex = firstSelected >= 0 ? firstSelected : 0;

  const toggle = (chip: Chip): void => {
    if (!multi) {
      onChange(selected.includes(chip.value) ? '' : chip.value);
      return;
    }
    if (selected.includes(chip.value)) {
      onChange(selected.filter((v) => v !== chip.value));
      return;
    }
    if (max !== undefined && selected.length >= max) return;
    onChange([...selected, chip.value]);
  };

  const move = (next: number): void => {
    const i = (next + chips.length) % chips.length;
    refs.current[i]?.focus();
  };

  return (
    <div className={cn('fg-chips-wrap', className)}>
      <div className="fg-field__head">
        <span
          className={cn('fg-field__label', hideLabel && 'fg-visually-hidden')}
          id={`${id}-label`}
        >
          {label}
          {multi && max !== undefined && (
            <span className="fg-chips__count">
              {' '}
              {selected.length} of {max}
            </span>
          )}
        </span>
        {adornment}
      </div>
      {hint !== undefined && (
        <p className="fg-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div
        className="fg-chips"
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint !== undefined ? hintId : undefined}
      >
        {chips.map((chip, i) => {
          const on = selected.includes(chip.value);
          return (
            <button
              key={chip.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              className="fg-chip"
              aria-pressed={on}
              aria-disabled={full && !on ? true : undefined}
              tabIndex={i === activeIndex ? 0 : -1}
              onClick={() => {
                toggle(chip);
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
                  move(chips.length - 1);
                } else if (e.key === 'i' && onExplain) {
                  e.preventDefault();
                  onExplain(chip.value);
                }
              }}
            >
              {chip.label}
              {chip.hint !== undefined && <span className="fg-chip__hint">{chip.hint}</span>}
            </button>
          );
        })}
      </div>
      {full && (
        <p className="fg-field__hint" role="status">
          That is the most this field takes. Remove one to choose another.
        </p>
      )}
    </div>
  );
}
