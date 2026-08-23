'use client';

import { useCallback, useState } from 'react';
import { AssistantBusy, AssistantFailed, type Critique } from '@forge/ai';
import type { Model } from '@forge/catalog';
import { Button } from '@forge/ui';
import { AiLabel, useAssistant } from '../lib/assistant';

/**
 * A second opinion in the Doctor, beside the diagnosis rather than instead of it.
 *
 * The diagnosis above it is written by the engine, deterministically, and is there whether or not
 * anybody has a key. This adds what a checklist cannot say: what this particular prompt is likely
 * to produce. With no assistant it is one quiet line, not an error and not an advert.
 */
export function SecondOpinion({
  prompt,
  model,
}: {
  prompt: string;
  model: Model;
}): React.ReactNode {
  const { assistant } = useAssistant();
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'asking' }
    | { kind: 'said'; critique: Critique }
    | { kind: 'problem'; message: string }
  >({ kind: 'idle' });

  const ask = useCallback(() => {
    setState({ kind: 'asking' });
    assistant.critique(prompt, model).then(
      (critique) => {
        setState({ kind: 'said', critique });
      },
      (error: unknown) => {
        const message =
          error instanceof AssistantBusy || error instanceof AssistantFailed
            ? error.message
            : 'The assistant could not be reached. Check the key and the connection.';
        setState({ kind: 'problem', message });
      },
    );
  }, [assistant, model, prompt]);

  if (!assistant.available) {
    return (
      <div className="ai-block">
        <h3 className="ai-block__title">A second opinion</h3>
        <p className="ai-block__note">
          The diagnosis above is written by Forge itself and does not need one. If you want a model
          to read the prompt as well, <a href="/assistant">add a key</a>. It stays in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-block">
      <h3 className="ai-block__title">A second opinion</h3>
      {state.kind === 'idle' && (
        <>
          <p className="ai-block__note">
            Sends the prompt above to the assistant and asks what it is likely to produce. The
            diagnosis does not change.
          </p>
          <Button size="sm" onClick={ask}>
            Ask the assistant
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
          <AiLabel what="A model read this prompt and wrote the lines below." />
          <ul className="notes">
            {state.critique.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {state.critique.suggestion.length > 0 && (
            <p className="ai-block__note">{state.critique.suggestion}</p>
          )}
        </>
      )}
    </div>
  );
}
