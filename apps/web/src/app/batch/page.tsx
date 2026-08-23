'use client';

import { useRef, useState } from 'react';
import {
  MODELS,
  findModel,
  forge,
  isBriefEmpty,
  modelById,
  modelLabel,
  scoreLabel,
} from '@forge/catalog';
import type { Model } from '@forge/catalog';
import { Button, ChipGroup, toast } from '@forge/ui';
import { Empty, Workspace } from '../../components/Workspace';
import { Result } from '../../components/Result';
import { useBriefs, useModelId } from '../../lib/store';

const LIMIT = 6;

/** One brief, several models, results in a row. */
export default function BatchPage(): React.ReactNode {
  const [sourceId] = useModelId('midjourney');
  const { briefFor } = useBriefs();
  const [picked, setPicked] = useState<string[]>([]);
  const [ran, setRan] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  const source = findModel(sourceId) ?? modelById('midjourney');
  const brief = briefFor(source.id);
  const empty = isBriefEmpty(brief);

  /** Only models in the same category can read the same brief. */
  const candidates = MODELS.filter((m) => m.category === source.category);

  const chosen = ran && !empty ? picked : [];
  const results = chosen
    .map((id) => findModel(id))
    .filter((m): m is Model => m !== undefined)
    .map((m) => ({ model: m, result: forge(brief, m) }));

  return (
    <Workspace
      title="Batch"
      lede="One brief, several models at once. Every model in the same category reads the same brief, so you can see the same idea written six ways and compare the scores side by side."
      outputLabel="The batch"
      outputRef={outputRef}
      output={
        results.length === 0 ? (
          <Empty title="Nothing in the batch">
            {empty
              ? 'Write a brief in the Build workspace first. Batch forges that brief across several models at once.'
              : 'Choose the models to forge this brief with, then strike.'}
          </Empty>
        ) : (
          <>
            <section className="billet" aria-label="Scores across the batch">
              <div className="billet__head">
                <h2 className="billet__title">Scores across the batch</h2>
              </div>
              <div className="billet__body">
                <ul className="batchscores">
                  {[...results]
                    .sort((a, b) => b.result.score - a.result.score)
                    .map(({ model, result }) => (
                      <li key={model.id}>
                        <span className="batchscores__n fg-mono">{result.score}</span>
                        <span className="batchscores__name">{modelLabel(model)}</span>
                        <span className="batchscores__label">{scoreLabel(result.score).name}</span>
                      </li>
                    ))}
                </ul>
                <p className="billet__note">
                  The score measures how much of the brief is steering that model, not which model
                  is better. A low score usually means that model reads a field this brief left
                  empty.
                </p>
              </div>
            </section>
            <div className="batch">
              {results.map(({ model, result }) => (
                <div className="batch__one" key={model.id}>
                  <h2 className="crosspair__name">{modelLabel(model)}</h2>
                  <Result result={result} model={model} />
                </div>
              ))}
            </div>
          </>
        )
      }
    >
      <p className="ws-note">
        Working from the brief you wrote for <strong>{modelLabel(source)}</strong> in the Build
        workspace.
      </p>
      <ChipGroup
        label={`Models to forge it with`}
        hint={`the ${String(candidates.length)} models that read this kind of brief, up to ${String(LIMIT)} at a time`}
        chips={candidates.map((m) => ({ value: m.id, label: modelLabel(m) }))}
        value={picked}
        max={LIMIT}
        onChange={(v) => {
          setPicked(Array.isArray(v) ? v : [v]);
        }}
      />
      <div className="strike-row">
        <Button
          variant="primary"
          size="lg"
          disabled={empty || picked.length === 0}
          onClick={() => {
            setRan(true);
            outputRef.current?.focus();
            toast(`Forged ${String(picked.length)} prompts from one brief.`, 'good');
          }}
        >
          Strike all
        </Button>
      </div>
    </Workspace>
  );
}
