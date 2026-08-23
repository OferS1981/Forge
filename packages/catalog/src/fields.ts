import { AUTO_FILL } from './autofill';
import { RAW_FIELDS } from './fields-raw';
import { FIELD_IDS } from './ids';
import type { Field, FieldId, Mode, Option, TermId } from './types';
import { VOCAB } from './vocab';

/**
 * Tier rule: every field that appears in any model's `core` list is simple, and so are aspect and
 * duration. Everything else is the craft layer and is advanced. The invariants test checks this
 * set against the model files.
 */
export const SIMPLE_FIELDS: ReadonlySet<FieldId> = new Set<FieldId>([
  'subject',
  'setting',
  'medium',
  'purpose',
  'action',
  'script',
  'useCase',
  'voiceChar',
  'vArch',
  'lang',
  'sound',
  'sfxKind',
  'mGenre',
  'mMood',
  'mInst',
  'mBpm',
  'goal',
  'context',
  'format',
  'cTask',
  'cStack',
  'cCheck',
  'aApp',
  'aScreens',
  'aData',
  'rQuestion',
  'rScope',
  'rFormat',
  'aspect',
  'duration',
]);

export function tierOf(id: FieldId): Mode {
  return SIMPLE_FIELDS.has(id) ? 'simple' : 'advanced';
}

export function optionsFrom(values: readonly string[], term: TermId): Option[] {
  return values.map((value) => ({ value, label: value, term, tier: 'simple' }));
}

function build(id: FieldId): Field {
  const raw = RAW_FIELDS[id];
  const term: TermId = `field.${id}`;
  const field: Field = { id, label: raw.label, type: raw.type, tier: tierOf(id), term };
  if (raw.hint !== undefined) field.hint = raw.hint;
  if (raw.max !== undefined) field.max = raw.max;
  if (raw.placeholder !== undefined) field.placeholder = raw.placeholder;
  if (raw.options !== undefined)
    field.options = optionsFrom(VOCAB[raw.options], `vocab.${raw.options}`);
  else if (raw.inline !== undefined) field.options = optionsFrom(raw.inline, term);
  else if (raw.type === 'select') field.options = [];
  const auto = AUTO_FILL[id];
  if (auto) field.autoFill = auto;
  return field;
}

export const FIELDS: Record<FieldId, Field> = Object.fromEntries(
  FIELD_IDS.map((id) => [id, build(id)]),
) as Record<FieldId, Field>;

export const FIELD_LIST: readonly Field[] = FIELD_IDS.map((id) => FIELDS[id]);

export function fieldById(id: FieldId): Field {
  return FIELDS[id];
}
