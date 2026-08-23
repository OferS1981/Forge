import { useId, type ReactNode, type RefObject } from 'react';
import { Button } from './Button';
import { Popover } from './Popover';

export interface CoachMarkProps {
  open: boolean;
  /** What the mark points at. */
  anchor: RefObject<HTMLElement | null>;
  title: string;
  body: string;
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  nextLabel?: string | undefined;
  side?: 'top' | 'bottom' | 'left' | 'right' | undefined;
}

/**
 * One step of the walkthrough, anchored to the thing it is talking about. It is a dialog rather
 * than a tooltip because it holds buttons, and it can always be skipped: a tour nobody can leave
 * is a trap.
 */
export function CoachMark({
  open,
  anchor,
  title,
  body,
  step,
  total,
  onNext,
  onSkip,
  nextLabel,
  side = 'bottom',
}: CoachMarkProps): ReactNode {
  const last = step >= total;
  const headingId = useId();

  return (
    <Popover
      open={open}
      onClose={onSkip}
      anchor={anchor}
      side={side}
      align="start"
      labelledBy={headingId}
      focusOnOpen
      className="fg-coach"
    >
      <p className="fg-coach__step">
        Step {step} of {total}
      </p>
      <h3 className="fg-coach__title" id={headingId}>
        {title}
      </h3>
      <p className="fg-coach__body">{body}</p>
      <div className="fg-coach__actions">
        <Button variant="quiet" size="sm" onClick={onSkip}>
          Skip the walkthrough
        </Button>
        <Button variant="primary" size="sm" onClick={onNext}>
          {nextLabel ?? (last ? 'Done' : 'Next')}
        </Button>
      </div>
    </Popover>
  );
}
