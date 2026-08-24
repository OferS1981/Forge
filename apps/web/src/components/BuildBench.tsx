'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAutoFill,
  CATEGORIES,
  FIELDS,
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
import { Mark } from './Mark';
import { ModelHead, ModelRail } from './ModelRail';
import { Output } from './Output';
import {
  useBriefs,
  useForgeCount,
  useInvite,
  useBenchMode,
  usePlanOpen,
  useModelId,
  usePolicyNotes,
} from '../lib/store';
import { usePinnedModels } from '../lib/library';
import { recordUse } from '../lib/account';
import { Keep } from './Keep';
import { CompliancePass } from './CompliancePass';
import { PlanPanel } from './PlanPanel';
import { hasProfile, profileClause, useProfile } from '../lib/profile';
import { EXAMPLE_BRIEF } from '../lib/walkthrough';
import { Walkthrough, WalkthroughRestart } from './Walkthrough';

const FIRST = CATEGORIES[0]?.defaultModel ?? 'midjourney';

export function BuildBench(): React.ReactNode {
  const [mode, setMode] = useBenchMode();
  const [planOpen, setPlanOpen] = usePlanOpen();
  /*
   * While the plan is open the brief shows everything, exclusions included, so every interview
   * answer lands somewhere visible. The strike composes in whichever mode is chosen: Simple fills
   * the skipped questions with explained defaults, Advanced adds nothing that was not answered.
   */
  const briefMode = planOpen ? 'pro' : mode;
  const [modelId, setModelId] = useModelId(FIRST);
  const { pins, toggle: togglePin } = usePinnedModels();
  const [forged, bumpForged] = useForgeCount();
  const [inviteDismissed, dismissInvite] = useInvite();
  const [profile] = useProfile();
  const [useMyProfile, setUseMyProfile] = useState(false);
  const [policyNotes, setPolicyNotes] = usePolicyNotes();
  const { briefFor, setField, setFields, clear } = useBriefs();

  const [result, setResult] = useState<ForgeResult | null>(null);
  const [lift, setLift] = useState<{ to: number; onApply: () => void } | undefined>(undefined);
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
    const withProfile =
      useMyProfile && model.category === 'text' && hasProfile(profile)
        ? {
            ...brief,
            context: [brief.context, profileClause(profile)]
              .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
              .join(' '),
          }
        : brief;
    const out = forge(withProfile, model, mode);
    setResult(out);
    /*
     * Advanced fills in nothing you have not asked for; the lift is you asking for it, one click,
     * everything visible in the brief afterwards. Offered only when it genuinely moves the score.
     */
    if (mode !== 'simple') {
      const { brief: filledUp } = applyAutoFill(withProfile, model, 'simple');
      const lifted = forge(filledUp, model, mode);
      setLift(
        lifted.score > out.score + 4
          ? {
              to: lifted.score,
              onApply: () => {
                setFields(model.id, filledUp);
                setResult(lifted);
                setLift(undefined);
              },
            }
          : undefined,
      );
    } else {
      setLift(undefined);
    }
    setStrikes((n) => n + 1);
    bumpForged();
    recordUse('strike:' + model.id);
    if (planOpen) recordUse('plan');
    outputRef.current?.focus();
  }, [brief, model, mode, planOpen, useMyProfile, profile, bumpForged, setFields]);

  /**
   * The auto-filled line in Simple mode is the tutorial: each choice opens the one field that made
   * it, in Advanced mode, with focus already inside. The move waits a frame because switching mode
   * re-renders the brief and the field does not exist until it has.
   */
  const openField = useCallback(
    (field: FieldId) => {
      // In Plan everything is already on show, so the mode stays put.
      if (!planOpen) {
        if (FIELDS[field].tier === 'pro') {
          if (mode !== 'pro') setMode('pro');
        } else if (mode === 'simple') {
          setMode('advanced');
        }
      }
      setFocusField(field);
    },
    [planOpen, mode, setMode],
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
              if (v === 'simple' || v === 'advanced' || v === 'pro') setMode(v);
            }}
            options={[
              { value: 'simple', label: 'Simple' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'pro', label: 'Pro' },
            ]}
          />
          <p className="modebar__what">
            {mode === 'simple'
              ? 'Forge makes the choices, settings included. You give it the subject.'
              : mode === 'advanced'
                ? 'The middle tier. You choose what you want; Forge fills in nothing you have not asked for.'
                : 'Everything Advanced has, plus what you do not want: the keep-outs and excludes, in their own section.'}
          </p>
          <Switch
            label="Plan it with me"
            hint="for a big prompt: Forge interviews you, every answer lands in the brief"
            checked={planOpen}
            onChange={setPlanOpen}
          />
          <Switch
            label="Policy notes"
            hint="the model's own documented content rules, beside the prompt"
            checked={policyNotes}
            onChange={setPolicyNotes}
          />
          {model.category === 'text' && hasProfile(profile) && (
            <Switch
              label="Use my profile"
              hint="adds the About-me line from your account page to the context, visibly"
              checked={useMyProfile}
              onChange={setUseMyProfile}
            />
          )}
          {mode === 'simple' && forged >= 10 && (
            <p className="modebar__offer" role="status">
              You have forged {forged} prompts. Advanced mode opens the craft layer if you want it.
            </p>
          )}
        </div>

        {planOpen && (
          <PlanPanel
            brief={brief}
            model={model}
            mode={mode}
            onAnswer={(field, value) => {
              setField(model.id, field, value);
            }}
            onOpenField={openField}
          />
        )}

        <div id="brief" data-tour="brief">
          <Brief
            model={model}
            brief={brief}
            mode={briefMode}
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
          onReplaceField={(field, values) => {
            // A chips field takes the axes as separate chips; a text field takes one sentence.
            const def = FIELDS[field];
            setField(model.id, field, def.type === 'chips' ? values : values.join(', '));
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
            lift={lift}
            onOpenField={openField}
            keep={<Keep brief={brief} model={model} mode={mode} result={result} />}
            policyNotes={policyNotes}
          />
        )}
      </section>
    </main>
  );
}
