import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src/components/Button';
import { expectNoViolations, must, setup } from './helpers';

describe('Button', () => {
  it('is reachable and pressable by keyboard', async () => {
    const onClick = vi.fn();
    const { user } = setup(<Button onClick={onClick}>Save</Button>);
    await user.tab();
    expect(document.activeElement).toHaveTextContent('Save');
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('says it is busy, and refuses input while it is', async () => {
    const onClick = vi.fn();
    const { user } = setup(
      <Button busy busyLabel="Forging" onClick={onClick}>
        Strike
      </Button>,
    );
    const button = document.querySelector('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Forging');
    await user.click(must(button, 'the button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('reports a pressed state when it holds one', () => {
    setup(<Button pressed>Filter</Button>);
    expect(document.querySelector('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = setup(
      <>
        <Button variant="primary">Strike</Button>
        <Button variant="danger">Delete</Button>
        <Button disabled>Unavailable</Button>
      </>,
    );
    await expectNoViolations(container);
  });
});
