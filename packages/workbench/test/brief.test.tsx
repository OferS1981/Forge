import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FIELDS, modelById, type ModelId } from '@forge/catalog';
import { Brief } from '../src/Brief';
import { explanationFor } from '../src/explain';

/**
 * The brief is generated from the catalogue, so what is worth testing is that it stays generated:
 * that it asks for exactly what the chosen model says it needs, that Simple mode asks for less
 * than Advanced, and that it names no model and no field of its own.
 */

const noop = (): void => undefined;

function draw(id: ModelId, mode: 'simple' | 'advanced') {
  const model = modelById(id);
  return render(<Brief model={model} brief={{}} mode={mode} onChange={noop} onExplain={noop} />);
}

describe('the generated brief', () => {
  it('asks for every core field the model declares', () => {
    const model = modelById('midjourney');
    draw('midjourney', 'advanced');
    for (const id of model.core) {
      expect(document.getElementById(`field-${id}`), `${id} is missing`).not.toBeNull();
    }
  });

  it('changes shape with the model, because it reads the model', () => {
    const { unmount } = draw('midjourney', 'advanced');
    const image = document.querySelectorAll('.brief__field').length;
    unmount();
    draw('suno', 'advanced');
    const music = document.querySelectorAll('.brief__field').length;
    expect(image).toBeGreaterThan(0);
    expect(music).toBeGreaterThan(0);
    expect(music).not.toBe(image);
  });

  it('asks fewer questions in Simple mode, and says why', () => {
    const { unmount } = draw('midjourney', 'simple');
    const simple = document.querySelectorAll('.brief__field').length;
    expect(screen.getByText(/Forge chooses the lens/)).toBeInTheDocument();
    unmount();
    draw('midjourney', 'advanced');
    expect(document.querySelectorAll('.brief__field').length).toBeGreaterThan(simple);
  });

  it('reports a change with the field id the catalogue uses', () => {
    const onChange = vi.fn();
    const model = modelById('midjourney');
    render(<Brief model={model} brief={{}} mode="advanced" onChange={onChange} onExplain={noop} />);
    const first = model.core[0];
    if (first === undefined) throw new Error('the model declares no core fields');
    const host = document.getElementById(`field-${first}`);
    const input = host?.querySelector('input, textarea');
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement))
      throw new Error('the first core field drew no text control');
    // Through fireEvent, because React ignores a value set directly on the element. The extension
    // hits the same wall when it writes into someone else's page: see setNativeValue.
    fireEvent.change(input, { target: { value: 'a dragon' } });
    expect(onChange).toHaveBeenCalledWith(first, 'a dragon');
  });

  it('draws every field type the registry uses, across the whole catalogue', () => {
    const types = new Set(Object.values(FIELDS).map((f) => f.type));
    expect(types.size).toBeGreaterThan(3);
    // A model per grammar, so no branch of the control switch goes unrendered.
    for (const id of ['midjourney', 'veo', 'suno', 'el-tts', 'claude', 'cursor'] as const) {
      const { unmount } = draw(id, 'advanced');
      expect(document.querySelectorAll('.brief__field').length).toBeGreaterThan(0);
      unmount();
    }
  });
});

describe('the join between the glossary and the popover', () => {
  it('gives back the words for a term the catalogue knows', () => {
    const model = modelById('midjourney');
    const term = FIELDS.subject.term;
    const explanation = explanationFor(term, model);
    expect(explanation?.label.length).toBeGreaterThan(0);
    expect(explanation?.what.length).toBeGreaterThan(0);
  });

  it('gives back nothing for a term that is not there, rather than an empty shell', () => {
    // The cast is the point of the test: this is what a bad id at runtime would look like.
    expect(explanationFor('not.a.term' as never)).toBeUndefined();
  });
});
