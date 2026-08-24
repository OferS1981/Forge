import type { Brief, FieldId, Mode } from '@forge/catalog';
import type { Shared } from './share';
import {
  EMPTY_LIBRARY,
  type Env,
  type Folder,
  type Library,
  type LibraryData,
  type Pin,
  type SavedPrompt,
  type SavedRecipe,
  type Share,
} from './types';

/**
 * The library in this browser. It is the default, and it is not a lesser version of the account:
 * folders, prompts, recipes, pins and shares all work with nobody signed in, because section 13
 * says anonymous users get everything except cloud sync.
 *
 * Storage is injected rather than reached for, so the tests are exact about what was written and
 * the whole thing runs in Node.
 */

export interface KeyValue {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export const LIBRARY_KEY = 'forge.library.v1';

/** Where phase 5 kept recipes and pins, before there was a library to keep them in. */
const LEGACY_RECIPES = 'forge.recipes';
const LEGACY_PINS = 'forge.pins';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

function asBrief(value: unknown): Brief {
  if (!isRecord(value)) return {};
  const out: Record<string, string | string[]> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === 'string' || isStrings(v)) out[key] = v;
  }
  return out;
}

function asMode(value: unknown): Mode {
  return value === 'advanced' || value === 'pro' ? value : 'simple';
}

