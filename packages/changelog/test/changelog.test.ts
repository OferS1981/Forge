import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODELS } from '@forge/catalog';
import {
  affectedBy,
  affectedSentence,
  countChanges,
  describe as describeChange,
  diff,
  isEmptyRelease,
  parseSnapshot,
  releasesFrom,
  serialiseSnapshot,
  takeSnapshot,
  type Snapshot,
  type SavedLike,
} from '../src/index';
import { HISTORY } from '../snapshots/index';

const DIR = new URL('../snapshots/', import.meta.url);

/** A snapshot built by hand, so a diff is tested against something exact rather than real history. */
function fake(takenOn: string, claims: Record<string, [string, string][]>): Snapshot {
  return {
    takenOn,
    models: Object.entries(claims).map(([id, list]) => ({
      id,
      name: id,
      category: 'image',
      version: list.find(([field]) => field === 'version')?.[1] ?? 'v1',
      claims: list.map(([field, says]) => ({ field, says })),
    })),
  };
}

describe('taking a snapshot', () => {
  it('covers the whole catalogue', () => {
    const snapshot = takeSnapshot('2026-01-01');
    expect(snapshot.models).toHaveLength(MODELS.length);
    for (const model of snapshot.models) expect(model.claims.length).toBeGreaterThan(0);
  });

  it('is the same on two runs, so an unchanged catalogue produces no diff', () => {
    expect(serialiseSnapshot(takeSnapshot('2026-01-01'))).toBe(
      serialiseSnapshot(takeSnapshot('2026-01-01')),
    );
  });

  it('sorts, so a reordered model file is not a change', () => {
    const serialised = serialiseSnapshot(takeSnapshot('2026-01-01'));
    const parsed = parseSnapshot(serialised);
    const ids = parsed?.models.map((m) => m.id) ?? [];
    expect(ids).toEqual([...ids].sort());
  });

  it('reads one back, and survives a file that is not one', () => {
    const snapshot = takeSnapshot('2026-01-01');
    expect(parseSnapshot(serialiseSnapshot(snapshot))?.models.length).toBe(snapshot.models.length);
    expect(parseSnapshot('{ not json')).toBeNull();
    expect(parseSnapshot('[]')).toBeNull();
    expect(parseSnapshot('{"takenOn":"whenever","models":[]}')).toBeNull();
  });

  it('drops a row with no id rather than carrying a broken record', () => {
    const parsed = parseSnapshot(
      JSON.stringify({ takenOn: '2026-01-01', models: [{ name: 'no id' }, { id: 'ok' }] }),
    );
    expect(parsed?.models.map((m) => m.id)).toEqual(['ok']);
  });
});

describe('what changed between two snapshots', () => {
  it('sees a value move, as one change rather than two', () => {
    const release = diff(
      fake('2026-01-01', { midjourney: [['settings.--stylize', 'defaults to 100']] }),
      fake('2026-02-01', { midjourney: [['settings.--stylize', 'defaults to 250']] }),
    );
    expect(release.changed).toHaveLength(1);
    expect(release.changed[0]?.changes).toEqual([
      {
        kind: 'changed',
        field: 'settings.--stylize',
        was: 'defaults to 100',
        now: 'defaults to 250',
      },
    ]);
  });

  it('sees a line arrive and a line go, in a field that holds several', () => {
    const release = diff(
      fake('2026-01-01', {
        veo: [
          ['warnings', 'one'],
          ['warnings', 'two'],
        ],
      }),
      fake('2026-02-01', {
        veo: [
          ['warnings', 'two'],
          ['warnings', 'three'],
        ],
      }),
    );
    expect(release.changed[0]?.changes).toEqual([
      { kind: 'removed', field: 'warnings', was: 'one' },
      { kind: 'added', field: 'warnings', now: 'three' },
    ]);
  });

  it('calls out a version move as the headline', () => {
    const release = diff(
      fake('2026-01-01', { midjourney: [['version', 'V8.2']] }),
      fake('2026-02-01', { midjourney: [['version', 'V8.3']] }),
    );
    expect(release.changed[0]?.version).toEqual({ was: 'V8.2', now: 'V8.3' });
  });

  it('sees a model arrive and a model go', () => {
    const release = diff(
      fake('2026-01-01', { old: [['version', 'v1']] }),
      fake('2026-02-01', { fresh: [['version', 'v1']] }),
    );
    expect(release.added.map((m) => m.id)).toEqual(['fresh']);
    expect(release.removed.map((m) => m.id)).toEqual(['old']);
  });

  it('finds nothing when nothing moved', () => {
    const one = fake('2026-01-01', { midjourney: [['version', 'V8.2']] });
    const release = diff(one, { ...one, takenOn: '2026-02-01' });
    expect(isEmptyRelease(release)).toBe(true);
    expect(countChanges(release)).toBe(0);
  });

  it('counts every move, for the line at the top of the page', () => {
    const release = diff(
      fake('2026-01-01', { a: [['version', 'v1']], gone: [['version', 'v1']] }),
      fake('2026-02-01', { a: [['version', 'v2']], fresh: [['version', 'v1']] }),
    );
    expect(countChanges(release)).toBe(3);
  });
});

