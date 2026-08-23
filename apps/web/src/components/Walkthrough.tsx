'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, CoachMark } from '@forge/ui';
import { STEPS, TOTAL, type Step } from '../lib/walkthrough';
import { useWalkthrough } from '../lib/store';

export interface WalkthroughProps {
  /** Fills the example brief, so step three has something real to strike. */
  onFill: () => void;
  /** Strikes it, so step four has a real prompt to point at. */
  onStrike: () => void;
}

/**
 * The first run. Five marks over the real interface, using a real brief, leavable at any point and
 * resumable afterwards. It anchors to elements by data attribute rather than by ref, because the
 * things it points at belong to four different components and threading refs through all of them
 * would tie the tour to their shape.
 */
export function Walkthrough({ onFill, onStrike }: WalkthroughProps): ReactNode {
  const [state, setState] = useWalkthrough();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const done = state === 'done';
  const index = done ? 0 : state.step;
  const step: Step | undefined = done ? undefined : STEPS[index];
  const acted = useRef<string | null>(null);

  // Whatever the step needs to have happened before it makes sense, happens once.
  useEffect(() => {
    if (!step || acted.current === step.id) return;
    acted.current = step.id;
    if (step.does === 'fill') onFill();
    if (step.does === 'strike') onStrike();
  }, [step, onFill, onStrike]);

  /*
   * The element a mark points at may not exist yet: the prompt and the settings only appear once
   * the step before has struck. So this looks on the next frame, and keeps looking, rather than
   * assuming the page is already in the shape the step expects.
   */
  useEffect(() => {
    if (!step) return;
    let frame = 0;
    const find = (): void => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
      if (el) {
        anchorRef.current = el;
        setAnchor(el);
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
      } else {
        frame = requestAnimationFrame(find);
      }
    };
    frame = requestAnimationFrame(find);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [step]);

  const leave = useCallback(() => {
    setState('done');
  }, [setState]);

  const next = useCallback(() => {
    if (index + 1 >= TOTAL) setState('done');
    else setState({ step: index + 1 });
  }, [index, setState]);

  if (!step || anchor === null) return null;

  return (
    <CoachMark
      open
      anchor={anchorRef}
      title={step.title}
      body={step.body}
      step={index + 1}
      total={TOTAL}
      side={step.side}
      nextLabel={step.nextLabel}
      onNext={next}
      onSkip={leave}
    />
  );
}

/** Offers the walkthrough again once it has been left, without ever forcing it. */
export function WalkthroughRestart(): ReactNode {
  const [state, setState] = useWalkthrough();
  if (state !== 'done') return null;
  return (
    <Button
      variant="quiet"
      size="sm"
      onClick={() => {
        setState({ step: 0 });
      }}
    >
      Show me around
    </Button>
  );
}
