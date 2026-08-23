import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Disclosure } from '../src/components/Disclosure';
import { DropZone } from '../src/components/DropZone';
import { Table } from '../src/components/Table';
import { ToastRegion, clearToasts, dismissToast, toast, toastStore } from '../src/components/Toast';
import { expectNoViolations, must, setup } from './helpers';

interface Row {
  name: string;
  value: string;
  why: string;
}

const ROWS: Row[] = [
  { name: 'aspect', value: '4:5', why: 'The shape the frame is delivered in' },
  { name: 'steps', value: '28', why: 'Lower on distilled variants' },
];

const COLUMNS = [
  { key: 'name', header: 'Setting', cell: (r: Row) => r.name, mono: true },
  { key: 'value', header: 'Value', cell: (r: Row) => r.value, mono: true },
  { key: 'why', header: 'Why', cell: (r: Row) => r.why },
];

describe('Table', () => {
  it('says what it is and scrolls inside its own container', async () => {
    const { container } = setup(
      <Table
        caption="Settings for this model"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(r) => r.name}
      />,
    );
    expect(container.querySelector('caption')).toHaveTextContent('Settings for this model');
    expect(container.querySelectorAll('th')).toHaveLength(3);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    const wrap = container.querySelector('.fg-table-wrap');
    // Keyboard users must be able to reach a scrollable region.
    expect(wrap).toHaveAttribute('tabindex', '0');
    expect(wrap).toHaveAccessibleName('Settings for this model');
    await expectNoViolations(container);
  });

  it('says so when there is nothing in it', () => {
    const { container } = setup(
      <Table
        caption="Settings"
        columns={COLUMNS}
        rows={[]}
        rowKey={(r: Row) => r.name}
        empty="No settings for this model yet."
      />,
    );
    expect(container).toHaveTextContent('No settings for this model yet.');
  });
});

describe('Disclosure', () => {
  it('opens and closes from the keyboard, and says which it is', async () => {
    const { user, container } = setup(
      <Disclosure summary="Three traps on this model">
        <p>Adjective spam costs tokens and steers nothing.</p>
      </Disclosure>,
    );
    const trigger = container.querySelector('button');
    const panel = container.querySelector('[role="region"]');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toBeVisible();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toBeVisible();
    expect(panel).toHaveAccessibleName('Three traps on this model');
    await expectNoViolations(container);
  });

  it('can be driven from outside', () => {
    const onOpenChange = vi.fn();
    const { container } = setup(
      <Disclosure summary="Traps" open onOpenChange={onOpenChange}>
        <p>Body</p>
      </Disclosure>,
    );
    expect(container.querySelector('button')).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('DropZone', () => {
  it('is a real file input, so the keyboard reaches it', async () => {
    const onFiles = vi.fn();
    const { user, container } = setup(
      <DropZone label="Drop an image, or choose a file" hint="PNG or JPEG" onFiles={onFiles} />,
    );
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAccessibleName('Drop an image, or choose a file');
    expect(input).toHaveAccessibleDescription('PNG or JPEG');
    await user.tab();
    expect(document.activeElement).toBe(input);
  });

  it('takes a chosen file and reports what it took', async () => {
    const onFiles = vi.fn();
    const { user, container, rerender } = setup(<DropZone label="Drop a file" onFiles={onFiles} />);
    const file = new File(['x'], 'billet.png', { type: 'image/png' });
    await user.upload(must(container.querySelector('input'), 'input'), file);
    expect(onFiles).toHaveBeenCalledWith([file]);
    rerender(<DropZone label="Drop a file" onFiles={onFiles} status="Took 1 file." />);
    expect(container).toHaveTextContent('Took 1 file.');
  });

  it('has no axe violations', async () => {
    const { container } = setup(
      <DropZone label="Drop a file" hint="PNG or JPEG" onFiles={vi.fn()} />,
    );
    await expectNoViolations(container);
  });
});

describe('Toast', () => {
  // Cleared before the region is mounted, so no update lands outside an act block.
  beforeEach(() => {
    clearToasts();
  });

  it('announces politely, and a critical message assertively', async () => {
    clearToasts();
    const { container } = setup(<ToastRegion />);
    const region = container.querySelector('[role="status"]');
    expect(region).toHaveAttribute('aria-live', 'polite');
    act(() => {
      toast('Struck. The prompt is on the clipboard.', 'good');
    });
    expect(container).toHaveTextContent('Struck. The prompt is on the clipboard.');
    act(() => {
      toast('That model is not answering.', 'crit');
    });
    expect(container.querySelector('[role="status"]')).toHaveAttribute('aria-live', 'assertive');
    await expectNoViolations(container);
  });

  it('can be dismissed by hand', async () => {
    const { user, container } = setup(<ToastRegion />);
    act(() => {
      toast('Saved to your library.');
    });
    await user.click(must(container.querySelector('.fg-toast__close'), '.fg-toast__close'));
    expect(container).not.toHaveTextContent('Saved to your library.');
  });

  it('goes away on its own after its time is up', () => {
    vi.useFakeTimers();
    try {
      setup(<ToastRegion />);
      act(() => {
        toast('Copied.', 'info', 1000);
      });
      expect(toastStore.get().items).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(toastStore.get().items).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays until dismissed when it is given no duration', () => {
    vi.useFakeTimers();
    try {
      setup(<ToastRegion />);
      let id = '';
      act(() => {
        id = toast('Check this before you send it.', 'warn', 0);
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(toastStore.get().items).toHaveLength(1);
      act(() => {
        dismissToast(id);
      });
      expect(toastStore.get().items).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
