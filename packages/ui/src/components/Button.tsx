import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** React 19 takes ref as an ordinary prop, so no forwardRef wrapper is needed. */
export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  /** Shown instead of the label while the action runs, and announced politely. */
  busy?: boolean | undefined;
  busyLabel?: string | undefined;
  /** True when the button drives a pressed state, such as a filter that is on. */
  pressed?: boolean | undefined;
  icon?: ReactNode | undefined;
  children?: ReactNode | undefined;
}

/**
 * A real button element. Nothing here reimplements what the platform already does: it is styled,
 * given a size that clears the touch target below 820px, and told how to say it is busy.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  busy = false,
  busyLabel = 'Working',
  pressed,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      {...rest}
      type={type}
      className={cn('fg-btn', `fg-btn--${variant}`, `fg-btn--${size}`, className)}
      disabled={disabled === true || busy}
      aria-busy={busy || undefined}
      aria-pressed={pressed}
    >
      {icon !== undefined && (
        <span className="fg-btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="fg-btn__label">{busy ? busyLabel : children}</span>
    </button>
  );
}
