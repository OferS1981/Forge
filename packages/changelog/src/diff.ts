import type { Snapshot, SnapshotModel } from './snapshot';

/**
 * What changed between two snapshots.
 *
 * Section 22 asks for a sentence like "Midjourney V8.3 shipped and `--exp` behaves differently.
 * Four of your saved prompts use it." That sentence has two halves. This file is the first: what
 * changed, per model, in the words the change actually happened in. The second half is `affected`,
 * below, which is the part nobody else has, because it needs a library of saved briefs.
 */

export type ChangeKind = 'added' | 'removed' | 'changed';

export interface Change {
  kind: ChangeKind;
  /** The part of the model file it happened in: `version`, `settings.--stylize`, `warnings`. */
  field: string;
  /** What it said before, absent for something newly added. */
  was?: string;
  /** What it says now, absent for something removed. */
  now?: string;
}

export interface ModelChange {
  id: string;
  name: string;
  category: string;
  /** Set when the version string itself moved, which is the headline. */
  version?: { was: string; now: string };
  changes: Change[];
}

export interface Release {
  from: string;
  to: string;
  /** Models that arrived in the catalogue between the two snapshots. */
  added: { id: string; name: string; category: string; version: string }[];
  /** Models that went. Rare, and worth saying out loud when it happens. */
  removed: { id: string; name: string; category: string }[];
  changed: ModelChange[];
}

function byField(model: SnapshotModel): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const claim of model.claims) {
    const list = map.get(claim.field) ?? [];
    list.push(claim.says);
    map.set(claim.field, list);
  }
  return map;
}

/**
 * Within one field, what is gone and what is new.
 *
 * A settings row holds exactly one claim, so a removal and an addition in it are one event: "the
 * default moved from 100 to 250" beats two lines the reader has to join up. A field like `warnings`
 * holds several, and there one line going and another arriving really are two separate events, so
 * pairing them would invent a relationship that is not there. The test for that is the difference.
 */
function diffField(field: string, before: string[], after: string[]): Change[] {
  const gone = before.filter((says) => !after.includes(says));
  const fresh = after.filter((says) => !before.includes(says));
  if (gone.length === 0 && fresh.length === 0) return [];
  if (before.length === 1 && after.length === 1) {
    const was = gone[0];
    const now = fresh[0];
    if (was !== undefined && now !== undefined) return [{ kind: 'changed', field, was, now }];
  }
  return [
    ...gone.map((was): Change => ({ kind: 'removed', field, was })),
    ...fresh.map((now): Change => ({ kind: 'added', field, now })),
  ];
}

function diffModel(before: SnapshotModel, after: SnapshotModel): ModelChange | null {
  const beforeFields = byField(before);
  const afterFields = byField(after);
  const fields = [...new Set([...beforeFields.keys(), ...afterFields.keys()])].sort();

  const changes = fields.flatMap((field) =>
    diffField(field, beforeFields.get(field) ?? [], afterFields.get(field) ?? []),
  );
  if (changes.length === 0) return null;

  const change: ModelChange = {
    id: after.id,
    name: after.name,
    category: after.category,
    changes,
  };
  if (before.version !== after.version) {
    change.version = { was: before.version, now: after.version };
  }
  return change;
}

export function diff(before: Snapshot, after: Snapshot): Release {
  const beforeById = new Map(before.models.map((m) => [m.id, m]));
  const afterById = new Map(after.models.map((m) => [m.id, m]));

  return {
    from: before.takenOn,
    to: after.takenOn,
    added: after.models
      .filter((m) => !beforeById.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, category: m.category, version: m.version })),
    removed: before.models
      .filter((m) => !afterById.has(m.id))
      .map((m) => ({ id: m.id, name: m.name, category: m.category })),
    changed: after.models
      .filter((m) => beforeById.has(m.id))
      .flatMap((after_) => {
        const before_ = beforeById.get(after_.id);
        if (before_ === undefined) return [];
        const changed = diffModel(before_, after_);
        return changed === null ? [] : [changed];
      }),
  };
}

export function isEmptyRelease(release: Release): boolean {
  return release.added.length === 0 && release.removed.length === 0 && release.changed.length === 0;
}

/** How many things moved, for the one line at the top of the page. */
export function countChanges(release: Release): number {
  return (
    release.added.length +
    release.removed.length +
    release.changed.reduce((total, model) => total + model.changes.length, 0)
  );
}
