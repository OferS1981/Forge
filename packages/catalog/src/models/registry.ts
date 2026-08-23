import { CATEGORIES } from '../categories';
import type { CategoryId, Model, ModelId } from '../types';
import { MODELS } from './index';

export { MODELS };

const BY_ID = new Map<ModelId, Model>(MODELS.map((m) => [m.id, m]));

export function modelById(id: ModelId): Model {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown model: ${id}`);
  return m;
}

/**
 * A model id that came from somewhere untrusted: a saved preference, a share link, a browser
 * extension reading a host. Anything outside this package holds a plain string, so it needs a way
 * to ask whether that string is a model before it can look one up.
 */
export function isModelId(id: string): id is ModelId {
  return BY_ID.has(id as ModelId);
}

/** Look up a model from an untrusted string. Undefined when there is no such model. */
export function findModel(id: string): Model | undefined {
  return isModelId(id) ? modelById(id) : undefined;
}

export function modelsIn(category: CategoryId): Model[] {
  return MODELS.filter((m) => m.category === category);
}

/** The model a newcomer should start with in each category. */
export function defaultModel(category: CategoryId): Model {
  const c = CATEGORIES.find((x) => x.id === category);
  if (!c) throw new Error(`Unknown category: ${category}`);
  return modelById(c.defaultModel);
}

/** Display name: "ElevenLabs · Speech". */
export function modelLabel(m: Model): string {
  return m.sub ? m.name + ' · ' + m.sub : m.name;
}
