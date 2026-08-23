'use client';

import { useMemo, useState } from 'react';
import { modelLabel, type Brief, type ForgeResult, type Mode, type Model } from '@forge/catalog';
import { shareUrl, type SavedPrompt } from '@forge/data';
import { Button, Combobox, Dialog, TextField, toast } from '@forge/ui';
import { useLibrary } from '../lib/library';

/**
 * Keeping a prompt, from the place where a prompt worth keeping appears.
 *
 * What is saved is the brief. The finished text is not stored anywhere, because it can always be
 * made again and because a stored string is a photograph of a prompt that was once right.
 */

const NO_FOLDER = 'unfiled';

/** A name someone will recognise later, taken from the first thing they actually wrote. */
export function suggestTitle(brief: Brief, model: Model): string {
  const first = model.core[0];
  const value = first === undefined ? undefined : brief[first];
  const text = Array.isArray(value) ? value.join(', ') : (value ?? '');
  const trimmed = text.trim();
  if (trimmed.length === 0) return modelLabel(model);
  return trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57).trimEnd()}...`;
}

export function Keep({
  brief,
  model,
  mode,
  result,
}: {
  brief: Brief;
  model: Model;
  mode: Mode;
  result: ForgeResult;
}): React.ReactNode {
  const { store, state } = useLibrary();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState(NO_FOLDER);

  const folders = useMemo(
    () => [
      { value: NO_FOLDER, label: 'No folder' },
      ...state.data.folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [state.data.folders],
  );

  const save = async (name: string, folderId: string | null): Promise<SavedPrompt | null> =>
    store.run((library) =>
      library.savePrompt({
        modelId: model.id,
        brief,
        title: name,
        score: result.score,
        mode,
        folderId,
      }),
    );

  const shareIt = async (): Promise<void> => {
    const name = suggestTitle(brief, model);
    const saved = await save(name, null);
    if (saved === null) return;
    const shared = await store.run((library) => library.shareOf(saved));
    if (shared === null) return;
    const url = shareUrl(window.location.origin, shared);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      toast(`Saved as ${name}. Could not reach the clipboard, so the link is ${url}`, 'warn', 0);
      return;
    }
    toast(
      shared.kind === 'inline'
        ? `Saved as ${name} and the link is copied. It carries the prompt inside it, so it works without an account and cannot be taken back.`
        : `Saved as ${name} and the link is copied. You can take it down from the library.`,
      'good',
    );
  };

  return (
    <>
      <div className="keep">
        <Button
          size="sm"
          onClick={() => {
            setTitle(suggestTitle(brief, model));
            setFolder(NO_FOLDER);
            setOpen(true);
          }}
        >
          Keep this prompt
        </Button>
        <Button
          size="sm"
          variant="quiet"
          onClick={() => {
            void shareIt();
          }}
        >
          Share a link
        </Button>
        <p className="keep__note">
          What is kept is the brief, not this text, so it can be forged again for another model
          later.
        </p>
      </div>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Keep this prompt"
        description="Give it a name you will recognise, and a folder if you want one."
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setOpen(false);
              }}
            >
              Not now
            </Button>
            <Button
              variant="primary"
              disabled={title.trim().length === 0 || state.busy}
              onClick={() => {
                const name = title.trim();
                void save(name, folder === NO_FOLDER ? null : folder).then((saved) => {
                  if (saved !== null) toast(`Kept as ${name}. It is in your library.`, 'good');
                });
                setOpen(false);
              }}
            >
              Keep it
            </Button>
          </>
        }
      >
        <TextField
          label="Name"
          id="keep-title"
          value={title}
          onChange={(e) => {
            setTitle(e.currentTarget.value);
          }}
        />
        <Combobox
          label="Folder"
          options={folders}
          value={folder}
          onChange={setFolder}
          searchHint="Filter folders"
          placeholder="No folder"
        />
      </Dialog>
    </>
  );
}
