import { CATEGORIES, MODELS, claimsFor } from '@forge/catalog';

/**
 * A snapshot of what the catalogue claims, on a day.
 *
 * It is deliberately a snapshot of *claims* rather than of files. Phase 10 already decided what a
 * claim is, in order to hand an agent a list of things a vendor page could contradict. Reusing that
 * definition means the two halves of the maintenance story, checking and telling, cannot disagree
 * about what counts as a change. A whitespace edit is not a change here, and neither is a reordered
 * import.
 */

export interface Snapshot {
  /** The day this was taken, as a date. Passed in, never read from a clock, so a rerun agrees. */
  takenOn: string;
  models: SnapshotModel[];
}

export interface SnapshotModel {
  id: string;
  name: string;
  category: string;
  version: string;
  /** Claim text, keyed by the field it came from. Several claims can share a field. */
  claims: { field: string; says: string }[];
}

export function takeSnapshot(takenOn: string): Snapshot {
  return {
    takenOn,
    models: MODELS.map((model) => ({
      id: model.id,
      name: model.name,
      category: model.category,
      version: model.version,
      claims: claimsFor(model).map((claim) => ({ field: claim.field, says: claim.says })),
    })),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Reading one back. A snapshot on disk is data written by an older version of this code, so it is
 * read defensively: a row that has no id is dropped rather than carried around as a broken record.
 */
export function parseSnapshot(raw: string): Snapshot | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const takenOn = str(value.takenOn);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenOn)) return null;
  const models = Array.isArray(value.models) ? value.models : [];
  return {
    takenOn,
    models: models.filter(isRecord).flatMap((model) => {
      const id = str(model.id);
      if (id.length === 0) return [];
      const claims = Array.isArray(model.claims) ? model.claims : [];
      return [
        {
          id,
          name: str(model.name),
          category: str(model.category),
          version: str(model.version),
          claims: claims
            .filter(isRecord)
            .map((claim) => ({ field: str(claim.field), says: str(claim.says) }))
            .filter((claim) => claim.field.length > 0),
        },
      ];
    }),
  };
}

/** Stable and sorted, so a rerun on an unchanged catalogue produces no diff at all. */
export function serialiseSnapshot(snapshot: Snapshot): string {
  const ordered: Snapshot = {
    takenOn: snapshot.takenOn,
    models: [...snapshot.models]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => ({
        ...model,
        claims: [...model.claims].sort(
          (a, b) => a.field.localeCompare(b.field) || a.says.localeCompare(b.says),
        ),
      })),
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/** The categories, for the page that groups by them. Re-exported so the app needs one import. */
export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.name]),
);
