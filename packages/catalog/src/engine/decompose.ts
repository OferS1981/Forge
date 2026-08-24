import type { CategoryId } from '../types';

/**
 * The decomposition method, manual section 5.4: if you can only name the effect by naming a
 * person, you have not finished describing it yet. Given a name, return the attribute scaffold,
 * the eight visual axes or the nine audio ones, so the person can answer the question the name
 * was hiding. The prompt gets better and the finding clears at the same time. This is the feature
 * that makes the Compliance Pass a craft tool rather than a compliance nag.
 */

export interface ScaffoldAxis {
  id: string;
  label: string;
  /** What to look for in the reference. */
  hint: string;
  /** A worked value in the register of the manual's fox example, to show the level of precision. */
  example: string;
  /** Set where the category itself implies a default; empty where only the user can answer. */
  prefill?: string;
}

export interface AttributeScaffold {
  /** The name being decomposed. */
  term: string;
  kind: 'visual' | 'audio';
  axes: ScaffoldAxis[];
  /** The one-line teaching, shown above the axes. */
  note: string;
}

const VISUAL: ScaffoldAxis[] = [
  {
    id: 'medium',
    label: 'Medium and substrate',
    hint: 'What was it made with, and on what?',
    example: 'gouache and coloured pencil on cold-press paper, visible tooth in the flat areas',
  },
  {
    id: 'mark',
    label: 'Mark-making',
    hint: 'Line weight and variation, edge quality, brush behaviour, grain, halftone, stipple.',
    example: 'confident varied line, thick on the shadow side',
  },
  {
    id: 'palette',
    label: 'Palette',
    hint: 'Named hues, saturation, temperature, value range, limited-palette constraints.',
    example: 'limited palette of burnt sienna, sage and bone, one saturated vermilion accent',
  },
  {
    id: 'lighting',
    label: 'Lighting',
    hint: 'Key-to-fill ratio, direction, hardness, practicals, time of day, colour of the light.',
    example: 'soft single key from the left, no cast shadows',
  },
  {
    id: 'lens',
    label: 'Lens and camera',
    hint: 'Focal length, aperture and depth of field, film stock or sensor character, halation.',
    example: '85mm at f/2, gentle halation on the highlights',
  },
  {
    id: 'composition',
    label: 'Composition',
    hint: 'Framing, crop, subject placement, negative space, perspective, symmetry.',
    example: 'cropped tight, generous negative space at the top of the frame',
  },
  {
    id: 'era',
    label: 'Era and technique',
    hint: 'The period signifiers that carry most of what people mean by "style".',
    example: 'mid-century screenprint flatness, registration slightly off',
  },
  {
    id: 'mood',
    label: 'Mood and register',
    hint: 'The feeling, named plainly, without intensifiers.',
    example: 'quiet, warm, unhurried',
  },
];

const AUDIO: ScaffoldAxis[] = [
  {
    id: 'instrumentation',
    label: 'Instrumentation and voicing',
    hint: 'What is actually playing, and how it is voiced.',
    example: 'upright bass, brushed kit, baritone guitar, mellotron flutes',
  },
  {
    id: 'arrangement',
    label: 'Arrangement density and form',
    hint: 'How full it is and how it is built.',
    example: 'sparse verses, everything enters at once for one chorus only',
  },
  {
    id: 'tempo',
    label: 'Tempo, feel and swing',
    hint: 'BPM if you know it; the feel if you do not.',
    example: 'around 96 BPM, behind the beat, light swing',
  },
  {
    id: 'harmony',
    label: 'Harmonic language and modality',
    hint: 'Major or modal, simple or extended, where it resolves.',
    example: 'mixolydian, dominant chords that never quite resolve',
  },
  {
    id: 'timbre',
    label: 'Timbre and processing chain',
    hint: 'Amp type, tape saturation, plate versus spring reverb, sidechain.',
    example: 'tape saturation, spring reverb on everything, gentle sidechain pump',
  },
  {
    id: 'mix',
    label: 'Mix character',
    hint: 'Drum-bus compression, stereo width, low-end curve.',
    example: 'narrow stereo image, compressed drum bus, soft low end',
  },
  {
    id: 'vocal',
    label: 'Vocal delivery register',
    hint: 'Breathy, belted, doubled, spoken. Delivery, not a person.',
    example: 'close-mic breathy lead, doubled at the octave in the chorus',
  },
  {
    id: 'production-era',
    label: 'Production-era signifiers',
    hint: 'The decade the recording chain implies.',
    example: 'late-seventies studio: dry drums, warm console saturation',
  },
  {
    id: 'genre',
    label: 'Genre and subgenre',
    hint: 'Genres are genres, not people.',
    example: 'coastal folk-rock with soul phrasing',
  },
];

const AUDIO_CATEGORIES = new Set<CategoryId>(['voice', 'sfx', 'music']);

/**
 * Category-implied prefills: only where the category itself answers the axis, never a guess at
 * what the person meant.
 */
function prefillFor(axis: ScaffoldAxis, category: CategoryId): string | undefined {
  if (category === 'voice' && axis.id === 'instrumentation') return 'a single voice, no music';
  if (category === 'sfx' && axis.id === 'vocal') return 'none: this is a sound, not a voice';
  return undefined;
}

export function decompose(term: string, category: CategoryId): AttributeScaffold {
  const kind = AUDIO_CATEGORIES.has(category) ? 'audio' : 'visual';
  const base = kind === 'audio' ? AUDIO : VISUAL;
  const axes = base.map((a) => {
    const prefill = prefillFor(a, category);
    return prefill === undefined ? { ...a } : { ...a, prefill };
  });
  return {
    term,
    kind,
    axes,
    note: `You named ${term}, which gives you one dial you cannot turn. Ask what is actually producing the feeling you want, write those things down, and recombine them with your own subject and staging. ${String(axes.length)} attributes give you ${String(axes.length)} dials, more controllable, portable between models, stable across versions, and outside both the copyright and the trademark theories.`,
  };
}
