'use client';

import { useMemo } from 'react';
import { CATEGORIES, MODELS } from '@forge/catalog';
import { beginning, countChanges, describe, releasesFrom, type Release } from '@forge/changelog';
import { HISTORY } from '@forge/changelog/history';
import { Workspace } from '../../components/Workspace';

/**
 * What changed in the catalogue, in public.
 *
 * Section 22 asks for this and says why: the data already exists, it is free to publish, and it is
 * genuinely useful. It needs nobody to be signed in and nothing to be fetched. The history is a set
 * of files in the repository, so this page is as verifiable as the catalogue itself.
 */

function when(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function ReleaseEntry({ release }: { release: Release }): React.ReactNode {
  return (
    <section className="rel" aria-label={`Changes on ${when(release.to)}`}>
      <header className="rel__head">
        <h2 className="rel__when">
          <time dateTime={release.to}>{when(release.to)}</time>
        </h2>
        <p className="rel__count">
          {countChanges(release)} change{countChanges(release) === 1 ? '' : 's'}
        </p>
      </header>

      {release.added.length > 0 && (
        <div className="rel__group">
          <h3 className="rel__what">New in the catalogue</h3>
          <ul className="notes">
            {release.added.map((model) => (
              <li key={model.id}>
                {model.name}, {model.version}
              </li>
            ))}
          </ul>
        </div>
      )}

      {release.removed.length > 0 && (
        <div className="rel__group">
          <h3 className="rel__what">Gone from the catalogue</h3>
          <ul className="notes">
            {release.removed.map((model) => (
              <li key={model.id}>{model.name}</li>
            ))}
          </ul>
        </div>
      )}

      {release.changed.map((model) => (
        <div className="rel__group" key={model.id}>
          <h3 className="rel__what">
            {model.name}
            {model.version === undefined ? '' : ` moved to ${model.version.now}`}
          </h3>
          <ul className="notes">
            {model.changes.map((change) => (
              <li key={`${change.field}${change.was ?? ''}${change.now ?? ''}`}>
                <span className="rel__field fg-mono">{change.field}</span> {describe(change)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default function ChangesPage(): React.ReactNode {
  const releases = useMemo(() => releasesFrom(HISTORY), []);
  const first = beginning(HISTORY);
  const claims = useMemo(
    () => (first === undefined ? 0 : first.models.reduce((n, m) => n + m.claims.length, 0)),
    [first],
  );

  return (
    <Workspace
      title="What changed"
      lede="Every change to the catalogue, with the date it happened. Forge keeps the history as files in its own repository, so this page is as checkable as the models are. Nothing here needs an account."
      outputLabel="The record"
      output={
        <>
          {releases.map((release) => (
            <ReleaseEntry key={release.to} release={release} />
          ))}

          {first !== undefined && (
            <section className="rel" aria-label="Where the record starts">
              <header className="rel__head">
                <h2 className="rel__when">
                  <time dateTime={first.takenOn}>{when(first.takenOn)}</time>
                </h2>
                <p className="rel__count">The record starts here</p>
              </header>
              <p className="rel__note">
                {first.models.length} models and {claims} claims, each one something a vendor page
                could contradict. Everything above this line is a change since then.
              </p>
            </section>
          )}
        </>
      }
    >
      <section className="chg-side" aria-label="How this works">
        <h2>Where it comes from</h2>
        <p>
          Once a month Forge checks every claim in the catalogue against the vendor&apos;s own
          documentation and opens a pull request with a citation for each change. A person reads it
          and merges it. Nothing in the catalogue is merged by a machine.
        </p>
        <h2>What counts as a change</h2>
        <p>
          A version, an aspect ratio, a clip length, a setting&apos;s default or range, the shape of
          a negative prompt, or a warning. Not a reworded comment and not a moved line: the record
          is a diff of what Forge claims, not of its files.
        </p>
        <h2>Why it is worth reading</h2>
        <p>
          A prompt that worked last year can quietly stop working when a model ships a new version.
          If you keep prompts in your <a href="/library">library</a>, Forge marks the ones a change
          touches and offers to forge them again, because what it saved was the brief rather than
          the finished text.
        </p>
        <h2>The catalogue today</h2>
        <p>
          {MODELS.length} models across {CATEGORIES.length} categories.{' '}
          <a href="/glossary">The glossary</a> explains every field and setting they use.
        </p>
      </section>
    </Workspace>
  );
}
