import { useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface Tab {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface TabsProps {
  label: string;
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string | undefined;
}

/**
 * The four workspaces sit on this. One tab stop for the strip, arrows move and select, and the
 * panel is labelled by its tab so a screen-reader user knows what they landed in.
 */
export function Tabs({ label, tabs, value, onChange, children, className }: TabsProps): ReactNode {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.value === value),
  );

  const move = (next: number): void => {
    const total = tabs.length;
    for (let step = 0; step < total; step++) {
      const i = (((next + step) % total) + total) % total;
      const tab = tabs[i];
      if (tab && tab.disabled !== true) {
        onChange(tab.value);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <div className={cn('fg-tabs', className)}>
      <div className="fg-tabs__strip" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.value}`}
            className="fg-tabs__tab"
            aria-selected={t.value === value}
            aria-controls={`${id}-panel-${t.value}`}
            tabIndex={i === index ? 0 : -1}
            disabled={t.disabled}
            onClick={() => {
              onChange(t.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                move(i + 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                move(i - 1);
              } else if (e.key === 'Home') {
                e.preventDefault();
                move(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                move(tabs.length - 1);
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        className="fg-tabs__panel"
        role="tabpanel"
        id={`${id}-panel-${value}`}
        aria-labelledby={`${id}-tab-${value}`}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}
