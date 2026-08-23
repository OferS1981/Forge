import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ChipGroup } from '../src/components/ChipGroup';
import { Listbox } from '../src/components/Listbox';
import { Segmented } from '../src/components/Segmented';
import { Tabs } from '../src/components/Tabs';
import { expectNoViolations, must, setup } from './helpers';

const CHIPS = [
  { value: 'one', label: 'one' },
  { value: 'two', label: 'two' },
  { value: 'three', label: 'three' },
];

describe('ChipGroup', () => {
  it('is one tab stop, and the arrows move inside it', async () => {
    const { user } = setup(
      <>
        <ChipGroup label="Lighting" chips={CHIPS} value={[]} onChange={vi.fn()} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toHaveTextContent('one');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveTextContent('two');
    await user.keyboard('{End}');
    expect(document.activeElement).toHaveTextContent('three');
    await user.keyboard('{Home}');
    expect(document.activeElement).toHaveTextContent('one');
    // One more tab leaves the whole group, not just the chip.
    await user.tab();
    expect(document.activeElement).toHaveTextContent('After');
  });

  it('toggles a chip with the keyboard and reports what is chosen', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <ChipGroup label="Lighting" chips={CHIPS} value={[]} onChange={onChange} />,
    );
    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(['one']);
    expect(document.activeElement).toHaveAttribute('aria-pressed', 'false');
  });

  it('stops at the maximum instead of failing quietly', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <ChipGroup
        label="Lighting"
        chips={CHIPS}
        value={['one', 'two']}
        onChange={onChange}
        max={2}
      />,
    );
    expect(container).toHaveTextContent('2 of 2');
    expect(container).toHaveTextContent('That is the most this field takes');
    const third = container.querySelectorAll('button')[2];
    expect(third).toHaveAttribute('aria-disabled', 'true');
    await user.click(must(third, 'the third chip'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('takes one value when it is a single choice, and clears on a second press', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <ChipGroup label="Medium" chips={CHIPS} value="one" onChange={onChange} />,
    );
    const first = container.querySelector('button');
    expect(first).toHaveAttribute('aria-pressed', 'true');
    await user.click(must(first, 'the first chip'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('explains a chip on i, without selecting it', async () => {
    const onChange = vi.fn();
    const onExplain = vi.fn();
    const { user } = setup(
      <ChipGroup
        label="Lighting"
        chips={CHIPS}
        value={[]}
        onChange={onChange}
        onExplain={onExplain}
      />,
    );
    await user.tab();
    await user.keyboard('i');
    expect(onExplain).toHaveBeenCalledWith('one');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = setup(
      <ChipGroup
        label="Lighting"
        chips={CHIPS}
        value={['one']}
        onChange={vi.fn()}
        max={2}
        hint="Pick one or two."
      />,
    );
    await expectNoViolations(container);
  });
});

describe('Segmented', () => {
  it('is a radio group the arrows move and select in', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <Segmented
        label="Mode"
        value="simple"
        onChange={onChange}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'advanced', label: 'Advanced' },
        ]}
      />,
    );
    expect(container.querySelector('[role="radiogroup"]')).toHaveAccessibleName('Mode');
    await user.tab();
    expect(document.activeElement).toHaveTextContent('Simple');
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('advanced');
  });

  it('wraps around the ends', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <Segmented
        label="Mode"
        value="simple"
        onChange={onChange}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'advanced', label: 'Advanced' },
        ]}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('advanced');
  });

  it('has no axe violations', async () => {
    const { container } = setup(
      <Segmented
        label="Theme"
        value="system"
        onChange={vi.fn()}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />,
    );
    await expectNoViolations(container);
  });
});

describe('Tabs', () => {
  const tabs = [
    { value: 'prompt', label: 'Prompt' },
    { value: 'settings', label: 'Settings' },
    { value: 'traps', label: 'Traps', disabled: true },
  ];

  it('moves with the arrows and labels its panel', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <Tabs label="Output" tabs={tabs} value="prompt" onChange={onChange}>
        <p>The prompt</p>
      </Tabs>,
    );
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel).toHaveAccessibleName('Prompt');
    await user.tab();
    expect(document.activeElement).toHaveTextContent('Prompt');
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('skips a disabled tab rather than landing on it', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <Tabs label="Output" tabs={tabs} value="settings" onChange={onChange}>
        <p>Settings</p>
      </Tabs>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('prompt');
  });

  it('has no axe violations', async () => {
    const { container } = setup(
      <Tabs label="Output" tabs={tabs} value="prompt" onChange={vi.fn()}>
        <p>The prompt</p>
      </Tabs>,
    );
    await expectNoViolations(container);
  });
});

describe('a listbox whose groups repeat', () => {
  const options = [
    { value: 'a', label: 'A', group: 'One' },
    { value: 'b', label: 'B', group: 'Two' },
    { value: 'c', label: 'C', group: 'One' },
  ];

  it('draws every run, and drawing a shorter list afterwards removes what went', () => {
    /*
     * A group is a run of adjacent options, so the same name can start a second run. Keying the
     * runs by name gave React two children with one key, which left the whole previous list on the
     * page under the new one. This is that bug, as a test.
     */
    const { rerender } = setup(
      <Listbox options={options} value="a" onSelect={() => undefined} label="Things" />,
    );
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getAllByRole('group')).toHaveLength(3);

    rerender(
      <Listbox
        options={[{ value: 'c', label: 'C', group: 'One' }]}
        value="c"
        onSelect={() => undefined}
        label="Things"
      />,
    );
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });
});
