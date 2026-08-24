'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  diagnoseRefusal,
  findModel,
  modelById,
  modelLabel,
  parseRefusal,
  splitHalves,
} from '@forge/catalog';
import { Button, Segmented, TextArea } from '@forge/ui';
import { Empty, ModelPicker, Workspace } from './Workspace';
import { useModelId } from '../lib/store';
import { recordUse } from '../lib/account';

/**
 * The Refusal Doctor: the policy manual's ninety-second diagnostic as a workspace. Paste the
 * error, answer the one question that separates a classifier from the model, and bisect, which
 * needs no model access at all, so it is free and works offline. It names the layer and gives
 * the fix for that layer; it never suggests a way around a rule, because the fix for a false
 * positive is precision, not evasion.
 */

type Consistency = 'every' | 'sometimes' | 'unsure';

const DETERMINISTIC: Record<Consistency, boolean | null> = {
  every: true,
  sometimes: false,
  unsure: null,
};

export function RefusalDoctor(): React.ReactNode {
  const [modelId, setModelId] = useModelId('midjourney');
  const [errorText, setErrorText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [consistency, setConsistency] = useState<Consistency>('unsure');
  const [ran, setRan] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  const model = findModel(modelId) ?? modelById('midjourney');

  const read = useMemo(() => parseRefusal(errorText), [errorText]);
  const verdict = useMemo(
    () => diagnoseRefusal(read, DETERMINISTIC[consistency]),
    [read, consistency],
  );

  // The bisect walk: a stack of ever-smaller fragments, driven by which half failed.
  const [fragment, setFragment] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  const halves = useMemo(() => (fragment === null ? null : splitHalves(fragment)), [fragment]);
  const narrow = useCallback((half: string) => {
    setFragment(half);
    setSteps((n) => n + 1);
  }, []);

  const run = useCallback(() => {
    setRan(true);
    recordUse('refusal');
    setFragment(null);
    setSteps(0);
    outputRef.current?.focus();
  }, []);

  const refusal = model.refusal;
  const done = fragment !== null && fragment.trim().split(/\s+/).length <= 3;

  return (
    <Workspace
      title="Refusal Doctor"
      lede="Something got blocked. Paste the error and the prompt, and Forge names which of the seven layers refused you and the fix for that layer. Nothing is sent anywhere: the diagnostic is a table and a bisection, not a model call."
      outputLabel="The refusal, diagnosed"
      outputRef={outputRef}
      output={
        !ran ? (
          <Empty title="No refusal yet">
            Paste the error text, say whether it fails every time, and the diagnosis names the
            layer. Deterministic means classifier. Inconsistent means the model. That single fact
            picks the fix.
          </Empty>
        ) : (
          <>
            {read.codes.length > 0 && (
              <section className="billet" aria-label="What the error itself says">
                <div className="billet__head">
                  <h2 className="billet__title">The error names what fired</h2>
                </div>
                <div className="billet__body">
                  <ul className="notes">
                    {read.codes.map((c) => (
                      <li key={c.code}>
                        <span className="fg-mono">{c.code}</span>: {c.category}, blocked on the{' '}
                        {c.side === 'input' ? 'prompt' : 'output'}.{' '}
                        {c.side === 'input'
                          ? 'The fix is vocabulary.'
                          : 'The fix is the depiction or the settings.'}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            <section className="billet" aria-label="The layer">
              <div className="billet__head">
                <h2 className="billet__title">{verdict.name}</h2>
              </div>
              <div className="billet__body">
                <p className="billet__note">
                  <strong>What it sees: </strong>
                  {verdict.sees}
                </p>
                <p className="billet__note">
                  <strong>The fix: </strong>
                  {verdict.fix}
                </p>
              </div>
            </section>

            <section className="billet" aria-label="This vendor's path">
              <div className="billet__head">
                <h2 className="billet__title">On {modelLabel(model)}, honestly</h2>
              </div>
              <div className="billet__body">
                {refusal.diagnostics !== undefined && (
                  <p className="billet__note">{refusal.diagnostics}</p>
                )}
                <p className="billet__note">
                  {refusal.appealPath ??
                    'There is no appeal path here. No published appeals process exists for this vendor, so the fix is the prompt or a different model, not a form.'}
                </p>
                <p className="billet__note">{refusal.vendorGuidance}</p>
                {refusal.unverified === true && (
                  <p className="billet__note">
                    This vendor sheet is unverified: no primary page was fetched for it. Treat it as
                    a lead.
                  </p>
                )}
              </div>
            </section>

            {prompt.trim() !== '' && !read.codes.some((c) => c.hardLine) && (
              <section className="billet" aria-label="Bisect the prompt">
                <div className="billet__head">
                  <h2 className="billet__title">Bisect: four runs to the trigger</h2>
                </div>
                <div className="billet__body">
                  {fragment === null ? (
                    <>
                      <p className="billet__note">
                        Delete half, run it, and whichever half fails alone contains the trigger.
                        Forge does the splitting; you do the testing, in the vendor&rsquo;s own app.
                      </p>
                      <Button
                        onClick={() => {
                          narrow(prompt.trim());
                        }}
                      >
                        Start the bisect
                      </Button>
                    </>
                  ) : done ? (
                    <p className="billet__note" data-testid="bisect-done">
                      The trigger is in: <strong>&ldquo;{fragment.trim()}&rdquo;</strong>. Swap the
                      ambiguous word for a more precise synonym, precision unblocks and improves the
                      prompt at the same time. ({steps} step{steps === 1 ? '' : 's'}.)
                    </p>
                  ) : (
                    halves !== null && (
                      <>
                        <p className="billet__note">
                          Run each half alone in the model&rsquo;s app. Which one was refused?
                        </p>
                        <div className="bisect">
                          {[halves[0], halves[1]].map((half, i) => (
                            <div className="bisect__half" key={half.slice(0, 32)}>
                              <p className="bisect__text">{half}</p>
                              <Button
                                size="sm"
                                onClick={() => {
                                  narrow(half);
                                }}
                              >
                                This half failed
                              </Button>
                              {i === 0 && <span className="fg-visually-hidden">first half</span>}
                            </div>
                          ))}
                        </div>
                        <p className="billet__note">
                          If both halves pass alone, the trigger is accumulated severity across the
                          whole: shorten it, or chunk it.
                        </p>
                      </>
                    )
                  )}
                </div>
              </section>
            )}
          </>
        )
      }
    >
      <ModelPicker label="The model that refused" value={model.id} onChange={setModelId} />
      <TextArea
        label="The error text"
        hint="paste it exactly, codes and all"
        id="refusal-error"
        rows={4}
        value={errorText}
        placeholder='e.g. "The prompt could not be submitted... support code 58061214"'
        onChange={(e) => {
          setErrorText(e.currentTarget.value);
        }}
      />
      <Segmented
        label="Does it fail every time?"
        value={consistency}
        onChange={(v) => {
          if (v === 'every' || v === 'sometimes' || v === 'unsure') setConsistency(v);
        }}
        options={[
          { value: 'every', label: 'Every time' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'unsure', label: 'Not sure' },
        ]}
      />
      <TextArea
        label="The refused prompt"
        hint="optional, for the bisect"
        id="refusal-prompt"
        rows={6}
        value={prompt}
        placeholder="paste the prompt that was refused and Forge will split it for testing"
        onChange={(e) => {
          setPrompt(e.currentTarget.value);
        }}
      />
      <div className="strike-row">
        <Button
          variant="primary"
          size="lg"
          onClick={run}
          disabled={errorText.trim().length === 0 && prompt.trim().length === 0}
        >
          Diagnose the refusal
        </Button>
      </div>
    </Workspace>
  );
}
