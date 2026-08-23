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
