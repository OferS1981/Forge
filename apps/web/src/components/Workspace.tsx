'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import { CATEGORIES, MODELS, categoryById, modelLabel, type CategoryId } from '@forge/catalog';
import { Combobox, type ListOption } from '@forge/ui';

/**
 * Every workspace is the same bench: what you give it on the left, what it makes on the right.
 * Build, Doctor, Reverse and Match all sit in this, so the shape of the product is one shape.
 */
export function Workspace({
  title,
  lede,
  children,
  output,
  outputRef,
  outputLabel = 'The result',
}: {
  title: string;
  lede: string;
  children: ReactNode;
  output: ReactNode;
  outputRef?: RefObject<HTMLElement | null> | undefined;
  outputLabel?: string | undefined;
}): ReactNode {
  const fallback = useRef<HTMLElement>(null);
  return (
    <main className="bench">
      <section className="bay bay--anvil" aria-label={title}>
        <header className="ws-head">
          <h1 className="ws-title">{title}</h1>
          <p className="ws-lede">{lede}</p>
        </header>
        <div id="brief">{children}</div>
      </section>
      <section
        className="bay bay--billet"
        aria-label={outputLabel}
        aria-live="polite"
        tabIndex={-1}
        ref={outputRef ?? fallback}
      >
        {output}
      </section>
    </main>
  );
}

/** The empty state a workspace shows before it has been given anything. */
export function Empty({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function toOption(id: string): ListOption {
  const m = MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown model: ${id}`);
  const category = categoryById(m.category);
  const option: ListOption = {
    value: m.id,
    label: modelLabel(m),
    hint: [m.version, m.maker].filter((s) => s !== undefined && s.length > 0).join(' · '),
    group: category.name,
    colourToken: category.colour,
  };
  if (category.defaultModel === m.id) option.recommended = true;
  return option;
}

/**
 * The model picker, wherever a workspace needs one. It takes a list of categories when only some
 * of the catalogue makes sense: Reverse Forge cannot produce a voice from a photograph.
 */
export function ModelPicker({
  label,
  value,
  onChange,
  categories,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  categories?: readonly CategoryId[] | undefined;
  hideLabel?: boolean | undefined;
}): ReactNode {
  const allowed = categories ?? CATEGORIES.map((c) => c.id);
  const options = CATEGORIES.filter((c) => allowed.includes(c.id)).flatMap((c) =>
    MODELS.filter((m) => m.category === c.id).map((m) => toOption(m.id)),
  );
  return (
    <Combobox
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      hideLabel={hideLabel}
      searchHint={`Filter ${String(options.length)} models`}
      placeholder="Choose a model"
    />
  );
}

/** The models a given workspace is allowed to target. */
export const VISUAL: readonly CategoryId[] = ['image', 'video'];
