import { describe, expect, it } from 'vitest';
import { LIBRARY_KEY, createLocalLibrary, parseLibrary } from '../src/local';
import { EMPTY_LIBRARY } from '../src/types';
import { fakeEnv, fakeStorage } from './fakes';

const brief = { subject: 'a dragon breathing fire', setting: 'a wasteland at dusk' };

function library(seed: Record<string, string> = {}) {
  const storage = fakeStorage(seed);
  return { storage, lib: createLocalLibrary(storage, fakeEnv()) };
}

describe('the library in this browser', () => {
  it('starts empty rather than failing when there is nothing stored', async () => {
    const { lib } = library();
    expect(await lib.read()).toEqual(EMPTY_LIBRARY);
    expect(lib.kind).toBe('local');
  });

  it('saves a prompt with its brief, not its rendered string', async () => {
    const { lib } = library();
    const saved = await lib.savePrompt({
      modelId: 'nanobanana',
      brief,
      title: 'The dragon',
      score: 70,
      mode: 'simple',
    });
    expect(saved.brief).toEqual(brief);
    expect(Object.keys(saved)).not.toContain('flat');
    expect((await lib.read()).prompts).toHaveLength(1);
  });

  it('puts the newest prompt first, because that is the one being worked on', async () => {
    const { lib } = library();
    const base = { modelId: 'veo', brief: {}, score: 0, mode: 'simple' as const };
    await lib.savePrompt({ ...base, title: 'First' });
    await lib.savePrompt({ ...base, title: 'Second' });
    expect((await lib.read()).prompts.map((p) => p.title)).toEqual(['Second', 'First']);
  });

  it('keeps the work when a folder is deleted, and unfiles it', async () => {
    const { lib } = library();
    const folder = await lib.addFolder('Campaign');
    await lib.savePrompt({
      modelId: 'veo',
      brief: {},
      title: 'Filed',
      score: 0,
      mode: 'simple',
      folderId: folder.id,
    });
    await lib.removeFolder(folder.id);
    const data = await lib.read();
    expect(data.folders).toEqual([]);
    expect(data.prompts[0]?.title).toBe('Filed');
    expect(data.prompts[0]?.folderId).toBeNull();
  });

  it('renames a folder and ignores a rename of one that is not there', async () => {
    const { lib } = library();
    const folder = await lib.addFolder('Old');
    await lib.renameFolder(folder.id, 'New');
    await lib.renameFolder('missing', 'Nope');
    expect((await lib.read()).folders).toEqual([{ id: folder.id, name: 'New', position: 0 }]);
  });

  it('updates only the fields it was given, and touches the time', async () => {
    const { lib } = library();
    const saved = await lib.savePrompt({
      modelId: 'veo',
      brief,
      title: 'Before',
      score: 40,
      mode: 'simple',
    });
    await lib.updatePrompt(saved.id, { title: 'After' });
    await lib.updatePrompt('missing', { title: 'Nowhere' });
    const after = (await lib.read()).prompts[0];
    expect(after?.title).toBe('After');
    expect(after?.brief).toEqual(brief);
    expect(after?.score).toBe(40);
    expect(after?.updatedAt).not.toBe(saved.updatedAt);
  });

  it('replaces a recipe saved twice under one name instead of making a second', async () => {
    const { lib } = library();
    await lib.saveRecipe({ name: 'Basement', modelId: 'midjourney', brief: {}, locked: ['lens'] });
    await lib.saveRecipe({ name: 'Basement', modelId: 'midjourney', brief: {}, locked: ['light'] });
    const recipes = (await lib.read()).recipes;
    expect(recipes).toHaveLength(1);
    expect(recipes[0]?.locked).toEqual(['light']);
  });

  it('removes a recipe', async () => {
    const { lib } = library();
    const recipe = await lib.saveRecipe({ name: 'Gone', modelId: 'veo', brief: {}, locked: [] });
    await lib.removeRecipe(recipe.id);
    expect((await lib.read()).recipes).toEqual([]);
  });

  it('renumbers pins to the order they were given, so the rail order is the stored order', async () => {
    const { lib } = library();
    await lib.setPins([
      { modelId: 'veo', position: 9 },
      { modelId: 'suno', position: 4 },
    ]);
    expect((await lib.read()).pins).toEqual([
      { modelId: 'veo', position: 0 },
      { modelId: 'suno', position: 1 },
    ]);
  });

  it('shares a prompt by putting it in the link, with no row and no request', async () => {
    const { lib, storage } = library();
    const saved = await lib.savePrompt({
      modelId: 'nanobanana',
      brief,
      title: 'The dragon',
      score: 70,
      mode: 'simple',
    });
    const shared = await lib.shareOf(saved);
    expect(shared.kind).toBe('inline');
    if (shared.kind !== 'inline') throw new Error('expected an inline share');
    expect(shared.payload.brief).toEqual(brief);
    expect(shared.payload.title).toBe('The dragon');
    // Nothing was recorded, because there is nothing to take down.
    expect(JSON.parse(storage.dump()[LIBRARY_KEY] ?? '{}')).toMatchObject({ shares: [] });
  });

  it('drops the share when the prompt behind it goes', async () => {
    const { lib } = library();
    const saved = await lib.savePrompt({
      modelId: 'veo',
      brief: {},
      title: 'Doomed',
      score: 0,
      mode: 'simple',
    });
    await lib.removePrompt(saved.id);
    expect((await lib.read()).prompts).toEqual([]);
  });
});