function list<T>(value: unknown, one: (v: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const out: T[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const parsed = one(item);
    if (parsed !== null) out.push(parsed);
  }
  return out;
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/**
 * Anything at all can be in localStorage: an older version of Forge, a half-written value, another
 * tab mid-write. Every field is read defensively and a row that has no id is dropped rather than
 * carried around as a broken record.
 */
export function parseLibrary(raw: string | null): LibraryData {
  if (raw === null) return EMPTY_LIBRARY;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY_LIBRARY;
  }
  if (!isRecord(value)) return EMPTY_LIBRARY;
  return {
    folders: list<Folder>(value.folders, (f) =>
      typeof f.id === 'string'
        ? { id: f.id, name: str(f.name, 'Untitled'), position: num(f.position) }
        : null,
    ),
    prompts: list<SavedPrompt>(value.prompts, (p) =>
      typeof p.id === 'string'
        ? {
            id: p.id,
            folderId: typeof p.folderId === 'string' ? p.folderId : null,
            modelId: str(p.modelId),
            brief: asBrief(p.brief),
            title: str(p.title, 'Untitled'),
            score: num(p.score),
            mode: asMode(p.mode),
            createdAt: str(p.createdAt),
            updatedAt: str(p.updatedAt),
          }
        : null,
    ),
    recipes: list<SavedRecipe>(value.recipes, (r) =>
      typeof r.id === 'string'
        ? {
            id: r.id,
            name: str(r.name, 'Untitled'),
            modelId: str(r.modelId),
            brief: asBrief(r.brief),
            locked: (isStrings(r.locked) ? r.locked : []) as FieldId[],
            createdAt: str(r.createdAt),
          }
        : null,
    ),
    pins: list<Pin>(value.pins, (p) =>
      typeof p.modelId === 'string' ? { modelId: p.modelId, position: num(p.position) } : null,
    ),
    shares: list<Share>(value.shares, (s) =>
      typeof s.id === 'string' && typeof s.slug === 'string'
        ? {
            id: s.id,
            promptId: str(s.promptId),
            slug: s.slug,
            expiresAt: typeof s.expiresAt === 'string' ? s.expiresAt : null,
            createdAt: str(s.createdAt),
          }
        : null,
    ),
  };
}

/**
 * Recipes and pins existed before the library did. Nobody should open Forge after this phase and
 * find their recipes gone, so the first read adopts what phase 5 left behind.
 */
function adoptLegacy(storage: KeyValue, env: Env): LibraryData {
  const data: LibraryData = {
    ...EMPTY_LIBRARY,
    folders: [],
    prompts: [],
    recipes: [],
    pins: [],
    shares: [],
  };
  try {
    const rawRecipes: unknown = JSON.parse(storage.getItem(LEGACY_RECIPES) ?? 'null');
    data.recipes = list<SavedRecipe>(rawRecipes, (r) =>
      typeof r.id === 'string'
        ? {
            id: r.id,
            name: str(r.name, 'Untitled'),
            modelId: str(r.model),
            brief: asBrief(r.brief),
            locked: (isStrings(r.locked) ? r.locked : []) as FieldId[],
            createdAt: env.now(),
          }
        : null,
    );
  } catch {
    // Nothing worth rescuing.
  }
  try {
    const rawPins: unknown = JSON.parse(storage.getItem(LEGACY_PINS) ?? 'null');
    if (isStrings(rawPins)) data.pins = rawPins.map((modelId, position) => ({ modelId, position }));
  } catch {
    // Same.
  }
  return data;
}

export function createLocalLibrary(storage: KeyValue, env: Env): Library {
  function load(): LibraryData {
    const raw = storage.getItem(LIBRARY_KEY);
    if (raw !== null) return parseLibrary(raw);
    const adopted = adoptLegacy(storage, env);
    if (adopted.recipes.length > 0 || adopted.pins.length > 0) save(adopted);
    return adopted;
  }

  function save(data: LibraryData): void {
    storage.setItem(LIBRARY_KEY, JSON.stringify(data));
  }

  function change(work: (data: LibraryData) => void): void {
    const data = load();
    work(data);
    save(data);
  }

  return {
    kind: 'local',

    read: () => Promise.resolve(load()),

    addFolder: (name) => {
      const data = load();
      const folder: Folder = { id: env.id(), name, position: data.folders.length };
      data.folders.push(folder);
      save(data);
      return Promise.resolve(folder);
    },

    renameFolder: (id, name) => {
      change((data) => {
        const folder = data.folders.find((f) => f.id === id);
        if (folder) folder.name = name;
      });
      return Promise.resolve();
    },

    removeFolder: (id) => {
      change((data) => {
        data.folders = data.folders.filter((f) => f.id !== id);
        // The work in it is kept and becomes unfiled. Deleting a folder is not deleting prompts.
        for (const prompt of data.prompts) if (prompt.folderId === id) prompt.folderId = null;
      });
      return Promise.resolve();
    },

    savePrompt: (input) => {
      const data = load();
      const at = env.now();
      const prompt: SavedPrompt = {
        id: env.id(),
        folderId: input.folderId ?? null,
        modelId: input.modelId,
        brief: input.brief,
        title: input.title,
        score: input.score,
        mode: input.mode,
        createdAt: at,
        updatedAt: at,
      };
      data.prompts.unshift(prompt);
      save(data);
      return Promise.resolve(prompt);
    },

    updatePrompt: (id, patch) => {
      change((data) => {
        const prompt = data.prompts.find((p) => p.id === id);
        if (!prompt) return;
        if (patch.title !== undefined) prompt.title = patch.title;
        if (patch.folderId !== undefined) prompt.folderId = patch.folderId;
        if (patch.brief !== undefined) prompt.brief = patch.brief;
        if (patch.score !== undefined) prompt.score = patch.score;
        if (patch.mode !== undefined) prompt.mode = patch.mode;
        prompt.updatedAt = env.now();
      });
      return Promise.resolve();
    },

    removePrompt: (id) => {
      change((data) => {
        data.prompts = data.prompts.filter((p) => p.id !== id);
        // A share of a prompt that is gone would be a link to nothing. The database does this with
        // a cascade; here it has to be said.
        data.shares = data.shares.filter((s) => s.promptId !== id);
      });
      return Promise.resolve();
    },

    saveRecipe: (input) => {
      const data = load();
      const recipe: SavedRecipe = { id: env.id(), createdAt: env.now(), ...input };
      // The name is the identity, matching the unique constraint an account puts on it, so saving
      // twice under one name replaces rather than quietly making a second copy.
      data.recipes = [...data.recipes.filter((r) => r.name !== input.name), recipe];
      save(data);
      return Promise.resolve(recipe);
    },

    removeRecipe: (id) => {
      change((data) => {
        data.recipes = data.recipes.filter((r) => r.id !== id);
      });
      return Promise.resolve();
    },

    setPins: (pins) => {
      change((data) => {
        data.pins = pins.map((p, position) => ({ modelId: p.modelId, position }));
      });
      return Promise.resolve();
    },

    /*
     * No row, no request, no slug. The prompt travels inside the link, in the fragment, which no
     * host ever receives. That is what lets a signed-out visitor share at all.
     */
    shareOf: (prompt) =>
      Promise.resolve<Shared>({
        kind: 'inline',
        payload: {
          v: 1,
          title: prompt.title,
          modelId: prompt.modelId,
          brief: prompt.brief,
          mode: prompt.mode,
        },
      }),

    // A browser holds no slug shares, so this list is always empty and this is always a no-op. The
    // screen does not offer it either: an inline link cannot be withdrawn and does not pretend to.
    revokeShare: (slug) => {
      change((data) => {
        data.shares = data.shares.filter((s) => s.slug !== slug);
      });
      return Promise.resolve();
    },
  };
}