describe('the history in this repository', () => {
  it('is a real record, oldest first', () => {
    expect(HISTORY.length).toBeGreaterThan(1);
    const dates = HISTORY.map((s) => s.takenOn);
    expect(dates).toEqual([...dates].sort());
  });

  it('names its files the way the index does', () => {
    const files = readdirSync(DIR)
      .filter((name) => name.endsWith('.json'))
      .sort();
    expect(files.map((name) => name.replace('.json', ''))).toEqual(HISTORY.map((s) => s.takenOn));
    const index = readFileSync(new URL('index.ts', DIR), 'utf8');
    for (const file of files) expect(index, `${file} is not in the index`).toContain(file);
  });

  /*
   * The build gate. A catalogue change with no snapshot means the changelog is quietly behind the
   * thing it describes, which is the one failure this whole phase exists to prevent.
   */
  it('is up to date with the catalogue as it stands', () => {
    const newest = HISTORY[HISTORY.length - 1];
    if (newest === undefined) throw new Error('there is no history at all');
    const now = takeSnapshot(newest.takenOn);
    expect(
      serialiseSnapshot(now),
      'The catalogue has changed since the last snapshot. Run node scripts/catalog-snapshot.mjs and commit the file it writes.',
    ).toBe(serialiseSnapshot({ ...newest, takenOn: newest.takenOn }));
  });

  it('holds at least one real release, which is what the page shows', () => {
    const releases = releasesFrom(HISTORY);
    expect(releases.length).toBeGreaterThan(0);
    expect(
      countChanges(releases[0] ?? { added: [], removed: [], changed: [], from: '', to: '' }),
    ).toBeGreaterThan(0);
  });

  it('puts the newest release first, which is how a changelog is read', () => {
    const releases = releasesFrom(HISTORY);
    const dates = releases.map((r) => r.to);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('drops a gap in which nothing moved, rather than showing an empty day', () => {
    const one = takeSnapshot('2026-01-01');
    const releases = releasesFrom([one, { ...one, takenOn: '2026-02-01' }]);
    expect(releases).toEqual([]);
  });
});

describe('which of your saved prompts a change touches', () => {
  const release = diff(
    fake('2026-01-01', { midjourney: [['version', 'V8.2']] }),
    fake('2026-02-01', { midjourney: [['version', 'V8.3']] }),
  );

  const saved = (over: Partial<SavedLike> = {}): SavedLike => ({
    id: 'p1',
    title: 'The dragon',
    modelId: 'midjourney',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...over,
  });

  it('finds prompts written for that model before the change', () => {
    const affected = affectedBy(release, [saved(), saved({ id: 'p2', title: 'Another' })]);
    expect(affected).toHaveLength(1);
    expect(affected[0]?.prompts.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('leaves alone a prompt saved after the change, because it was written against the new one', () => {
    expect(affectedBy(release, [saved({ updatedAt: '2026-03-01T00:00:00.000Z' })])).toEqual([]);
  });

  it('leaves alone a prompt for a different model', () => {
    expect(affectedBy(release, [saved({ modelId: 'veo' })])).toEqual([]);
  });

  it('errs towards telling somebody when a date cannot be read', () => {
    expect(affectedBy(release, [saved({ updatedAt: 'whenever' })])).toHaveLength(1);
  });

  it('says nothing when the library is empty, rather than an empty band', () => {
    expect(affectedBy(release, [])).toEqual([]);
  });

  it('writes the sentence section 22 asked for', () => {
    const affected = affectedBy(release, [saved(), saved({ id: 'p2' }), saved({ id: 'p3' })]);
    const first = affected[0];
    if (first === undefined) throw new Error('nothing was affected');
    const sentence = affectedSentence(first);
    expect(sentence).toContain('V8.3 shipped');
    expect(sentence).toContain('3 of your saved prompts use it');
  });

  it('gets the singular right, because one prompt is not one prompts', () => {
    const affected = affectedBy(release, [saved()]);
    const first = affected[0];
    if (first === undefined) throw new Error('nothing was affected');
    expect(affectedSentence(first)).toContain('1 of your saved prompts uses it');
  });
});

describe('a change, as a sentence', () => {
  it('reads as English for each of the three kinds', () => {
    expect(describeChange({ kind: 'added', field: 'warnings', now: 'Watch the sync' })).toBe(
      'Watch the sync is new.',
    );
    expect(describeChange({ kind: 'removed', field: 'warnings', was: 'Old advice' })).toBe(
      'Old advice is gone.',
    );
    expect(
      describeChange({
        kind: 'changed',
        field: 'settings.--stylize',
        was: 'defaults to 100',
        now: 'defaults to 250',
      }),
    ).toBe('--stylize was defaults to 100 and is now defaults to 250.');
  });

  it('never apologises and never uses an em dash', () => {
    for (const release of releasesFrom(HISTORY)) {
      for (const model of release.changed) {
        for (const change of model.changes) {
          const said = describeChange(change);
          expect(said).not.toMatch(/sorry|apolog/i);
          expect(said).not.toContain('—');
        }
      }
    }
  });
});
