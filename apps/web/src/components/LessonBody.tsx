'use client';

import { useRouter } from 'next/navigation';
import { modelById } from '@forge/catalog';
import { Button, Markdown, splitTitle, toast } from '@forge/ui';
import type { Lesson } from '../lib/lessons';
import { useBenchMode, useBriefs, useModelId } from '../lib/store';

/**
 * A lesson, and the button that matters: it loads the brief the lesson describes into the Build
 * workspace, in Advanced mode, so the reader lands on the thing they have just read about with the
 * craft layer visible.
 */
export function LessonBody({
  lesson,
  nextSlug,
  nextTitle,
}: {
  lesson: Lesson;
  nextSlug?: string | undefined;
  nextTitle?: string | undefined;
}): React.ReactNode {
  const router = useRouter();
  const [, setModelId] = useModelId('midjourney');
  const [, setMode] = useBenchMode();
  const { setFields } = useBriefs();
  const { title, body } = splitTitle(lesson.source);
  const model = modelById(lesson.demo.model);

  const tryIt = (): void => {
    setModelId(lesson.demo.model);
    setMode('advanced');
    setFields(lesson.demo.model, lesson.demo.brief);
    toast(`Loaded the example into the Build workspace, on ${model.name}.`, 'good');
    router.push('/');
  };

  return (
    <main className="lesson" id="lesson">
      <p className="lesson__back">
        <a href="/learn">All lessons</a>
      </p>
      <article className="lesson__body">
        <h1 className="lesson__title">{title.length > 0 ? title : lesson.title}</h1>
        <p className="lesson__standfirst">{lesson.standfirst}</p>
        <Markdown source={body} className="prose" />
      </article>

      <aside className="tryit" aria-label="Try it">
        <h2 className="tryit__title">Try it</h2>
        <p className="tryit__what">
          This loads {lesson.demo.what} into the Build workspace, on {model.name}, with the craft
          layer open so you can see every choice.
        </p>
        <Button variant="primary" size="lg" onClick={tryIt}>
          Load this into Build
        </Button>
      </aside>

      {nextSlug !== undefined && (
        <p className="lesson__next">
          Next: <a href={`/learn/${nextSlug}`}>{nextTitle}</a>
        </p>
      )}
    </main>
  );
}
