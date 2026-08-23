'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BROWSER_ENV,
  createLocalLibrary,
  isEmptyPlan,
  planImport,
  runImport,
  type ImportPlan,
} from '@forge/data';
import { Button, TextField, toast } from '@forge/ui';
import { Workspace } from '../../components/Workspace';
import { useLibrary } from '../../lib/library';
import { sendSignInLink, signInWithGoogle, signOut } from '../../lib/account';

/**
 * Where the work is kept, and how to move it.
 *
 * This page is deliberately dull. An account is not a tier and it is not a gate: it is a second
 * place to keep the same library, so that it follows you to another browser. There is nothing to
 * buy here and nothing is withheld from anyone who does not sign in.
 */

function browserStorage(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
} {
  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Nothing to do.
      }
    },
  };
}

function count(plan: ImportPlan): string {
  const parts: string[] = [];
  const say = (n: number, one: string, many: string): void => {
    if (n > 0) parts.push(`${String(n)} ${n === 1 ? one : many}`);
  };
  say(plan.prompts.length, 'prompt', 'prompts');
  say(plan.folders.length, 'folder', 'folders');
  say(plan.recipes.length, 'recipe', 'recipes');
  say(plan.pins.length, 'pinned model', 'pinned models');
  if (parts.length === 0) return 'nothing';
  if (parts.length === 1) return parts[0] ?? 'nothing';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] ?? ''}`;
}

export default function AccountPage(): React.ReactNode {
  const { store, state, account, accountsAvailable } = useLibrary();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);

  const signedIn = account !== null;

  /*
   * The offer to bring the browser's work up is made from the browser's library directly rather
   * than from what is on screen, because once someone is signed in the screen is showing the
   * account. Both have to be read to know what is worth offering.
   */
  useEffect(() => {
    // Nothing to work out yet. The offer is only ever rendered inside the signed-in branch, so a
    // plan left over from a previous session is never on screen and does not need clearing here.
    if (!signedIn || state.status !== 'ready') return;
    let live = true;
    void createLocalLibrary(browserStorage(), BROWSER_ENV)
      .read()
      .then((local) => {
        if (live) setPlan(planImport(local, state.data));
      });
    return () => {
      live = false;
    };
  }, [signedIn, state.status, state.data]);

  const send = useCallback(async (): Promise<void> => {
    setWorking(true);
    setProblem(null);
    try {
      await sendSignInLink(email.trim(), `${window.location.origin}/account`);
      setSent(true);
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : 'The link could not be sent. Check the address and try again.',
      );
    } finally {
      setWorking(false);
    }
  }, [email]);

  const google = useCallback(async (): Promise<void> => {
    setProblem(null);
    try {
      await signInWithGoogle(`${window.location.origin}/account`);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Google sign-in did not start.');
    }
  }, []);

  const bringItUp = useCallback(async (): Promise<void> => {
    if (plan === null) return;
    setWorking(true);
    const result = await store.run((library) => runImport(library, plan, state.data));
    setWorking(false);
    if (result === null) return;
    toast(`Brought up ${count(plan)}. It is in your account now.`, 'good');
    setPlan(null);
  }, [plan, state.data, store]);

  return (
    <Workspace
      title="Account"
      lede="An account is somewhere to keep the library other than this browser. Everything in Forge works without one."
      outputLabel="What an account changes"
      output={
        <div className="acct-side">
          <h2>What changes, and what does not</h2>
          <ul className="notes">
            <li>
              Every workspace, every model and every lesson works signed out. Nothing here is held
              back.
            </li>
            <li>
              Saved prompts, folders, recipes and pinned models move from this browser to your
              account, so they are there on your other machine.
            </li>
            <li>
              Share links change shape. Signed out, a link carries the prompt inside it: it works
              anywhere and cannot be taken back. Signed in, Forge mints a short link you can take
              down later.
            </li>
            <li>
              A saved prompt keeps the brief, not the finished text, so nothing you keep goes stale
              when a model changes.
            </li>
          </ul>
          <h2>What Forge stores</h2>
          <p className="acct-side__note">
            Your address, the briefs you save, their titles, their folders and their models. No
            usage tracking of any kind, here or anywhere else in Forge.
          </p>
        </div>
      }
    >
      {!accountsAvailable ? (
        <section className="acct" aria-label="Sign in">
          <h2 className="acct__title">This build has no account service</h2>
          <p className="acct__note">
            No project is configured, so there is nowhere to sign in to. Everything you make is kept
            in this browser, and that is the whole product: the <a href="/library">library</a>,
            folders, recipes, pinned models and share links all work exactly as they do with an
            account.
          </p>
          <p className="acct__note">
            To turn accounts on, set <code className="fg-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="fg-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and run the migration in{' '}
            <code className="fg-mono">packages/data/sql</code>.
          </p>
        </section>
      ) : signedIn ? (
        <section className="acct" aria-label="Signed in">
          <h2 className="acct__title">Signed in as {account.email}</h2>
          <p className="acct__note">
            The library is in your account. It is the same library, in a different place.
          </p>

          {plan !== null && !isEmptyPlan(plan) && (
            <div className="acct__import">
              <h3>There is work in this browser that is not in your account</h3>
              <p className="acct__note">
                {count(plan)}, made before you signed in. Bringing it up copies it into the account
                and leaves this browser untouched.
                {plan.alreadyThere.prompts > 0 &&
                  ` ${String(plan.alreadyThere.prompts)} of the prompts here are already in the account and will be left alone.`}
              </p>
              <Button
                variant="primary"
                disabled={working || state.busy}
                onClick={() => {
                  void bringItUp();
                }}
              >
                {working ? 'Bringing it up' : 'Bring it up into the account'}
              </Button>
            </div>
          )}

          <div className="strike-row">
            <Button
              onClick={() => {
                void signOut().then(
                  () => {
                    toast('Signed out. The library in this browser is still here.');
                  },
                  () => {
                    setProblem('Sign out did not complete. Try again.');
                  },
                );
              }}
            >
              Sign out
            </Button>
          </div>
        </section>
      ) : (
        <section className="acct" aria-label="Sign in">
          <h2 className="acct__title">Sign in</h2>
          <p className="acct__note">
            Forge sends a link to your address. There is no password to make and none to lose.
          </p>

          {sent ? (
            <p className="acct__sent" role="status">
              A link is on its way to {email.trim()}. Open it in this browser and you will be signed
              in. The link works once.
            </p>
          ) : (
            <>
              <TextField
                label="Email address"
                id="account-email"
                type="email"
                value={email}
                placeholder="you@example.com"
                hint="Forge sends one link. It is not used for anything else."
                onChange={(e) => {
                  setEmail(e.currentTarget.value);
                }}
              />
              <div className="strike-row">
                <Button
                  variant="primary"
                  disabled={!email.includes('@') || working}
                  onClick={() => {
                    void send();
                  }}
                >
                  {working ? 'Sending' : 'Send me a link'}
                </Button>
                <Button
                  onClick={() => {
                    void google();
                  }}
                >
                  Continue with Google
                </Button>
              </div>
            </>
          )}

          {problem !== null && (
            <p className="acct__problem" role="alert">
              {problem}
            </p>
          )}
        </section>
      )}
    </Workspace>
  );
}
