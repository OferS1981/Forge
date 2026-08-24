import { describe, expect, it } from 'vitest';
import { plan } from '../src/engine';
import { MODELS, modelById } from '../src/models/registry';

describe('the plan interview', () => {
  it('asks the whole brief for an empty one, in professional order', () => {
    const qs = plan({}, modelById('nanobanana'));
    expect(qs.length).toBeGreaterThanOrEqual(5);
    expect(qs[0]?.field).toBe('subject');
    for (const q of qs) {
      expect(q.ask.endsWith('?')).toBe(true);
      expect(q.why.length).toBeGreaterThan(20);
    }
  });

  it('answered fields leave the interview', () => {
    const before = plan({}, modelById('nanobanana')).length;
    const after = plan(
      { subject: 'a dragon', medium: 'photograph' },
      modelById('nanobanana'),
    ).length;
    expect(after).toBe(before - 2);
  });

  it('a complete brief has no questions left', () => {
    const qs = plan(
      {
        subject: 'a dragon',
        medium: 'photograph',
        setting: 'a cliff at dawn',
        purpose: 'a book cover',
        mood: ['menacing'],
        ref: 'romantic-era storm painting',
        avoid: 'text',
      },
      modelById('nanobanana'),
    );
    expect(qs).toEqual([]);
  });

  it('never asks about a field the model does not have', () => {
    for (const m of MODELS) {
      const known = new Set([...m.core, ...m.craft, ...m.tech]);
      for (const q of plan({}, m)) {
        expect(known.has(q.field), `${m.id} asked about ${q.field}`).toBe(true);
      }
    }
  });

  it('every category has a script that reaches its models', () => {
    for (const m of MODELS) {
      expect(plan({}, m).length, `${m.id} has an empty interview`).toBeGreaterThan(0);
    }
  });

  it('the code interview leads with the task and the check, like a senior would', () => {
    const qs = plan({}, modelById('claudecode'));
    expect(qs[0]?.field).toBe('cTask');
    expect(qs[1]?.field).toBe('cCheck');
  });
});
