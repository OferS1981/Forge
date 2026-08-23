import { useId, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DisclosureProps {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean | undefined;
  /** Controlled mode, when the page needs to open several at once. */
  open?: boolean | undefined;
  onOpenChange?: (open: boolean) => void;
  className?: string | undefined;
}

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
}: DisclosureProps): ReactNode {
  const id = useId();
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;

  return (
    <div className={cn('fg-disclosure', className)}>
      <button
        type="button"
        className="fg-disclosure__trigger"
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        onClick={() => {
          const next = !isOpen;
          setInternal(next);
          onOpenChange?.(next);
        }}
      >
        <span className="fg-disclosure__mark" aria-hidden="true" data-open={isOpen ? '1' : '0'} />
        {summary}
      </button>
      <div
        className="fg-disclosure__panel"
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
