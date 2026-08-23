import type { Metadata } from 'next';
import { LESSONS } from '../../lib/lessons';

export const metadata: Metadata = {
  title: 'Learn, Forge',
  description:
    'Six short lessons on what actually steers an AI model: lenses, lighting, negative prompts, motion, punctuation, and why the old quality words stopped working.',
};

export default function LearnIndex(): React.ReactNode {
  return (
    <main className="learn" id="learn">
      <header className="learn__head">
        <h1 className="learn__title">Learn</h1>
        <p className="learn__lede">
          Six short lessons on the things that actually move a result. Each one ends with a button
          that loads the brief it describes into the Build workspace, so you can do the thing rather
          than only read about it.
        </p>
      </header>
      <ol className="lessons">
        {LESSONS.map((lesson, i) => (
          <li className="lesson-card" key={lesson.slug}>
            <span className="lesson-card__n fg-mono" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="lesson-card__title">
                <a href={`/learn/${lesson.slug}`}>{lesson.title}</a>
              </h2>
              <p className="lesson-card__standfirst">{lesson.standfirst}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
