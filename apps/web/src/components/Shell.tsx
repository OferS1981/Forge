'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MODELS, TERM_LIST } from '@forge/catalog';
import {
  CommandPalette,
  ThemeToggle,
  ToastRegion,
  isPaletteShortcut,
  type Command,
} from '@forge/ui';

/**
 * The shell every route sits in: the skip link, the top bar, the command palette and the one live
 * region the whole page announces through.
 *
 * The workspace tabs name Build, Doctor, Reverse and Match. Only Build exists today, and the other
 * three say so rather than pretending to be there.
 */
/** Term ids contain dots, which are not valid in a fragment target. */
function termAnchor(id: string): string {
  return id.replace(/\./g, '-');
}

const WORKSPACES = [
  { id: 'build', label: 'Build', href: '/', ready: true },
  { id: 'doctor', label: 'Doctor', href: '/', ready: false },
  { id: 'reverse', label: 'Reverse', href: '/', ready: false },
  { id: 'match', label: 'Match', href: '/', ready: false },
];

export function Shell({ children }: { children: ReactNode }): ReactNode {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isPaletteShortcut(e)) {
        e.preventDefault();
        setPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Cmd-K searches models and glossary terms together, so typing "cfg" reaches the explanation as
  // directly as typing a model name reaches the model.
  const commands: Command[] = [
    ...MODELS.map((m) => ({
      value: `model:${m.id}`,
      label: m.sub === undefined ? m.name : `${m.name} ${m.sub}`,
      hint: m.blurb,
      group: 'Models',
      keywords: `${m.maker ?? ''} ${m.tags.join(' ')} ${m.grammar}`,
    })),
    ...TERM_LIST.map((t) => ({
      value: `term:${t.id}`,
      label: t.label,
      hint: t.short,
      group: 'Glossary',
      keywords: t.id,
    })),
  ];

  const run = (value: string): void => {
    if (value.startsWith('model:')) {
      window.dispatchEvent(
        new CustomEvent('forge:model', { detail: value.slice('model:'.length) }),
      );
      return;
    }
    if (value.startsWith('term:'))
      window.location.href = `/glossary#${termAnchor(value.slice('term:'.length))}`;
  };

  return (
    <>
      <a className="fg-skip" href="#brief">
        Skip to the brief
      </a>
      <div className="app">
        <div className="topbar">
          <nav className="tabs" aria-label="Workspaces">
            {WORKSPACES.map((w) => (
              <a
                key={w.id}
                className="tab"
                href={w.href}
                aria-current={w.ready ? 'page' : undefined}
                aria-disabled={w.ready ? undefined : true}
                data-ready={w.ready ? '1' : '0'}
              >
                {w.label}
                {!w.ready && <span className="tab__soon">soon</span>}
              </a>
            ))}
          </nav>
          <div className="topbar__spacer" />
          <a className="topbar__link" href="/glossary">
            Glossary
          </a>
          <ThemeToggle />
        </div>
        {children}
      </div>
      <CommandPalette
        open={palette}
        onClose={() => {
          setPalette(false);
        }}
        commands={commands}
        onRun={run}
      />
      <ToastRegion />
    </>
  );
}
