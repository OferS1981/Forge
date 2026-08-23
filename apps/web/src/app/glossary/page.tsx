'use client';

import { useMemo, useState } from 'react';
import { TERM_LIST, type Term } from '@forge/catalog';
import { TextField } from '@forge/ui';

/**
 * Every term in the product, grouped, searchable and deep-linkable. The Doctor's findings and the
 * info dots both point here, so a user who wants the long version has somewhere to land.
 */

const GROUPS = [
  {
    id: 'field',
    name: 'The brief',
    lede: 'The questions Forge asks you, and why each one is asked.',
  },
  {
    id: 'vocab',
    name: 'The vocabulary',
    lede: 'The professional terms behind the chips: what a colourist, a gaffer or an engineer means by them.',
  },
  {
    id: 'setting',
    name: 'The settings',
    lede: 'Every parameter Forge writes alongside a prompt, under the name the vendor uses for it.',
  },
];

function anchor(id: string): string {
  return id.replace(/\./g, '-');
}

function Entry({ term }: { term: Term }): React.ReactNode {
  return (
    <article className="term" id={anchor(term.id)}>
      <h3 className="term__label">{term.label}</h3>
      <p className="term__short">{term.short}</p>
      <dl className="term__list">
        <dt>What it is</dt>
        <dd>{term.what}</dd>
        <dt>What changes</dt>
        <dd>{term.changes}</dd>
        <dt>When to use it</dt>
        <dd>{term.when}</dd>
        {term.range !== undefined && (
          <>
            <dt>Range</dt>
            <dd className="fg-mono">{term.range}</dd>
          </>
        )}
        {term.example !== undefined && (
          <>
            <dt>Low</dt>
            <dd>{term.example.low}</dd>
            <dt>High</dt>
            <dd>{term.example.high}</dd>
          </>
        )}
      </dl>
      <p className="term__id fg-mono">{term.id}</p>
    </article>
  );
}

export default function GlossaryPage(): React.ReactNode {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matches = (t: Term): boolean =>
      q.length === 0 ||
      `${t.label} ${t.short} ${t.what} ${t.changes} ${t.when} ${t.id}`.toLowerCase().includes(q);
    return GROUPS.map((g) => ({
      ...g,
      terms: TERM_LIST.filter((t) => t.id.startsWith(`${g.id}.`) && matches(t)).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    }));
  }, [query]);

  const found = groups.reduce((n, g) => n + g.terms.length, 0);

  return (
    <main className="glossary" id="glossary">
      <header className="glossary__head">
        <h1 className="glossary__title">Glossary</h1>
        <p className="glossary__lede">
          Every field, every option and every setting in Forge, explained the way a good teacher
          would: what it is, what changes when you move it, and when to reach for it. There are{' '}
          {TERM_LIST.length} of them, and nothing in the product is allowed to exist without one.
        </p>
        <TextField
          label="Search the glossary"
          type="search"
          placeholder="stylize, negative prompt, aperture"
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
          }}
        />
        <p className="glossary__count" role="status">
          {query.length === 0
            ? `${String(TERM_LIST.length)} terms`
            : `${String(found)} ${found === 1 ? 'term' : 'terms'} match`}
        </p>
      </header>

      {groups.map((g) =>
        g.terms.length === 0 ? null : (
          <section className="glossary__group" key={g.id} aria-labelledby={`group-${g.id}`}>
            <h2 className="glossary__group-name" id={`group-${g.id}`}>
              {g.name}
            </h2>
            <p className="glossary__group-lede">{g.lede}</p>
            <div className="terms">
              {g.terms.map((t) => (
                <Entry key={t.id} term={t} />
              ))}
            </div>
          </section>
        ),
      )}

      {found === 0 && (
        <p className="glossary__empty">
          Nothing matches that. Try the name of a setting, such as stylize or cfg, or a word from
          the brief, such as aperture.
        </p>
      )}
    </main>
  );
}
