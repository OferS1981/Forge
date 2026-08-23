import { describe, expect, it } from 'vitest';
import {
  SLUG_PATTERN,
  decodeShare,
  encodeShare,
  mintSlug,
  readFragment,
  shareUrl,
} from '../src/share';
import type { SharePayload } from '../src/share';

const payload: SharePayload = {
  v: 1,
  title: 'The dragon',
  modelId: 'nanobanana',
  brief: { subject: 'a dragon breathing fire', medium: 'cinematic still', mood: ['calm', 'tense'] },
  mode: 'simple',
};

describe('a share link', () => {
  it('survives the round trip exactly', () => {
    expect(decodeShare(encodeShare(payload))).toEqual(payload);
  });

  it('carries characters that are not ASCII, because briefs are written by people', () => {
    const accented: SharePayload = {
      ...payload,
      title: 'Le dragon, à l aube',
      brief: { subject: 'un dragon 🐉' },
    };
    expect(decodeShare(encodeShare(accented))).toEqual(accented);
  });

  it('uses only characters that survive a URL and an email client', () => {
    expect(encodeShare(payload)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('refuses anything that is not a share rather than throwing', () => {
    expect(decodeShare('not base64 at all !!')).toBeNull();
    expect(decodeShare(btoa('{"v":2}'))).toBeNull();
    expect(decodeShare(btoa('[1,2,3]'))).toBeNull();
    expect(decodeShare(btoa('null'))).toBeNull();
  });

  it('refuses a payload with the wrong pieces', () => {
    const bad = (o: object): string => btoa(JSON.stringify(o)).replace(/=+$/, '');
    expect(decodeShare(bad({ v: 1, title: 'x', modelId: 'y', mode: 'simple' }))).toBeNull();
    expect(
      decodeShare(bad({ v: 1, title: 'x', modelId: 'y', mode: 'sideways', brief: {} })),
    ).toBeNull();
    expect(
      decodeShare(bad({ v: 1, title: 5, modelId: 'y', mode: 'simple', brief: {} })),
    ).toBeNull();
    expect(
      decodeShare(bad({ v: 1, title: 'x', modelId: 'y', mode: 'simple', brief: { a: 3 } })),
    ).toBeNull();
    expect(
      decodeShare(bad({ v: 1, title: 'x', modelId: 'y', mode: 'simple', brief: ['a'] })),
    ).toBeNull();
  });
});

describe('reading the fragment a page was opened with', () => {
  it('reads an inline share', () => {
    const shared = readFragment(`#${encodeShare(payload)}`);
    expect(shared).toEqual({ kind: 'inline', payload });
  });

  it('reads a slug share', () => {
    const slug = 'abcdefghij0123456789kl';
    expect(readFragment(`#s=${slug}`)).toEqual({ kind: 'slug', slug });
  });

  it('refuses a slug that is not the right shape, rather than asking the server about it', () => {
    expect(readFragment('#s=short')).toBeNull();
    expect(readFragment('#s=UPPERCASE0123456789ab')).toBeNull();
  });

  it('is null for an empty or unrelated fragment', () => {
    expect(readFragment('')).toBeNull();
    expect(readFragment('#')).toBeNull();
    expect(readFragment('#section-heading')).toBeNull();
  });

  it('does not mind whether the hash is included', () => {
    expect(readFragment(encodeShare(payload))).toEqual({ kind: 'inline', payload });
  });
});

describe('the slug', () => {
  it('matches what the database will accept', () => {
    const slug = mintSlug((n) => Uint8Array.from({ length: n }, (_, i) => i * 11));
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it('uses every byte it was given, so the randomness is not thrown away', () => {
    const a = mintSlug((n) => Uint8Array.from({ length: n }, (_, i) => i));
    const b = mintSlug((n) => Uint8Array.from({ length: n }, (_, i) => i + 1));
    expect(a).not.toBe(b);
  });
});

describe('the address of a share', () => {
  it('puts everything after the hash, so no host ever receives it', () => {
    const url = shareUrl('https://forge.example', { kind: 'inline', payload });
    expect(url.split('#')[0]).toBe('https://forge.example/p');
    expect(readFragment(url.slice(url.indexOf('#')))).toEqual({ kind: 'inline', payload });
  });

  it('does not double the slash when the origin has one', () => {
    expect(
      shareUrl('https://forge.example/', { kind: 'slug', slug: 'abcdefghij0123456789kl' }),
    ).toBe('https://forge.example/p#s=abcdefghij0123456789kl');
  });
});
