import { useId, useRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useDismiss } from '../lib/useDismiss';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Button } from './Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** One line under the title saying what happens if they go ahead. */
  description?: string | undefined;
  children?: ReactNode | undefined;
  /** The buttons along the bottom. Omit for a plain message. */
  footer?: ReactNode | undefined;
  /** Escape and the backdrop stop working when a choice is genuinely required. */
  dismissible?: boolean | undefined;
  className?: string | undefined;
}

/**
 * This is what replaces window.alert, window.confirm and window.prompt. A modal layer with a
 * title, a focus trap, Escape to close and focus returned to whatever opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className,
}: DialogProps): ReactNode {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);
  useDismiss(open, ref, () => {
    if (dismissible) onClose();
  });

  if (!open) return null;

  return (
    <div className="fg-modal">
      <div
        className="fg-modal__scrim"
        aria-hidden="true"
        onMouseDown={() => {
          if (dismissible) onClose();
        }}
      />
      <div
        ref={ref}
        className={cn('fg-dialog', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description !== undefined ? `${id}-desc` : undefined}
      >
        <div className="fg-dialog__head">
          <h2 className="fg-dialog__title" id={`${id}-title`}>
            {title}
          </h2>
          {dismissible && (
            <Button variant="quiet" size="sm" aria-label="Close this dialog" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        {description !== undefined && (
          <p className="fg-dialog__desc" id={`${id}-desc`}>
            {description}
          </p>
        )}
        {children !== undefined && <div className="fg-dialog__body">{children}</div>}
        {footer !== undefined && <div className="fg-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
