import type { ModelChange, Release } from './diff';

/**
 * The half nobody else has.
 *
 * A saved prompt in Forge keeps the brief and the model, not the rendered string. Phase 7 argued
 * that this was the right call and could not yet show why. This is why: when a model changes, Forge
 * knows exactly which of your saved prompts were written for it, and can offer to forge them again
 * rather than leaving you to find out from a bad render.
 */

/** Only the two fields this needs, so it works against a saved prompt from either library. */
export interface SavedLike {
  id: string;
  title: string;
  modelId: string;
  updatedAt: string;
}

export interface Affected {
  model: ModelChange;
  prompts: SavedLike[];
}

/**
 * Which saved prompts a release touches.
 *
 * A prompt saved *after* the change is not affected by it: it was written against the catalogue as
 * it is now. Comparing dates rather than listing every prompt for the model is the difference
 * between a useful line and a nag.
 */
export function affectedBy(release: Release, saved: readonly SavedLike[]): Affected[] {
  return release.changed
    .map((model) => ({
      model,
      prompts: saved.filter(
        (prompt) => prompt.modelId === model.id && olderThan(prompt.updatedAt, release.to),
      ),
    }))
    .filter((entry) => entry.prompts.length > 0);
}

function olderThan(updatedAt: string, releaseDate: string): boolean {
  const saved = Date.parse(updatedAt);
  const released = Date.parse(`${releaseDate}T23:59:59Z`);
  // A prompt with no readable date is treated as old, which errs towards telling somebody.
  if (Number.isNaN(saved)) return true;
  if (Number.isNaN(released)) return false;
  return saved <= released;
}

/**
 * The sentence itself, in the shape section 22 wrote it. Kept here rather than in a component so
 * the wording is tested, and so the website and anything else that shows it agree.
 */
export function affectedSentence(entry: Affected): string {
  const count = entry.prompts.length;
  const headline =
    entry.model.version === undefined
      ? `${entry.model.name} changed.`
      : `${entry.model.name} ${entry.model.version.now} shipped.`;
  // The headline already carries the version move, so the detail is the first change that is not it.
  const what = entry.model.changes.find((change) => change.field !== 'version');
  const detail = what === undefined ? '' : ` ${describe(what)}`;
  /*
   * "1 of your saved prompts uses it", not "1 of your saved prompt use it": the noun stays plural
   * after "of your", and it is the verb that moves.
   */
  return `${headline}${detail} ${String(count)} of your saved prompts use${count === 1 ? 's' : ''} it.`;
}

/** One change, as a sentence. Used by the public page and by the library line alike. */
export function describe(change: ModelChange['changes'][number]): string {
  const where = change.field.startsWith('settings.')
    ? `${change.field.slice('settings.'.length)} `
    : '';
  switch (change.kind) {
    case 'added':
      return `${where}${change.now ?? ''} is new.`.trim();
    case 'removed':
      return `${where}${change.was ?? ''} is gone.`.trim();
    case 'changed':
      return `${where}was ${change.was ?? ''} and is now ${change.now ?? ''}.`.trim();
  }
}
