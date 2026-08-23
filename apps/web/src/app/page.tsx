'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  findModel,
  forge,
  modelById,
  modelLabel,
  recommend,
  type FieldId,
  type ForgeResult,
} from '@forge/catalog';
import { Button, Segmented, toast } from '@forge/ui';
import { Brief } from '../components/Brief';
import { Mark } from '../components/Mark';
import { ModelHead, ModelRail } from '../components/ModelRail';
import { Output } from '../components/Output';
import { useBriefs, useForgeCount, useMode, useModelId, usePins } from '../lib/store';

const FIRST = CATEGORIES[0]?.defaultModel ?? 'midjourney';

export default function BuildPage(): React.ReactNode {
  const [mode, setMode] = useMode();
  const [modelId, setModelId] = useModelId(FIRST);
  const [pins, setPins] = usePins();
  const [forged, bumpForged] = useForgeCount();
  const { briefFor, setField, clear } = useBriefs();

  const [result, setResult] = useState<ForgeResult | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [focusField, setFocusField] = useState<FieldId | undefined>(undefined);
  const outputRef = useRef<HTMLDivElement>(null);

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

  const advice = useMemo(() => recommend(brief, model), [brief, model]);

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

        <ModelRail value={model.id} onChange={setModelId} pins={pins} />
        <ModelHead
          model={model}
          pinned={pins.includes(model.id)}
          onTogglePin={() => {
            setPins(
              pins.includes(model.id) ? pins.filter((p) => p !== model.id) : [...pins, model.id],
            );
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
          {mode === 'simple' && forged >= 10 && (
            <p className="modebar__offer" role="status">
              You have forged {forged} prompts. Advanced mode opens the craft layer if you want it.
            </p>
          )}
        </div>

        <div id="brief">
          <Brief
            model={model}
            brief={brief}
            mode={mode}
            onChange={(field, value) => {
              setField(model.id, field, value);
            }}
            onExplain={(term) => {
              window.location.href = `/glossary#${term.replace(/\./g, '-')}`;
            }}
          />
        </div>

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

        <div className="strike-row">
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
          <Output result={result} model={model} mode={mode} onOpenField={openField} />
        )}
      </section>
    </main>
  );
}
