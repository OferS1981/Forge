import type { Brief, CategoryId, FieldId, Model } from '../types';

/**
 * The Compliance Pass: advice before submission, never a gate. Everything here follows the policy
 * manual's line, making a legitimate request legible to a classifier is craft, making a
 * prohibited request illegible is evasion, and everything is on the first side of it. The pass
 * warns before submission instead of after refusal, offers the decomposition that makes the
 * prompt better, and tells people what they own. It never blocks a Strike, every finding is
 * dismissible, and nothing here rewrites anything without the person choosing it.
 */

export type FindingSeverity = 'note' | 'caution' | 'high';

export interface ComplianceFinding {
  /** Stable within a session, so a dismissal can be remembered. */
  id: string;
  severity: FindingSeverity;
  title: string;
  /** The plain explanation, in the register of advice from a colleague, not a compliance nag. */
  detail: string;
  /** A suggested clause or rewrite, when one exists. Offered, never applied. */
  rewrite?: string;
  /** The brief field the finding points at. */
  field?: FieldId;
  /** When set, the finding offers the attribute scaffold instead of a mere warning. */
  decompose?: { term: string; category: CategoryId };
}

/** The fields where the grammar expects a description, which is where a name is a flag. */
const STYLE_FIELDS: readonly FieldId[] = ['ref', 'medium', 'mood', 'palette', 'grade'];
const SUBJECT_FIELDS: readonly FieldId[] = ['subject', 'action', 'setting'];
const MUSIC_FIELDS: readonly FieldId[] = ['mGenre', 'mMood', 'mInst', 'mProd', 'mVocal'];

function text(brief: Brief, ids: readonly FieldId[]): { field: FieldId; value: string }[] {
  const out: { field: FieldId; value: string }[] = [];
  for (const id of ids) {
    const v = brief[id];
    if (typeof v === 'string' && v.trim() !== '') out.push({ field: id, value: v });
    if (Array.isArray(v))
      for (const item of v) if (item.trim() !== '') out.push({ field: id, value: item });
  }
  return out;
}

/**
 * Craft vocabulary that looks like a name but is not one. Rembrandt lighting is a lighting term
 * with a person inside it; a Dutch angle is not a Dutch person. Conservative by design: the
 * manual's rule is that a false flag interrupting a legitimate prompt is worse than a miss.
 */
const CRAFT_PHRASES =
  /\b(rembrandt light|dutch angle|venetian blind|french (?:new wave|crop)|american shot|german expressionis|art deco|art nouveau|bauhaus|ukiyo-e|impressionis|cubis|brutalis|minimalis|new york|los angeles|san francisco|middle east)\w*/i;

const NAME = String.raw`[A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)+`;

interface Hit {
  field: FieldId;
  name: string;
  construction: string;
}

