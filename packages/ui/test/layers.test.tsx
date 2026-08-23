import { useRef, useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CoachMark } from '../src/components/CoachMark';
import { CommandPalette, isPaletteShortcut } from '../src/components/CommandPalette';
import { Dialog } from '../src/components/Dialog';
import { InfoDot } from '../src/components/InfoDot';
import { Popover } from '../src/components/Popover';
import { Tooltip } from '../src/components/Tooltip';
import { expectNoViolations, must, setup } from './helpers';

const EXPLANATION = {
  label: 'Stylize',
  short: 'How much artistic licence the model takes.',
  what: 'A dial between your words and the model default look.',
  changes: 'At zero you get the prompt. High, you get the house style.',
  when: 'Lower it for documentary work, raise it for concept art.',
  range: '0 to 1000, default 100',
  example: { low: 'Literal', high: 'Stylised' },
};

function PopoverHarness(): ReactNode {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        anchor={anchor}
        label="A layer"
        focusOnOpen
      >
        <button type="button">Inside</button>
      </Popover>
    </>
  );
}

describe('Popover', () => {
  it('opens, takes focus, and Escape puts it back', async () => {
    const { user, container } = setup(<PopoverHarness />);
    await user.click(must(container.querySelector('button'), 'button'));
    expect(document.querySelector('[role="dialog"]')).toHaveAccessibleName('A layer');
    await user.keyboard('{Escape}');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toHaveTextContent('Open');
  });

  it('closes on a press outside without stealing focus', async () => {
    const { user, container } = setup(
      <>
        <PopoverHarness />
        <button type="button">Elsewhere</button>
      </>,
    );
    const [open] = [...container.querySelectorAll('button')].filter(
      (b) => b.textContent === 'Open',
    );
    await user.click(must(open, 'the Open button'));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const [elsewhere] = [...container.querySelectorAll('button')].filter(
      (b) => b.textContent === 'Elsewhere',
    );
    await user.click(must(elsewhere, 'the Elsewhere button'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('Tooltip', () => {
  it('shows on focus at once and describes the control', async () => {
    const { user, container } = setup(
      <Tooltip text="Copies the prompt to the clipboard.">
        <button type="button">Copy</button>
      </Tooltip>,
    );
    await user.tab();
    expect(document.querySelector('[role="tooltip"]')).toHaveTextContent('Copies the prompt');
    expect(container.querySelector('button')).toHaveAccessibleDescription(
      'Copies the prompt to the clipboard.',
    );
    await user.tab();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('waits before showing on hover, so a passing mouse does not flash it', () => {
    vi.useFakeTimers();
    try {
      const { container } = setup(
        <Tooltip text="A hint" delay={500}>
          <button type="button">Copy</button>
        </Tooltip>,
      );
      const button = container.querySelector('button');
      if (!button) throw new Error('No trigger rendered.');
      button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('never uses a title attribute', () => {
    const { container } = setup(
      <Tooltip text="A hint">
        <button type="button">Copy</button>
      </Tooltip>,
    );
    expect(container.querySelector('[title]')).toBeNull();
  });
});

describe('InfoDot', () => {
  it('is a real button of its own, so explaining is not selecting', async () => {
    const { user, container } = setup(<InfoDot term="stylize" explanation={EXPLANATION} />);
    const dot = container.querySelector('button');
    expect(dot).toHaveAccessibleName('What is stylize?');
    expect(dot).toHaveAttribute('aria-expanded', 'false');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(dot).toHaveAttribute('aria-expanded', 'true');
    expect(document.body).toHaveTextContent('At zero you get the prompt');
    expect(document.body).toHaveTextContent('0 to 1000, default 100');
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(dot);
  });

  it('has no axe violations while it is open', async () => {
    const { user, container } = setup(<InfoDot term="stylize" explanation={EXPLANATION} />);
    await user.click(must(container.querySelector('button'), 'button'));
    await expectNoViolations(document.body);
  });
});

describe('Dialog', () => {
  const props = {
    title: 'Delete this prompt',
    description: 'It goes from your library and from any share link. That cannot be undone.',
  };

  it('is modal, named, and traps the tab key', async () => {
    const onClose = vi.fn();
    const { user } = setup(
      <Dialog {...props} open onClose={onClose}>
        <button type="button">Inside one</button>
        <button type="button">Inside two</button>
      </Dialog>,
    );
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete this prompt');
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/);
    // Tab all the way round: focus never leaves the dialog.
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog?.contains(document.activeElement)).toBe(true);
    }
  });

  it('closes on Escape when it may be dismissed, and not when it may not', async () => {
    const onClose = vi.fn();
    const { user, rerender } = setup(<Dialog {...props} open onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(<Dialog {...props} open onClose={onClose} dismissible={false} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when it is closed', () => {
    setup(<Dialog {...props} open={false} onClose={vi.fn()} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('has no axe violations', async () => {
    setup(
      <Dialog
        {...props}
        open
        onClose={vi.fn()}
        footer={<button type="button">Delete it</button>}
      />,
    );
    await expectNoViolations(document.body);
  });
});

describe('CommandPalette', () => {
  const commands = [
    { value: 'build', label: 'Go to Build', group: 'Workspaces', keywords: 'anvil forge' },
    { value: 'doctor', label: 'Go to Doctor', group: 'Workspaces' },
    { value: 'theme', label: 'Switch theme', group: 'Settings' },
  ];

  it('knows its shortcut on either platform', () => {
    expect(isPaletteShortcut(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))).toBe(true);
    expect(isPaletteShortcut(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true }))).toBe(true);
    expect(isPaletteShortcut(new KeyboardEvent('keydown', { key: 'k' }))).toBe(false);
  });

  it('searches, moves and runs entirely from the keyboard', async () => {
    const onRun = vi.fn();
    const onClose = vi.fn();
    const { user } = setup(
      <CommandPalette open commands={commands} onRun={onRun} onClose={onClose} />,
    );
    const input = document.querySelector('input');
    expect(document.activeElement).toBe(input);
    await user.keyboard('anvil');
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledWith('build');
    expect(onClose).toHaveBeenCalled();
  });

  it('moves down the list and runs the one it lands on', async () => {
    const onRun = vi.fn();
    const { user } = setup(
      <CommandPalette open commands={commands} onRun={onRun} onClose={vi.fn()} />,
    );
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onRun).toHaveBeenCalledWith('doctor');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const { user } = setup(
      <CommandPalette open commands={commands} onRun={vi.fn()} onClose={onClose} />,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    setup(<CommandPalette open commands={commands} onRun={vi.fn()} onClose={vi.fn()} />);
    await expectNoViolations(document.body);
  });
});

function CoachHarness({ open }: { open: boolean }): ReactNode {
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={anchor} type="button">
        Rail
      </button>
      <CoachMark
        open={open}
        anchor={anchor}
        title="This is the model rail"
        body="Choose a model and the brief changes to the fields it reads."
        step={1}
        total={3}
        onNext={vi.fn()}
        onSkip={vi.fn()}
      />
    </>
  );
}

describe('CoachMark', () => {
  it('says where it is in the walkthrough and can always be left', async () => {
    setup(<CoachHarness open />);
    expect(document.body).toHaveTextContent('Step 1 of 3');
    expect(document.querySelector('[role="dialog"]')).toHaveAccessibleName(
      'This is the model rail',
    );
    expect(document.body).toHaveTextContent('Skip the walkthrough');
    await expectNoViolations(document.body);
  });

  it('shows nothing when it is closed', () => {
    setup(<CoachHarness open={false} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
