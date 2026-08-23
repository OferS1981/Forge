'use client';

import { useState } from 'react';
import { Button, Dialog, TextField, toast } from '@forge/ui';
import { Workspace } from '../../components/Workspace';
import { useAssistant } from '../../lib/assistant';

/**
 * The key panel section 12 asks for: where the key is kept, in one sentence, and one click to
 * delete it.
 *
 * The rest of the page is the honest description of what turning it on does and does not do. Forge
 * without an assistant is the whole product; this adds a second opinion in two places and nothing
 * else, and it is deliberately hard to mistake for the thing that writes the prompts.
 */
export default function AssistantPage(): React.ReactNode {
  const { assistant, named, save, forget } = useAssistant();
  const [value, setValue] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [refused, setRefused] = useState(false);

  return (
    <Workspace
      title="Assistant"
      lede="Forge writes prompts from the catalogue, with no model call. An assistant is optional, adds a second opinion in two places, and runs on a key you paste that never leaves this browser."
      outputLabel="What it changes"
      output={
        <div className="acct-side">
          <h2>What it adds</h2>
          <ul className="notes">
            <li>
              In Reverse, it describes a picture you dropped in and offers the fields it saw. You
              decide whether to take them.
            </li>
            <li>
              In the Doctor, it gives a second opinion beside the diagnosis, which is written by the
              engine either way.
            </li>
          </ul>
          <h2>What it does not do</h2>
          <ul className="notes">
            <li>
              It never writes a prompt. The engine writes prompts, from the catalogue, the same way
              every time.
            </li>
            <li>
              It cannot add a model, a field or a setting. Anything it says that the catalogue does
              not know is dropped before you see it.
            </li>
            <li>
              Nothing in Forge stops working without it. Every workspace, every model and every
              lesson is the same with it switched off.
            </li>
          </ul>
          <h2>Where the key goes</h2>
          <p className="acct-side__note">
            Into this browser and nowhere else. Forge has no server in the path: the request goes
            from here straight to the vendor, so there is nothing of ours that could log it. It is
            never put in a link. Forge also limits itself to a few requests a minute, so a mistake
            cannot run up a bill on your key.
          </p>
        </div>
      }
    >
      <section className="acct" aria-label="The key">
        {named === null ? (
          <>
            <h2 className="acct__title">No key stored</h2>
            <p className="acct__note">
              Paste a key from your own account with the vendor. It is kept in this browser, and you
              can delete it here at any time.
            </p>
            <TextField
              label="API key"
              id="assistant-key"
              type="password"
              value={value}
              placeholder="Paste the key"
              hint="Kept in this browser only. Forge never sends it anywhere except to the vendor."
              onChange={(e) => {
                setValue(e.currentTarget.value);
                setRefused(false);
              }}
            />
            {refused && (
              <p className="acct__problem" role="alert">
                That does not look like a key. A key is one long run of characters with no spaces in
                it. Check what was copied and paste it again.
              </p>
            )}
            <div className="strike-row">
              <Button
                variant="primary"
                disabled={value.trim().length === 0}
                onClick={() => {
                  if (save(value)) {
                    setValue('');
                    toast('The key is stored in this browser.', 'good');
                  } else {
                    setRefused(true);
                  }
                }}
              >
                Store the key here
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="acct__title">Using {named}</h2>
            <p className="acct__note">
              Stored in this browser. Forge shows only the last four characters, so a shared screen
              does not give it away.
            </p>
            <p className="acct__note" role="status">
              {assistant.available
                ? 'The assistant is on in Reverse and in the Doctor.'
                : 'The assistant is not running.'}
            </p>
            <div className="strike-row">
              <Button
                variant="danger"
                onClick={() => {
                  setConfirming(true);
                }}
              >
                Delete the key from this browser
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog
        open={confirming}
        onClose={() => {
          setConfirming(false);
        }}
        title="Delete the key"
        description="It goes from this browser now. Nothing else in Forge changes, and nothing you have made is touched."
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setConfirming(false);
              }}
            >
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                forget();
                setConfirming(false);
                toast('The key is deleted from this browser.');
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
