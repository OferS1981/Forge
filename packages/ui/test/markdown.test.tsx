import { describe, expect, it } from 'vitest';
import { Markdown } from '../src/components/Markdown';
import { parseInline, parseMarkdown, splitTitle } from '../src/lib/markdown';
import { expectNoViolations, setup } from './helpers';

describe('parseInline', () => {
  it('reads plain text as one run', () => {
    expect(parseInline('a plain line')).toEqual([{ kind: 'text', text: 'a plain line' }]);
  });

  it('reads bold, italic, code and links', () => {
    expect(parseInline('**bold**')).toEqual([{ kind: 'strong', text: 'bold' }]);
    expect(parseInline('*soft*')).toEqual([{ kind: 'em', text: 'soft' }]);
    expect(parseInline('_soft_')).toEqual([{ kind: 'em', text: 'soft' }]);
    expect(parseInline('`--ar 4:5`')).toEqual([{ kind: 'code', text: '--ar 4:5' }]);
    expect(parseInline('[the glossary](/glossary)')).toEqual([
      { kind: 'link', text: 'the glossary', href: '/glossary' },
    ]);
  });

  it('keeps the text around a marked-up run', () => {
    expect(parseInline('use **85mm** for faces')).toEqual([
      { kind: 'text', text: 'use ' },
      { kind: 'strong', text: '85mm' },
      { kind: 'text', text: ' for faces' },
    ]);
  });

  it('drops nothing and invents nothing', () => {
    const line = 'a `code` and **bold** and [link](/x) together';
    const rebuilt = parseInline(line)
      .map((p) => {
        if (p.kind === 'code') return `\`${p.text}\``;
        if (p.kind === 'strong') return `**${p.text}**`;
        if (p.kind === 'link') return `[${p.text}](${p.href})`;
        return p.text;
      })
      .join('');
    expect(rebuilt).toBe(line);
  });

  it('leaves an unclosed marker as plain text rather than eating the rest', () => {
    expect(parseInline('a lone * star')).toEqual([{ kind: 'text', text: 'a lone * star' }]);
  });
});

describe('parseMarkdown', () => {
  it('reads headings at two levels', () => {
    const blocks = parseMarkdown('## Two\n\n### Three');
    expect(blocks).toEqual([
      { kind: 'heading', level: 2, content: [{ kind: 'text', text: 'Two' }] },
      { kind: 'heading', level: 3, content: [{ kind: 'text', text: 'Three' }] },
    ]);
  });

  it('joins the lines of one paragraph and separates two', () => {
    const blocks = parseMarkdown('one line\nand its wrap\n\na second paragraph');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      kind: 'paragraph',
      content: [{ kind: 'text', text: 'one line and its wrap' }],
    });
  });

  it('reads both kinds of list, and does not merge them', () => {
    const blocks = parseMarkdown('- one\n- two\n\n1. first\n2. second');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: 'list', ordered: false });
    expect(blocks[1]).toMatchObject({ kind: 'list', ordered: true });
    expect(blocks[0]).toMatchObject({
      items: [[{ kind: 'text', text: 'one' }], [{ kind: 'text', text: 'two' }]],
    });
  });

  it('reads a fenced code block without touching what is inside it', () => {
    const blocks = parseMarkdown('```\n**not bold**\n  indented\n```');
    expect(blocks).toEqual([{ kind: 'code', text: '**not bold**\n  indented' }]);
  });

  it('reads a block quote across several lines', () => {
    expect(parseMarkdown('> first\n> second')).toEqual([
      { kind: 'quote', content: [{ kind: 'text', text: 'first second' }] },
    ]);
  });

  it('ends a paragraph when something else starts, without a blank line', () => {
    const blocks = parseMarkdown('a paragraph\n- a list item');
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'list']);
  });

  it('continues a list item that wrapped onto the next line', () => {
    const blocks = parseMarkdown(
      '- a long item that wrapped\n  onto the next line\n- a second item',
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: 'list',
      items: [
        [{ kind: 'text', text: 'a long item that wrapped onto the next line' }],
        [{ kind: 'text', text: 'a second item' }],
      ],
    });
  });

  it('ends a list at a blank line, not at a wrap', () => {
    const blocks = parseMarkdown('- one\n  wrapped\n\na paragraph after it');
    expect(blocks.map((b) => b.kind)).toEqual(['list', 'paragraph']);
  });

  it('reads an empty document as nothing', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('\n\n  \n')).toEqual([]);
  });
});

describe('splitTitle', () => {
  it('takes the first heading as the title', () => {
    expect(splitTitle('# What a lens changes\n\nBody text')).toEqual({
      title: 'What a lens changes',
      body: '\nBody text',
    });
  });

  it('leaves a document with no title alone', () => {
    expect(splitTitle('Body text').title).toBe('');
  });
});

describe('Markdown', () => {
  const SOURCE = [
    '## A heading',
    '',
    'A paragraph with **bold**, `code` and a [link](/glossary).',
    '',
    '- one',
    '- two',
    '',
    '> A quote.',
    '',
    '```',
    'a code block',
    '```',
  ].join('\n');

  it('renders every kind of block as a real element', () => {
    const { container } = setup(<Markdown source={SOURCE} />);
    expect(container.querySelector('h2')).toHaveTextContent('A heading');
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('code')).toHaveTextContent('code');
    expect(container.querySelector('a')).toHaveAttribute('href', '/glossary');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('blockquote')).toHaveTextContent('A quote.');
    expect(container.querySelector('pre')).toHaveTextContent('a code block');
  });

  it('renders markup as text rather than as elements, so nothing can be injected', () => {
    const { container } = setup(
      <Markdown source={'A line with <img src=x onerror=alert(1)> in it'} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>');
  });

  it('has no axe violations', async () => {
    const { container } = setup(<Markdown source={SOURCE} />);
    await expectNoViolations(container);
  });
});
