import { FIELDS, type Brief, type FieldId, type Model } from '@forge/catalog';

/**
 * What Forge asks the assistant, and how it reads the answer.
 *
 * All of it is here rather than at the edge, because this is the part that can be wrong in a way
 * nobody notices: a question that invites the model to invent, or a parser that accepts anything.
 * Every function below is tested in Node with no key and no network.
 *
 * The rule running through it: the assistant may describe and it may criticise. It never writes a
 * prompt. The engine writes prompts, deterministically, and that is the product.
 */

/** The fields a picture could plausibly answer, in the catalogue's own ids. */
export function describableFields(model: Model): FieldId[] {
  return [...model.core, ...model.craft].filter((id) => {
    const field = FIELDS[id];
    return field.type === 'text' || field.type === 'area' || field.type === 'chip1';
  });
}

function fieldMenu(model: Model): string {
  return describableFields(model)
    .map((id) => {
      const field = FIELDS[id];
      const options = field.options?.map((o) => o.value).join(' | ');
      const allowed = options === undefined ? 'free text' : `one of: ${options}`;
      return `- ${id}: ${field.label}, ${field.hint ?? ''} (${allowed})`;
    })
    .join('\n');
}

export function describeSystem(model: Model): string {
  return [
    'You are looking at a reference image for someone who is about to write an image prompt.',
    'Report only what is visibly there. If something is not visible, leave that field out.',
    'Do not guess at intent, mood words or story. Do not invent a brand, a person or a place.',
    '',
    'Reply with JSON only, no prose around it, in this shape:',
    '{"summary": "one sentence saying what is in the picture", "brief": {"<field id>": "<value>"}}',
    '',
    'The field ids you may use, and nothing else:',
    fieldMenu(model),
  ].join('\n');
}

export function critiqueSystem(model: Model): string {
  return [
    `You are giving a second opinion on a prompt written for ${model.name}.`,
    'Forge has already scored it and named what is missing. Add only what a reader would not get',
    'from a checklist: what this particular prompt is likely to produce, and why.',
    '',
    'Never rewrite the prompt. Forge writes prompts.',
    'Be specific and short. No praise, no hedging, no preamble.',
    '',
    'Reply with JSON only, no prose around it, in this shape:',
    '{"findings": ["..."], "suggestion": "one sentence"}',
  ].join('\n');
}

export function freeformSystem(model: Model): string {
  return [
    `Someone is writing a brief for ${model.name} and is stuck on the subject line.`,
    'Give them one concrete subject, in one sentence, drawn from what they have written so far.',
    'Plain words. No adjectives stacked up, no "masterpiece", no quality words at all.',
    'Reply with the sentence and nothing else.',
  ].join('\n');
}

export function briefAsText(brief: Brief): string {
  const lines = Object.entries(brief)
    .filter(([, value]) => value.length > 0)
    .map(([id, value]) => {
      const field = FIELDS[id as FieldId];
      const shown = Array.isArray(value) ? value.join(', ') : value;
      return `${field.label}: ${shown}`;
    });
  return lines.length === 0 ? 'They have written nothing yet.' : lines.join('\n');
}

/**
 * Models wrap JSON in prose or a fence however they are asked not to. This finds the object and
 * ignores the rest, which is more useful than being right about whose fault it was.
 */
export function firstJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Reading a described brief.
 *
 * Only fields this model actually has, only values its own options allow, and only strings. A model
 * that answers with a field Forge does not know, or a lens that is not in the vocabulary, has its
 * answer dropped rather than smuggled into the brief. This is the parser that stops the assistant
 * from becoming a second, unverified catalogue.
 */
export function readDescription(
  text: string,
  model: Model,
): { brief: Brief; summary: string } | null {
  const parsed = firstJsonObject(text);
  if (!isRecord(parsed)) return null;
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  if (summary.length === 0) return null;

  const allowed = new Set<string>(describableFields(model));
  const raw = isRecord(parsed.brief) ? parsed.brief : {};
  let brief: Brief = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!allowed.has(id) || typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    const options = FIELDS[id as FieldId].options;
    if (options !== undefined && !options.some((o) => o.value === trimmed)) continue;
    brief = { ...brief, [id]: trimmed };
  }
  return { brief, summary };
}

export function readCritique(text: string): { findings: string[]; suggestion: string } | null {
  const parsed = firstJsonObject(text);
  if (!isRecord(parsed)) return null;
  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
    : [];
  const suggestion = typeof parsed.suggestion === 'string' ? parsed.suggestion.trim() : '';
  if (findings.length === 0 && suggestion.length === 0) return null;
  return { findings: findings.map((f) => f.trim()), suggestion };
}
