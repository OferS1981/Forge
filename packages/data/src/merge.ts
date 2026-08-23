import type { Folder, Library, LibraryData, Pin, SavedPrompt, SavedRecipe } from './types';

/**
 * The one-click import section 13 asks for: on first sign-in, offer to take the work in this
 * browser up into the account.
 *
 * It is planned before it is run, so the offer can say exactly what will happen and nothing is
 * decided while writes are in flight. Importing twice is not an error: everything already there is
 * recognised and skipped, so a person who clicks it again does not end up with two of everything.
 */

export interface ImportPlan {
  folders: Folder[];
  prompts: SavedPrompt[];
  recipes: SavedRecipe[];
  pins: Pin[];
  /** What was already in the account, so the offer can say so rather than implying it was lost. */
  alreadyThere: { folders: number; prompts: number; recipes: number; pins: number };
  /** The browser's library as it was when the plan was made, so running it needs nothing else. */
  source: LibraryData;
}

export function isEmptyPlan(plan: ImportPlan): boolean {
  return (
    plan.folders.length === 0 &&
    plan.prompts.length === 0 &&
    plan.recipes.length === 0 &&
    plan.pins.length === 0
  );
}

/** Two prompts are the same prompt when they would forge the same thing under the same name. */
function sameAs(a: SavedPrompt, b: SavedPrompt): boolean {
  return (
    a.modelId === b.modelId &&
    a.title.trim() === b.title.trim() &&
    JSON.stringify(a.brief) === JSON.stringify(b.brief)
  );
}

export function planImport(local: LibraryData, account: LibraryData): ImportPlan {
  const folderNames = new Set(account.folders.map((f) => f.name));
  const recipeNames = new Set(account.recipes.map((r) => r.name));
  const pinned = new Set(account.pins.map((p) => p.modelId));

  const folders = local.folders.filter((f) => !folderNames.has(f.name));
  const prompts = local.prompts.filter((p) => !account.prompts.some((q) => sameAs(p, q)));
  const recipes = local.recipes.filter((r) => !recipeNames.has(r.name));
  const pins = local.pins.filter((p) => !pinned.has(p.modelId));

  return {
    folders,
    prompts,
    recipes,
    pins,
    alreadyThere: {
      folders: local.folders.length - folders.length,
      prompts: local.prompts.length - prompts.length,
      recipes: local.recipes.length - recipes.length,
      pins: local.pins.length - pins.length,
    },
    source: local,
  };
}

export interface ImportResult {
  folders: number;
  prompts: number;
  recipes: number;
  pins: number;
}

/**
 * Folders go up first, because a prompt refers to one by id and the account will mint its own. A
 * prompt whose folder was skipped as a duplicate is filed in the folder of that name that was
 * already there, which is what someone importing a second time expects.
 */
export async function runImport(
  library: Library,
  plan: ImportPlan,
  account: LibraryData,
): Promise<ImportResult> {
  const byName = new Map(account.folders.map((f) => [f.name, f.id]));
  const remap = new Map<string, string>();

  for (const folder of plan.folders) {
    const made = await library.addFolder(folder.name);
    byName.set(folder.name, made.id);
    remap.set(folder.id, made.id);
  }
  /*
   * A folder skipped as a duplicate still has to point somewhere: its prompts belong in the
   * account's folder of that name. Without this, importing twice would unfile everything.
   */
  for (const folder of plan.source.folders) {
    if (remap.has(folder.id)) continue;
    const existing = byName.get(folder.name);
    if (existing !== undefined) remap.set(folder.id, existing);
  }

  for (const prompt of plan.prompts) {
    const folderId = prompt.folderId === null ? null : (remap.get(prompt.folderId) ?? null);
    await library.savePrompt({
      modelId: prompt.modelId,
      brief: prompt.brief,
      title: prompt.title,
      score: prompt.score,
      mode: prompt.mode,
      folderId,
    });
  }

  for (const recipe of plan.recipes) {
    await library.saveRecipe({
      name: recipe.name,
      modelId: recipe.modelId,
      brief: recipe.brief,
      locked: recipe.locked,
    });
  }

  if (plan.pins.length > 0) {
    await library.setPins([...account.pins, ...plan.pins]);
  }

  return {
    folders: plan.folders.length,
    prompts: plan.prompts.length,
    recipes: plan.recipes.length,
    pins: plan.pins.length,
  };
}
