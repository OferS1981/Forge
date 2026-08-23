import type { FieldId, FieldType, VocabBank } from './types';

/** Raw field registry ported verbatim from the prototype. fields.ts adds tiers, terms and autoFill. */
export interface RawField {
  label: string;
  hint?: string;
  type: FieldType;
  /** A vocabulary bank name, or an inline option list. */
  options?: VocabBank;
  inline?: readonly string[];
  max?: number;
  placeholder?: string;
}

export const RAW_FIELDS: Record<FieldId, RawField> = {
  subject: {
    label: 'Subject',
    hint: 'the one thing the frame is about',
    type: 'area',
    placeholder: 'A retired boxer taping his hands in a basement gym',
  },
  action: {
    label: 'What happens across the clip',
    hint: 'describe motion over time, not a still',
    type: 'area',
    placeholder: 'He finishes taping, flexes the fist, then looks up at the camera',
  },
  setting: {
    label: 'Setting',
    hint: 'where, and what time',
    type: 'text',
    placeholder: 'Basement gym at 6am, condensation on the windows',
  },
  purpose: {
    label: 'Where it will be used',
    hint: 'changes framing, crop and safety margins',
    type: 'text',
    placeholder: 'Instagram carousel, first slide',
  },
  medium: { label: 'Medium', type: 'chip1', options: 'medium' },
  shot: { label: 'Shot & angle', type: 'chips', options: 'shot', max: 2 },
  lens: { label: 'Lens', type: 'chip1', options: 'lens' },
  aperture: { label: 'Aperture', type: 'chip1', options: 'aperture' },
  light: {
    label: 'Lighting',
    hint: 'pick one or two. stacking more dilutes each',
    type: 'chips',
    options: 'light',
    max: 2,
  },
  film: { label: 'Film stock / capture', type: 'chip1', options: 'film' },
  grade: { label: 'Colour grade', type: 'chip1', options: 'grade' },
  comp: { label: 'Composition', type: 'chip1', options: 'comp' },
  mood: { label: 'Mood', type: 'chips', options: 'mood', max: 2 },
  palette: {
    label: 'Palette',
    hint: 'hex codes beat colour names when the brand matters',
    type: 'text',
    placeholder: '#0B3D2E deep green, warm brass, bone white',
  },
  imgtext: {
    label: 'Words to render in the image',
    hint: 'quote them exactly',
    type: 'text',
    placeholder: 'NORTHBOUND SUPPLY CO.',
  },
  avoid: {
    label: 'Keep out',
    hint: 'what must not appear',
    type: 'text',
    placeholder: 'logos, watermarks, other people',
  },
  ref: {
    label: 'Reference or style anchor',
    type: 'text',
    placeholder: 'Roger Deakins night exteriors',
  },
  aspect: { label: 'Aspect ratio', type: 'select' },
  camMove: {
    label: 'Camera move',
    hint: 'one move per shot. stacking produces mush',
    type: 'chip1',
    options: 'camMove',
  },
  motion: { label: 'Motion in frame', type: 'chips', options: 'motion', max: 2 },
  pacing: { label: 'Pacing', type: 'chip1', options: 'pacing' },
  duration: { label: 'Duration', type: 'select' },
  vaudio: {
    label: 'Audio',
    hint: 'dialogue in quotes, then SFX, then ambience',
    type: 'area',
    placeholder: 'He says, "Last round." SFX: skipping rope on concrete. Ambient: distant traffic.',
  },
  shots: { label: 'Number of shots', type: 'seg', inline: ['1', '2', '3', '4'] },
  script: {
    label: 'The script',
    hint: 'under 250 characters gets unstable. give it a paragraph',
    type: 'area',
    placeholder: 'There is a moment, right before the bell, when the noise drops away.',
  },
  useCase: {
    label: 'What it is for',
    type: 'select',
    inline: [
      'Corporate narration',
      'Audiobook',
      'Ad / commercial read',
      'Trailer / hype VO',
      'Character acting',
      'Conversational agent',
      'E-learning / IVR',
      'Meditation / ASMR',
    ],
  },
  voiceChar: {
    label: 'Voice character',
    type: 'text',
    placeholder: 'British woman, late 30s, dry and unhurried',
  },
  vTone: { label: 'Tone', type: 'chips', options: 'vocalTone', max: 3 },
  vTexture: { label: 'Texture', type: 'chips', options: 'vocalTexture', max: 2 },
  vArch: { label: 'Archetype', type: 'chip1', options: 'vocalArch' },
  lang: {
    label: 'Language / locale',
    hint: 'name the dialect, not just the language',
    type: 'text',
    placeholder: 'English, Received Pronunciation (not General American)',
  },
  sound: {
    label: 'The sound',
    hint: 'one event per generation. layer them later',
    type: 'text',
    placeholder: 'Heavy wooden door creaking open on rusted hinges',
  },
  sfxKind: { label: 'Kind', type: 'chip1', options: 'sfxKind' },
  room: { label: 'Space', type: 'chip1', options: 'room' },
  mic: { label: 'Capture', type: 'chip1', options: 'mic' },
  sfxLen: {
    label: 'Duration (seconds)',
    hint: 'leave blank and the model infers it',
    type: 'text',
    placeholder: '3',
  },
  sfxLoop: { label: 'Seamless loop', type: 'seg', inline: ['No', 'Yes'] },
  mGenre: { label: 'Genre', type: 'chips', options: 'genre', max: 2 },
  mMood: { label: 'Mood', type: 'chips', options: 'mood', max: 2 },
  mInst: { label: 'Instrumentation', type: 'chips', options: 'instruments', max: 5 },
  mProd: { label: 'Production', type: 'chips', options: 'production', max: 3 },
  mBpm: { label: 'Tempo (BPM)', type: 'text', placeholder: '122' },
  mKey: { label: 'Key', type: 'text', placeholder: 'A minor' },
  mVocal: { label: 'Vocals', type: 'seg', inline: ['Instrumental', 'Vocals'] },
  mStruct: {
    label: 'Arrangement',
    hint: "narrate it in order: 'start with… then bring in…'",
    type: 'area',
    placeholder:
      'Start with just brushed drums and upright bass, bring in the Rhodes at 0:20, horns land on the last chorus',
  },
  mLyrics: {
    label: 'Lyrics or theme',
    type: 'area',
    placeholder: '[Verse 1]\\nStreetlights on the ring road…',
  },
  mExclude: {
    label: 'Exclude',
    hint: 'instruments and elements you do not want',
    type: 'text',
    placeholder: 'electric guitar, heavy drums',
  },
  goal: {
    label: 'The task',
    hint: 'what you want back, in one or two sentences',
    type: 'area',
    placeholder:
      'Review this pricing page copy and tell me which claims a sceptical CFO would not believe',
  },
  role: { label: 'Role to assign', type: 'chip1', options: 'llmRole' },
  context: {
    label: 'Context it needs',
    hint: 'paste the material, or say what will be pasted',
    type: 'area',
    placeholder: 'I will paste the current page copy below. Our buyer is a 20-person agency.',
  },
  format: { label: 'Output format', type: 'chip1', options: 'llmFormat' },
  length: { label: 'Length', type: 'text', placeholder: 'Under 400 words' },
  rules: {
    label: 'Hard rules',
    hint: "few and specific. long 'never' lists dilute every rule",
    type: 'text',
    placeholder: 'Never invent a statistic. Quote the source line before each claim.',
  },
  examples: {
    label: 'Example of a good answer',
    hint: 'one is worth a paragraph of description',
    type: 'area',
  },
  effort: { label: 'Reasoning depth', type: 'seg', inline: ['Low', 'Medium', 'High', 'Max'] },
  cTask: {
    label: 'What to build or change',
    type: 'area',
    placeholder: 'Add rate limiting to the public API, 100 requests per minute per key',
  },
  cStack: {
    label: 'Stack and repo shape',
    type: 'text',
    placeholder: 'Node 22, Fastify, Postgres via Drizzle, tests in Vitest',
  },
  cScope: {
    label: 'Leave alone',
    hint: 'the single highest-value instruction in agent prompting',
    type: 'text',
    placeholder: 'Do not touch the auth middleware or any migration older than 0042',
  },
  cCheck: {
    label: 'How we know it worked',
    hint: "a command that exits 0, not 'make it work'",
    type: 'text',
    placeholder: 'npm test passes and curl -I returns 429 on the 101st call',
  },
  cPattern: {
    label: 'Existing pattern to follow',
    type: 'text',
    placeholder: 'Mirror src/routes/webhooks.ts',
  },
  aApp: {
    label: 'What the app does',
    type: 'area',
    placeholder: 'A shared shopping list where two people tick items off in real time',
  },
  aScreens: {
    label: 'Screens in this pass',
    hint: 'one slice at a time beats a whole app in one prompt',
    type: 'text',
    placeholder: 'Just the list screen and the add-item sheet',
  },
  aData: {
    label: 'Data model',
    type: 'text',
    placeholder: 'List has many Items. Item: name, quantity, done, addedBy',
  },
  aStyle: {
    label: 'Look',
    hint: 'use design vocabulary: weight, spacing, radius',
    type: 'text',
    placeholder: 'Dense, 14px base, 8px radius, one accent colour, no gradients',
  },
  rQuestion: {
    label: 'The question',
    type: 'area',
    placeholder:
      'Which European cities have introduced a tourist cap since 2023, and what did it change?',
  },
  rDecision: {
    label: 'The decision this feeds',
    hint: 'tells the model what to prioritise',
    type: 'text',
    placeholder: 'Where to run a pilot next spring',
  },
  rScope: {
    label: 'Scope',
    type: 'text',
    placeholder: '2023 to today, EU only, primary sources and city government pages',
  },
  rGaps: {
    label: 'If evidence is missing',
    hint: 'all three deep-research modes reward this being explicit',
    type: 'text',
    placeholder: 'Say so in a Gaps section rather than estimating',
  },
  rFormat: {
    label: 'Deliverable',
    type: 'chip1',
    inline: [
      'Cited brief, 1 page',
      'Comparison table',
      'Executive summary + appendix',
      'Annotated source list',
      'Timeline',
    ],
  },
};
