import { explain, type Model, type TermId } from '@forge/catalog';
import type { Explanation } from '@forge/ui';

/**
 * The catalogue holds the words, packages/ui draws the popover, and this is the one place that
 * joins them. Nothing else in the app touches the glossary shape.
 */
export function explanationFor(id: TermId, model?: Model): Explanation | undefined {
  const term = explain(id, model === undefined ? undefined : { model });
  if (!term) return undefined;
  const out: Explanation = {
    label: term.label,
    short: term.short,
    what: term.what,
    changes: term.changes,
    when: term.when,
  };
  if (term.range !== undefined) out.range = term.range;
  if (term.example !== undefined) out.example = term.example;
  return out;
}
