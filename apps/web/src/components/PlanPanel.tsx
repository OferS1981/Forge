'use client';

import { useMemo, useState } from 'react';
import { FIELDS, plan, type Brief, type FieldId, type Mode, type Model } from '@forge/catalog';
import { Button } from '@forge/ui';

/**
 * The Plan interview: one question at a time, in the order a professional would ask, every
 * answer landing visibly in the brief below. Skipping is first-class: a skipped question goes
 * to the back of your session and Forge's own defaults cover it at the strike. When nothing is
 * left to ask, the plan is complete and says so.
 */
export function PlanPanel({
  brief,
  model,
  mode,
  onAnswer,
  onOpenField,
}: {
  brief: Brief;
  model: Model;
  mode: Mode;
  onAnswer: (field: FieldId, value: string | string[]) => void;
  onOpenField: (field: FieldId) => void;
}): React.ReactNode {
  const [skipped, setSkipped] = useState<FieldId[]>([]);
  const [draft, setDraft] = useState('');

  const questions = useMemo(() => plan(brief, model), [brief, model]);
  const open = questions.filter((q) => !skipped.includes(q.field));
  const current = open[0] ?? questions[0];
  const total = useMemo(() => plan({}, model).length, [model]);
  const answered = total - questions.length;

  if (questions.length === 0) {
    return (
      <section className="plan" aria-label="The plan">
        <p className="plan__done">
          The plan is complete: all {total} questions are answered. Strike when ready, or open any
          field below to change your mind.
        </p>
      </section>
    );
  }
  if (current === undefined) return null;

  const isChips = FIELDS[current.field].type === 'chips';
  const submit = (): void => {
    const value = draft.trim();
    if (value === '') return;
    onAnswer(
      current.field,
      isChips
        ? value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : value,
    );
    setDraft('');
  };

  return (
    <section className="plan" aria-label="The plan">
      <p className="plan__count">
        Question {answered + 1} of {total}
        {answered > 0 && (
          <span className="plan__prefilled"> {answered} already answered by your brief.</span>
        )}
      </p>
      <label className="plan__ask" htmlFor="plan-answer">
        {current.ask}
      </label>
      <p className="plan__why">{current.why}</p>
      <input
        id="plan-answer"
        className="plan__input"
        type="text"
        value={draft}
        placeholder={isChips ? 'separate several with commas' : 'your answer'}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <div className="plan__actions">
        <Button size="sm" variant="primary" disabled={draft.trim() === ''} onClick={submit}>
          Answer
        </Button>
        <Button
          size="sm"
          variant="quiet"
          onClick={() => {
            setSkipped((prev) => (prev.includes(current.field) ? prev : [...prev, current.field]));
          }}
        >
          {mode === 'simple' ? 'Skip: Forge decides' : 'Skip'}
        </Button>
        <Button
          size="sm"
          variant="quiet"
          onClick={() => {
            onOpenField(current.field);
          }}
        >
          Open the field instead
        </Button>
      </div>
      {skipped.length > 0 && (
        <p className="plan__skipnote">
          Skipped: {skipped.length}.{' '}
          {mode === 'simple'
            ? 'Forge fills those with its own defaults and says why.'
            : 'In Advanced mode a skipped question stays unanswered, exactly as you left it.'}
        </p>
      )}
    </section>
  );
}
