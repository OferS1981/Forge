import { cap, deMeta, stripBanned, wordCount } from '../compose/text';
import type { Axes, Brief, Diagnosis, Model } from '../types';
import { VOCAB } from '../vocab';
import { clamp, weigh } from './score';

/** What the Doctor can recognise in a pasted prompt. Ported verbatim. */
export const LEX = {
  camera:
    /\b(\d{2,3}\s?mm|f\/\d|close-?up|wide shot|medium shot|establishing|macro|telephoto|anamorphic|tilt-?shift|low angle|high angle|dutch angle|over-the-shoulder|bokeh|depth of field|rack focus)\b/i,
  light:
    /\b(golden hour|blue hour|rim ?light|backlit|softbox|rembrandt|chiaroscuro|high-?key|low-?key|volumetric|overcast|hard light|soft light|neon|tungsten|3200k|5600k|practical)\b/i,
  film: /\b(portra|ektar|velvia|tri-?x|hp5|cinestill|vision3|kodachrome|film grain|halation|super ?8|16mm|35mm film|polaroid)\b/i,
  comp: /\b(rule of thirds|negative space|symmetr|leading lines|foreground|centred|centered|framing|composition)\b/i,
  colour:
    /\b(teal and orange|desaturat|monochrom|palette|#[0-9a-f]{6}|duotone|bleach bypass|lifted blacks|pastel|saturated)\b/i,
  format: /\b(json|markdown|table|bullet|numbered|csv|xml|schema|word[s]?|paragraph|format)\b/i,
  role: /\b(you are|act as|as an? (expert|senior|professional))\b/i,
  example: /\b(example|for instance|e\.g\.|<example>|like this)\b/i,
  neg: /\b(--no |negative prompt|do not|don'?t |avoid |without |exclude)\b/i,
  delim: /(<[a-z_]+>|```|^#{1,3}\s|\n-{3,})/im,
  params: /(--\w+|\b(cfg|steps|seed|guidance|stability|bpm)\b)/i,
} as const;

const CRAFT_KEYS = ['camera', 'light', 'film', 'comp', 'colour'] as const;
const CRAFT_NAMES: Record<(typeof CRAFT_KEYS)[number], string> = {
  camera: 'camera and lens',
  light: 'lighting',
  film: 'film stock',
  comp: 'composition',
  colour: 'colour',
};
const WRITTEN = ['text', 'code', 'app', 'research'];
const VISUAL = ['image', 'video'];

/** Read a pasted prompt and say what is not doing any work. */
export function diagnose(text: string, m: Model): Diagnosis {
  const t = text;
  const words = wordCount(t);
  const bad = stripBanned(t);
  const findings: string[] = [];
  const working: string[] = [];
  const A = {} as Axes;

  A.specificity = clamp(
    Math.min(100, words * (m.category === 'image' || m.category === 'video' ? 2.4 : 1.1)) *
      (/(a|an|the)\s+(cool|nice|good|awesome|amazing)\b/i.test(t) ? 0.5 : 1),
  );
  if (words < 8)
    findings.push(
      'At ' +
        String(words) +
        ' words there is almost nothing to steer with. Every model fills the gaps you leave, and it fills them with the average of its training data.',
    );
  else if (words > 220 && m.category === 'image')
    findings.push(
      'At ' +
        String(words) +
        ' words this is long for an image prompt on most models. Midjourney stops rewarding length past about 150 tokens; Flux and Qwen are the exceptions that keep reading.',
    );
  else working.push('Length is in the productive band for this model.');

  const craftHits = CRAFT_KEYS.filter((k) => LEX[k].test(t));
  A.technical = clamp(craftHits.length * 24);
  if (VISUAL.includes(m.category)) {
    if (!LEX.camera.test(t))
      findings.push(
        'No lens or shot size. One focal length and one aperture do more work than any adjective you could add.',
      );
    if (!LEX.light.test(t))
      findings.push(
        'No lighting description. This is the single highest-yield thing missing from most image prompts.',
      );
    if (!LEX.colour.test(t))
      findings.push(
        "No colour direction. Naming a grade or giving hex codes is how you stop getting the model's default palette.",
      );
    for (const k of craftHits) working.push('Has a ' + CRAFT_NAMES[k] + ' layer.');
  }

  A.structure = clamp(LEX.delim.test(t) ? 90 : t.includes('\n') ? 55 : 30);
  if (WRITTEN.includes(m.category) && !LEX.delim.test(t))
    findings.push(
      'No delimiters. Separating instructions from data with tags or headings reduces misattribution and prompt-injection surface on every model tested.',
    );

  A.constraints = clamp(LEX.neg.test(t) ? 85 : 25);
  if (!LEX.neg.test(t) && m.negative.mode !== 'none')
    findings.push(
      'Nothing is excluded. ' +
        (m.negative.mode === 'flag'
          ? 'This model takes ' + (m.negative.label ?? '') + '.'
          : 'This model has a ' +
            (m.negative.label ?? 'negative') +
            ' field and you are not using it.'),
    );

  A.format = clamp(LEX.format.test(t) ? 88 : VISUAL.includes(m.category) ? 55 : 22);
  if (WRITTEN.includes(m.category) && !LEX.format.test(t))
    findings.push(
      'No output format. This is the strongest single lever in every vendor prompting guide, and it is missing.',
    );

  A.context = clamp(
    /\b(for|because|so that|audience|client|used (in|on|for))\b/i.test(t) ? 80 : 30,
  );
  if (A.context < 50)
    findings.push(
      'No stated purpose. Where the output will be used changes framing, length and tone more than any style word.',
    );

  A.modelfit = clamp(50 + craftHits.length * 10 + (LEX.params.test(t) ? 20 : 0));
  if (m.grammar === 'tags' && !t.includes(','))
    findings.push(
      'This is a Stable Diffusion target and the prompt is prose. SDXL is the one family where comma-separated tags genuinely perform better.',
    );
  if (m.grammar !== 'tags' && m.category === 'image' && (t.match(/,/g) ?? []).length > 12)
    findings.push(
      'Heavy comma-tag style on a model that reads language. Tag soup is an SD-era habit; ' +
        m.name +
        ' parses sentences.',
    );

  A.noise = clamp(100 - bad.removed.length * 22);
  if (bad.removed.length)
    findings.push(
      'Dead weight: ' +
        bad.removed.join(', ') +
        '. These steer nothing on any 2026 model, and on Midjourney they add style noise.',
    );
  else working.push('No filler tokens.');

  return {
    axes: A,
    score: weigh(A),
    findings,
    working,
    words,
    stripped: bad.removed,
    cleaned: bad.text,
  };
}

/** Turn a pasted prompt back into a brief, filling the craft layer the prompt was missing. */
export function rebuild(text: string, m: Model): Brief {
  /*
   * Anything in quotation marks is someone's words: a script to be spoken, text to appear in the
   * image. It is lifted out before the dead-weight pass so the Doctor never misquotes a patient,
   * which would be worse than any fault it was treating.
   */
  const quoted = /["\u201c]([^"\u201d]{2,400})["\u201d]/.exec(text)?.[1];
  const stripped = stripBanned(text).text;
  /*
   * "With no music, not crowded, without any clutter" is three exclusions living inside the
   * description, which is the one place they do harm: a negative construction plants the flagged
   * word in the prompt. The Doctor lifts them out here, and the category branches put them where
   * the model can actually use them.
   */
  const exclusions: string[] = [];
  const t = stripped
    .replace(
      /(?:^|[,;]\s*)(?:with no|without any|without|not|no)\s+([a-z][\w -]{2,24}?)(?=\s*(?:[,.;]|$))/gi,
      (_, w: string) => {
        exclusions.push(w.trim());
        return '';
      },
    )
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/^[,.\s]+|[,.\s]+$/g, '');
  const b: Brief = {};
  const firstClause = deMeta((t.split(/[.\n,]/)[0] ?? '').trim());
  if (m.category === 'image' || m.category === 'video') {
    /*
     * A pasted prompt is usually a comma wall: subject words and craft words shuffled together.
     * The craft belongs in craft fields; everything else is the subject, and it all survives.
     * The old build kept only the first clause, which threw away "red hair, freckles" the moment
     * "portrait" arrived first: content loss dressed as tidiness.
     */
    const craftLike = (c: string): boolean =>
      LEX.camera.test(c) ||
      LEX.light.test(c) ||
      LEX.colour.test(c) ||
      LEX.comp.test(c) ||
      /\b\d{2,3}\s?mm\b|f\/\d|film grain|bokeh|anamorphic|golden hour|blue hour|8[05]mm|\bhdr\b|dslr|4k|footage|drone shot|slow motion/i.test(
        c,
      );
    const clauses = t
      .split(/[,.\n]/)
      .map((c) => deMeta(c.trim()))
      .filter((c) => c.length > 1);
    const subjectClauses = clauses.filter((c) => !craftLike(c));
    b.subject = subjectClauses.slice(0, 5).join(', ') || firstClause || deMeta(t.slice(0, 140));
    b.medium = /paint|illustration|drawing|render|3d|vector/i.test(t)
      ? (/oil painting|illustration|3D render|flat vector/i.exec(t)?.[0] ?? 'photograph')
      : 'photograph';
    if (!LEX.camera.test(t)) {
      b.shot = ['medium shot'];
      b.lens = '50mm normal';
      b.aperture = 'f/2.8';
    } else {
      b.shot = [/close-?up|wide shot|medium shot|establishing/i.exec(t)?.[0] ?? 'medium shot'];
      b.lens = /\d{2,3}\s?mm/i.exec(t)?.[0] ?? '50mm normal';
    }
    b.light = LEX.light.test(t)
      ? [LEX.light.exec(t)?.[0] ?? 'golden hour']
      : ['softbox key camera-left'];
    if (!LEX.colour.test(t)) b.grade = 'warm highlights, cool shadows';
    if (!LEX.comp.test(t)) b.comp = 'rule of thirds';
    b.mood = ['calm'];
    if (m.category === 'video') {
      b.action = t.length > 60 ? t : firstClause + ', held for the length of the shot';
      b.camMove = 'slow dolly in';
    }
    const q = /["“]([^"”]{2,40})["”]/.exec(t);
    if (q?.[1] !== undefined) b.imgtext = q[1];
    b.avoid =
      exclusions.length > 0 ? exclusions.join(', ') : 'watermarks, text artefacts, extra limbs';
  } else if (m.category === 'voice') {
    /*
     * A voice patient is usually delivery instructions wrapped around the words to say. The
     * quoted words become the script, exactly as typed; whatever surrounds them was describing
     * the voice, so it becomes the voice.
     */
    if (quoted !== undefined) {
      b.script = quoted;
      const around = deMeta(
        text
          .replace(/["\u201c][^"\u201d]*["\u201d]/, ' ')
          .replace(/\b(reading|saying|says|read this)\b:?/gi, ' ')
          .replace(/\s+/g, ' ')
          .replace(/[,:;\s]+$/, '')
          .trim(),
      );
      b.voiceChar =
        around.length > 3 ? cap(stripBanned(around).text) : 'Neutral adult voice, unhurried';
    } else {
      /*
       * Unquoted text is a script only when it reads like one: sentences with interior stops. A
       * comma wall of short tokens, or "a warm narrator voiceover", is a description of a voice,
       * and putting a description in the mouth is the one mistake a voice tool must never make.
       */
      const clauses = text.split(',').map((c) => c.trim());
      const wallish = clauses.length >= 3 && clauses.every((c) => c.split(/\s+/).length <= 3);
      const sentence = /[.!?]\s+\S/.test(text.trim()) || /[.!?]$/.test(text.trim());
      if (wallish || (!sentence && wordCount(text) <= 10)) {
        b.voiceChar = cap(stripBanned(text.trim()).text);
      } else {
        b.script = text.trim();
        b.voiceChar = 'Neutral adult voice, unhurried';
      }
    }
    b.useCase = 'Corporate narration';
    b.vTone = ['warm'];
  } else if (m.category === 'music') {
    b.mGenre = [VOCAB.genre.find((g) => t.toLowerCase().includes(g)) ?? 'ambient'];
    b.mMood = ['calm'];
    b.mBpm = '100';
    b.mVocal = 'Instrumental';
    b.mStruct = t;
    if (exclusions.length > 0) b.mExclude = exclusions.join(', ');
  } else if (m.category === 'sfx') {
    b.sound = t;
    b.sfxKind = 'foley';
    b.room = 'treated booth';
    if (exclusions.length > 0) b.avoid = exclusions.join(', ');
  } else if (m.category === 'code') {
    b.cTask = t;
    b.cCheck = 'the existing test suite passes';
    b.cScope = 'anything not named above';
  } else if (m.category === 'app') {
    b.aApp = t;
    b.aScreens = 'one screen only';
    b.cScope = 'everything already working';
  } else if (m.category === 'research') {
    b.rQuestion = t;
    b.rFormat = 'Cited brief, 1 page';
    b.rGaps = 'Say so in a Gaps section rather than estimating';
  } else {
    b.goal = t;
    b.format = 'Markdown with headings';
    b.role = 'senior editor';
    b.effort = 'High';
    b.rules = 'Do not invent facts. If the answer is not in the material, say so';
  }
  return b;
}
