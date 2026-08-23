import type { Brief, FieldId, Mode } from '@forge/catalog';
import { mintSlug, type SharePayload, type Shared } from './share';
import {
  type Env,
  type Folder,
  type Library,
  type LibraryData,
  type SavedPrompt,
  type SavedRecipe,
  type Share,
} from './types';

/**
 * The library in an account.
 *
 * It talks to six methods rather than to a vendor's client. Everything above this line is testable
 * against a fake, and the part that cannot be tested without a hosted project is the forty lines in
 * the app that implement `RemotePort`. That is the whole reason for the seam.
 */
export interface RemotePort {
  /** Who is signed in. Every row is written with it, and every policy checks it again server side. */
  userId: () => string;
  select: <T>(table: string, columns: string) => Promise<T[]>;
  insert: <T>(table: string, row: Record<string, unknown>) => Promise<T>;
  update: (
    table: string,
    patch: Record<string, unknown>,
    match: Record<string, unknown>,
  ) => Promise<void>;
  remove: (table: string, match: Record<string, unknown>) => Promise<void>;
  rpc: <T>(fn: string, args: Record<string, unknown>) => Promise<T[]>;
}

interface FolderRow {
  id: string;
  name: string;
  position: number;
}
interface PromptRow {
  id: string;
  folder_id: string | null;
  model_id: string;
  brief: Brief;
  title: string;
  score: number;
  mode: string;
  created_at: string;
  updated_at: string;
}
interface RecipeRow {
  id: string;
  name: string;
  model_id: string;
  brief: Brief;
  locked_fields: string[];
  created_at: string;
}
interface PinRow {
  model_id: string;
  position: number;
}
interface ShareRow {
  id: string;
  prompt_id: string;
  slug: string;
  expires_at: string | null;
  created_at: string;
}

const asMode = (v: string): Mode => (v === 'advanced' ? 'advanced' : 'simple');

const toPrompt = (r: PromptRow): SavedPrompt => ({
  id: r.id,
  folderId: r.folder_id,
  modelId: r.model_id,
  brief: r.brief,
  title: r.title,
  score: r.score,
  mode: asMode(r.mode),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRecipe = (r: RecipeRow): SavedRecipe => ({
  id: r.id,
  name: r.name,
  modelId: r.model_id,
  brief: r.brief,
  locked: r.locked_fields as FieldId[],
  createdAt: r.created_at,
});

const toShare = (r: ShareRow): Share => ({
  id: r.id,
  promptId: r.prompt_id,
  slug: r.slug,
  expiresAt: r.expires_at,
  createdAt: r.created_at,
});

export function createRemoteLibrary(port: RemotePort, env: Env): Library {
  const owner = (): { user_id: string } => ({ user_id: port.userId() });

  return {
    kind: 'account',

    read: async (): Promise<LibraryData> => {
      // Five reads in parallel. Row level security is what limits them to this account, not a
      // filter written here, which is the point of testing the policies rather than the query.
      const [folders, prompts, recipes, pins, shares] = await Promise.all([
        port.select<FolderRow>('folders', 'id,name,position'),
        port.select<PromptRow>(
          'prompts',
          'id,folder_id,model_id,brief,title,score,mode,created_at,updated_at',
        ),
        port.select<RecipeRow>('recipes', 'id,name,model_id,brief,locked_fields,created_at'),
        port.select<PinRow>('pins', 'model_id,position'),
        port.select<ShareRow>('shares', 'id,prompt_id,slug,expires_at,created_at'),
      ]);
      return {
        folders: [...folders].sort((a, b) => a.position - b.position),
        prompts: prompts.map(toPrompt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        recipes: recipes.map(toRecipe),
        pins: [...pins]
          .sort((a, b) => a.position - b.position)
          .map((p) => ({ modelId: p.model_id, position: p.position })),
        shares: shares.map(toShare),
      };
    },

    addFolder: async (name) => {
      const existing = await port.select<FolderRow>('folders', 'id');
      const row = await port.insert<FolderRow>('folders', {
        ...owner(),
        name,
        position: existing.length,
      });
      return { id: row.id, name, position: existing.length } satisfies Folder;
    },

    renameFolder: (id, name) => port.update('folders', { name }, { id }),

    // The database sets the prompts in it to null on delete, so the work survives its folder.
    removeFolder: (id) => port.remove('folders', { id }),

    savePrompt: async (input) => {
      const row = await port.insert<PromptRow>('prompts', {
        ...owner(),
        folder_id: input.folderId ?? null,
        model_id: input.modelId,
        brief: input.brief,
        title: input.title,
        score: input.score,
        mode: input.mode,
      });
      return toPrompt(row);
    },

    updatePrompt: (id, patch) => {
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.folderId !== undefined) row.folder_id = patch.folderId;
      if (patch.brief !== undefined) row.brief = patch.brief;
      if (patch.score !== undefined) row.score = patch.score;
      if (patch.mode !== undefined) row.mode = patch.mode;
      return port.update('prompts', row, { id });
    },

    removePrompt: (id) => port.remove('prompts', { id }),

    saveRecipe: async (input) => {
      // `(user_id, name)` is unique, so saving twice under one name replaces rather than failing.
      await port.remove('recipes', { ...owner(), name: input.name });
      const row = await port.insert<RecipeRow>('recipes', {
        ...owner(),
        name: input.name,
        model_id: input.modelId,
        brief: input.brief,
        locked_fields: input.locked,
      });
      return toRecipe(row);
    },

    removeRecipe: (id) => port.remove('recipes', { id }),

    setPins: async (pins) => {
      await port.remove('pins', owner());
      for (const [position, pin] of pins.entries()) {
        await port.insert('pins', { ...owner(), model_id: pin.modelId, position });
      }
    },

    /*
     * An account mints a short link rather than putting the prompt in the link, so it can be taken
     * down later. The slug is made here, from a cryptographic random source, and the check
     * constraint on the column refuses anything shorter.
     */
    shareOf: async (prompt): Promise<Shared> => {
      const existing = await port.select<ShareRow>('shares', 'id,prompt_id,slug,expires_at');
      const already = existing.find((s) => s.prompt_id === prompt.id);
      if (already) return { kind: 'slug', slug: already.slug };
      const row = await port.insert<ShareRow>('shares', {
        ...owner(),
        prompt_id: prompt.id,
        slug: mintSlug(env.random),
      });
      return { kind: 'slug', slug: row.slug };
    },

    revokeShare: (slug) => port.remove('shares', { slug }),
  };
}

interface SharedRow {
  slug: string;
  title: string;
  model_id: string;
  brief: Brief;
  mode: string;
  score: number;
}

/**
 * Resolve a slug someone was given. This is the one thing an anonymous reader may do, and it goes
 * through a `security definer` function that takes an exact slug, so it cannot be turned into a
 * list of everybody's prompts.
 */
export async function readShare(port: RemotePort, slug: string): Promise<SharePayload | null> {
  const rows = await port.rpc<SharedRow>('share_by_slug', { p_slug: slug });
  const row = rows[0];
  if (row === undefined) return null;
  return {
    v: 1,
    title: row.title,
    modelId: row.model_id,
    brief: row.brief,
    mode: asMode(row.mode),
  };
}
