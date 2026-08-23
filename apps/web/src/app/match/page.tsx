'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import {
  PRIORITIES,
  categoryById,
  match,
  modelLabel,
  type MatchResult,
  type StrengthTag,
} from '@forge/catalog';
import { Button, ChipGroup, TextArea } from '@forge/ui';
import { Empty, Workspace } from '../../components/Workspace';
import { useModelId } from '../../lib/store';

export default function MatchPage(): React.ReactNode {
  const [, setModelId] = useModelId('midjourney');
  const [query, setQuery] = useState('');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [result, setResult] = useState<MatchResult | null>(null);
  const outputRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const run = useCallback(() => {
    if (query.trim().length === 0) return;
    setResult(match(query, priorities as StrengthTag[]));
    outputRef.current?.focus();
  }, [query, priorities]);

  /** Choosing a model here opens the Build workspace with it already selected. */
  const open = (id: string): void => {
    setModelId(id);
    router.push('/');
  };

  return (
    <Workspace
      title="Match"
      lede="Describe what you are trying to make. Forge works out which kinds of model the job needs, ranks them on the documented strengths in the catalogue, and tells you why. A job that needs three kinds of model gets three answers."
      outputLabel="The models for that job"
      outputRef={outputRef}
      output={
        result === null ? (
          <Empty title="No brief">
            Say what you are making and Forge will point you at the right anvil.
          </Empty>
        ) : (
          <section className="billet" aria-label="Best fits for that brief">
            <div className="billet__head">
              <h2 className="billet__title">Best fits for that brief</h2>
            </div>
            <div className="billet__body">
              <p className="billet__note">
                {result.multi
                  ? 'This brief needs more than one tool. Forge has split it by job: build each prompt on its own anvil, then assemble.'
                  : 'Ranked on the documented strengths in the catalogue. Pick one and Forge opens the Build workspace with it already chosen.'}
              </p>
              {result.groups.map((g) => (
                <div className="matchgroup" key={g.category}>
                  {result.multi && <h3 className="matchgroup__job">For {g.job}</h3>}
                  <ul className="recs">
                    {g.models.map((entry, i) => (
                      <li key={entry.model.id}>
                        <button
                          type="button"
                          className="rec"
                          onClick={() => {
                            open(entry.model.id);
                          }}
                        >
                          <span
                            className="rec__dot"
                            aria-hidden="true"
                            style={{
                              background: `var(${categoryById(entry.model.category).colour})`,
                            }}
                          />
                          <span className="rec__body">
                            <span className="rec__name">{modelLabel(entry.model)}</span>
                            <span className="rec__why">{entry.model.best}</span>
                          </span>
                          <span className="rec__rank">
                            {i === 0 ? 'First choice' : 'Alternative'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )
      }
    >
      <TextArea
        label="What are you making?"
        id="match-in"
        rows={4}
        value={query}
        placeholder="A 15-second vertical ad for a running shoe, with a voiceover and a music bed"
        onChange={(e) => {
          setQuery(e.currentTarget.value);
        }}
      />
      <ChipGroup
        label="What matters most?"
        hint="pick as many as genuinely matter, and Forge weights the ranking by them"
        chips={PRIORITIES.map((p) => ({ value: p.tag, label: p.label }))}
        value={priorities}
        onChange={(v) => {
          setPriorities(Array.isArray(v) ? v : [v]);
        }}
      />
      <div className="strike-row">
        <Button variant="primary" size="lg" onClick={run} disabled={query.trim().length === 0}>
          Find the tool
        </Button>
      </div>
    </Workspace>
  );
}
