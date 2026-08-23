import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from '../src/components/Slider';
import { Switch } from '../src/components/Switch';
import { TextArea } from '../src/components/TextArea';
import { TextField } from '../src/components/TextField';
import { expectNoViolations, setup } from './helpers';

describe('TextField', () => {
  it('is named by its label and described by its hint', async () => {
    const { user } = setup(<TextField label="Subject" hint="The one thing the frame is about" />);
    const input = document.querySelector('input');
    expect(input).toHaveAccessibleName('Subject');
    expect(input).toHaveAccessibleDescription('The one thing the frame is about');
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard('a boxer');
    expect(input).toHaveValue('a boxer');
  });

  it('marks itself invalid and says how to fix it', async () => {
    const { container } = setup(
      <TextField label="Palette" error="Give a hex code, such as #0B3D2E, or a colour name." />,
    );
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/hex code/);
    await expectNoViolations(container);
  });
});

describe('TextArea', () => {
  it('counts what has been typed', async () => {
    const onChange = vi.fn();
    const { container } = setup(
      <TextArea label="Notes" value="four" maxLength={10} showCount onChange={onChange} />,
    );
    expect(container).toHaveTextContent('4 of 10 characters');
    await expectNoViolations(container);
  });

  it('flags going over the limit', () => {
    const { container } = setup(
      <TextArea label="Notes" value="123456" maxLength={4} showCount onChange={vi.fn()} />,
    );
    expect(document.querySelector('textarea')).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.fg-field__count--over')).not.toBeNull();
  });
});

describe('Switch', () => {
  it('toggles with the keyboard and reports its state', async () => {
    const onChange = vi.fn();
    const { user, rerender } = setup(
      <Switch label="Generate audio" checked={false} onChange={onChange} />,
    );
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('role', 'switch');
    expect(input).not.toBeChecked();
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Switch label="Generate audio" checked onChange={onChange} />);
    expect(document.querySelector('input')).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = setup(<Switch label="Generate audio" checked onChange={vi.fn()} />);
    await expectNoViolations(container);
  });
});

describe('Slider', () => {
  /**
   * The arrow keys belong to the native range input, which is the reason to use one. jsdom does
   * not implement that behaviour, so it is proved in a real browser by e2e/smoke/gallery.spec.ts
   * and what is checked here is the contract that gets it: a real range input, focusable, named,
   * and reporting the value it changes to.
   */
  it('is a real range input, focusable and named', async () => {
    const onChange = vi.fn();
    const { user } = setup(
      <Slider label="Stylize" min={0} max={100} step={10} value={50} onChange={onChange} />,
    );
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('type', 'range');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
    expect(input).toHaveAttribute('step', '10');
    expect(input).toHaveAccessibleName('Stylize');
    await user.tab();
    expect(document.activeElement).toBe(input);
  });

  it('reports the value it moved to', () => {
    const onChange = vi.fn();
    setup(<Slider label="Stylize" min={0} max={100} step={10} value={50} onChange={onChange} />);
    const input = document.querySelector('input');
    if (!input) throw new Error('The slider did not render an input.');
    fireEvent.change(input, { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('formats the readout when asked to', async () => {
    const { container } = setup(
      <Slider
        label="Stability"
        min={0}
        max={1}
        step={0.05}
        value={0.55}
        onChange={vi.fn()}
        format={(v) => `${String(Math.round(v * 100))} percent`}
      />,
    );
    expect(container).toHaveTextContent('55 percent');
    expect(document.querySelector('input')).toHaveAttribute('aria-valuetext', '55 percent');
    await expectNoViolations(container);
  });
});
