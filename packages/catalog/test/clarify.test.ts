import { describe, expect, it } from 'vitest';
import { clarify } from '../src/engine';
import { modelById } from '../src/models/registry';

/**
 * The questions a senior asks, held to the rules that stop them being a nag: only when the field
 * is empty, only when the model reads it, never for an empty brief, never more than three, and
 * always with a why that makes answering feel worth it.
 */
describe('clarify', () => {
  it('asks a coding brief for its check, its scope and its stack, in that order', () => {
    const questions = clarify({ cTask: 'Fix the flaky test' }, modelById('claudecode'));
    expect(questions.map((q) => q.field)).toEqual(['cCheck', 'cScope', 'cStack']);
    expect(questions[0]?.ask).toBe('How will we know it worked?');
  });

  it('drops a question the brief already answers', () => {
    const questions = clarify(
      { cTask: 'Fix the flaky test', cCheck: 'The suite passes 20 runs' },
      modelById('claudecode'),
    );
    expect(questions.map((q) => q.field)).toEqual(['cScope', 'cStack']);
  });

  it('asks nothing at all of an empty brief: the form is the interview there', () => {
    expect(clarify({}, modelById('claudecode'))).toEqual([]);
  });

  it('never asks about a field the model does not read', () => {
    for (const id of ['midjourney', 'veo', 'suno', 'perplexity', 'v0'] as const) {
      const model = modelById(id);
      const reads = new Set([...model.core, ...model.craft, ...model.tech]);
      for (const q of clarify(
        { subject: 'x', rQuestion: 'x', aApp: 'x', mGenre: ['ambient'] },
        model,
      )) {
        expect(reads.has(q.field), `${id} asked about ${q.field}`).toBe(true);
      }
    }
  });

  it('never asks more than three questions', () => {
    expect(clarify({ goal: 'Write something' }, modelById('claude')).length).toBeLessThanOrEqual(3);
  });

  it('gives every question a why a person would accept', () => {
    for (const q of clarify({ rQuestion: 'What changed?' }, modelById('perplexity'))) {
      expect(q.why.length).toBeGreaterThan(20);
      expect(q.why).not.toContain('—');
    }
  });

  it('asks a video brief what happens, which is the question that matters most', () => {
    const questions = clarify({ subject: 'a swimmer' }, modelById('veo'));
    expect(questions[0]?.field).toBe('action');
  });
});
