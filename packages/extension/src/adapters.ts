/**
 * Writing a prompt into somebody else's page.
 *
 * Section 14: a small per-site adapter, best effort, degrading quietly when a site changes its DOM.
 * That last part is the whole design. These selectors are guesses about markup we do not control
 * and did not write, and one of them will be wrong within a month. So an adapter that cannot find
 * its field is not an error: it is a fallback to the clipboard, which always works.
 *
 * Pure functions over a Document, so every one of them is tested in jsdom against markup shaped
 * like the real thing, with no browser and no network.
 */

export type Target = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export interface Adapter {
  /** The model this site is for, so the panel opens the right anvil. Matched through HOSTS. */
  readonly site: string;
  /** What the field is called on that site, for the line the panel shows. */
  readonly field: string;
  readonly selectors: readonly string[];
}

/**
 * React keeps its own copy of an input's value and puts it back on the next render, so setting
 * `el.value` directly is undone the moment the page re-renders. The documented way round it is to
 * call the value setter on the prototype, which React's own onChange plumbing is watching, and then
 * dispatch the event it listens for. Every one of these three sites is a React app.
 */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = Object.getPrototypeOf(el) as object;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) descriptor.set.call(el, value);
  else el.value = value;
}

const isField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

const isEditable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.isContentEditable;

/**
 * The three sites section 14 names. The selectors go from the most specific the site gives us to
 * the most generic, so a renamed test id falls through to something that still works rather than
 * failing outright.
 */
export const ADAPTERS: readonly Adapter[] = [
  {
    site: 'midjourney.com',
    field: 'the imagine bar',
    selectors: ['#desktop_imagine_bar', '[id*="imagine"] textarea', 'textarea[placeholder]'],
  },
  {
    site: 'elevenlabs.io',
    field: 'the text box',
    selectors: ['[data-testid="text-to-speech-input"]', 'div[contenteditable="true"]', 'textarea'],
  },
  {
    site: 'suno.com',
    field: 'the style box',
    selectors: [
      '[data-testid="tag-input-textarea"]',
      'textarea[placeholder*="style" i]',
      'textarea',
    ],
  },
];

export function adapterFor(host: string): Adapter | undefined {
  const clean = host.toLowerCase().replace(/^www\./, '');
  return ADAPTERS.find((a) => clean === a.site || clean.endsWith(`.${a.site}`));
}

export type PasteOutcome =
  /** Written into the page. */
  | { kind: 'written'; field: string }
  /** There is an adapter for this site, but its field is not on this page right now. */
  | { kind: 'no-field'; site: string; field: string }
  /** No adapter for this site. Not a failure: the clipboard is the universal answer. */
  | { kind: 'unsupported' };

/** The first element any of the selectors finds, ignoring one that is hidden or disabled. */
function find(doc: Document, adapter: Adapter): Target | null {
  for (const selector of adapter.selectors) {
    const found = doc.querySelectorAll(selector);
    for (const el of found) {
      if (isField(el)) {
        if (el.disabled || el.readOnly) continue;
        return el;
      }
      if (isEditable(el)) return el;
    }
  }
  return null;
}

/**
 * Put the prompt in the page's own field. Returns what happened rather than throwing, because
 * every outcome here is one the panel has a sentence for.
 */
export function pasteInto(doc: Document, host: string, text: string): PasteOutcome {
  const adapter = adapterFor(host);
  if (adapter === undefined) return { kind: 'unsupported' };

  const target = find(doc, adapter);
  if (target === null) return { kind: 'no-field', site: adapter.site, field: adapter.field };

  if (isField(target)) {
    setNativeValue(target, text);
  } else {
    target.textContent = text;
  }
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
  if (typeof target.focus === 'function') target.focus();
  return { kind: 'written', field: adapter.field };
}

/** The sentence the panel shows. Never an apology, and never a failure where there is not one. */
export function pasteMessage(outcome: PasteOutcome): string {
  switch (outcome.kind) {
    case 'written':
      return `Written into ${outcome.field}. Check it before you run it.`;
    case 'no-field':
      return `Forge could not find ${outcome.field} on this page. The prompt is on the clipboard, so paste it yourself.`;
    case 'unsupported':
      return 'The prompt is on the clipboard. Paste it into the box this site uses.';
  }
}
