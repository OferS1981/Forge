import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number | undefined;
  onChange: (value: number) => void;
  hint?: string | undefined;
  /** Turns 0.55 into "0.55" or "55 percent". The readout is part of the control. */
  format?: (value: number) => string;
  disabled?: boolean | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * A real range input, styled. The native element already has the full keyboard contract and the
 * correct announcement, so nothing is reimplemented, only the track and thumb are drawn.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  format,
  disabled = false,
  id,
  className,
}: SliderProps): ReactNode {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const text = format ? format(value) : String(value);
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('fg-slider', className)}>
      <div className="fg-field__head">
        <label className="fg-field__label" htmlFor={inputId}>
          {label}
        </label>
        <output className="fg-slider__value" htmlFor={inputId}>
          {text}
        </output>
      </div>
      {hint !== undefined && (
        <p className="fg-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <input
        id={inputId}
        className="fg-slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={hint !== undefined ? hintId : undefined}
        aria-valuetext={text}
        style={{ ['--fg-slider-pct' as string]: `${String(pct)}%` }}
        onChange={(e) => {
          onChange(Number(e.currentTarget.value));
        }}
      />
    </div>
  );
}
