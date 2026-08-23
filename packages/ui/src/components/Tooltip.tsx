import {
  cloneElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Popover } from './Popover';

interface Anchorable {
  ref?: Ref<HTMLElement> | undefined;
  'aria-describedby'?: string | undefined;
  onMouseEnter?: (() => void) | undefined;
  onMouseLeave?: (() => void) | undefined;
  onFocus?: (() => void) | undefined;
  onBlur?: (() => void) | undefined;
}

export interface TooltipProps {
  /** The one-line hint. Never the whole explanation: that is what the info dot opens. */
  text: string;
  /** The control the tip describes. It keeps its own behaviour, and gains aria-describedby. */
  children: ReactElement<Anchorable>;
  /** Hover delay in milliseconds, so a mouse crossing the control does not flash a tip. */
  delay?: number | undefined;
}

/**
 * Never a title attribute. A title tooltip cannot be styled, does not appear on keyboard focus,
 * and never appears on touch at all. This one shows on hover after a delay, immediately on focus,
 * and Escape dismisses it.
 */
export function Tooltip({ text, children, delay = 500 }: TooltipProps): ReactNode {
  const id = useId();
  const anchor = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const show = (immediate: boolean): void => {
    clearTimeout(timer.current);
    if (immediate) {
      setOpen(true);
      return;
    }
    timer.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  };
  const hide = (): void => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  /*
   * The ref is handed to the child so the tip can be positioned against it, and read only inside
   * an effect. Nothing here reads anchor.current during render, which is what the rule guards.
   */
  // eslint-disable-next-line react-hooks/refs
  const trigger = cloneElement(children, {
    ref: anchor,
    'aria-describedby': open ? id : undefined,
    onMouseEnter: () => {
      children.props.onMouseEnter?.();
      show(false);
    },
    onMouseLeave: () => {
      children.props.onMouseLeave?.();
      hide();
    },
    onFocus: () => {
      children.props.onFocus?.();
      show(true);
    },
    onBlur: () => {
      children.props.onBlur?.();
      hide();
    },
  });

  return (
    <>
      {trigger}
      <Popover
        open={open}
        onClose={hide}
        anchor={anchor}
        id={id}
        role="tooltip"
        side="top"
        align="center"
        className="fg-tooltip"
      >
        {text}
      </Popover>
    </>
  );
}
