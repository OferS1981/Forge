import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../lib/cn';
import { useDismiss } from '../lib/useDismiss';
import { usePosition } from '../lib/usePosition';
import { Listbox, optionId, type ListOption } from './Listbox';

export interface ComboboxProps {
  label: string;
  options: ListOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown on the trigger when nothing is chosen. */
  placeholder?: string | undefined;
  /** The filter input appears above this many options, and can be forced either way. */
  searchable?: boolean | undefined;
  searchThreshold?: number | undefined;
  searchHint?: string | undefined;
  hideLabel?: boolean | undefined;
  /** Compact serves aspect ratio, duration and every other short option list. */
  compact?: boolean | undefined;
  disabled?: boolean | undefined;
  adornment?: ReactNode | undefined;
  renderAction?: ((option: ListOption) => ReactNode) | undefined;
  className?: string | undefined;
}

function haystack(o: ListOption): string {
  return `${o.label} ${o.hint ?? ''} ${o.group ?? ''}`.toLowerCase();
}

interface PanelProps {
  listId: string;
  labelId: string;
  label: string;
  options: ListOption[];
  value: string;
  showSearch: boolean;
  searchHint: string;
  onSelect: (value: string) => void;
  onClose: (returnFocus: boolean) => void;
  renderAction?: ((option: ListOption) => ReactNode) | undefined;
  style: { top: number; left: number };
  side: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Mounted only while the popover is open, so the filter and the keyboard position start fresh
 * every time it opens. That is what a native picker does, and it means no effect has to reset
 * anything.
 */
function Panel({
  listId,
  labelId,
  label,
  options,
  value,
  showSearch,
  searchHint,
  onSelect,
  onClose,
  renderAction,
  style,
  side,
  panelRef,
}: PanelProps): ReactNode {
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [wanted, setWanted] = useState(value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q.length === 0 ? options : options.filter((o) => haystack(o).includes(q));
  }, [options, query]);

  // Derived, not stored: when the filter moves the list out from under the keyboard, the first
  // row becomes the active one without an effect having to notice and correct it.
  const active = filtered.some((o) => o.value === wanted) ? wanted : (filtered[0]?.value ?? '');

  useEffect(() => {
    // Whichever element is going to receive the keys takes focus when the layer opens.
    if (showSearch) input.current?.focus();
    else list.current?.focus();
  }, [showSearch]);

  const move = (step: number | 'home' | 'end'): void => {
    if (filtered.length === 0) return;
    const i = filtered.findIndex((o) => o.value === active);
    const next =
      step === 'home'
        ? 0
        : step === 'end'
          ? filtered.length - 1
          : Math.max(0, Math.min(filtered.length - 1, (i < 0 ? 0 : i) + step));
    setWanted(filtered[next]?.value ?? '');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>): void => {
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active.length > 0) onSelect(active);
    } else if (e.key === 'Tab') {
      onClose(false);
    }
  };

  return (
    <div ref={panelRef} className="fg-pop fg-combo__pop" style={style} data-side={side}>
      {showSearch && (
        <input
          ref={input}
          type="text"
          className="fg-combo__search"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active.length > 0 ? optionId(listId, active) : undefined}
          aria-label={`${label}. ${searchHint}`}
          placeholder={searchHint}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
          }}
          onKeyDown={onKeyDown}
        />
      )}
      <Listbox
        id={listId}
        options={filtered}
        value={value}
        activeValue={active}
        onActiveChange={setWanted}
        onSelect={onSelect}
        labelledBy={labelId}
        renderAction={renderAction}
        focusable={!showSearch}
        listRef={list}
        onKeyDown={showSearch ? undefined : onKeyDown}
      />
    </div>
  );
}

/**
 * The model picker, and in its compact variant every other option list in the product. A
 * command-style combobox: a trigger, a filter input, results grouped with a sticky header, arrows
 * to move, Home and End, Enter to choose, Escape to close.
 *
 * It is not a native select, and it is not a menu. It carries the documented combobox contract:
 * the trigger has aria-expanded and aria-controls, the input has role="combobox" with
 * aria-activedescendant, and the list has role="listbox" with role="option" rows.
 *
 * It knows nothing about models. It takes options.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Choose',
  searchable,
  searchThreshold = 12,
  searchHint = 'Filter',
  hideLabel = false,
  compact = false,
  disabled = false,
  adornment,
  renderAction,
  className,
}: ComboboxProps): ReactNode {
  const id = useId();
  const listId = `${id}-list`;
  const labelId = `${id}-label`;
  const trigger = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const showSearch = searchable ?? options.length > searchThreshold;
  const current = options.find((o) => o.value === value);
  const pos = usePosition(open, trigger, layer, 'bottom', 'start');

  const close = (returnFocus: boolean): void => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };
  useDismiss(open, layer, close, trigger);

  return (
    <div className={cn('fg-combo', compact && 'fg-combo--compact', className)}>
      <div className="fg-field__head">
        <span className={cn('fg-field__label', hideLabel && 'fg-visually-hidden')} id={labelId}>
          {label}
        </span>
        {adornment}
      </div>
      <button
        ref={trigger}
        type="button"
        id={`${id}-trigger`}
        className="fg-combo__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${id}-trigger`}
        onClick={() => {
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (open) return;
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="fg-combo__value" data-empty={current === undefined ? '1' : '0'}>
          {current?.label ?? placeholder}
        </span>
        <span className="fg-combo__chevron" aria-hidden="true" />
      </button>

      {open && (
        <Panel
          panelRef={layer}
          listId={listId}
          labelId={labelId}
          label={label}
          options={options}
          value={value}
          showSearch={showSearch}
          searchHint={searchHint}
          renderAction={renderAction}
          style={{ top: pos.top, left: pos.left }}
          side={pos.side}
          onClose={close}
          onSelect={(v) => {
            onChange(v);
            close(true);
          }}
        />
      )}
    </div>
  );
}
