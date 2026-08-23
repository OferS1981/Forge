'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { findModel, forge, modelLabel, type ForgeResult, type Model } from '@forge/catalog';
import { readFragment, readShare, type SharePayload } from '@forge/data';
import { Button } from '@forge/ui';
import { Empty } from '../../components/Workspace';
import { Output } from '../../components/Output';
import { anonymousPort, configured } from '../../lib/account';
import { openInBuild } from '../../lib/store';

/**
 * A shared prompt, read-only.
 *
 * The link is `/p/#…`. A fragment is never sent to a host, which is what lets a signed-out visitor
 * share at all: the brief travels inside the link and no row is needed anywhere. An account link is
 * the short `#s=` form instead, resolved by the one function an anonymous reader may call.
 *
 * What arrives is the brief, so the prompt is forged here, on the reader's machine, against today's
 * catalogue. A share does not go stale.
 */

type State =
  | { kind: 'reading' }
  | { kind: 'none' }
  | { kind: 'gone' }
  | { kind: 'unknown-model'; modelId: string }
  | { kind: 'ready'; payload: SharePayload; model: Model; result: ForgeResult };

function build(payload: SharePayload): State {
  const model = findModel(payload.modelId);
  if (model === undefined) return { kind: 'unknown-model', modelId: payload.modelId };
  return { kind: 'ready', payload, model, result: forge(payload.brief, model, payload.mode) };
}

export default function SharedPage(): React.ReactNode {
  const [state, setState] = useState<State>({ kind: 'reading' });
  const router = useRouter();

  useEffect(() => {
    let live = true;

    const read = (): void => {
      const shared = readFragment(window.location.hash);
      if (shared === null) {
        setState({ kind: 'none' });
        return;
      }
      if (shared.kind === 'inline') {
        setState(build(shared.payload));
        return;
      }
      if (!configured()) {
        // A short link needs the project that minted it. Saying so beats a spinner that never ends.
        setState({ kind: 'gone' });
        return;
      }
      setState({ kind: 'reading' });
      void readShare(anonymousPort(), shared.slug).then(
        (payload) => {
          if (!live) return;
          setState(payload === null ? { kind: 'gone' } : build(payload));
        },
        () => {
          if (live) setState({ kind: 'gone' });
        },
      );
    };

    read();
    window.addEventListener('hashchange', read);
    return () => {
      live = false;
      window.removeEventListener('hashchange', read);
    };
  }, []);

  return (
    <main className="bench bench--one">
      <section className="bay bay--billet" aria-label="A shared prompt" tabIndex={-1}>
        {state.kind === 'reading' && <p className="lib-note">Reading the link.</p>}

        {state.kind === 'none' && (
          <Empty title="Nothing in this link">
            A Forge share link carries the prompt after the hash. This one has nothing after it, or
            it was cut short on the way. Ask for it again, and paste the whole thing.
          </Empty>
        )}

        {state.kind === 'gone' && (
          <Empty title="This link no longer opens anything">
            Short links can be taken down by the person who made them, and they can expire. The
            prompt itself is not lost, it is just not being shared here any more.
          </Empty>
        )}

        {state.kind === 'unknown-model' && (
          <Empty title="Forge does not know that model">
            This link was made for a model called {state.modelId}, which is not in the catalogue.
            That usually means the link is from a newer version of Forge than this one.
          </Empty>
        )}

        {state.kind === 'ready' && (
          <>
            <header className="shared__head">
              <p className="shared__what">Shared with you</p>
              <h1 className="shared__title">{state.payload.title}</h1>
              <p className="shared__model">
                Written for {modelLabel(state.model)}. Forged again just now, in this browser,
                against today&apos;s catalogue.
              </p>
              <div className="strike-row">
                <Button
                  variant="primary"
                  onClick={() => {
                    openInBuild(state.payload.modelId, state.payload.brief, state.payload.mode);
                    router.push('/');
                  }}
                >
                  Open this in Forge
                </Button>
              </div>
            </header>
            {/* No onOpenField: the page is read-only, so the auto-filled values are plain text. */}
            <Output result={state.result} model={state.model} mode={state.payload.mode} />
          </>
        )}
      </section>
    </main>
  );
}
