/**
 * A markdown reader for the subset our own lesson files use: headings, paragraphs, lists, fenced
 * code, block quotes, emphasis, inline code and links.
 *
 * It returns a tree rather than an HTML string, so the renderer never reaches for
 * dangerouslySetInnerHTML and there is no injection surface at all. The lessons are files in this
 * repository, not anything a visitor can write, but a renderer that cannot inject is still the
 * right shape. If this ever has to read arbitrary markdown, replace it with a real parser.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; href: string };

export type Block =
  | { kind: 'heading'; level: 2 | 3; content: Inline[] }
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'list'; ordered: boolean; items: Inline[][] }
  | { kind: 'code'; text: string }
  | { kind: 'quote'; content: Inline[] };

const INLINE = /(\[[^\]]+\]\([^)\s]+\))|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/;

/** Split one line into runs of plain text and marked-up runs. */
export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  let rest = line;

  const push = (part: Inline): void => {
    if (part.kind === 'text' && part.text.length === 0) return;
    out.push(part);
  };

  while (rest.length > 0) {
    const match = INLINE.exec(rest);
    if (match === null) {
      push({ kind: 'text', text: rest });
      break;
    }
    push({ kind: 'text', text: rest.slice(0, match.index) });
    const token = match[0];
    if (token.startsWith('[')) {
      const split = token.indexOf('](');
      push({
        kind: 'link',
        text: token.slice(1, split),
        href: token.slice(split + 2, -1),
      });
    } else if (token.startsWith('`')) {
      push({ kind: 'code', text: token.slice(1, -1) });
    } else if (token.startsWith('**')) {
      push({ kind: 'strong', text: token.slice(2, -2) });
    } else {
      push({ kind: 'em', text: token.slice(1, -1) });
    }
    rest = rest.slice(match.index + token.length);
  }

  return out;
}

function isListItem(line: string): { ordered: boolean; text: string } | undefined {
  const bullet = /^[-*]\s+(.*)$/.exec(line);
  if (bullet?.[1] !== undefined) return { ordered: false, text: bullet[1] };
  const numbered = /^\d+\.\s+(.*)$/.exec(line);
  if (numbered?.[1] !== undefined) return { ordered: true, text: numbered[1] };
  return undefined;
}

/** Read a markdown document into blocks. Everything it does not recognise becomes a paragraph. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.trim().length === 0) {
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        body.push(lines[i] ?? '');
        i++;
      }
      i++;
      blocks.push({ kind: 'code', text: body.join('\n') });
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading?.[1] !== undefined && heading[2] !== undefined) {
      blocks.push({
        kind: 'heading',
        level: heading[1].length === 2 ? 2 : 3,
        content: parseInline(heading[2]),
      });
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const body: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('> ')) {
        body.push((lines[i] ?? '').slice(2));
        i++;
      }
      blocks.push({ kind: 'quote', content: parseInline(body.join(' ')) });
      continue;
    }

    const first = isListItem(line);
    if (first) {
      const items: string[] = [];
      const ordered = first.ordered;
      while (i < lines.length) {
        const current = lines[i] ?? '';
        const item = isListItem(current);
        if (item) {
          if (item.ordered !== ordered) break;
          items.push(item.text);
          i++;
          continue;
        }
        // A line that is neither blank nor a new item is the previous one, wrapped.
        const last = items[items.length - 1];
        if (current.trim().length === 0 || last === undefined) break;
        items[items.length - 1] = last + ' ' + current.trim();
        i++;
      }
      blocks.push({ kind: 'list', ordered, items: items.map(parseInline) });
      continue;
    }

    // A paragraph runs until a blank line or the start of something else.
    const body: string[] = [];
    while (i < lines.length) {
      const next = lines[i] ?? '';
      if (
        next.trim().length === 0 ||
        next.startsWith('```') ||
        next.startsWith('> ') ||
        /^#{2,3}\s/.test(next) ||
        isListItem(next)
      )
        break;
      body.push(next.trim());
      i++;
    }
    blocks.push({ kind: 'paragraph', content: parseInline(body.join(' ')) });
  }

  return blocks;
}

/** Everything before the first blank line after a leading `# ` title, and the rest. */
export function splitTitle(source: string): { title: string; body: string } {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const first = lines[0] ?? '';
  const heading = /^#\s+(.*)$/.exec(first);
  if (heading?.[1] === undefined) return { title: '', body: source };
  return { title: heading[1], body: lines.slice(1).join('\n') };
}
