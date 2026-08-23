import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDismiss } from '../lib/useDismiss';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Listbox, optionId, type ListOption } from './Listbox';

export interface Command extends ListOption {
  /** Extra words that should match, such as an abbreviation or an old name for the thing. */
  keywords?: string | undefined;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  onRun: (value: string) => void;
  title?: string | undefined;
  placeholder?: string | undefined;
  empty?: string | undefined;
}

/**
 * What someone typed almost always names the thing they want, so a match in the name comes before
 * a match in a description. Without this, typing a workspace's exact name can put a model whose
 * blurb happens to use the word above it, and Enter goes somewhere else entirely.
 *
 * Three bands, and the original order holds inside each, so the catalogue's own ordering still
 * decides between two equally good matches. Groups are then kept together, in the order of their
 * best match, because the list draws a heading per run and scattering a group would draw its
 * heading several times.
 */
export function rank(commands: Command[], query: string): Command[] {
  const q = query.toLowerCase().trim();
  if (q.length === 0) return commands;
  const banded: { command: Command; band: number; at: number }[] = [];
  for (const [at, command] of commands.entries()) {
    const label = command.label.toLowerCase();
    const rest =
      `${command.hint ?? ''} ${command.group ?? ''} ${command.keywords ?? ''}`.toLowerCase();
    const band = label.startsWith(q) ? 0 : label.includes(q) ? 1 : rest.includes(q) ? 2 : 3;
    if (band < 3) banded.push({ command, band, at });
  }
  banded.sort((a, b) => a.band - b.band || a.at - b.at);
  const groupOrder = new Map<string, number>();
  for (const b of banded) {
    const name = b.command.group ?? '';
    if (!groupOrder.has(name)) groupOrder.set(name, groupOrder.size);
  }
  // Sort is stable, so this reorders the groups without disturbing the ranking inside one.
  banded.sort(
    (a, b) =>
      (groupOrder.get(a.command.group ?? '') ?? 0) - (groupOrder.get(b.command.group ?? '') ?? 0),
  );
  return banded.map((b) => b.command);
}

/** True when the event is the palette shortcut, on either platform. */
export function isPaletteShortcut(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
}

type BodyProps = Omit<CommandPaletteProps, 'open'>;

/** Mounted only while the palette is open, so it always opens empty. */
function Body({
  onClose,
  commands,
  onRun,
  title,
  placeholder,
  empty,
}: Required<BodyProps>): ReactNode {
  const id = useId();
  const listId = `${id}-list`;
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [wanted, setWanted] = useState('');

  useFocusTrap(true, ref);
  useDismiss(true, ref, onClose);

  const filtered = useMemo(() => rank(commands, query), [commands, query]);

  // Derived: filtering moves the list, so the active row follows without an effect to correct it.
  const active = filtered.some((c) => c.value === wanted) ? wanted : (filtered[0]?.value ?? '');

  useEffect(() => {
    input.current?.focus();
  }, []);

  const move = (step: number | 'home' | 'end'): void => {
    if (filtered.length === 0) return;
    const i = filtered.findIndex((c) => c.value === active);
    const next =
      step === 'home'
        ? 0
        : step === 'end'
          ? filtered.length - 1
          : Math.max(0, Math.min(filtered.length - 1, (i < 0 ? 0 : i) + step));
    setWanted(filtered[next]?.value ?? '');
  };

  const run = (value: string): void => {
    onRun(value);
    onClose();
  };

  return (
    <div className="fg-modal fg-modal--top">
      <div className="fg-modal__scrim" aria-hidden="true" onMouseDown={onClose} />
      <div ref={ref} className="fg-palette" role="dialog" aria-modal="true" aria-label={title}>
        <input
          ref={input}
          type="text"
          className="fg-palette__input"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active.length > 0 ? optionId(listId, active) : undefined}
          aria-label={title}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              move(-1);
            } else if (e.key === 'Home') {
              e.preventDefault();
              move('home');
            } else if (e.key === 'End') {
              e.preventDefault();
              move('end');
            } else if (e.key === 'Enter' && active.length > 0) {
              e.preventDefault();
              run(active);
            }
          }}
        />
        <Listbox
          id={listId}
          options={filtered}
          value={active}
          activeValue={active}
          onActiveChange={setWanted}
          onSelect={run}
          label={title}
          empty={empty}
        />
      </div>
    </div>
  );
}

/**
 * One search over everything: workspaces, models, saved prompts and glossary terms. It is a modal
 * dialog containing a combobox, so focus is trapped, Escape closes, and the list is announced.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  onRun,
  title = 'Search Forge',
  placeholder = 'Type to search',
  empty = 'Nothing matches',
}: CommandPaletteProps): ReactNode {
  if (!open) return null;
  return (
    <Body
      onClose={onClose}
      commands={commands}
      onRun={onRun}
      title={title}
      placeholder={placeholder}
      empty={empty}
    />
  );
}
