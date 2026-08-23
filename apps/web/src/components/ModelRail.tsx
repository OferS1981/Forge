'use client';

import { useMemo, useState } from 'react';
import { CATEGORIES, MODELS, categoryById, modelLabel, type Model } from '@forge/catalog';
import { Combobox, type ListOption } from '@forge/ui';

export interface ModelRailProps {
  value: string;
  onChange: (id: string) => void;
  pins: string[];
}

/**
 * The tool rack. Fifty-seven models grouped by category, filterable by name, maker, capability tag
 * and grammar, with the category default marked and pins kept at the top.
 *
 * It names no model: everything below comes out of the catalogue.
 */
function toOption(m: Model, pinned: boolean, group?: string): ListOption {
  const category = categoryById(m.category);
  const option: ListOption = {
    value: m.id,
    label: modelLabel(m),
    hint: [m.version, m.maker].filter((s) => s !== undefined && s.length > 0).join(' · '),
    group: group ?? category.name,
    colourToken: category.colour,
  };
  if (!pinned && category.defaultModel === m.id) option.recommended = true;
  return option;
}

export function ModelRail({ value, onChange, pins }: ModelRailProps): React.ReactNode {
  const options = useMemo(() => {
    const pinned = MODELS.filter((m) => pins.includes(m.id));
    const rest = CATEGORIES.flatMap((c) =>
      MODELS.filter((m) => m.category === c.id && !pins.includes(m.id)).map((m) =>
        toOption(m, false),
      ),
    );
    return [...pinned.map((m) => toOption(m, true, 'Pinned')), ...rest];
  }, [pins]);

  return (
    <Combobox
      label="Model"
      options={options}
      value={value}
      onChange={onChange}
      searchHint={`Filter ${String(MODELS.length)} models`}
      placeholder="Choose a model"
      renderBadge={(o) =>
        pins.includes(o.value) ? (
          <span className="rail-pin" aria-hidden="true">
            Pinned
          </span>
        ) : null
      }
    />
  );
}

/** The model's own headline: what it is, what it is for, and what it is bad at. */
export function ModelHead({
  model,
  pinned,
  onTogglePin,
}: {
  model: Model;
  pinned: boolean;
  onTogglePin: () => void;
}): React.ReactNode {
  const [open, setOpen] = useState(false);
  const category = categoryById(model.category);

  return (
    <header className="mhead">
      <div className="mhead__top">
        <span
          className="mhead__dot"
          aria-hidden="true"
          style={{ background: `var(${category.colour})` }}
        />
        <h1 className="mhead__name">{modelLabel(model)}</h1>
        <span className="mhead__ver">{model.version}</span>
        {model.unverified === true && <span className="mhead__flag">Unverified</span>}
        <button type="button" className="mhead__pin" aria-pressed={pinned} onClick={onTogglePin}>
          {pinned ? 'Pinned to the top of the list' : 'Pin to the top of the list'}
        </button>
      </div>
      <p className="mhead__blurb">{model.blurb}</p>
      <ul className="mhead__tags">
        {model.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <button
        type="button"
        className="mhead__more"
        aria-expanded={open}
        aria-controls="model-detail"
        onClick={() => {
          setOpen(!open);
        }}
      >
        {open ? 'Hide what it is good and bad at' : 'What it is good and bad at'}
      </button>
      <div id="model-detail" className="mhead__detail" hidden={!open}>
        <p>
          <strong>Good at.</strong> {model.best}
        </p>
        <p>
          <strong>Bad at.</strong> {model.worst}
        </p>
        {model.unverified === true && (
          <p className="mhead__unverified">
            Nothing on this page has been checked against the vendor documentation since{' '}
            {model.verifiedOn}. Treat the settings as a starting point and confirm anything that
            costs you a generation.
          </p>
        )}
        <ul className="mhead__sources">
          {model.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noreferrer noopener" target="_blank">
                {s.title}
              </a>{' '}
              <span>{s.publisher}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
