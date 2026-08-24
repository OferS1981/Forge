import { diff, isEmptyRelease, type Release } from './diff';
import type { Snapshot } from './snapshot';

/**
 * The history, as a list of releases.
 *
 * A release is the gap between two consecutive snapshots. A gap in which nothing moved is dropped
 * rather than shown as an empty entry, so the page is a list of things that happened rather than a
 * list of days on which a script ran.
 */
export function releasesFrom(history: readonly Snapshot[]): Release[] {
  const releases: Release[] = [];
  for (let i = 1; i < history.length; i++) {
    const before = history[i - 1];
    const after = history[i];
    if (before === undefined || after === undefined) continue;
    const release = diff(before, after);
    if (!isEmptyRelease(release)) releases.push(release);
  }
  // Newest first, which is the order anybody reads a changelog in.
  return releases.reverse();
}

/** The first snapshot, which is where the record starts and what the page opens with. */
export function beginning(history: readonly Snapshot[]): Snapshot | undefined {
  return history[0];
}