describe('reading what is already in storage', () => {
  it('survives a value that is not JSON', () => {
    expect(parseLibrary('{not json')).toEqual(EMPTY_LIBRARY);
    expect(parseLibrary(null)).toEqual(EMPTY_LIBRARY);
    expect(parseLibrary('[]')).toEqual(EMPTY_LIBRARY);
  });

  it('drops a row with no id rather than carrying a broken record around', () => {
    const parsed = parseLibrary(
      JSON.stringify({ folders: [{ name: 'No id' }, { id: 'f1', name: 'Fine' }] }),
    );
    expect(parsed.folders).toEqual([{ id: 'f1', name: 'Fine', position: 0 }]);
  });

  it('keeps only string and string-list values in a brief', () => {
    const parsed = parseLibrary(
      JSON.stringify({
        prompts: [
          { id: 'p1', brief: { subject: 'ok', bad: 3, list: ['a', 'b'], worse: { x: 1 } } },
        ],
      }),
    );
    expect(parsed.prompts[0]?.brief).toEqual({ subject: 'ok', list: ['a', 'b'] });
    expect(parsed.prompts[0]?.title).toBe('Untitled');
    expect(parsed.prompts[0]?.mode).toBe('simple');
  });

  it('adopts the recipes and pins phase 5 left behind, so nobody loses their work', async () => {
    const { lib } = library({
      'forge.recipes': JSON.stringify([
        {
          id: 'r1',
          name: 'Basement documentary',
          model: 'midjourney',
          brief: {},
          locked: ['lens'],
        },
      ]),
      'forge.pins': JSON.stringify(['veo', 'suno']),
    });
    const data = await lib.read();
    expect(data.recipes[0]?.name).toBe('Basement documentary');
    expect(data.recipes[0]?.modelId).toBe('midjourney');
    expect(data.pins).toEqual([
      { modelId: 'veo', position: 0 },
      { modelId: 'suno', position: 1 },
    ]);
  });

  it('adopts them once, and does not undo a later deletion', async () => {
    const { lib } = library({ 'forge.pins': JSON.stringify(['veo']) });
    await lib.read();
    await lib.setPins([]);
    expect((await lib.read()).pins).toEqual([]);
  });

  it('ignores legacy values that are the wrong shape', async () => {
    const { lib } = library({ 'forge.recipes': 'nonsense', 'forge.pins': '{"not":"a list"}' });
    const data = await lib.read();
    expect(data.recipes).toEqual([]);
    expect(data.pins).toEqual([]);
  });
});
