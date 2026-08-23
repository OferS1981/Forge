import { describe, expect, it, vi } from 'vitest';
import { Combobox } from '../src/components/Combobox';
import type { ListOption } from '../src/components/Listbox';
import { expectNoViolations, must, setup } from './helpers';

const FEW: ListOption[] = [
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '16:9', label: '16:9' },
];

const MANY: ListOption[] = Array.from({ length: 20 }, (_, i) => ({
  value: `opt-${String(i)}`,
  label: `Option ${String(i)}`,
  hint: i % 2 === 0 ? 'Even maker' : 'Odd maker',
  group: i < 10 ? 'First group' : 'Second group',
  colourToken: '--cat-image',
  recommended: i === 0,
}));

describe('Combobox', () => {
  it('is a button that says it opens a listbox, not a native select', async () => {
    const { container } = setup(
      <Combobox label="Aspect ratio" options={FEW} value="4:5" onChange={vi.fn()} />,
    );
    expect(container.querySelector('select')).toBeNull();
    const trigger = container.querySelector('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAccessibleName(/Aspect ratio/);
    await expectNoViolations(container);
  });

  it('opens on Enter, moves on the arrows and chooses on Enter', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <Combobox label="Aspect ratio" options={FEW} value="1:1" onChange={onChange} />,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('4:5');
    // Closing returns focus to the trigger, so the next tab goes forward, not back to the top.
    expect(document.activeElement).toBe(container.querySelector('button'));
  });

  it('opens on ArrowDown and closes on Escape without choosing', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <Combobox label="Aspect ratio" options={FEW} value="1:1" onChange={onChange} />,
    );
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(container.querySelector('button'));
  });

  it('goes to the ends with Home and End', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <Combobox label="Aspect ratio" options={FEW} value="1:1" onChange={onChange} />,
    );
    await user.tab();
    await user.keyboard('{Enter}{End}{Enter}');
    expect(onChange).toHaveBeenCalledWith('16:9');
  });

  it('filters when there are enough options to need it', async () => {
    const onChange = vi.fn();
    const { user, container } = setup(
      <Combobox label="Model" options={MANY} value="opt-0" onChange={onChange} />,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    const search = container.querySelector('input');
    expect(search).toHaveAttribute('role', 'combobox');
    expect(search).toHaveAttribute('aria-autocomplete', 'list');
    expect(document.activeElement).toBe(search);
    await user.keyboard('Option 12');
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('opt-12');
  });

  it('filters on the second row and the group as well as the label', async () => {
    const { user, container } = setup(
      <Combobox label="Model" options={MANY} value="opt-0" onChange={vi.fn()} />,
    );
    await user.tab();
    await user.keyboard('{Enter}second group');
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(10);
  });

  it('says so when nothing matches', async () => {
    const { user, container } = setup(
      <Combobox label="Model" options={MANY} value="opt-0" onChange={vi.fn()} />,
    );
    await user.tab();
    await user.keyboard('{Enter}zzzz');
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(container).toHaveTextContent('Nothing matches');
  });

  it('points at the active row with aria-activedescendant while the input keeps focus', async () => {
    const { user, container } = setup(
      <Combobox label="Model" options={MANY} value="opt-0" onChange={vi.fn()} />,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    const search = container.querySelector('input');
    const before = search?.getAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}');
    const after = search?.getAttribute('aria-activedescendant');
    expect(before).not.toBe(after);
    expect(after).toBeTruthy();
    expect(document.activeElement).toBe(search);
    const active = container.querySelector('[data-active="1"]');
    expect(active?.id).toBe(after);
  });

  it('groups the rows and marks the recommended one', async () => {
    const { user, container } = setup(
      <Combobox label="Model" options={MANY} value="opt-0" onChange={vi.fn()} />,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(container).toHaveTextContent('First group');
    expect(container).toHaveTextContent('Second group');
    expect(container).toHaveTextContent('Recommended');
    await expectNoViolations(container);
  });

  it('shows the value it holds, and a placeholder when it holds none', () => {
    const { container, rerender } = setup(
      <Combobox
        label="Model"
        options={FEW}
        value=""
        onChange={vi.fn()}
        placeholder="Choose a model"
      />,
    );
    expect(container).toHaveTextContent('Choose a model');
    rerender(<Combobox label="Model" options={FEW} value="16:9" onChange={vi.fn()} />);
    expect(container.querySelector('.fg-combo__value')).toHaveTextContent('16:9');
  });

  it('cannot be opened when it is disabled', async () => {
    const { user, container } = setup(
      <Combobox label="Model" options={FEW} value="1:1" onChange={vi.fn()} disabled />,
    );
    await user.click(must(container.querySelector('button'), 'button'));
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});
