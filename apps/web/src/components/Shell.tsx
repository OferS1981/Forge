'use client';

import { usePathname, useRouter } from 'next/navigation';
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

export const WORKSPACES = [
  { id: 'build', label: 'Build', href: '/', what: 'Write a prompt for a model you have chosen.' },
  {
    id: 'doctor',
    label: 'Doctor',
    href: '/doctor',
    what: 'Paste a prompt that under-performed and see what is doing no work.',
  },
  {
    id: 'reverse',
    label: 'Reverse',
    href: '/reverse',
    what: 'Drop a reference and get the prompt that would produce it.',
  },
  {
    id: 'match',
    label: 'Match',
    href: '/match',
    what: 'Describe the job and find the models that are good at it.',
  },
];

/** The workspaces that are not tabs: reachable from the palette and from each other. */
export const TOOLS = [
  {
    id: 'cross-forge',
    label: 'Cross-forge',
    href: '/cross-forge',
    what: 'The same brief in two models, side by side, with what was lost.',
  },
  {
    id: 'batch',
    label: 'Batch',
    href: '/batch',
    what: 'One brief, several models, results in a row.',
  },
  {
    id: 'compare',
    label: 'Compare',
    href: '/compare',
    what: 'Two prompts, with what actually changed marked.',
  },
  {
    id: 'recipes',
    label: 'Recipes',
    href: '/recipes',
    what: 'Save a brief as a template and reuse it.',
  },
];

export function Shell({ children }: { children: ReactNode }): ReactNode {
  const [palette, setPalette] = useState(false);
  const path = usePathname();
  const router = useRouter();

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
    ...[...WORKSPACES, ...TOOLS].map((w) => ({
      value: `go:${w.href}`,
      label: w.label,
      hint: w.what,
      group: 'Workspaces',
      keywords: w.id,
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
    if (value.startsWith('go:')) {
      router.push(value.slice('go:'.length));
      return;
    }
    if (value.startsWith('term:'))
      router.push(`/glossary#${termAnchor(value.slice('term:'.length))}`);
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
                aria-current={w.href === path ? 'page' : undefined}
              >
                {w.label}
              </a>
            ))}
          </nav>
          <div className="topbar__spacer" />
          <a className="topbar__link" href="/learn">
            Learn
          </a>
          <a className="topbar__link" href="/glossary">
            Glossary
          </a>
          <ThemeToggle />
        </div>
        <nav className="tools" aria-label="Tools">
          {TOOLS.map((t) => (
            <a
              key={t.id}
              className="tools__link"
              href={t.href}
              aria-current={t.href === path ? 'page' : undefined}
            >
              {t.label}
            </a>
          ))}
        </nav>
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
