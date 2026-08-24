'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { FIELDS, findModel, modelLabel, scoreLabel } from '@forge/catalog';
import { shareUrl, type SavedPrompt, type SavedRecipe } from '@forge/data';
import { affectedBy, affectedSentence, releasesFrom } from '@forge/changelog';
import { HISTORY } from '@forge/changelog/history';
import { Button, Combobox, Dialog, TextField, toast } from '@forge/ui';
import { Empty, Workspace } from '../../components/Workspace';
import { useLibrary } from '../../lib/library';
import { openInBuild } from '../../lib/store';

/**
 * Everything that has been kept: folders, saved prompts, pinned models and recipes.
 *
 * The page never asks whether anyone is signed in. It reads one library and writes to one library,
 * and the line at the top says where that library is. Signing in moves the work; it does not
 * unlock the screen.
 */

const UNFILED = 'unfiled';
const ALL = 'all';

function when(iso: string): string {
  if (iso.length === 0) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function modelName(id: string): string {
  const model = findModel(id);
  return model === undefined ? id : modelLabel(model);
}

export default function LibraryPage(): React.ReactNode {
  const { store, state, account, accountsAvailable } = useLibrary();
  const router = useRouter();
  const { folders, prompts, recipes, pins } = state.data;

  /*
   * The sentence section 22 asked for, and the reason a saved prompt keeps the brief rather than
   * the finished text: when a model changes, Forge knows which of your prompts were written for it
   * before that, and can forge them again. Read from files in the repository, so it costs nothing
   * and works signed out.
   */
  const stale = useMemo(() => {
    const found = new Map<string, string>();
    for (const release of releasesFrom(HISTORY)) {
      for (const entry of affectedBy(release, prompts)) {
        const sentence = affectedSentence(entry);
        for (const prompt of entry.prompts)
          if (!found.has(prompt.id)) found.set(prompt.id, sentence);
      }
    }
    return found;
  }, [prompts]);

  const [folderName, setFolderName] = useState('');
  const [filter, setFilter] = useState(ALL);
  const [renaming, setRenaming] = useState<SavedPrompt | null>(null);
  const [renameTo, setRenameTo] = useState('');
  const [deletingPrompt, setDeletingPrompt] = useState<SavedPrompt | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<SavedRecipe | null>(null);

  const shown = useMemo(() => {
    if (filter === ALL) return prompts;
    if (filter === UNFILED) return prompts.filter((p) => p.folderId === null);
    return prompts.filter((p) => p.folderId === filter);
  }, [filter, prompts]);

  const folderOptions = useMemo(
    () => [
      { value: ALL, label: `Everything (${String(prompts.length)})` },
      {
        value: UNFILED,
        label: `Unfiled (${String(prompts.filter((p) => p.folderId === null).length)})`,
      },
      ...folders.map((f) => ({
        value: f.id,
        label: `${f.name} (${String(prompts.filter((p) => p.folderId === f.id).length)})`,
      })),
    ],
    [folders, prompts],
  );

  const moveOptions = useMemo(
    () => [
      { value: UNFILED, label: 'No folder' },
      ...folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [folders],
  );

  const share = async (prompt: SavedPrompt): Promise<void> => {
    const shared = await store.run((library) => library.shareOf(prompt));
    if (shared === null) return;
    const url = shareUrl(window.location.origin, shared);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      toast(`Could not reach the clipboard. The link is ${url}`, 'warn', 0);
      return;
    }
    toast(
      shared.kind === 'inline'
        ? 'Link copied. It carries the prompt inside it, so it works without an account and cannot be taken back.'
        : 'Link copied. You can take it down again from this page.',
      'good',
    );
  };

  const sharedSlug = (prompt: SavedPrompt): string | null =>
    state.data.shares.find((s) => s.promptId === prompt.id)?.slug ?? null;

  return (
    <Workspace
      title="Library"
      lede="Everything you have kept. A saved prompt holds the brief, not the finished text, so it can be forged again when Forge learns something new about the model, or sent to a different model entirely."
      outputLabel="Saved prompts"
      output={
        <>
          <div className="lib-where" role="status">
            <p>
              {state.kind === 'account'
                ? `Kept in your account, as ${account?.email ?? 'you'}. It follows you to another browser.`
                : 'Kept in this browser. Nothing has been sent anywhere.'}
            </p>
            {state.kind === 'local' && accountsAvailable && (
              <a className="lib-where__link" href="/account">
                Sign in to sync it
              </a>
            )}
          </div>

          {state.error !== null && (
            <p className="lib-error" role="alert">
              {state.error}
            </p>
          )}

          {prompts.length === 0 ? (
            <Empty title="Nothing saved yet">
              Forge a prompt in the Build workspace and choose Keep this prompt. What is saved is
              the brief, so the same one can be forged again for a different model later.
            </Empty>
          ) : (
            <>
              <div className="lib-filter">
                <Combobox
                  label="Folder"
                  options={folderOptions}
                  value={filter}
                  onChange={setFilter}
                  searchHint="Filter folders"
                  placeholder="Everything"
                />
              </div>
              <ul className="lib-list">
                {shown.map((prompt) => {
                  const slug = sharedSlug(prompt);
                  return (
                    <li className="lib-item" key={prompt.id}>
                      <div className="lib-item__head">
                        <h2 className="lib-item__title">{prompt.title}</h2>
                        <span className="lib-item__model fg-mono">{modelName(prompt.modelId)}</span>
                      </div>
                      {stale.get(prompt.id) !== undefined && (
                        <p className="lib-item__stale">
                          <span className="lib-item__stale-tag">Model changed</span>{' '}
                          {stale.get(prompt.id)} <a href="/changes">See what changed</a>, then open
                          it in Build and strike again to forge it against the catalogue as it
                          stands.
                        </p>
                      )}
                      <p className="lib-item__meta">
                        Score {prompt.score}, {scoreLabel(prompt.score).name.toLowerCase()}
                        {when(prompt.updatedAt).length > 0
                          ? `, saved ${when(prompt.updatedAt)}`
                          : ''}
                        {prompt.mode === 'advanced' ? ', advanced mode' : ''}
                      </p>
                      <div className="lib-item__move">
                        <Combobox
                          label={`Folder for ${prompt.title}`}
                          hideLabel
                          options={moveOptions}
                          value={prompt.folderId ?? UNFILED}
                          onChange={(value) => {
                            void store.run((library) =>
                              library.updatePrompt(prompt.id, {
                                folderId: value === UNFILED ? null : value,
                              }),
                            );
                          }}
                          searchHint="Filter folders"
                          placeholder="No folder"
                        />
                      </div>
                      <div className="lib-item__actions">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            openInBuild(prompt.modelId, prompt.brief, prompt.mode);
                            router.push('/');
                          }}
                        >
                          Open in Build
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            void share(prompt);
                          }}
                        >
                          {slug === null ? 'Copy a share link' : 'Copy the share link'}
                        </Button>
                        {slug !== null && (
                          <Button
                            size="sm"
                            variant="quiet"
                            onClick={() => {
                              void store.run((library) => library.revokeShare(slug));
                              toast('That link no longer opens anything.');
                            }}
                          >
                            Take the link down
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => {
                            setRenaming(prompt);
                            setRenameTo(prompt.title);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            setDeletingPrompt(prompt);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {shown.length === 0 && <p className="lib-note">Nothing in that folder yet.</p>}
            </>
          )}
        </>
      }
    >
      <section className="lib-side" aria-label="Folders">
        <h2 className="lib-side__title">Folders</h2>
        <p className="lib-side__note">
          Deleting a folder keeps the prompts in it. They become unfiled.
        </p>
        {folders.length > 0 && (
          <ul className="lib-rows">
            {folders.map((folder) => (
              <li key={folder.id}>
                <span>{folder.name}</span>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    setDeletingFolder(folder.id);
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
        <TextField
          label="New folder"
          id="new-folder"
          value={folderName}
          placeholder="Campaign"
          onChange={(e) => {
            setFolderName(e.currentTarget.value);
          }}
        />
        <Button
          disabled={folderName.trim().length === 0 || state.busy}
          onClick={() => {
            const name = folderName.trim();
            void store.run((library) => library.addFolder(name));
            setFolderName('');
            toast(`Added ${name}.`, 'good');
          }}
        >
          Add the folder
        </Button>
      </section>

      <section className="lib-side" aria-label="Pinned models">
        <h2 className="lib-side__title">Pinned models</h2>
        {pins.length === 0 ? (
          <p className="lib-side__note">
            Nothing pinned. Pin a model from the Build workspace and it sits at the top of the rack.
          </p>
        ) : (
          <ul className="lib-rows">
            {pins.map((pin) => (
              <li key={pin.modelId}>
                <span>{modelName(pin.modelId)}</span>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    void store.run((library) =>
                      library.setPins(
                        pins
                          .filter((p) => p.modelId !== pin.modelId)
                          .map((p, position) => ({ modelId: p.modelId, position })),
                      ),
                    );
                  }}
                >
                  Unpin
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lib-side" aria-label="Recipes">
        <h2 className="lib-side__title">Recipes</h2>
        {recipes.length === 0 ? (
          <p className="lib-side__note">
            No recipes yet. The <a href="/recipes">Recipes workspace</a> saves a brief as a template
            with the fields that make the look locked.
          </p>
        ) : (
          <ul className="lib-rows">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <span>
                  {recipe.name}
                  <span className="lib-rows__what">
                    {recipe.locked.length === 0
                      ? ' nothing locked'
                      : ` ${recipe.locked.map((id) => FIELDS[id].label).join(', ')}`}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    setDeletingRecipe(recipe);
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={renaming !== null}
        onClose={() => {
          setRenaming(null);
        }}
        title="Rename this prompt"
        description="The name is only for finding it again. The brief is not touched."
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setRenaming(null);
              }}
            >
              Keep the name
            </Button>
            <Button
              variant="primary"
              disabled={renameTo.trim().length === 0}
              onClick={() => {
                if (renaming !== null) {
                  const id = renaming.id;
                  const title = renameTo.trim();
                  void store.run((library) => library.updatePrompt(id, { title }));
                  toast('Renamed.', 'good');
                }
                setRenaming(null);
              }}
            >
              Rename it
            </Button>
          </>
        }
      >
        <TextField
          label="Name"
          id="rename-prompt"
          value={renameTo}
          onChange={(e) => {
            setRenameTo(e.currentTarget.value);
          }}
        />
      </Dialog>

      <Dialog
        open={deletingPrompt !== null}
        onClose={() => {
          setDeletingPrompt(null);
        }}
        title="Delete this prompt"
        description={
          deletingPrompt === null
            ? ''
            : `${deletingPrompt.title} goes from the library, along with any link you shared of it.`
        }
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setDeletingPrompt(null);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingPrompt !== null) {
                  const id = deletingPrompt.id;
                  void store.run((library) => library.removePrompt(id));
                  toast('Deleted.');
                }
                setDeletingPrompt(null);
              }}
            >
              Delete it
            </Button>
          </>
        }
      />

      <Dialog
        open={deletingFolder !== null}
        onClose={() => {
          setDeletingFolder(null);
        }}
        title="Delete this folder"
        description="The prompts in it are kept and become unfiled."
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setDeletingFolder(null);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingFolder !== null) {
                  const id = deletingFolder;
                  void store.run((library) => library.removeFolder(id));
                  if (filter === id) setFilter(ALL);
                  toast('Deleted the folder. The prompts in it are unfiled.');
                }
                setDeletingFolder(null);
              }}
            >
              Delete it
            </Button>
          </>
        }
      />

      <Dialog
        open={deletingRecipe !== null}
        onClose={() => {
          setDeletingRecipe(null);
        }}
        title="Delete this recipe"
        description={deletingRecipe === null ? '' : `${deletingRecipe.name} goes from the library.`}
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setDeletingRecipe(null);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingRecipe !== null) {
                  const id = deletingRecipe.id;
                  void store.run((library) => library.removeRecipe(id));
                  toast('Deleted.');
                }
                setDeletingRecipe(null);
              }}
            >
              Delete it
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
