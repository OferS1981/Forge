import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADAPTERS, adapterFor, pasteInto, pasteMessage, setNativeValue } from '../src/adapters';

/**
 * These adapters depend on markup we do not control. The tests cannot prove the selectors still
 * match the real sites, and they do not pretend to: what they prove is that every path through
 * `pasteInto` behaves, including the two that matter most, which are the React-controlled field
 * and the page where the field is simply not there.
 */

function page(html: string): Document {
  document.body.innerHTML = html;
  return document;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('matching a site', () => {
  it('finds the adapter for a host and for a subdomain of it', () => {
    expect(adapterFor('midjourney.com')?.site).toBe('midjourney.com');
    expect(adapterFor('www.midjourney.com')?.site).toBe('midjourney.com');
    expect(adapterFor('alpha.midjourney.com')?.site).toBe('midjourney.com');
    expect(adapterFor('ELEVENLABS.IO')?.site).toBe('elevenlabs.io');
  });

  it('does not match a host that merely ends in the same letters', () => {
    expect(adapterFor('notmidjourney.com')).toBeUndefined();
    expect(adapterFor('suno.com.example.net')).toBeUndefined();
  });

  it('has the three sites section 14 names, and no duplicates', () => {
    expect(ADAPTERS.map((a) => a.site)).toEqual(['midjourney.com', 'elevenlabs.io', 'suno.com']);
    expect(new Set(ADAPTERS.map((a) => a.site)).size).toBe(ADAPTERS.length);
    for (const adapter of ADAPTERS) expect(adapter.selectors.length).toBeGreaterThan(0);
  });
});

describe('writing into the page', () => {
  it('writes into Midjourney and tells the page it changed', () => {
    const doc = page('<textarea id="desktop_imagine_bar"></textarea>');
    const field = doc.querySelector('textarea');
    const seen: string[] = [];
    field?.addEventListener('input', () => seen.push('input'));
    field?.addEventListener('change', () => seen.push('change'));

    const outcome = pasteInto(doc, 'midjourney.com', 'a dragon --ar 16:9');
    expect(outcome).toEqual({ kind: 'written', field: 'the imagine bar' });
    expect(field?.value).toBe('a dragon --ar 16:9');
    // Without these the site's own state never learns about the text.
    expect(seen).toEqual(['input', 'change']);
  });

  it('writes into a contenteditable box, which is what ElevenLabs uses', () => {
    const doc = page('<div data-testid="text-to-speech-input" contenteditable="true"></div>');
    // jsdom does not implement isContentEditable, so it is defined the way the browser reports it.
    const box = doc.querySelector<HTMLElement>('[contenteditable]');
    Object.defineProperty(box, 'isContentEditable', { value: true });
    const outcome = pasteInto(doc, 'elevenlabs.io', 'Hello, and welcome back.');
    expect(outcome.kind).toBe('written');
    expect(box?.textContent).toBe('Hello, and welcome back.');
  });

  it('falls through to a later selector when the first is not on the page', () => {
    const doc = page('<textarea placeholder="Style of music"></textarea>');
    expect(pasteInto(doc, 'suno.com', 'shoegaze, 90bpm')).toEqual({
      kind: 'written',
      field: 'the style box',
    });
    expect(doc.querySelector('textarea')?.value).toBe('shoegaze, 90bpm');
  });

  it('skips a field that is disabled or read only rather than writing into nothing', () => {
    const doc = page(
      '<textarea id="desktop_imagine_bar" disabled></textarea><textarea placeholder="x"></textarea>',
    );
    expect(pasteInto(doc, 'midjourney.com', 'a dragon').kind).toBe('written');
    expect(doc.querySelectorAll('textarea')[1]?.value).toBe('a dragon');
  });

  it('says the field is missing rather than failing, when the site has changed', () => {
    const doc = page('<p>The site was redesigned last night.</p>');
    const outcome = pasteInto(doc, 'suno.com', 'shoegaze');
    expect(outcome).toEqual({ kind: 'no-field', site: 'suno.com', field: 'the style box' });
    expect(pasteMessage(outcome)).toContain('on the clipboard');
  });

  it('is unsupported, not broken, on a site with no adapter', () => {
    const doc = page('<textarea></textarea>');
    expect(pasteInto(doc, 'example.com', 'anything')).toEqual({ kind: 'unsupported' });
    expect(doc.querySelector('textarea')?.value).toBe('');
  });

  it('never apologises, and never calls the clipboard a failure', () => {
    for (const outcome of [
      { kind: 'written', field: 'the imagine bar' },
      { kind: 'no-field', site: 'suno.com', field: 'the style box' },
      { kind: 'unsupported' },
    ] as const) {
      const message = pasteMessage(outcome);
      expect(message).not.toMatch(/sorry|apolog|error|failed/i);
      expect(message).not.toContain('—');
      expect(message.endsWith('.')).toBe(true);
    }
  });
});

describe('the React problem', () => {
  it('goes through the prototype setter, which is the one React is watching', () => {
    const doc = page('<input id="desktop_imagine_bar" />');
    const input = doc.querySelector('input');
    if (input === null) throw new Error('no input');

    // Stand in for React: it keeps its own copy and puts it back unless the setter is called.
    const seen: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input) as object,
      'value',
    );
    /*
     * Read off the descriptor and called with an explicit receiver below, which is exactly what
     * setNativeValue does, so taking the reference here is the behaviour under test.
     */
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = descriptor?.set;
    if (original === undefined) throw new Error('the prototype has no value setter to watch');
    const spy = vi.fn(function record(this: HTMLInputElement, value: string) {
      seen.push(value);
      original.call(this, value);
    });
    Object.defineProperty(Object.getPrototypeOf(input), 'value', { ...descriptor, set: spy });

    setNativeValue(input, 'through the setter');

    expect(seen).toEqual(['through the setter']);
    expect(input.value).toBe('through the setter');
    Object.defineProperty(Object.getPrototypeOf(input), 'value', { ...descriptor, set: original });
  });

  it('still writes when the prototype has no value setter at all', () => {
    const fake = { value: '' } as HTMLInputElement;
    setNativeValue(fake, 'direct');
    expect(fake.value).toBe('direct');
  });
});
