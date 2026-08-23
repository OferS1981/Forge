import { describe, expect, it } from 'vitest';
import { createRemoteLibrary, readShare } from '../src/remote';
import { createLocalLibrary } from '../src/local';
import { createLibraryStore } from '../src/store';
import { isEmptyPlan, planImport, runImport } from '../src/merge';
import { EMPTY_LIBRARY, type Library } from '../src/types';
import { fakeEnv, fakePort, fakeStorage } from './fakes';

const brief = { subject: 'a dragon breathing fire' };

function account(): { lib: Library; port: ReturnType<typeof fakePort> } {
  const port = fakePort();
  return { lib: createRemoteLibrary(port, fakeEnv()), port };
}

describe('the library in an account', () => {
  it('writes the signed-in user onto every row, so the policy has something to check', async () => {
    const { lib, port } = account();
    await lib.addFolder('Campaign');
    await lib.savePrompt({ modelId: 'veo', brief, title: 'A', score: 1, mode: 'simple' });
    await lib.saveRecipe({ name: 'Look', modelId: 'veo', brief, locked: [] });
    await lib.setPins([{ modelId: 'veo', position: 0 }]);
    for (const table of ['folders', 'prompts', 'recipes', 'pins']) {
      for (const row of port.rows(table)) expect(row.user_id).toBe('user-1');
    }
  });

  it('sends the column names the migration actually declares', async () => {
    const { lib, port } = account();
    await lib.savePrompt({ modelId: 'veo', brief, title: 'A', score: 12, mode: 'advanced' });
    expect(port.rows('prompts')[0]).toMatchObject({
      model_id: 'veo',
      title: 'A',
      score: 12,
      mode: 'advanced',
      folder_id: null,
      brief,
    });
  });

  it('reads rows back into the same shape the browser library uses', async () => {
    const { lib } = account();
    const folder = await lib.addFolder('Campaign');
    await lib.savePrompt({
      modelId: 'veo',
      brief,
      title: 'A',
      score: 1,
      mode: 'simple',
      folderId: folder.id,
    });
    const data = await lib.read();
    expect(data.prompts[0]).toMatchObject({ modelId: 'veo', title: 'A', brief, mode: 'simple' });
    expect(data.folders[0]?.name).toBe('Campaign');
  });

  it('orders prompts newest first and folders by position', async () => {
    const { lib, port } = account();
    port.rows('prompts').push(
      {
        id: 'a',
        title: 'Older',
        updated_at: '2026-01-01T00:00:00.000Z',
        brief: {},
        model_id: 'veo',
        score: 0,
        mode: 'simple',
        created_at: '',
        folder_id: null,
      },
      {
        id: 'b',
        title: 'Newer',
        updated_at: '2026-06-01T00:00:00.000Z',
        brief: {},
        model_id: 'veo',
        score: 0,
        mode: 'simple',
        created_at: '',
        folder_id: null,
      },
    );
    port
      .rows('folders')
      .push({ id: 'f2', name: 'Second', position: 1 }, { id: 'f1', name: 'First', position: 0 });
    const data = await lib.read();
    expect(data.prompts.map((p) => p.title)).toEqual(['Newer', 'Older']);
    expect(data.folders.map((f) => f.name)).toEqual(['First', 'Second']);
  });

  it('sends only the fields an update was given', async () => {
    const { lib, port } = account();
    await lib.savePrompt({ modelId: 'veo', brief, title: 'A', score: 1, mode: 'simple' });
    await lib.updatePrompt('row-1', { title: 'B' });
    expect(port.calls).toContain('update prompts title');
    await lib.updatePrompt('row-1', { folderId: null, score: 90, brief: {}, mode: 'advanced' });
    expect(port.calls).toContain('update prompts folder_id,brief,score,mode');
  });

  it('replaces a recipe of the same name, matching the unique constraint on the table', async () => {
    const { lib, port } = account();
    await lib.saveRecipe({ name: 'Look', modelId: 'veo', brief, locked: ['lens'] });
    await lib.saveRecipe({ name: 'Look', modelId: 'veo', brief, locked: ['light'] });
    expect(port.rows('recipes')).toHaveLength(1);
    expect(port.rows('recipes')[0]?.locked_fields).toEqual(['light']);
  });

  it('mints a short revocable link, and gives back the same one next time', async () => {
    const { lib, port } = account();
    const prompt = await lib.savePrompt({
      modelId: 'veo',
      brief,
      title: 'A',
      score: 1,
      mode: 'simple',
    });
    const first = await lib.shareOf(prompt);
    const second = await lib.shareOf(prompt);
    expect(first.kind).toBe('slug');
    expect(second).toEqual(first);
    expect(port.rows('shares')).toHaveLength(1);
    if (first.kind !== 'slug') throw new Error('expected a slug share');
    expect(first.slug).toMatch(/^[a-z0-9]{22}$/);
    await lib.revokeShare(first.slug);
    expect(port.rows('shares')).toEqual([]);
  });

  it('resolves a slug for a reader who holds one, and nothing for one who does not', async () => {
    const { lib, port } = account();
    const prompt = await lib.savePrompt({
      modelId: 'veo',
      brief,
      title: 'A',
      score: 1,
      mode: 'simple',
    });
    const shared = await lib.shareOf(prompt);
    if (shared.kind !== 'slug') throw new Error('expected a slug share');
    expect(await readShare(port, shared.slug)).toEqual({
      v: 1,
      title: 'A',
      modelId: 'veo',
      brief,
      mode: 'simple',
    });
    expect(await readShare(port, 'zzzzzzzzzzzzzzzzzzzzzz')).toBeNull();
  });
});

