import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Listbox, optionId } from '../src/components/Listbox';
import { ThemeToggle, applyTheme, readTheme } from '../src/components/Theme';
import { cn } from '../src/lib/cn';
import { createStore } from '../src/lib/store';
import { focusable } from '../src/lib/useFocusTrap';
import { expectNoViolations, must, setup } from './helpers';

describe('cn', () => {
  it('joins what is there and drops what is not', () => {
    expect(cn('a', false, undefined, 'b', null, '')).toBe('a b');
    expect(cn()).toBe('');
  });
});

describe('createStore', () => {
  it('tells its listeners when the value changes, and only then', () => {
    const store = createStore({ n: 1 });
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.set({ n: 2 });
    expect(store.get()).toEqual({ n: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
    const same = store.get();
    store.set(same);
    expect(listener).toHaveBeenCalledTimes(1);
    store.set((s) => ({ n: s.n + 1 }));
    expect(store.get()).toEqual({ n: 3 });
    stop();
    store.set({ n: 4 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('Listbox', () => {
  const options = [
    { value: 'a', label: 'Alpha', group: 'One', hint: 'First' },
    { value: 'b', label: 'Bravo', group: 'One' },
    { value: 'c', label: 'Charlie', group: 'Two', disabled: true },
  ];

  it('marks what is selected and what the keyboard is on', () => {
    const { container } = setup(
      <Listbox
        id="l"
        options={options}
        value="a"
        activeValue="b"
        onSelect={vi.fn()}
        label="Options"
      />,
    );
    const list = container.querySelector('[role="listbox"]');
    expect(list).toHaveAccessibleName('Options');
    expect(container.querySelector(`#${optionId('l', 'a')}`)).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(container.querySelector(`#${optionId('l', 'b')}`)).toHaveAttribute('data-active', '1');
  });

  it('refuses a disabled row', async () => {
    const onSelect = vi.fn();
    const { user, container } = setup(
      <Listbox id="l" options={options} value="a" onSelect={onSelect} />,
    );
    await user.click(must(container.querySelector(`#${optionId('l', 'c')}`), 'the disabled row'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('says so when there is nothing to show', async () => {
    const { container } = setup(
      <Listbox id="l" options={[]} value="" onSelect={vi.fn()} empty="Nothing matches" />,
    );
    expect(container).toHaveTextContent('Nothing matches');
    await expectNoViolations(container);
  });

  it('makes an id out of a value that is not id-shaped', () => {
    expect(optionId('l', '16:9')).toBe('l-opt-16_9');
    expect(optionId('l', 'a b')).toBe('l-opt-a_b');
  });
});

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('leaves the attribute off for the system theme, so the operating system decides', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('falls back to the system theme when nothing sensible is stored', () => {
    expect(readTheme()).toBe('system');
    localStorage.setItem('forge.theme', 'nonsense');
    expect(readTheme()).toBe('system');
    localStorage.setItem('forge.theme', 'light');
    expect(readTheme()).toBe('light');
  });

  it('is a two-choice radio group that remembers the choice', async () => {
    // Light and Dark only: a visitor who never chose follows the device, and the first click
    // makes it explicit. "System" as a visible third option read as a duplicate.
    const { user, container } = setup(<ThemeToggle />);
    expect(container.querySelector('[role="radiogroup"]')).toHaveAccessibleName('Theme');
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(2);
    await act(async () => {
      await user.click(must(radios[1], '[role="radio"]'));
    });
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('forge.theme')).toBe('dark');
  });
});

describe('focusable', () => {
  it('finds what a tab can land on, and skips a hidden subtree', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <button type="button">One</button>
      <a href="#x">Two</a>
      <input />
      <button type="button" disabled>Not this</button>
      <div hidden><button type="button">Nor this</button></div>
      <div aria-hidden="true"><button type="button">Nor this either</button></div>
      <div tabindex="-1">Not tabbable</div>
      <div tabindex="0">This one</div>
    `;
    document.body.appendChild(root);
    const names = focusable(root).map((el) => {
      const text = el.textContent.trim();
      return text.length > 0 ? text : el.tagName;
    });
    expect(names).toEqual(['One', 'Two', 'INPUT', 'This one']);
    root.remove();
  });
});
