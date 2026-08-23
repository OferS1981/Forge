import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { cn } from '../lib/cn';

export interface ListOption {
  value: string;
  label: string;
  /** The second row: a maker, a version, a one-line strength. */
  hint?: string | undefined;
  /** The group this option sits under. Options are rendered in the order given. */
  group?: string | undefined;
  /** A CSS custom property name, never a hex. The token file owns every colour. */
  colourToken?: string | undefined;
  /** Marked as the sensible starting choice for a newcomer. */
  recommended?: boolean | undefined;
  disabled?: boolean | undefined;
}

export interface ListboxProps {
  options: ListOption[];
  value: string;
  onSelect: (value: string) => void;
  /** The option the keyboard is on. Owned by the caller so a filter input can drive it. */
  activeValue?: string | undefined;
  onActiveChange?: ((value: string) => void) | undefined;
  label?: string | undefined;
  labelledBy?: string | undefined;
  id?: string | undefined;
  /** Rendered when nothing matches the filter. */
  empty?: string | undefined;
  /** Shown against a pinned or recommended row. */
  renderAction?: ((option: ListOption) => ReactNode) | undefined;
  /**
   * The list itself takes focus and drives the keyboard. Used when there is no filter input above
   * it to hold focus instead. Either way the active row is named by aria-activedescendant.
   */
  focusable?: boolean | undefined;
  onKeyDown?: ((e: KeyboardEvent<HTMLElement>) => void) | undefined;
  listRef?: RefObject<HTMLDivElement | null> | undefined;
  className?: string | undefined;
}

export function optionId(listId: string, value: string): string {
  return `${listId}-opt-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

interface Group {
  name: string | undefined;
  options: ListOption[];
}

/** Keep the given order, but collect runs of the same group so each gets one wrapper. */
function group(options: ListOption[]): Group[] {
  const groups: Group[] = [];
  for (const o of options) {
    const last = groups[groups.length - 1];
    if (last && last.name === o.group) last.options.push(o);
    else groups.push({ name: o.group, options: [o] });
  }
  return groups;
}

/**
 * The list half of every picker in the product. It never owns focus: the trigger or the filter
 * input keeps it and points at the active row with aria-activedescendant, which is the documented
 * pattern for a combobox and the only way a filter input can stay typable while arrows move.
 */
export function Listbox({
  options,
  value,
  onSelect,
  activeValue,
  onActiveChange,
  label,
  labelledBy,
  id = 'fg-listbox',
  empty = 'Nothing matches',
  renderAction,
  focusable = false,
  onKeyDown,
  listRef,
  className,
}: ListboxProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const active = activeValue ?? value;

  useEffect(() => {
    if (active.length === 0) return;
    const el = ref.current?.querySelector<HTMLElement>(`#${CSS.escape(optionId(id, active))}`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, id]);

  const row = (o: ListOption): ReactNode => (
    <div
      key={o.value}
      id={optionId(id, o.value)}
      role="option"
      aria-selected={o.value === value}
      aria-disabled={o.disabled === true ? true : undefined}
      data-active={o.value === active ? '1' : undefined}
      className="fg-list__opt"
      onMouseEnter={() => {
        onActiveChange?.(o.value);
      }}
      onMouseDown={(e) => {
        // Keep focus where it is: the trigger or the filter input owns it.
        e.preventDefault();
      }}
      onClick={() => {
        if (o.disabled !== true) onSelect(o.value);
      }}
    >
      <span className="fg-list__tick" aria-hidden="true" />
      {o.colourToken !== undefined && (
        <span
          className="fg-list__dot"
          aria-hidden="true"
          style={{ background: `var(${o.colourToken})` }}
        />
      )}
      <span className="fg-list__text">
        <span className="fg-list__label">
          {o.label}
          {o.recommended === true && <span className="fg-list__rec">Recommended</span>}
        </span>
        {o.hint !== undefined && <span className="fg-list__hint">{o.hint}</span>}
      </span>
      {renderAction?.(o)}
    </div>
  );

  return (
    <div ref={ref} className={cn('fg-list fg-scroll', className)}>
      {options.length === 0 ? (
        /* An empty listbox holding a sentence is invalid ARIA, so the note sits outside it. */
        <p className="fg-list__empty">{empty}</p>
      ) : (
        <div
          ref={listRef}
          role="listbox"
          id={id}
          aria-label={labelledBy === undefined ? (label ?? 'Options') : undefined}
          aria-labelledby={labelledBy}
          tabIndex={focusable ? -1 : undefined}
          aria-activedescendant={focusable && active.length > 0 ? optionId(id, active) : undefined}
          onKeyDown={onKeyDown}
        >
          {group(options).map((g) =>
            g.name === undefined ? (
              g.options.map(row)
            ) : (
              <div key={g.name} role="group" aria-label={g.name}>
                <div className="fg-list__group" aria-hidden="true">
                  {g.name}
                </div>
                {g.options.map(row)}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
