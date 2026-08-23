import type { Brief, FieldId, Mode } from '@forge/catalog';
import type { Shared } from './share';

/**
 * What the library holds. These are the rows in `sql/001_library.sql`, in the shape the app reads
 * them, and they are the same shape whether the work is in this browser or in an account. That is
 * the point: signing in changes where the library is, never what it can do.
 */

export interface Folder {
  id: string;
  name: string;
  position: number;
}

/**
 * A saved prompt keeps the brief, not the rendered string. A brief can be forged again when the
 * catalogue learns something new about the model, or translated to a different model. A string is
 * a photograph of a prompt that was once right.
 */
export interface SavedPrompt {
  id: string;
  folderId: string | null;
  modelId: string;
  brief: Brief;
  title: string;
  score: number;
  mode: Mode;
  createdAt: string;
  updatedAt: string;
}

export interface SavedRecipe {
  id: string;
  name: string;
  modelId: string;
  brief: Brief;
  /** The fields the recipe fixes. Everything else is asked for again. */
  locked: FieldId[];
  createdAt: string;
}

export interface Pin {
  modelId: string;
  position: number;
}

export interface Share {
  id: string;
  promptId: string;
  slug: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface LibraryData {
  folders: Folder[];
  prompts: SavedPrompt[];
  recipes: SavedRecipe[];
  pins: Pin[];
  shares: Share[];
}

export const EMPTY_LIBRARY: LibraryData = {
  folders: [],
  prompts: [],
  recipes: [],
  pins: [],
  shares: [],
};

export interface NewPrompt {
  modelId: string;
  brief: Brief;
  title: string;
  score: number;
  mode: Mode;
  folderId?: string | null;
}

export interface PromptPatch {
  title?: string;
  folderId?: string | null;
  brief?: Brief;
  score?: number;
  mode?: Mode;
}

export interface NewRecipe {
  name: string;
  modelId: string;
  brief: Brief;
  locked: FieldId[];
}

/**
 * One interface, two implementations: the browser and an account. Every screen is written against
 * this, so no screen knows whether anyone is signed in, and nothing can quietly become a feature
 * that only works with an account.
 */
export interface Library {
  /** Which one this is. The library says so in one line rather than leaving people to guess. */
  readonly kind: 'local' | 'account';
  read: () => Promise<LibraryData>;
  addFolder: (name: string) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  /** The prompts in it are kept and become unfiled. Deleting a folder is not deleting the work. */
  removeFolder: (id: string) => Promise<void>;
  savePrompt: (input: NewPrompt) => Promise<SavedPrompt>;
  updatePrompt: (id: string, patch: PromptPatch) => Promise<void>;
  removePrompt: (id: string) => Promise<void>;
  saveRecipe: (input: NewRecipe) => Promise<SavedRecipe>;
  removeRecipe: (id: string) => Promise<void>;
  setPins: (pins: Pin[]) => Promise<void>;
  /**
   * A link to a saved prompt.
   *
   * In a browser this is the prompt encoded in the link itself: it works, it costs nothing, and it
   * cannot be taken back, because the reader already holds it. An account mints a short slug
   * instead, which can be taken down later. Sharing therefore works signed out; what an account
   * adds is a link you keep control of. The two are told apart by `kind`, and the screen says which
   * one it just made rather than implying a withdrawal that would not happen.
   */
  shareOf: (prompt: SavedPrompt) => Promise<Shared>;
  /** Takes down a slug share. A browser has no slug shares, so there is nothing for it to do. */
  revokeShare: (slug: string) => Promise<void>;
}

/** Injected, so that a test can be exact about what was written and when. */
export interface Env {
  now: () => string;
  id: () => string;
  /** n cryptographically random bytes, for a share slug nobody can guess. */
  random: (n: number) => Uint8Array;
}

export const BROWSER_ENV: Env = {
  now: () => new Date().toISOString(),
  id: () => crypto.randomUUID(),
  random: (n) => crypto.getRandomValues(new Uint8Array(n)),
};
