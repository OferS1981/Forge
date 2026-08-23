export const CATALOG_VERSION = '1.0.0';

export * from './types';
export {
  AXIS_IDS,
  CATEGORY_IDS,
  CHIP_FIELD_IDS,
  FIELD_IDS,
  GRAMMAR_IDS,
  MODEL_IDS,
  STRENGTH_TAGS,
  VOCAB_BANKS,
} from './ids';
export { CATEGORIES, categoryById, JOB_NAMES } from './categories';
export { FIELD_LIST, FIELDS, fieldById, SIMPLE_FIELDS, tierOf } from './fields';
export { AUTO_FILL, AUTO_FILL_FIELDS } from './autofill';
export { BANNED, VOCAB } from './vocab';
export { SCORE_LABELS, scoreLabel } from './score-labels';
export { GLOSSARY, TERM_LIST, explain, hasTerm } from './glossary';
export { HOSTS, modelForHost } from './hosts';
export {
  MODELS,
  defaultModel,
  findModel,
  isModelId,
  modelById,
  modelLabel,
  modelsIn,
} from './models/registry';
export { settingTerm } from './models/shared';
export * from './engine';
export { arr, cap, deMeta, has, join, lc, stripBanned, stripDot, wordCount } from './compose/text';
export { COMPOSERS } from './compose';
export type { Composed, Composer } from './compose';
