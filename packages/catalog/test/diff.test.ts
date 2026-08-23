import { describe, expect, it } from 'vitest';
import { diffPrompts } from '../src/engine/diff';

function rebuild(parts: { kind: string; text: string }[], side: 'before' | 'after'): string {
  return parts
    .filter((p) => p.kind === 'same' || p.kind === (side === 'before' ? 'removed' : 'added'))
    .map((p) => p.text)
    .join('');
}

describe('diffPrompts', () => {
  it('says nothing changed when nothing changed', () => {
    const d = diffPrompts('a wide shot at golden hour', 'a wide shot at golden hour');
    expect(d.added).toBe(0);
    expect(d.removed).toBe(0);
    expect(d.unchanged).toBe(6);
    expect(d.parts.every((p) => p.kind === 'same')).toBe(true);
  });

  it('marks one replaced word and leaves the rest alone', () => {
    const d = diffPrompts('a wide shot at golden hour', 'a wide shot at blue hour');
    expect(d.added).toBe(1);
    expect(d.removed).toBe(1);
    expect(d.parts.some((p) => p.kind === 'added' && p.text.includes('blue'))).toBe(true);
    expect(d.parts.some((p) => p.kind === 'removed' && p.text.includes('golden'))).toBe(true);
  });

  it('rebuilds both sides exactly, so nothing is lost in the diff', () => {
    const before = 'Photograph of a boxer.  Softbox key camera-left.';
    const after = 'Cinematic still of a boxer, low-key. Softbox key camera-left.';
    const d = diffPrompts(before, after);
    expect(rebuild(d.parts, 'before')).toBe(before);
    expect(rebuild(d.parts, 'after')).toBe(after);
  });

  it('reads an addition as an addition rather than a rewrite', () => {
    const d = diffPrompts('a boxer', 'a retired boxer taping his hands');
    expect(d.removed).toBe(0);
    expect(d.added).toBe(4);
    expect(d.unchanged).toBe(2);
  });

  it('handles an empty side at either end', () => {
    expect(diffPrompts('', 'two words here').added).toBe(3);
    expect(diffPrompts('two words here', '').removed).toBe(3);
    const empty = diffPrompts('', '');
    expect(empty.parts).toEqual([]);
    expect(empty.added + empty.removed + empty.unchanged).toBe(0);
  });

  it('joins runs of the same kind into one part', () => {
    const d = diffPrompts('one two three', 'one');
    const removed = d.parts.filter((p) => p.kind === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0]?.text.trim()).toBe('two three');
  });
});