describe('the snapshot the screens read', () => {
  it('starts loading, then holds what was stored', async () => {
    const store = createLibraryStore(createLocalLibrary(fakeStorage(), fakeEnv()));
    expect(store.get()).toMatchObject({ status: 'loading', kind: 'local', data: EMPTY_LIBRARY });
    await store.reload();
    expect(store.get().status).toBe('ready');
  });

  it('tells its subscribers, and stops when they leave', async () => {
    const store = createLibraryStore(createLocalLibrary(fakeStorage(), fakeEnv()));
    let count = 0;
    const stop = store.subscribe(() => {
      count += 1;
    });
    await store.reload();
    expect(count).toBeGreaterThan(0);
    const seen = count;
    stop();
    await store.reload();
    expect(count).toBe(seen);
  });

  it('re-reads after an action, so what is on screen is what was stored', async () => {
    const store = createLibraryStore(createLocalLibrary(fakeStorage(), fakeEnv()));
    await store.reload();
    await store.run((lib) => lib.addFolder('Campaign'));
    expect(store.get().data.folders.map((f) => f.name)).toEqual(['Campaign']);
    expect(store.get().busy).toBe(false);
  });

  it('puts a failure into the state in words, rather than throwing it at the screen', async () => {
    const port = fakePort();
    const store = createLibraryStore(createRemoteLibrary(port, fakeEnv()));
    port.fail('The library could not be reached. Check the connection and try again.');
    await store.reload();
    expect(store.get().status).toBe('error');
    expect(store.get().error).toMatch(/could not be reached/);
    const result = await store.run((lib) => lib.addFolder('Nope'));
    expect(result).toBeNull();
    port.fail(null);
    await store.reload();
    expect(store.get().status).toBe('ready');
    store.dismissError();
    expect(store.get().error).toBeNull();
  });

  it('swaps the library underneath the same screens when someone signs in', async () => {
    const store = createLibraryStore(createLocalLibrary(fakeStorage(), fakeEnv()));
    await store.reload();
    await store.run((lib) => lib.addFolder('Local only'));
    await store.swap(createRemoteLibrary(fakePort(), fakeEnv()));
    expect(store.get().kind).toBe('account');
    expect(store.get().data.folders).toEqual([]);
    expect(store.library().kind).toBe('account');
  });
});

