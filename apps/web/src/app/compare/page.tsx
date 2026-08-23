'use client';

import { useMemo, useRef, useState } from 'react';
import { diffPrompts, findModel, diagnose, modelById, scoreLabel } from '@forge/catalog';
import { Button, TextArea } from '@forge/ui';
import { Empty, ModelPicker, Workspace } from '../../components/Workspace';
import { useModelId } from '../../lib/store';

/**
 * Two prompts, with what actually changed marked, so an improvement can be traced to the edit
 * that caused it rather than guessed at.
 */
export default function ComparePage(): React.ReactNode {
  const [modelId, setModelId] = useModelId('midjourney');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [ran, setRan] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  const model = findModel(modelId) ?? modelById('midjourney');
  const ready = before.trim().length > 0 && after.trim().length > 0;

  const seen = useMemo(() => {
    if (!ran || !ready) return null;
    return {
      diff: diffPrompts(before, after),
      a: diagnose(before, model),
      b: diagnose(after, model),
    };
  }, [ran, ready, before, after, model]);

  return (
    <Workspace
      title="Compare"
      lede="Paste two versions of a prompt and Forge marks exactly what changed between them, then scores both. That is how you find out which edit caused the improvement, rather than changing five things and hoping."
      outputLabel="What changed"
      outputRef={outputRef}
      output={
        seen === null ? (
          <Empty title="Nothing to compare">
            Paste the version that worked and the version that did not, and Forge will show you what
            is different and what it did to the score.
          </Empty>
        ) : (
          <>
            <div className="beforeafter">
              <div className="beforeafter__side">
                <p className="beforeafter__n">{seen.a.score}</p>
                <p className="beforeafter__t">First</p>
              </div>
              <div className="beforeafter__body">
                <p className="beforeafter__names">
                  {scoreLabel(seen.a.score).name}
                  <span aria-hidden="true"> to </span>
                  <span className="beforeafter__after">{scoreLabel(seen.b.score).name}</span>
                </p>
                <p className="beforeafter__words">
                  {seen.diff.added} words added, {seen.diff.removed} removed, {seen.diff.unchanged}{' '}
                  unchanged
                </p>
              </div>
              <div className="beforeafter__side beforeafter__side--after">
                <p className="beforeafter__n">{seen.b.score}</p>
                <p className="beforeafter__t">Second</p>
              </div>
            </div>

            <section className="billet" aria-label="The difference">
              <div className="billet__head">
                <h2 className="billet__title">The difference</h2>
              </div>
              <div className="billet__body">
                <p className="diff">
                  {seen.diff.parts.map((p, i) => (
                    <span
                      // The parts are positional, so the index is the identity.
                      key={`${p.kind}-${String(i)}`}
                      className={`diff__${p.kind}`}
                    >
                      {p.kind === 'added' && <span className="fg-visually-hidden">Added: </span>}
                      {p.kind === 'removed' && (
                        <span className="fg-visually-hidden">Removed: </span>
                      )}
                      {p.text}
                    </span>
                  ))}
                </p>
                <p className="billet__note">
                  Struck-through words are only in the first prompt. Underlined words are only in
                  the second.
                </p>
              </div>
            </section>

            {seen.b.findings.length > 0 && (
              <section className="billet" aria-label="Still missing from the second prompt">
                <div className="billet__head">
                  <h2 className="billet__title">Still missing from the second prompt</h2>
                </div>
                <div className="billet__body">
                  <ul className="notes notes--warn">
                    {seen.b.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </>
        )
      }
    >
      <ModelPicker label="Scored against" value={model.id} onChange={setModelId} />
      <TextArea
        label="The first prompt"
        id="compare-a"
        rows={7}
        value={before}
        placeholder="a photo of a boxer in a gym"
        onChange={(e) => {
          setBefore(e.currentTarget.value);
        }}
      />
      <TextArea
        label="The second prompt"
        id="compare-b"
        rows={7}
        value={after}
        placeholder="Photograph of a retired boxer taping his hands, basement gym at 6am, 85mm at f/2.8, softbox key camera-left"
        onChange={(e) => {
          setAfter(e.currentTarget.value);
        }}
      />
      <div className="strike-row">
        <Button
          variant="primary"
          size="lg"
          disabled={!ready}
          onClick={() => {
            setRan(true);
            outputRef.current?.focus();
          }}
        >
          Compare
        </Button>
      </div>
    </Workspace>
  );
}
