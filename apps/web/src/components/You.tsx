'use client';

import { useState } from 'react';
import { Button, TextField, toast } from '@forge/ui';
import { hasProfile, profileMarkdown, useProfile } from '../lib/profile';

/**
 * The "You" card: a few facts, kept in this browser only. They reach a prompt only through the
 * "Use my profile" switch on the bench, where the line is visible in the output, and they can
 * leave as a user.md for any other tool. Deleting the fields deletes the data.
 */
export function You(): React.ReactNode {
  const [profile, setProfile] = useProfile();
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [key]: e.currentTarget.value });
  };

  return (
    <section className="acct" aria-label="You">
      <h2 className="acct__title">You</h2>
      <p className="acct__note">
        A few facts prompts can use: your name in a byline, your voice in a rewrite, your work as
        context. Kept in this browser and nowhere else, never uploaded, and only added to a prompt
        when you turn on <strong>Use my profile</strong> on the bench, where you can see the line it
        adds. Clearing a field deletes it.
      </p>
      <TextField
        label="Name"
        hint="what work should call you"
        value={profile.name}
        onChange={set('name')}
      />
      <TextField
        label="Birthday"
        hint="optional, only if age-appropriate tone matters to you"
        value={profile.birthday}
        onChange={set('birthday')}
      />
      <TextField
        label="What you do"
        hint="one sentence, e.g. I run a bakery called Crumb"
        value={profile.work}
        onChange={set('work')}
      />
      <TextField
        label="Your voice"
        hint="the words your writing should carry, e.g. warm, direct, no jargon"
        value={profile.voice}
        onChange={set('voice')}
      />
      <div className="strike-row">
        <Button
          disabled={!hasProfile(profile)}
          onClick={() => {
            void navigator.clipboard.writeText(profileMarkdown(profile)).then(() => {
              setCopied(true);
              toast('user.md copied. Paste it into any tool that writes for you.', 'good');
            });
          }}
        >
          {copied ? 'Copied' : 'Copy as user.md'}
        </Button>
      </div>
    </section>
  );
}
