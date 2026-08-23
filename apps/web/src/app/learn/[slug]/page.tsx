import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LESSONS, lessonBySlug } from '../../../lib/lessons';
import { LessonBody } from '../../../components/LessonBody';

/** A static export needs to know every page it has to write. */
export function generateStaticParams(): { slug: string }[] {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) return { title: 'Lesson not found, Forge' };
  return { title: `${lesson.title}, Forge`, description: lesson.standfirst };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactNode> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();
  const index = LESSONS.findIndex((l) => l.slug === lesson.slug);
  const next = LESSONS[index + 1];
  return <LessonBody lesson={lesson} nextSlug={next?.slug} nextTitle={next?.title} />;
}