function properNouns(brief: Brief): Hit[] {
  const hits: Hit[] = [];
  const seen = new Set<string>();
  const push = (field: FieldId, name: string, construction: string): void => {
    const clean = name
      .trim()
      .replace(/[.,;:]+$/, '')
      .replace(/['\u2019]s$/, '');
    if (CRAFT_PHRASES.test(clean)) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({ field, name: clean, construction });
  };
  const styled = new RegExp(
    String.raw`\bin the (?:style|manner|voice) of (${NAME}|[A-Z][\w'.-]+)`,
    'g',
  );
  const sounds = new RegExp(String.raw`\bsounds? like (${NAME}|[A-Z][\w'.-]+)`, 'g');
  const posses = new RegExp(String.raw`\blike (${NAME}|[A-Z][\w'.-]+)['’]s\b`, 'g');
  for (const { field, value } of text(brief, [
    ...STYLE_FIELDS,
    ...SUBJECT_FIELDS,
    ...MUSIC_FIELDS,
  ])) {
    for (const m of value.matchAll(styled)) push(field, m[1] ?? '', 'in the style of');
    for (const m of value.matchAll(sounds)) push(field, m[1] ?? '', 'sounds like');
    for (const m of value.matchAll(posses)) push(field, m[1] ?? '', 'a possessive');
  }
  // A bare capitalised multi-word token where the grammar expects a description. Style fields
  // only, and never at the start of a sentence, which is how ordinary prose capitalises.
  const bare = new RegExp(String.raw`(?<![.!?]\s)(?<!^)\b(${NAME})\b`, 'g');
  for (const { field, value } of text(brief, [...STYLE_FIELDS, ...MUSIC_FIELDS])) {
    for (const m of value.matchAll(bare))
      push(field, m[1] ?? '', 'a name where a description goes');
  }
  /*
   * A person named as the subject is the highest-exposure case of all: right of publicity, not
   * copyright, and consent is the only clean path. Detected only behind a person-ish preposition
   * ("a portrait of Taylor Swift"), so Tower Bridge in a wide shot stays unflagged; when a place
   * does match, the finding's own copy says to dismiss it.
   */
  const asSubject = new RegExp(
    String.raw`\b(?:of|featuring|as|starring|played by)\s+(${NAME})\b`,
    'g',
  );
  for (const { field, value } of text(brief, SUBJECT_FIELDS)) {
    for (const m of value.matchAll(asSubject))
      push(field, m[1] ?? '', 'a real name as the subject');
  }
  return hits;
}

const REGISTER_WORDS =
  /\b(medical|anatomical|surgical|clinical|autopsy|operative|wound|incision|historical|war|battlefield|battle of|holocaust|genocide|documentary|editorial|journalis\w*|educational|classroom|textbook|museum|funerary)\b/i;

const NEGATIVE_IN_PROSE = /\b(?:no|without|don't show|do not show|never)\s+([a-z][\w-]{2,})/i;

const INTENSIFIERS =
  /\b(horrific(?:ally)?|brutal(?:ly)?|gruesome(?:ly)?|massively|insanely|blood-soaked|ultra-violent|nightmarish|shocking(?:ly)?)\b/i;

/*
 * Words that mean a human child, and only that. "School" is out (a school of fish, art school),
 * "family" is out (a family restaurant), "teen" alone is out, and "baby" only counts when it is
 * not painting something baby blue or naming a baby grand. The rule of the whole pass is that a
 * false flag interrupting a legitimate prompt is worse than a miss, and this finding is the one
 * that says "no rewrite exists", so it earns the narrowest net in the file.
 */
const PEOPLE_WORDS =
  /\b(child|children|kids?\b|toddlers?|teenagers?|schoolchildren|minors|bab(?:y|ies)(?!\s+(?:blue|pink|grand|steps)))\b/i;
const DOMESTIC_TRIPS = /\b(shower(?:ing)?|bathtub|bathing|on the toilet|toilet|bathroom)\b/i;
const FACE_WORDS =
  /\b(face|portrait|person|people|man|woman|presenter|close-up of (?:a|the) (?:man|woman|person))\b/i;

const GOOGLE_MAKERS = new Set(['Google', 'Google DeepMind']);

/**
 * Run the pass. Deterministic, pure, and quiet by default: an empty brief returns no findings,
 * and a brief with nothing worth saying returns no findings. Severity is about how expensive the
 * surprise would be, not about how naughty anyone has been.
 */
export function compliance(brief: Brief, model: Model): ComplianceFinding[] {
  const findings: ComplianceFinding[] = [];
  const category = model.category;

  // 1. Proper nouns: the single highest-frequency trigger in the manual.
  for (const hit of properNouns(brief)) {
    const vendor =
      model.policy.artistNames === 'refused'
        ? category === 'music'
          ? 'This vendor contractually prohibits artist, song, album and label names in the input.'
          : 'This vendor refuses living artists by name, in its own words.'
        : model.policy.artistNames === 'stripped'
          ? 'This vendor silently deletes the name and your prompt quietly gets worse.'
          : 'Naming also converts a copyright question into a trademark and endorsement one.';
    findings.push({
      id: `proper-noun:${hit.name.toLowerCase().replace(/\s+/g, '-')}`,
      severity:
        model.policy.artistNames === 'refused' || model.policy.artistNames === 'stripped'
          ? 'caution'
          : 'note',
      title: `"${hit.name}" is one dial you cannot turn`,
      detail: `You wrote ${hit.construction === 'a name where a description goes' ? `"${hit.name}" where the grammar expects a description` : hit.construction === 'a real name as the subject' ? `"${hit.name}" as the subject. If that is a real person, style is not the issue: a face or a voice is governed by the right of publicity, and consent is the only clean path` : `${hit.construction} "${hit.name}"`}. ${vendor} If ${hit.name} is a movement, a place or a technique, dismiss this. If it is a person, a studio or a song, the look it names is really eight or nine attributes, and each one is a dial you can turn.`,
      field: hit.field,
      decompose: { term: hit.name, category },
    });
  }

  // 2. Register: name what kind of thing this is. One clause moves the published severity score.
  const registerable = text(brief, [...SUBJECT_FIELDS, 'goal', 'script']).find(({ value }) =>
    REGISTER_WORDS.test(value),
  );
  const purpose = brief.purpose;
  if (registerable && (typeof purpose !== 'string' || purpose.trim() === '')) {
    const word = REGISTER_WORDS.exec(registerable.value)?.[1] ?? 'that subject';
    findings.push({
      id: 'register',
      severity: 'note',
      title: 'Name the register',
      detail: `The brief mentions "${word}" but never says what kind of work this is. The only published severity rubric in the industry scores clinical, educational, journalistic and historical framing lower than the same words unframed, so one clause naming the register is the difference between a pass and a refusal, and it makes the prompt more precise at the same time.`,
      rewrite:
        'Fill the purpose field: "an educational illustration for teaching materials", "an editorial photograph for a news feature", "a clinical reference figure".',
      field: 'purpose',
    });
  }

  // 3. Negative constructions plant the flagged token in the prompt. "No blood" contains "blood".
  for (const { field, value } of text(brief, [...SUBJECT_FIELDS, ...STYLE_FIELDS])) {
    const m = NEGATIVE_IN_PROSE.exec(value);
    if (m) {
      findings.push({
        id: `negative:${field}`,
        severity: 'note',
        title: `"${m[0]}" says what is absent`,
        detail: `A negative construction puts the flagged word in the prompt: "${m[0]}" contains "${(m[1] ?? '').split(' ')[0] ?? ''}". Every vendor that publishes prompting guidance says the same thing for quality reasons: describe what is there instead. The avoid field exists for models with a real negative parameter.`,
        rewrite: 'Replace it with a positive description of what should be there instead.',
        field,
      });
      break;
    }
  }

  // 3b. Midjourney's --no parser reads each word alone. Vendor-documented, worth its own line.
  const avoid = brief.avoid;
  if ((model.id === 'midjourney' || model.id === 'mjvideo') && typeof avoid === 'string') {
    // The avoid field is a comma-separated string; each item becomes a --no term.
    const items = avoid.split(',').map((a) => a.trim());
    const multi = items.find((a) => a.includes(' '));
    if (multi !== undefined) {
      findings.push({
        id: 'mj-no-split',
        severity: 'caution',
        title: `--no will split "${multi}" into separate words`,
        detail: `Midjourney's own docs: the moderation system reads each word after --no independently, so "--no ${multi}" parses as ${multi
          .split(/\s+/)
          .map((w) => `"no ${w}"`)
          .join(' plus ')}, and their own advice is to describe what you do want instead.`,
        rewrite: 'Describe the thing you want in its place, and keep --no to single words.',
        field: 'avoid',
      });
    }
  }

  // 4. Emotive intensifiers do severity work but no descriptive work.
  for (const { field, value } of text(brief, [...SUBJECT_FIELDS, 'mood'])) {
    const m = INTENSIFIERS.exec(value);
    if (m) {
      findings.push({
        id: 'intensifier',
        severity: 'note',
        title: `"${m[1] ?? ''}" adds severity, not information`,
        detail:
          'The precise term is more useful to the model and scores lower on every published rubric. "A 4 cm transverse laceration" beats "a horrific bleeding wound" on both axes at once, that is the whole craft in one line.',
        rewrite: 'Swap the intensifier for the specific, measurable detail it was standing in for.',
        field,
      });
      break;
    }
  }

  // 5. Model-specific trip lines, in the vendor's own words, before submission instead of after.
  if (model.id === 'midjourney' || model.id === 'mjvideo') {
    const domestic = text(brief, SUBJECT_FIELDS).find(({ value }) => DOMESTIC_TRIPS.test(value));
    if (domestic) {
      findings.push({
        id: 'mj-domestic',
        severity: 'caution',
        title: 'An ordinary domestic scene, on their adult-content list',
        detail:
          'Midjourney\'s guidelines list "people in showers, on toilets" under adult content, the classic accidental trip on an entirely ordinary scene. Reframe the moment: after the shower, at the sink, towelling off by the window.',
        field: domestic.field,
      });
    }
  }
  if (GOOGLE_MAKERS.has(model.maker ?? '') && (category === 'image' || category === 'video')) {
    const kids = text(brief, SUBJECT_FIELDS).find(({ value }) => PEOPLE_WORDS.test(value));
    if (kids) {
      findings.push({
        id: 'google-person-generation',
        severity: 'high',
        title: 'People in frame meet personGeneration, and children meet a regional wall',
        detail:
          'On Google surfaces person generation is a capability gate, not a content judgement: the default allows adults only, and the setting that permits children, allow_all, is prohibited outright in the EU, UK, Switzerland and MENA regardless of settings. If you are in those regions and the scene needs children, no rewrite exists; use a different model.',
        field: kids.field,
      });
    }
  }
  if (model.id === 'seedance') {
    const face = text(brief, SUBJECT_FIELDS).find(({ value }) => FACE_WORDS.test(value));
    if (face) {
      findings.push({
        id: 'seedance-face',
        severity: 'caution',
        title: 'Photorealistic faces are blocked at the model layer here',
        detail:
          'Seedance blocks photorealistic faces in the model itself, so no phrasing fixes it. The documented routes are the digital avatar with liveness verification or enterprise portrait authorisation, or a model that permits people.',
        field: face.field,
      });
    }
  }

  // 6. Rights that would surprise: surfaced before the work is made, not after it is sold.
  const rightsBlock = model.rights;
  if (rightsBlock.outputOwner === 'tier-dependent' || rightsBlock.outputOwner === 'unclear') {
    findings.push({
      id: 'rights-surprise',
      severity: 'caution',
      title:
        rightsBlock.outputOwner === 'tier-dependent'
          ? 'What you own here depends on your tier'
          : 'Who owns the output here is genuinely unclear',
      detail: rightsBlock.ownershipNote ?? rightsBlock.commercialUse,
    });
  }
  // Not an else: Suno is tier-dependent AND gates exports retroactively, and the export cap is
  // exactly the surprise this pass exists to deliver before the work is made.
  if (rightsBlock.exportEntitlement !== undefined) {
    findings.push({
      id: 'rights-export',
      severity: 'caution',
      title: 'Getting the file out is what is gated here',
      detail: rightsBlock.exportEntitlement,
    });
  }

  return findings;
}
