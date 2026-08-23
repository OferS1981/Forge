import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Popover } from './Popover';

export interface Explanation {
  label: string;
  /** One sentence, for the hover hint. */
  short: string;
  what: string;
  changes: string;
  when: string;
  range?: string | undefined;
  example?: { low: string; high: string };
}

export interface InfoDotProps {
  /** Names the thing being explained, for the button's accessible name. */
  term: string;
  explanation: Explanation;
  className?: string | undefined;
}

/**
 * The explain gesture, kept separate from the select gesture. This is a real 24px button next to
 * the control, so clicking a chip still just selects the chip.
 */
export function InfoDot({ term, explanation, className }: InfoDotProps): ReactNode {
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={cn('fg-infodot', className)}
        aria-label={`What is ${term}?`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setOpen((o) => !o);
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      <Popover
        open={open}
        onClose={(returnFocus) => {
          setOpen(false);
          if (returnFocus) anchor.current?.focus();
        }}
        anchor={anchor}
        id={id}
        label={explanation.label}
        focusOnOpen
        className="fg-explain"
      >
        <h3 className="fg-explain__title">{explanation.label}</h3>
        <p className="fg-explain__short">{explanation.short}</p>
        <dl className="fg-explain__list">
          <dt>What it is</dt>
          <dd>{explanation.what}</dd>
          <dt>What changes</dt>
          <dd>{explanation.changes}</dd>
          <dt>When to use it</dt>
          <dd>{explanation.when}</dd>
          {explanation.range !== undefined && (
            <>
              <dt>Range</dt>
              <dd className="fg-mono">{explanation.range}</dd>
            </>
          )}
          {explanation.example !== undefined && (
            <>
              <dt>Low</dt>
              <dd>{explanation.example.low}</dd>
              <dt>High</dt>
              <dd>{explanation.example.high}</dd>
            </>
          )}
        </dl>
      </Popover>
    </>
  );
}
