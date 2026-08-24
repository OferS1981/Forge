import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  MODELS,
  categoryById,
  findModel,
  forge,
  modelById,
  modelLabel,
  scoreLabel,
  type Brief as BriefData,
  type FieldId,
  type ForgeResult,
  type Mode,
} from '@forge/catalog';
import { Brief } from '@forge/workbench';
import {
  Button,
  Combobox,
  Segmented,
  ThemeToggle,
  ToastRegion,
  toast,
  type ListOption,
} from '@forge/ui';
import { inExtension, onSite, paste, readSite } from '../bridge';
import { pasteMessage, type PasteOutcome } from '@forge/extension';

/**
 * The side panel.
 *
 * Not a copy of the website in a narrow column. Four hundred pixels is a different brief: it opens
 * on the model for the site you are on, asks the questions only you can answer, strikes, and puts
 * the result in that site's own box. Anything larger belongs on the website, and there is a link.
 *
 * It draws the same generated brief the website draws, out of `@forge/workbench`, so the form can
 * never drift between the two. That sharing is the reason for the monorepo, per section 14.
 */

const FALLBACK = CATEGORIES[0]?.defaultModel ?? 'midjourney';
const WEBSITE = 'https://forge.example';

function options(): ListOption[] {
  return CATEGORIES.flatMap((c) =>
    MODELS.filter((m) => m.category === c.id).map((m) => {
      const option: ListOption = {
        value: m.id,
        label: modelLabel(m),
        hint: m.version,
        group: c.name,
        colourToken: categoryById(m.category).colour,
      };
      return option;
    }),
  );
}

function isOutcome(value: unknown): value is PasteOutcome {
  const kind = (value as { kind?: unknown } | null)?.kind;
  return kind === 'written' || kind === 'no-field' || kind === 'unsupported';
}

export function Panel(): React.ReactNode {
  const [site, setSite] = useState(() => readSite(window.location.search));
  const [modelId, setModelId] = useState<string>(() => site.modelId ?? FALLBACK);
  const [mode, setMode] = useState<Mode>('simple');
  const [brief, setBrief] = useState<BriefData>({});
  const [result, setResult] = useState<ForgeResult | null>(null);

  // The content script tells the panel which site the tab is on, whenever that changes.
  useEffect(() => onSite(setSite), []);

  const followed = site.modelId;
  useEffect(() => {
    if (followed !== null) setModelId(followed);
  }, [followed]);

  const model = useMemo(() => findModel(modelId) ?? modelById(FALLBACK), [modelId]);

  const change = useCallback((field: FieldId, value: string | string[]) => {
    setBrief((current) => ({ ...current, [field]: value }));
  }, []);

  const strike = useCallback(() => {
    const empty = model.core.every((id) => {
      const v = brief[id];
      return v === undefined || (Array.isArray(v) ? v.length === 0 : v.trim().length === 0);
    });
    if (empty) {
      toast('Fill in at least the first field, then strike.', 'warn');
      return;
    }
    setResult(forge(brief, model, mode));
  }, [brief, model, mode]);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  /*
   * The clipboard first, then the page. That order matters: whatever the adapter does, the prompt
   * is already somewhere the person can use, so a site that has changed its markup overnight costs
   * them one paste rather than the work.
   */
  const putInPage = useCallback(async () => {
    if (result === null) return;
    const copied = await copy(result.flat);
    const outcome = await paste(result.flat);
    const said = isOutcome(outcome) ? pasteMessage(outcome) : pasteMessage({ kind: 'unsupported' });
    if (!copied && !isOutcome(outcome)) {
      toast('Could not reach the clipboard. Select the prompt and copy it by hand.', 'warn', 0);
      return;
    }
    toast(said, isOutcome(outcome) && outcome.kind === 'written' ? 'good' : undefined);
  }, [copy, result]);

  const openOnTheWebsite = useCallback(() => {
    try {
      localStorage.setItem('forge.model', JSON.stringify(model.id));
      const raw = localStorage.getItem('forge.briefs');
      const all: unknown = raw === null ? {} : JSON.parse(raw);
      const briefs =
        typeof all === 'object' && all !== null ? (all as Record<string, unknown>) : {};
      briefs[model.id] = brief;
      localStorage.setItem('forge.briefs', JSON.stringify(briefs));
    } catch {
      // The website will simply open empty.
    }
    window.open(WEBSITE, '_blank', 'noopener');
  }, [brief, model.id]);

  return (
    <div className="panel">
      <header className="panel__head">
        <div>
          <p className="panel__name">Forge</p>
          <p className="panel__where" data-testid="where">
            {site.host === null
              ? 'Not beside a site Forge knows. Pick a model and it works the same.'
              : site.modelId === null
                ? `On ${site.host}. Forge has no model for this site, so pick one.`
                : `On ${site.host}. Opened ${modelLabel(model)} for you.`}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Combobox
        label="Model"
        options={options()}
        value={model.id}
        onChange={setModelId}
        searchHint={`Filter ${String(MODELS.length)} models`}
        placeholder="Choose a model"
        compact
      />

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

      <div className="panel__brief">
        <Brief
          model={model}
          brief={brief}
          mode={mode}
          onChange={change}
          onExplain={() => {
            // The glossary is on the website. A popover in a four hundred pixel column is worse
            // than the link at the foot of this panel.
          }}
        />
      </div>

      <div className="panel__strike">
        <Button variant="primary" size="lg" onClick={strike}>
          Strike
        </Button>
      </div>

      {result !== null && (
        <section className="panel__out" aria-label="The forged prompt" aria-live="polite">
          <p className="panel__score">
            Score {result.score}, {scoreLabel(result.score).name.toLowerCase()}
          </p>
          <pre className="panel__prompt fg-mono">{result.flat}</pre>
          <div className="panel__actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                void putInPage();
              }}
            >
              {inExtension() ? 'Put it in the page' : 'Copy the prompt'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void copy(result.flat).then((ok) => {
                  toast(
                    ok ? 'The prompt is copied.' : 'Could not reach the clipboard.',
                    ok ? 'good' : 'warn',
                  );
                });
              }}
            >
              Copy
            </Button>
          </div>
          {result.settings.length > 0 && (
            <ul className="panel__settings">
              {result.settings
                .filter((r) => mode !== 'simple' || r.tier === 'simple')
                .map((r) => (
                  <li key={r.name}>
                    <span className="fg-mono">{r.name}</span>
                    <span className="fg-mono">{r.value}</span>
                  </li>
                ))}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="panel__warn">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="panel__foot">
        <button type="button" className="panel__link" onClick={openOnTheWebsite}>
          Open this on the website
        </button>
        <p className="panel__fine">
          The full workspace has the craft layer, the Doctor, the glossary and your library.
          {result !== null && result.autoFilled.length > 0
            ? ` Forge chose ${String(result.autoFilled.length)} things for you here, and says which ones there.`
            : ''}
        </p>
      </footer>
      <ToastRegion />
    </div>
  );
}
