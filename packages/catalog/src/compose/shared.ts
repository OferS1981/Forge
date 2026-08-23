import type { Block, Brief, Model } from '../types';
import { arr, artic, cap, first, has, join, lc, sentences, stripDot } from './text';

export function block(label: string, body: string): Block {
  return { label, body };
}

export function camClause(b: Brief): string {
  const bits: string[] = [];
  if (has(b.shot)) bits.push(join(b.shot));
  if (has(b.lens)) bits.push(b.lens ?? '');
  if (has(b.aperture)) bits.push(String(b.aperture).split(': ')[0] ?? '');
  if (!bits.length) return '';
  const out = bits.join(', ');
  // never capitalise a leading f-stop
  return /^[a-z]\//.test(out) ? out : cap(out);
}

export function lightClause(b: Brief): string {
  return has(b.light) ? cap(join(b.light)) : '';
}

export function finishClause(b: Brief): string {
  const bits: string[] = [];
  if (has(b.film)) bits.push(b.film ?? '');
  if (has(b.grade)) bits.push((b.grade ?? '') + ' grade');
  if (has(b.palette)) bits.push('palette: ' + (b.palette ?? ''));
  return bits.length ? cap(bits.join(', ')) : '';
}

export function moodClause(b: Brief): string {
  return has(b.mood) ? cap(join(b.mood)) + ' in feeling' : '';
}

export function imageSections(b: Brief): Block[] {
  const S: Block[] = [];
  const med = has(b.medium) ? (b.medium ?? '') : 'photograph';
  const subj = stripDot(b.subject) || 'the subject';
  S.push(
    block(
      'Subject',
      cap(med) + ' of ' + lc(subj) + (has(b.setting) ? ', ' + lc(stripDot(b.setting)) : '') + '.',
    ),
  );
  const cam = camClause(b);
  if (cam) S.push(block('Camera', cam + '.'));
  const li = lightClause(b);
  if (li) S.push(block('Light', li + '.'));
  const fin = finishClause(b);
  if (fin) S.push(block('Finish', fin + '.'));
  const comp: string[] = [];
  if (has(b.comp)) comp.push(b.comp ?? '');
  if (has(b.mood)) comp.push(join(b.mood) + ' in feeling');
  if (comp.length) S.push(block('Composition & mood', cap(comp.join(', ')) + '.'));
  if (has(b.imgtext))
    S.push(
      block(
        'In-image text',
        'The words "' +
          stripDot(b.imgtext) +
          '" rendered cleanly, high contrast against the background, correctly spelled.',
      ),
    );
  if (has(b.ref)) S.push(block('Reference', 'In the register of ' + stripDot(b.ref) + '.'));
  if (has(b.purpose))
    S.push(
      block(
        'Intended use',
        stripDot(b.purpose) + ': keep the focal subject clear of the outer eighth of the frame.',
      ),
    );
  return S;
}

export function videoSections(b: Brief, m: Model): Block[] {
  const S: Block[] = [];
  const cam = [has(b.camMove) ? (b.camMove ?? '') : '', has(b.shot) ? first(b.shot) : '']
    .filter(has)
    .join(', ');
  if (cam)
    S.push(
      block(
        'Cinematography',
        cap(cam) + (has(b.lens) ? ' on ' + artic(b.lens ?? '') + ' ' + (b.lens ?? '') : '') + '.',
      ),
    );
  S.push(
    block(
      'Subject',
      cap(stripDot(b.subject) || 'the subject') +
        (has(b.setting) ? ', ' + lc(stripDot(b.setting)) : '') +
        '.',
    ),
  );
  S.push(
    block(
      'Action',
      cap(stripDot(b.action) || 'the subject moves through the frame') +
        '.' +
        (has(b.motion) ? ' ' + cap(join(b.motion)) + ' throughout.' : ''),
    ),
  );
  const amb = [
    lightClause(b),
    finishClause(b),
    has(b.mood) ? join(b.mood) + ' in feeling' : '',
    has(b.pacing) ? (b.pacing ?? '') : '',
  ].filter(has);
  if (amb.length) S.push(block('Style & ambiance', sentences(amb) + '.'));
  if (has(b.vaudio)) S.push(block('Audio', stripDot(b.vaudio) + '.'));
  if (has(b.ref)) S.push(block('Reference', 'In the register of ' + stripDot(b.ref) + '.'));
  if (m.inlineCameraTokens && has(b.camMove)) {
    const mv = b.camMove ?? '';
    const t = /dolly|push|zoom/i.test(mv)
      ? '[zoom]'
      : /pan|whip|truck/i.test(mv)
        ? '[pan]'
        : '[static]';
    S.push(
      block(
        'Inline camera token',
        t +
          ': ' +
          m.name +
          ' reads this bracket syntax. Strip it before pasting into any other model.',
      ),
    );
  }
  return S;
}

export function splitBeats(text: string, n: number): string[] {
  const parts = text
    .split(/[.;]\s+|,\s+then\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < n; i++)
    out.push(parts[i] ?? parts[parts.length - 1] ?? 'the action continues');
  return out;
}

const TONE_TAGS: Record<string, string> = {
  calm: '[softly]',
  tense: '[urgent]',
  wry: '[sarcastic]',
  warm: '[warmly]',
  urgent: '[urgent]',
  weary: '[tired]',
  conspiratorial: '[whispers]',
  authoritative: '[dramatically]',
  breathless: '[exhales]',
  earnest: '[warmly]',
  reassuring: '[softly]',
  deadpan: '[deadpan]',
  commanding: '[shouts]',
};

/** Prefix the script with an audio tag matching the first tone chip, when tags are allowed. */
export function markUpScript(script: string, b: Brief, tagsOk: boolean): string {
  let s = script.trim();
  if (!tagsOk) return s;
  const tone = arr(b.vTone)[0];
  const tag = tone === undefined ? undefined : TONE_TAGS[tone];
  if (tag !== undefined && !s.startsWith('[')) s = tag + ' ' + s;
  return s;
}
