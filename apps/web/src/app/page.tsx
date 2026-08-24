'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  clarify,
  findModel,
  forge,
  modelById,
  modelLabel,
  recommend,
  type FieldId,
  type ForgeResult,
} from '@forge/catalog';
import { Button, Segmented, Switch, toast } from '@forge/ui';
import { Brief } from '@forge/workbench';
import { Mark } from '../components/Mark';
import { ModelHead, ModelRail } from '../components/ModelRail';
import { Output } from '../components/Output';
import {
  useBriefs,
  useForgeCount,
  useInvite,
  useMode,
  useModelId,
  usePolicyNotes,
} from '../lib/store';
import { usePinnedModels } from '../lib/library';
import { Keep } from '../components/Keep';
import { CompliancePass } from '../components/CompliancePass';
import { EXAMPLE_BRIEF } from '../lib/walkthrough';
import { Walkthrough, WalkthroughRestart } from '../components/Walkthrough';

const FIRST = CATEGORIES[0]?.defaultModel ?? 'midjourney';

export default function BuildPage(): React.ReactNode {
  const [mode, setMode] = useMode();
  const [modelId, setModelId] = useModelId(FIRST);
  const { pins, toggle: togglePin } = usePinnedModels();
  const [forged, bumpForged] = useForgeCount();
  const [inviteDismissed, dismissInvite] = useInvite();
  const [policyNotes, setPolicyNotes] = usePolicyNotes();
  const { briefFor, setField, setFields, clear } = useBriefs();

  const [result, setResult] = useState<ForgeResult | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [focusField, setFocusField] = useState<FieldId | undefined>(undefined);
  const outputRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const model = useMemo(() => findModel(modelId) ?? modelById(FIRST), [modelId]);
  const brief = briefFor(model.id);

  // The command palette lives in the shell, so it asks for a model through the page rather than
  // reaching into this component's state.
  useEffect(() => {
    const onPick = (e: Event): void => {
      if (e instanceof CustomEvent && typeof e.detail === 'string') setModelId(e.detail);
    };
    window.addEventListener('forge:model', onPick);
    return () => {
      window.removeEventListener('forge:model', onPick);
    };
  }, [setModelId]);

  const strike = useCallback(() => {
    const missing = model.core.filter((id) => {
      const v = brief[id];
      return v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim().length === 0);
    });
    if (missing.length === model.core.length) {
      toast('Fill in at least the first field, then strike.', 'warn');
      return;
    }
    const out = forge(brief, model, mode);
    setResult(out);
    setStrikes((n) => n + 1);
    bumpForged();
    outputRef.current?.focus();
  }, [brief, model, mode, bumpForged]);

  /**
   * The auto-filled line in Simple mode is the tutorial: each choice opens the one field that made
   * it, in Advanced mode, with focus already inside. The move waits a frame because switching mode
   * re-renders the brief and the field does not exist until it has.
   */
  const openField = useCallback(
    (field: FieldId) => {
      if (mode !== 'advanced') setMode('advanced');
      setFocusField(field);
    },
    [mode, setMode],
  );

  useEffect(() => {
    if (focusField === undefined) return;
    const raf = requestAnimationFrame(() => {
      const host = document.getElementById(`field-${focusField}`);
      host?.scrollIntoView({ block: 'center', behavior: 'auto' });
      host?.querySelector<HTMLElement>('input, textarea, button')?.focus();
      setFocusField(undefined);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [focusField, mode]);

  const fillExample = useCallback(() => {
    setFields(model.id, EXAMPLE_BRIEF);
  }, [model.id, setFields]);

  const advice = useMemo(() => recommend(brief, model), [brief, model]);
  /*
   * The questions a senior would ask before starting, from the engine, each opening its own field.
   * Not a chat: three deterministic questions at most, shown only once there is a brief to ask
   * about, gone as each is answered.
   */
  const questions = useMemo(() => clarify(brief, model), [brief, model]);

  return (
    <main className="bench">
      <section className="bay bay--anvil" aria-label="The brief">
        <div className="brand">
          <Mark strikeSignal={strikes} />
          <div>
            <p className="brand__name">Forge</p>
            <p className="brand__sub">Prompt smithy</p>
          </div>
        </div>

        <div data-tour="rail">
          {!inviteDismissed && forged === 0 && (
            <aside className="invite" aria-label="A faster way to start">
              <p className="invite__text">
                Already have a prompt?{' '}
                <a className="invite__link" href="/doctor">
                  Paste it into the Doctor
                </a>{' '}
                and watch Forge take it apart.
              </p>
              <WalkthroughRestart />
              <button
                type="button"
                className="invite__close"
                aria-label="Dismiss this suggestion"
                onClick={() => {
                  dismissInvite(true);
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </aside>
          )}

          <ModelRail value={model.id} onChange={setModelId} pins={pins} />
        </div>
        <ModelHead
          model={model}
          pinned={pins.includes(model.id)}
          onTogglePin={() => {
            togglePin(model.id);
          }}
        />

        <div className="modebar">
          <Segmented
            label="Mode"
            value={mode}
            onChange={(v) => {
              if (v === 'simple' || v === 'advanced') setMode(v);
            }}
            options={[
              { value: 'simple', label: 'Simple' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
          <p className="modebar__what">
            {mode === 'simple'
              ? 'Forge makes most of the choices. You give it the subject.'
              : 'You make most of the choices. Forge fills in nothing you have not asked for.'}
          </p>
          <Switch
            label="Policy notes"
            hint="the model's own documented content rules, beside the prompt"
            checked={policyNotes}
            onChange={setPolicyNotes}
          />
          {mode === 'simple' && forged >= 10 && (
            <p className="modebar__offer" role="status">
              You have forged {forged} prompts. Advanced mode opens the craft layer if you want it.
            </p>
          )}
        </div>

        <div id="brief" data-tour="brief">
          <Brief
            model={model}
            brief={brief}
            mode={mode}
            onChange={(field, value) => {
              setField(model.id, field, value);
            }}
            onExplain={(term) => {
              router.push(`/glossary#${term.replace(/\./g, '-')}`);
            }}
          />
        </div>

        {questions.length > 0 && (
          <section className="asks" aria-label="Forge would ask">
            <h2 className="asks__title">Before you strike, Forge would ask</h2>
            <ul className="asks__list">
              {questions.map((q) => (
                <li key={q.field}>
                  <button
                    type="button"
                    className="asks__open"
                    onClick={() => {
                      openField(q.field);
                    }}
                  >
                    {q.ask}
                  </button>
                  <span className="asks__why"> {q.why}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <CompliancePass
          brief={brief}
          model={model}
          onOpenField={openField}
          onReplaceField={(field, value) => {
            setField(model.id, field, value);
            openField(field);
          }}
        />

        {advice.length > 0 && (
          <div className="advice" role="status">
            {advice.slice(0, 1).map((r) => (
              <p key={r.model.id}>
                <span className="advice__what">
                  {r.kind === 'better' ? 'Better fit: ' : 'Usually paired with: '}
                </span>
                <button
                  type="button"
                  className="advice__go"
                  onClick={() => {
                    setModelId(r.model.id);
                  }}
                >
                  {modelLabel(r.model)}
                </button>
                <span className="advice__why"> {r.why}</span>
              </p>
            ))}
          </div>
        )}

        <div className="strike-row" data-tour="strike">
          <Button variant="primary" size="lg" onClick={strike}>
            Strike
          </Button>
          <Button
            variant="quiet"
            onClick={() => {
              clear(model.id);
              setResult(null);
              toast('The brief is empty again.');
            }}
          >
            Clear the brief
          </Button>
        </div>
      </section>

      <Walkthrough onFill={fillExample} onStrike={strike} />

      <section
        className="bay bay--billet"
        aria-label="The forged prompt"
        aria-live="polite"
        tabIndex={-1}
        ref={outputRef}
      >
        {result === null ? (
          <div className="empty">
            <h2>Cold anvil</h2>
            <p>
              Pick a model, fill in the brief, and strike. Forge composes the prompt in that
              model&apos;s own grammar and lists the exact settings to match it.
            </p>
          </div>
        ) : (
          <Output
            result={result}
            model={model}
            mode={mode}
            onOpenField={openField}
            keep={<Keep brief={brief} model={model} mode={mode} result={result} />}
            policyNotes={policyNotes}
          />
        )}
      </section>
    </main>
  );
}