describe('taking the browser work up into an account', () => {
  async function seededLocal(): Promise<Library> {
    const lib = createLocalLibrary(fakeStorage(), fakeEnv());
    const folder = await lib.addFolder('Campaign');
    await lib.savePrompt({
      modelId: 'veo',
      brief,
      title: 'The dragon',
      score: 70,
      mode: 'simple',
      folderId: folder.id,
    });
    await lib.savePrompt({
      modelId: 'suno',
      brief: {},
      title: 'Unfiled',
      score: 10,
      mode: 'simple',
    });
    await lib.saveRecipe({ name: 'Basement', modelId: 'midjourney', brief, locked: ['lens'] });
    await lib.setPins([{ modelId: 'veo', position: 0 }]);
    return lib;
  }

  it('says nothing to import when the browser is empty', () => {
    const plan = planImport(EMPTY_LIBRARY, EMPTY_LIBRARY);
    expect(isEmptyPlan(plan)).toBe(true);
  });

  it('takes everything up the first time, with prompts still in their folders', async () => {
    const local = await seededLocal();
    const { lib: cloud } = account();
    const plan = planImport(await local.read(), await cloud.read());
    expect(isEmptyPlan(plan)).toBe(false);
    const result = await runImport(cloud, plan, await cloud.read());
    expect(result).toEqual({ folders: 1, prompts: 2, recipes: 1, pins: 1 });

    const data = await cloud.read();
    const campaign = data.folders.find((f) => f.name === 'Campaign');
    expect(campaign).toBeDefined();
    expect(data.prompts.find((p) => p.title === 'The dragon')?.folderId).toBe(campaign?.id);
    expect(data.prompts.find((p) => p.title === 'Unfiled')?.folderId).toBeNull();
    expect(data.recipes.map((r) => r.name)).toEqual(['Basement']);
    expect(data.pins.map((p) => p.modelId)).toEqual(['veo']);
  });

  it('importing a second time changes nothing, so a second click is not a second copy', async () => {
    const local = await seededLocal();
    const { lib: cloud } = account();
    const first = planImport(await local.read(), await cloud.read());
    await runImport(cloud, first, await cloud.read());
    const before = await cloud.read();

    const second = planImport(await local.read(), before);
    expect(isEmptyPlan(second)).toBe(true);
    expect(second.alreadyThere).toEqual({ folders: 1, prompts: 2, recipes: 1, pins: 1 });
    await runImport(cloud, second, before);

    const after = await cloud.read();
    expect(after.prompts).toHaveLength(before.prompts.length);
    expect(after.folders).toHaveLength(before.folders.length);
  });

  it('files a prompt into the account folder of the same name when the folder was already there', async () => {
    const local = await seededLocal();
    const { lib: cloud } = account();
    const existing = await cloud.addFolder('Campaign');
    const plan = planImport(await local.read(), await cloud.read());
    expect(plan.folders).toEqual([]);
    await runImport(cloud, plan, await cloud.read());
    const data = await cloud.read();
    expect(data.prompts.find((p) => p.title === 'The dragon')?.folderId).toBe(existing.id);
  });

  it('keeps the pins the account already had, and adds the new ones after them', async () => {
    const local = await seededLocal();
    const { lib: cloud } = account();
    await cloud.setPins([{ modelId: 'midjourney', position: 0 }]);
    const plan = planImport(await local.read(), await cloud.read());
    await runImport(cloud, plan, await cloud.read());
    expect((await cloud.read()).pins.map((p) => p.modelId)).toEqual(['midjourney', 'veo']);
  });

  it('treats a prompt with the same name but a different brief as a different prompt', async () => {
    const local = createLocalLibrary(fakeStorage(), fakeEnv());
    await local.savePrompt({
      modelId: 'veo',
      brief: { subject: 'a' },
      title: 'Same name',
      score: 0,
      mode: 'simple',
    });
    const { lib: cloud } = account();
    await cloud.savePrompt({
      modelId: 'veo',
      brief: { subject: 'b' },
      title: 'Same name',
      score: 0,
      mode: 'simple',
    });
    const plan = planImport(await local.read(), await cloud.read());
    expect(plan.prompts).toHaveLength(1);
  });
});
