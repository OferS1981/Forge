import type { VocabBank } from '../types';
import type { Copy } from './fields';

/**
 * One entry per vocabulary bank. These explain the whole set of options a chip group offers, so a
 * user who does not know what a film stock is can find out without leaving the form.
 */
export const VOCAB_COPY: Record<VocabBank, Copy> = {
  shot: {
    short: 'How much of the subject is in frame, and from where.',
    what: 'Shot sizes run from an extreme close-up to an establishing wide, and angles run from low to high. Both are standard camera-department language.',
    changes: 'How close the viewer feels, and how much context they get.',
    when: 'Always pick one. Two at most: a close-up from a low angle is coherent, three stacked sizes is not.',
  },
  lens: {
    short: 'The focal length, which decides how the space looks.',
    what: 'A number in millimetres. Small numbers see wide and exaggerate depth, large numbers see narrow and compress it.',
    changes: 'Perspective and background separation, not just how much fits in.',
    when: 'On anything photographic. 35mm for documentary, 85mm for faces, 24mm for places.',
    range: '14mm to 200mm, plus anamorphic, tilt-shift and probe',
  },
  aperture: {
    short: 'How much of the picture is sharp.',
    what: 'The f-stop. A low number opens the lens wide, letting in more light and holding a thin slice in focus.',
    changes: 'Depth of field, and how much the background reads as a place rather than a blur.',
    when: 'Alongside the lens. Wide open for portraits, stopped down for landscapes and products.',
    range: 'f/1.4 to f/16',
    example: { low: 'f/1.4, creamy bokeh.', high: 'f/16, deep focus.' },
  },
  light: {
    short: 'Where the light comes from and how hard it is.',
    what: 'Real lighting setups and conditions, from golden hour and overcast diffusion through to a named studio key light.',
    changes: 'Mood, shape, contrast and colour temperature, all at once.',
    when: 'Always. Pick one or two. Stacking more dilutes each of them.',
  },
  film: {
    short: 'The stock the picture was shot on.',
    what: 'Real emulsions, each with its own colour response and grain, plus clean digital capture for when you want none of that.',
    changes: 'Grain, contrast and the way colours sit against each other.',
    when: 'When the era or texture is part of the brief. Leave it off for clean commercial work.',
  },
  grade: {
    short: 'The colour treatment over the whole frame.',
    what: 'The grade a colourist would apply after the shoot.',
    changes: 'The palette and the emotional temperature.',
    when: 'Whenever the model default, usually warm and saturated, is not what you want.',
  },
  medium: {
    short: 'What kind of picture this is at all.',
    what: 'Photograph, cinematic still, render, painting, vector, print process, and so on.',
    changes: 'The entire rendering approach, before any other choice applies.',
    when: 'Always. It is the first decision, and everything else reads differently under it.',
  },
  comp: {
    short: 'How the frame is arranged.',
    what: 'Standard compositional structures: thirds, symmetry, leading lines, layered depth.',
    changes: 'Where the eye goes and how much space the subject is given.',
    when: 'Whenever anything will be laid over the image later, and usually otherwise too.',
  },
  mood: {
    short: 'The feeling the picture should carry.',
    what: 'A one-word emotional register the model steers light, colour and expression towards.',
    changes: 'Small consistent shifts across several other layers.',
    when: 'One or two. More than that averages out to nothing.',
  },
  camMove: {
    short: 'How the camera itself moves.',
    what: 'Named moves from a locked-off static through to a crane, an orbit or a dolly zoom.',
    changes: 'The energy of the shot and the order in which things are revealed.',
    when: 'One per shot, always. Stacking moves produces mush on every model tested.',
  },
  pacing: {
    short: 'The rhythm of the clip.',
    what: 'From a single continuous take through to staccato cuts.',
    changes: 'Cut frequency where the model plans shots, and perceived speed where it does not.',
    when: 'On anything longer than a few seconds.',
  },
  motion: {
    short: 'What moves inside the frame.',
    what: 'Secondary movement: hair and fabric, steam, rain, dust in a beam, a crowd behind the subject.',
    changes: 'Whether the shot is alive or a photograph with a drifting camera.',
    when: 'On video, always. One or two. It is the most common thing missing from a video prompt.',
  },
  vocalTone: {
    short: 'The attitude the line is read with.',
    what: 'The emotional colour of the performance: warm, wry, urgent, conspiratorial.',
    changes:
      'Delivery, and on engines that read inline tags, the tag written into the front of the script.',
    when: 'Up to three. Precise beats general: weary lands, sad does not.',
  },
  vocalTexture: {
    short: 'The grain of the voice itself.',
    what: 'The timbre, independent of the performance: breathy, gravelly, velvety, reedy.',
    changes: 'What the voice sounds like rather than how it is acted.',
    when: 'When the voice has to be memorable rather than clean.',
  },
  vocalArch: {
    short: 'The kind of voice, named as a job.',
    what: 'A recognisable role: documentary narrator, trailer voice, news anchor, ASMR performer.',
    changes: 'Pace, weight and emphasis together, in one word.',
    when: 'When naming the job is faster and more precise than describing the sound.',
  },
  sfxKind: {
    short: 'The category of sound.',
    what: 'The terms these models are trained on: impact, whoosh, ambience bed, braam, riser, stinger, foley.',
    changes: 'The envelope and the length the model reaches for.',
    when: 'Always. Using the trained term is worth more than describing the shape in your own words.',
  },
  room: {
    short: 'The space the sound happens in.',
    what: 'The acoustics, from a treated booth through to a cathedral or open air.',
    changes: 'The reflections and the tail, which is most of the sense of scale.',
    when: 'On sound effects and music. Never on voice design: that models the voice, and room words break it.',
  },
  mic: {
    short: 'How the sound was captured.',
    what: 'The microphone and the distance, both of which are audible.',
    changes: 'Brightness, proximity and how present the source feels in a mix.',
    when: 'When it has to sit under something else rather than stand alone.',
  },
  genre: {
    short: 'The musical style.',
    what: 'A genre a listener would recognise, which carries instrumentation and rhythm with it.',
    changes: 'Almost everything about the arrangement.',
    when: 'Always. One, or two that genuinely blend.',
  },
  instruments: {
    short: 'What is actually playing.',
    what: 'Named instruments and sounds, from an upright bass to an 808 sub.',
    changes: 'The arrangement, more reliably than the genre alone.',
    when: 'Always. Two or three named well beat eight listed.',
  },
  production: {
    short: 'How the record was made.',
    what: 'Studio technique: close-mic’d, sidechained, tape saturation, plate reverb, vinyl crackle.',
    changes: 'Real audible things. On the better music models these are levers, not decoration.',
    when: 'Whenever the production is the point, which for beds and loops it usually is.',
  },
  llmFormat: {
    short: 'The shape the answer comes back in.',
    what: 'Prose, markdown, a list, numbered steps, JSON, a table, CSV, code only.',
    changes: 'More than any other instruction. Every vendor guide puts this first.',
    when: 'Always. If you are going to paste the answer somewhere, say what shape it has to be.',
  },
  llmRole: {
    short: 'The perspective the model answers from.',
    what: 'A role with a real point of view, not a compliment: senior editor, sceptical reviewer.',
    changes: 'What is included and what is challenged.',
    when: 'When the angle matters. It is worth less than naming the output format.',
  },
  banned: {
    short: 'Words that steer nothing and are removed.',
    what: 'Vocabulary from the 2022 era of image models: masterpiece, 8k, ultra detailed, trending on artstation.',
    changes:
      'Nothing good. On 2026 models these consume tokens without steering, and on some they add style noise.',
    when: 'Never. Forge strips them from your text and tells you which ones it took out.',
  },
};
