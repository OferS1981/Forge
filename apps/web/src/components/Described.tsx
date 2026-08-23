'use client';

import { useCallback, useState } from 'react';
import { AssistantBusy, AssistantFailed, type ImageDescription } from '@forge/ai';
import { FIELDS, type Brief, type FieldId, type Model } from '@forge/catalog';
import { Button } from '@forge/ui';
import { AiLabel, useAssistant } from '../lib/assistant';

/**
 * Reverse measures what a browser can honestly measure and says plainly that it cannot see what
 * the picture is of. This is the one thing an assistant can genuinely add there.
 *
 * What comes back is offered, never applied. Anything naming a field or a value the catalogue does
 * not know has already been dropped by the parser, so what is on screen is only ever real fields.
 */
export function Described({
  file,
  model,
  onTake,
}: {
  file: File | null;
  model: Model;
  onTake: (brief: Brief) => void;
}): React.ReactNode {
  const { assistant } = useAssistant();
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'asking' }
    | { kind: 'said'; description: ImageDescription }
    | { kind: 'problem'; message: string }
  >({ kind: 'idle' });

  const ask = useCallback(() => {
    if (file === null) return;
    setState({ kind: 'asking' });
    assistant.describeImage(file, model).then(
      (description) => {
        setState({ kind: 'said', description });
      },
      (error: unknown) => {
        const message =
          error instanceof AssistantBusy || error instanceof AssistantFailed
            ? error.message
            : 'The assistant could not be reached. Check the key and the connection.';
        setState({ kind: 'problem', message });
      },
    );
  }, [assistant, file, model]);

  if (!assistant.available) {
    return (
      <div className="ai-block">
        <h3 className="ai-block__title">What the picture is of</h3>
        <p className="ai-block__note">
          Forge measures the picture and asks you what it shows, because a browser cannot see it. An
          assistant can describe it instead: <a href="/assistant">add a key</a> and it stays in this
          browser.
        </p>
      </div>
    );
  }

  const entries = state.kind === 'said' ? Object.entries(state.description.brief) : [];

  return (
    <div className="ai-block">
      <h3 className="ai-block__title">What the picture is of</h3>
      {state.kind === 'idle' && (
        <>
          <p className="ai-block__note">
            Sends the picture to the assistant and asks it to describe only what is visible. You
            decide what to keep.
          </p>
          <Button size="sm" disabled={file === null} onClick={ask}>
            {file === null ? 'Drop a picture first' : 'Ask the assistant to describe it'}
          </Button>
        </>
      )}
      {state.kind === 'asking' && (
        <p className="ai-block__note" role="status">
          Asking the assistant.
        </p>
      )}
      {state.kind === 'problem' && (
        <>
          <p className="ai-block__problem" role="alert">
            {state.message}
          </p>
          <Button size="sm" onClick={ask}>
            Try again
          </Button>
        </>
      )}
      {state.kind === 'said' && (
        <>
          <AiLabel what="A model looked at the picture and wrote this." />
          <p className="ai-block__note">{state.description.summary}</p>
          {entries.length === 0 ? (
            <p className="ai-block__note">
              Nothing it said matched a field this model has, so there is nothing to take.
            </p>
          ) : (
            <>
              <ul className="notes">
                {entries.map(([id, value]) => (
                  <li key={id}>
                    <strong>{FIELDS[id as FieldId].label}:</strong>{' '}
                    {Array.isArray(value) ? value.join(', ') : value}
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onTake(state.description.brief);
                }}
              >
                Take these into the brief
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
