import type { Category, CategoryId } from './types';

/** Colours live in packages/ui tokens. The catalogue only knows the token name. */
export const CATEGORIES: readonly Category[] = [
  { id: 'image', name: 'Image', colour: '--cat-image', defaultModel: 'midjourney' },
  { id: 'video', name: 'Video', colour: '--cat-video', defaultModel: 'veo' },
  { id: 'voice', name: 'Voice & speech', colour: '--cat-voice', defaultModel: 'el-tts' },
  { id: 'sfx', name: 'Sound effects', colour: '--cat-sfx', defaultModel: 'el-sfx' },
  { id: 'music', name: 'Music', colour: '--cat-music', defaultModel: 'suno' },
  { id: 'text', name: 'Chat & reasoning', colour: '--cat-text', defaultModel: 'claude' },
  { id: 'code', name: 'Coding agents', colour: '--cat-code', defaultModel: 'claudecode' },
  { id: 'app', name: 'App builders', colour: '--cat-app', defaultModel: 'lovable' },
  { id: 'research', name: 'Research', colour: '--cat-research', defaultModel: 'perplexity' },
];

export function categoryById(id: CategoryId): Category {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown category: ${id}`);
  return c;
}

/** The prototype's job names, used by Match when a brief spans more than one category. */
export const JOB_NAMES: Record<CategoryId, string> = {
  image: 'the image',
  video: 'the video',
  voice: 'the voice',
  sfx: 'the sound design',
  music: 'the music',
  text: 'the writing',
  code: 'the code',
  app: 'the build',
  research: 'the research',
};
