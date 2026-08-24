'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  compliance,
  decompose,
  type AttributeScaffold,
  type Brief,
  type ComplianceFinding,
  type FieldId,
  type Model,
} from '@forge/catalog';
import { Button, Disclosure } from '@forge/ui';

/**
 * The Compliance Pass sits between the brief and the Strike button and runs live as the brief
 * fills in. It is advice, not a gate: it never blocks the Strike, every finding is dismissible,
 * and a dismissal is remembered for the session. The decomposition panel is the point of the
 * whole thing, a name becomes eight or nine dials, the prompt gets better, and the finding
 * clears at the same time.
 */

const DISMISS_KEY = 'forge.compliance-dismissed';

function readDismissed(): string[] {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const SEVERITY_WORD = { note: 'worth knowing', caution: 'will bite', high: 'a wall' } as const;

export interface CompliancePassProps {
  brief: Brief;
  model: Model;
  onOpenField: (field: FieldId) => void;
  /** Replace a field's value with the composed attributes from the scaffold. */
  onReplaceField: (field: FieldId, value: string) => void;
}

export function CompliancePass({
  brief,
  model,
  onOpenField,
  onReplaceField,
}: CompliancePassProps): React.ReactNode {
  const findings = useMemo(() => compliance(brief, model), [brief, model]);
  const [dismissed, setDismissed] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readDismissed(),
  );
  const [scaffoldFor, setScaffoldFor] = useState<ComplianceFinding | null>(null);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
      } catch {
        // Session memory is a courtesy, not a requirement.
      }
      return next;
    });
    setScaffoldFor((open) => (open !== null && open.id === id ? null : open));
  }, []);

  const live = findings.filter((f) => !dismissed.includes(f.id));
  if (live.length === 0) return null;

  const summary = `${String(live.length)} thing${live.length === 1 ? '' : 's'} worth knowing before you paste`;

  return (
    <section className="pass" aria-label="The compliance pass">
      <Disclosure summary={summary} className="pass__box">
        <p className="pass__tagline">
          Advice, not a gate: Strike works regardless, and every line here can be dismissed.
        </p>
        <ul className="pass__list">
          {live.map((f) => (
            <li key={f.id} className={`pass__item pass__item--${f.severity}`}>
              <p className="pass__head">
                <span className="pass__sev">{SEVERITY_WORD[f.severity]}</span>
                <span className="pass__title">{f.title}</span>
              </p>
              <p className="pass__detail">{f.detail}</p>
              {f.rewrite !== undefined && <p className="pass__rewrite">{f.rewrite}</p>}
              <p className="pass__actions">
                {f.decompose !== undefined && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setScaffoldFor((open) => (open?.id === f.id ? null : f));
                    }}
                  >
                    Describe it instead
                  </Button>
                )}
                {f.field !== undefined && (
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={() => {
                      if (f.field !== undefined) onOpenField(f.field);
                    }}
                  >
                    Open the field
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    dismiss(f.id);
                  }}
                >
                  Dismiss
                </Button>
              </p>
              {scaffoldFor !== null && scaffoldFor.id === f.id && f.decompose !== undefined && (
                <Scaffold
                  finding={f}
                  onApply={(value) => {
                    if (f.field !== undefined) onReplaceField(f.field, value);
                    dismiss(f.id);
                  }}
                  onClose={() => {
                    setScaffoldFor(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </Disclosure>
    </section>
  );
}

/**
 * The attribute scaffold: the eight visual or nine audio axes, prefilled where the category
 * implies a default, empty where only the person can answer. They pick; nothing applies itself.
 */
function Scaffold({
  finding,
  onApply,
  onClose,
}: {
  finding: ComplianceFinding;
  onApply: (value: string) => void;
  onClose: () => void;
}): React.ReactNode {
  const spec: AttributeScaffold | null = useMemo(
    () =>
      finding.decompose === undefined
        ? null
        : decompose(finding.decompose.term, finding.decompose.category),
    [finding],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  if (spec === null) return null;

  const filled = spec.axes
    .map((a) => (values[a.id] ?? a.prefill ?? '').trim())
    .filter((v) => v !== '');

  return (
    <div className="scaffold">
      <p className="scaffold__note">{spec.note}</p>
      <div className="scaffold__axes">
        {spec.axes.map((a) => (
          <label key={a.id} className="scaffold__axis">
            <span className="scaffold__label">{a.label}</span>
            <span className="scaffold__hint">
              {a.hint} e.g. {a.example}.
            </span>
            <input
              className="scaffold__input"
              type="text"
              value={values[a.id] ?? a.prefill ?? ''}
              placeholder={a.example}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [a.id]: e.target.value }));
              }}
            />
          </label>
        ))}
      </div>
      <p className="pass__actions">
        <Button
          size="sm"
          disabled={filled.length === 0}
          onClick={() => {
            onApply(filled.join(', '));
          }}
        >
          Use these {String(filled.length)} dials
        </Button>
        <Button size="sm" variant="quiet" onClick={onClose}>
          Close
        </Button>
      </p>
    </div>
  );
}
