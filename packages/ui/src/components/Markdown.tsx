import type { ReactNode } from 'react';
import { parseInline, parseMarkdown, type Block, type Inline } from '../lib/markdown';

/** Renders the block tree as React elements. Nothing here builds an HTML string. */
function renderInline(parts: Inline[]): ReactNode {
  return parts.map((part, i) => {
    const key = `${part.kind}-${String(i)}`;
    switch (part.kind) {
      case 'strong':
        return <strong key={key}>{part.text}</strong>;
      case 'em':
        return <em key={key}>{part.text}</em>;
      case 'code':
        return (
          <code className="fg-mono" key={key}>
            {part.text}
          </code>
        );
      case 'link':
        return (
          <a href={part.href} key={key}>
            {part.text}
          </a>
        );
      case 'text':
        return <span key={key}>{part.text}</span>;
    }
  });
}

function renderBlock(block: Block, i: number): ReactNode {
  const key = `${block.kind}-${String(i)}`;
  switch (block.kind) {
    case 'heading':
      return block.level === 2 ? (
        <h2 key={key}>{renderInline(block.content)}</h2>
      ) : (
        <h3 key={key}>{renderInline(block.content)}</h3>
      );
    case 'paragraph':
      return <p key={key}>{renderInline(block.content)}</p>;
    case 'quote':
      return <blockquote key={key}>{renderInline(block.content)}</blockquote>;
    case 'code':
      return (
        <pre className="fg-mono" key={key}>
          <code>{block.text}</code>
        </pre>
      );
    case 'list': {
      const items = block.items.map((item, n) => <li key={String(n)}>{renderInline(item)}</li>);
      return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>;
    }
  }
}

export function Markdown({
  source,
  className,
}: {
  source: string;
  className?: string | undefined;
}): ReactNode {
  return <div className={className}>{parseMarkdown(source).map(renderBlock)}</div>;
}

export { parseInline, parseMarkdown };
