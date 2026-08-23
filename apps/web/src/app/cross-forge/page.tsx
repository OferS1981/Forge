'use client';

import { useMemo, useRef, useState } from 'react';
import { FIELDS, findModel, isBriefEmpty, modelById, modelLabel, translate } from '@forge/catalog';
import { Button } from '@forge/ui';
import { Empty, ModelPicker, Workspace } from '../../components/Workspace';
import { Result } from '../../components/Result';
import { useBriefs, useModelId } from '../../lib/store';

/**
 * The same brief, re-expressed in another model's grammar, with what could not carry over and
 * why. This is only possible because the brief, not the prompt string, is the source of truth.
 */
export default function CrossForgePage(): React.ReactNode {
  const [fromId] = useModelId('midjourney');
  const [toId, setToId] = useState('sdxl');
  const { briefFor } = useBriefs();
  const [ran, setRan] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  const from = findModel(fromId) ?? modelById('midjourney');
  const to = findModel(toId) ?? modelById('sdxl');
  const brief = briefFor(from.id);
  const empty = isBriefEmpty(brief);

  const result = useMemo(
    () => (empty || !ran ? null : translate(brief, from, to)),
    [brief, from, to, empty, ran],
  );

  return (
    <Workspace
      title="Cross-forge"
      lede="Take the brief you wrote in the Build workspace and see it written properly for a second model. Prose becomes tags, tags become JSON, a still becomes a shot. Forge also says what could not carry across, and why."
      outputLabel="The two prompts"
      outputRef={outputRef}
      output={
        result === null ? (
          <Empty title="Nothing to carry across">
            {empty
              ? 'Write a brief in the Build workspace first. Cross-forge re-expresses that brief, so it needs one to work from.'
              : 'Choose a second model and cross-forge the brief you already wrote.'}
          </Empty>
        ) : (
          <>
            {result.lost.length > 0 ? (
              <section className="billet" aria-label="What was lost">
                <div className="billet__head">
                  <h2 className="billet__title">What was lost</h2>
                </div>
                <div className="billet__body">
                  <ul className="notes notes--warn">
                    {result.lost.map((l) => (
                      <li key={l.field}>
                        <strong>{FIELDS[l.field].label}.</strong> {l.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : (
              <section className="billet" aria-label="What was lost">
                <div className="billet__head">
                  <h2 className="billet__title">Nothing was lost</h2>
                </div>
                <div className="billet__body">
                  <p className="billet__note">
                    Every field you filled in is one {modelLabel(to)} also reads. The two prompts
                    say the same thing in different grammars.
                  </p>
                </div>
              </section>
            )}

            <div className="crosspair">
              <div className="crosspair__side">
                <h2 className="crosspair__name">{modelLabel(from)}</h2>
                <Result result={result.from} model={from} />
              </div>
              <div className="crosspair__side">
                <h2 className="crosspair__name">{modelLabel(to)}</h2>
                <Result result={result.to} model={to} />
              </div>
            </div>
          </>
        )
      }
    >
      <p className="ws-note">
        Working from the brief you wrote for <strong>{modelLabel(from)}</strong> in the Build
        workspace.
      </p>
      <ModelPicker label="Cross-forge it to" value={to.id} onChange={setToId} />
      <div className="strike-row">
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            setRan(true);
            outputRef.current?.focus();
          }}
          disabled={empty || from.id === to.id}
        >
          Cross-forge
        </Button>
        {from.id === to.id && (
          <p className="strike-row__note">
            That is the model the brief was written for. Choose a different one.
          </p>
        )}
      </div>
    </Workspace>
  );
}
