import type { FieldId } from '../types';

/** The written half of a term: the label comes from the field or the bank it explains. */
export interface Copy {
  short: string;
  what: string;
  changes: string;
  when: string;
  range?: string;
  example?: { low: string; high: string };
}

/**
 * One entry per brief field. Written to the voice in CLAUDE.md: what it is, what changes, when to
 * use it. Plain and specific, no hype, and never an apology for the model's limits.
 */
export const FIELD_COPY: Record<FieldId, Copy> = {
  subject: {
    short: 'The one thing the frame is about.',
    what: 'The person, object or scene the image or clip exists to show.',
    changes:
      'Everything. It is the first clause on most models, and the first clause carries the most weight.',
    when: 'Always. A prompt without a subject is a prompt about the average of the training data.',
    example: {
      low: 'A man in a gym.',
      high: 'A retired boxer taping his hands in a basement gym.',
    },
  },
  action: {
    short: 'What happens across the clip, described over time.',
    what: 'The movement in the shot: what starts, what changes, what it ends on.',
    changes:
      'Whether you get a moving photograph or a shot. Video models fill unspecified time with drift.',
    when: 'On every video model. The longer the clip, the more of the timeline this has to cover.',
    example: {
      low: 'He is taping his hands.',
      high: 'He finishes taping, flexes the fist, then looks up at the camera.',
    },
  },
  setting: {
    short: 'Where it happens, and at what time.',
    what: 'The place and the hour, which together decide the light and half the mood.',
    changes: 'The background, the colour temperature and what the model thinks the scene is for.',
    when: 'Whenever the place matters. Naming the hour is usually worth more than naming the place.',
    example: { low: 'In a gym.', high: 'Basement gym at 6am, condensation on the windows.' },
  },
  purpose: {
    short: 'Where the output will be used.',
    what: 'The destination: a carousel, a billboard, a thumbnail, a print.',
    changes:
      'Framing, crop and safety margins. It also tells the model how much detail survives at the size it will be seen.',
    when: 'Whenever you know it. It changes composition more than most style words do.',
  },
  medium: {
    short: 'What kind of picture this is.',
    what: 'Photograph, render, painting, vector, and so on.',
    changes:
      'The whole rendering approach, and on several models which internal style the request is routed to.',
    when: 'Always. Leaving it out means accepting whatever the model prefers.',
  },
  shot: {
    short: 'How close the camera is, and from what angle.',
    what: 'The shot size and camera position, in the language a camera department uses.',
    changes: 'How much of the subject is in frame and how the viewer relates to it.',
    when: 'Always. It is the cheapest way to stop getting a centred mid-shot of everything.',
  },
  lens: {
    short: 'The focal length, which decides the perspective.',
    what: 'A real lens: 24mm, 50mm, 85mm, and so on.',
    changes:
      'Compression and distortion. A wide lens pushes the background away, a long lens flattens it against the subject.',
    when: 'On anything photographic or cinematic. One focal length beats five adjectives.',
    example: {
      low: '24mm: a wide, open, slightly distorted view.',
      high: '200mm: the background compressed and soft behind the subject.',
    },
  },
  aperture: {
    short: 'How much is in focus.',
    what: 'The f-stop, which sets the depth of field.',
    changes: 'How much of the frame is sharp and how soft the background falls away.',
    when: 'With the lens. The two together are the difference between a snapshot and a photograph.',
    range: 'f/1.4 through f/16',
    example: {
      low: 'f/1.4: the eyes sharp, everything else melted.',
      high: 'f/16: front to back sharp.',
    },
  },
  light: {
    short: 'Where the light comes from and what quality it has.',
    what: 'The lighting setup, named the way a gaffer would name it.',
    changes:
      'More than any other single line. It sets mood, shape, contrast and the colour of the whole frame.',
    when: 'Always. This is the highest-yield thing missing from most prompts.',
  },
  film: {
    short: 'The stock or capture medium, which carries a look with it.',
    what: 'A real film stock, or clean digital capture.',
    changes: 'Grain, colour response and how highlights roll off.',
    when: 'When you want a specific era or texture. Skip it for clean commercial work.',
  },
  grade: {
    short: 'The colour treatment laid over the whole image.',
    what: 'The grade, as a colourist would describe it.',
    changes: 'The palette, the contrast and the emotional register.',
    when: 'Whenever you do not want the model default, which is usually warm and saturated.',
  },
  comp: {
    short: 'Where things sit in the frame.',
    what: 'The compositional structure: thirds, symmetry, leading lines, negative space.',
    changes: 'Where the eye lands first and how much room the subject has.',
    when: 'Whenever the layout matters, which is most of the time for anything with text on it later.',
  },
  mood: {
    short: 'How the picture should feel.',
    what: 'The emotional register, in one or two words.',
    changes: 'Light, colour and expression, all slightly, in the same direction.',
    when: 'Pick one or two. Stacking more cancels them out.',
  },
  palette: {
    short: 'The colours, named or given as hex codes.',
    what: 'The specific colours the image should be built from.',
    changes: 'The dominant hues. Hex codes are followed more closely than colour names.',
    when: 'Whenever a brand is involved. Names get you close, hex gets you closer.',
  },
  imgtext: {
    short: 'Words that must appear inside the picture.',
    what: 'Literal copy to render, quoted exactly as it should read.',
    changes:
      'Whether the model attempts real letters at all, and which models can be trusted with it.',
    when: 'Posters, packaging, logos, anything typographic. Some models are far better at this than others.',
  },
  avoid: {
    short: 'What must not appear.',
    what: 'The exclusion list, which becomes a negative prompt on the models that have one.',
    changes:
      'On models with a real negative field, quite a lot. On models without one, it is phrased positively instead.',
    when: 'When something keeps turning up that you do not want. Keep it short and concrete.',
  },
  ref: {
    short: 'A style anchor: a name, a film, a photographer.',
    what: 'A reference the model is likely to have seen, used to set a register rather than to copy.',
    changes: 'The overall look, sometimes strongly. Living artists are refused by several models.',
    when: 'When a description is not landing and a reference would say it in three words.',
  },
  aspect: {
    short: 'The shape of the frame.',
    what: 'The ratio or exact pixel size the model accepts, in that model’s own notation.',
    changes: 'The crop, and therefore the composition.',
    when: 'Always. Every model writes this differently, which is why Forge lists only what yours takes.',
  },
  camMove: {
    short: 'How the camera moves during the shot.',
    what: 'A single named camera move: a push, a pan, an orbit, a rise.',
    changes: 'The energy of the clip and what the viewer discovers when.',
    when: 'One per shot. Stacking dolly, orbit and tilt produces mush on every model.',
  },
  motion: {
    short: 'What moves inside the frame, apart from the camera.',
    what: 'Secondary motion: hair, fabric, steam, rain, crowds, dust.',
    changes: 'Whether the shot feels alive or like a still with a drifting camera.',
    when: 'On video, always. It is the cheapest way to stop getting a moving photograph.',
  },
  pacing: {
    short: 'How fast the shot feels.',
    what: 'The rhythm: a single held take, a slow burn, staccato cuts.',
    changes: 'Cut frequency on models that plan shots, and perceived speed on models that do not.',
    when: 'On anything longer than a few seconds.',
  },
  duration: {
    short: 'How long the clip runs.',
    what: 'The length, limited to what this model actually supports.',
    changes:
      'Resolution and price on several models, and how much of the timeline your prompt has to cover.',
    when: 'Always. Asking for a length a model does not offer fails or silently downgrades.',
  },
  vaudio: {
    short: 'The sound: dialogue, effects, ambience.',
    what: 'What should be heard, written in the order the model expects.',
    changes: 'Whether audio is generated at all, and whether the dialogue lands in sync.',
    when: 'On models with native audio. Keep dialogue short: lip-sync drifts past about fifteen words.',
  },
  shots: {
    short: 'How many shots to plan in one generation.',
    what: 'The number of distinct camera setups the model should produce.',
    changes: 'Whether you get one continuous take or a small sequence.',
    when: 'On the models that plan shot lists. Ask for one explicitly if you want a single take.',
  },
  script: {
    short: 'The words to be spoken.',
    what: 'The exact text, including its punctuation, which is the real prosody control.',
    changes: 'Everything. Ellipses hesitate, dashes clip, capitals stress.',
    when: 'Always, on speech. Under 250 characters is unstable: give it a paragraph.',
  },
  useCase: {
    short: 'What the recording is for.',
    what: 'The job: narration, an ad read, a character, an agent.',
    changes: 'Which engine is chosen and where the stability and style settings land.',
    when: 'Always. It picks the settings for you.',
  },
  voiceChar: {
    short: 'Who is speaking.',
    what: 'The voice in plain description: age, gender, nationality, manner.',
    changes: 'The voice that is chosen or designed.',
    when: 'Always. Name the dialect rather than the language.',
  },
  vTone: {
    short: 'The attitude in the read.',
    what: 'The emotional colour: warm, wry, urgent, weary.',
    changes: 'Delivery, and on some engines the audio tags written into the script.',
    when: 'Up to three. More than that averages out to neutral.',
  },
  vTexture: {
    short: 'The grain of the voice itself.',
    what: 'The timbre: breathy, gravelly, velvety, reedy.',
    changes: 'The character of the voice rather than the performance.',
    when: 'When the voice has to be distinctive rather than clean.',
  },
  vArch: {
    short: 'The kind of voice this is, as a job.',
    what: 'A recognisable archetype: documentary narrator, trailer voice, podcast host.',
    changes: 'Pace, weight and where the emphasis falls, all at once.',
    when: 'When you can name the job faster than you can describe the voice.',
  },
  lang: {
    short: 'The language and, more importantly, the dialect.',
    what: 'The locale, ideally as a tag such as en-AU or pt-BR.',
    changes: 'Pronunciation, rhythm and the pool of voices available.',
    when: 'Always. Naming the dialect is where the quality is.',
  },
  sound: {
    short: 'The single sound to make.',
    what: 'The source, the material and what happens to it.',
    changes: 'Everything. One event per generation is the documented workflow, not a limitation.',
    when: 'Always, on sound effects. Layer sequences in an editor rather than asking for them.',
  },
  sfxKind: {
    short: 'What kind of sound this is.',
    what: 'The category the model knows: impact, whoosh, ambience, riser, foley.',
    changes: 'The envelope and the length the model reaches for.',
    when: 'Always. These are terms the model was trained on, so they land.',
  },
  room: {
    short: 'The space the sound happens in.',
    what: 'The acoustics: dry booth, tiled bathroom, stairwell, cathedral.',
    changes: 'The tail, the reflections and the sense of size.',
    when: 'On sound effects and music. Never on voice design, which models the voice, not the room.',
  },
  mic: {
    short: 'How it was recorded.',
    what: 'The microphone and the distance, which is a real part of the sound.',
    changes: 'Proximity, brightness and how present the source feels.',
    when: 'When you want it to sit in a mix rather than sound like a stock effect.',
  },
  sfxLen: {
    short: 'How many seconds it should run.',
    what: 'A duration in seconds, or nothing at all.',
    changes: 'The shape of the envelope. Left blank, the model infers it, often well.',
    when: 'When it has to fit a cut. Otherwise leave it and let the model decide.',
  },
  sfxLoop: {
    short: 'Whether it has to loop seamlessly.',
    what: 'A request for a sound with no audible seam at the join.',
    changes: 'How the model treats the start and end, and on some engines the output format.',
    when: 'Ambience beds and anything that plays under something else.',
  },
  mGenre: {
    short: 'The genre, or the two it sits between.',
    what: 'The musical style, named as a genre a listener would recognise.',
    changes: 'Instrumentation, rhythm and production defaults, all at once.',
    when: 'Always. One or two. Three is a request the model cannot resolve.',
  },
  mMood: {
    short: 'How the music should feel.',
    what: 'The emotional register of the piece.',
    changes: 'Harmony, tempo feel and arrangement density.',
    when: 'Always. Precise words work better: melancholic beats sad.',
  },
  mInst: {
    short: 'What is playing.',
    what: 'The instruments that should be audible, named specifically.',
    changes: 'The arrangement, more reliably than the genre alone does.',
    when: 'Always. Naming two or three well beats naming eight.',
  },
  mProd: {
    short: 'How it was recorded and mixed.',
    what: 'Studio language: sidechained, bone-dry, tape saturation, plate reverb.',
    changes: 'Real audible things. These are levers, not adjectives.',
    when: 'When the production is the point, which for beds and loops it usually is.',
  },
  mBpm: {
    short: 'The tempo, as a number.',
    what: 'Beats per minute.',
    changes: 'Speed and feel. A number is followed far more closely than "fast".',
    when: 'Always, if you know it. It is the most reliably followed number in a music prompt.',
    range: 'Roughly 60 to 180',
  },
  mKey: {
    short: 'The musical key.',
    what: 'The key and mode, such as A minor.',
    changes: 'The harmonic centre, and the mood along with it.',
    when: 'When the track has to sit with something else, or when the mode matters.',
  },
  mVocal: {
    short: 'Whether anyone sings.',
    what: 'Instrumental, or with vocals.',
    changes: 'Whether a voice is generated at all. On most engines this is a real switch.',
    when: 'Always. Instrumental is the right default for anything that plays under speech.',
  },
  mStruct: {
    short: 'How the piece unfolds.',
    what: 'The arrangement, narrated in order.',
    changes: 'What happens when. Words like "start with" and "then bring in" are load-bearing.',
    when: 'On anything longer than a loop.',
  },
  mLyrics: {
    short: 'The words, or the theme they should cover.',
    what: 'Lyrics, often with section tags such as [Verse 1] on the engines that read them.',
    changes: 'What is sung, and on some engines the structure as well.',
    when: 'When there are vocals. Section tags are a convention of specific tools, not universal.',
  },
  mExclude: {
    short: 'What the music must not contain.',
    what: 'Instruments and elements to keep out.',
    changes:
      'On engines with a dedicated exclude field, a great deal. Negatives inside the style line are ignored.',
    when: 'When something keeps appearing. Put it here, not in the style description.',
  },
  goal: {
    short: 'What you want back.',
    what: 'The task, in one or two sentences.',
    changes: 'Everything. It is the instruction the whole prompt is built around.',
    when: 'Always. State the outcome, not the steps: reasoning models want goals.',
  },
  role: {
    short: 'Who the model should answer as.',
    what: 'A role with a point of view: senior editor, sceptical reviewer, data analyst.',
    changes: 'What gets included and what gets challenged, more than the writing style.',
    when: 'When the perspective matters. It is worth less than a good output format.',
  },
  context: {
    short: 'The material the answer must come from.',
    what: 'The documents, data or background to work from.',
    changes: 'Whether the answer is grounded or invented.',
    when: 'Whenever you have it. Put long material first and the question last.',
  },
  format: {
    short: 'The shape of the answer.',
    what: 'Prose, a table, JSON, numbered steps.',
    changes:
      'More than anything else you can add. It is the strongest single lever in every vendor guide.',
    when: 'Always. Forge writes it whether you fill it in or not.',
  },
  length: {
    short: 'How long the answer should be.',
    what: 'A word count, a number of paragraphs, or a hard cap.',
    changes:
      'Length, and indirectly depth. Reasoning effort does not shorten an answer: this does.',
    when: 'Whenever the answer keeps coming back longer than you want.',
  },
  rules: {
    short: 'The few things that must always hold.',
    what: 'Hard constraints, stated once each.',
    changes: 'Behaviour on the edge cases. A long list dilutes every rule in it.',
    when: 'Sparingly. Three specific rules outperform fifteen general ones.',
  },
  examples: {
    short: 'One answer that looks right.',
    what: 'A worked example of the output you want.',
    changes: 'Format adherence, sharply. One example beats a paragraph describing the format.',
    when: 'Whenever the shape matters and you can produce one. Include an edge case if you can.',
  },
  effort: {
    short: 'How hard the model should think.',
    what: 'The reasoning budget, which every vendor now exposes under a different name.',
    changes: 'Depth, latency and cost. It does not change how long the visible answer is.',
    when: 'Raise it for genuinely hard work. The documented rule is to use the lowest that works.',
    example: {
      low: 'Fast, cheap, fine for extraction.',
      high: 'Slow, expensive, better on hard problems.',
    },
  },
  cTask: {
    short: 'What to build or change.',
    what: 'The change, specifically enough that someone else could do it.',
    changes: 'Everything. Vagueness here is what produces a plausible-looking wrong diff.',
    when: 'Always.',
  },
  cStack: {
    short: 'What the code is built on.',
    what: 'Language, framework, database, test runner, and how the repo is laid out.',
    changes: 'Whether the code fits the project or arrives in a different dialect.',
    when: 'Always, unless the agent can already see it.',
  },
  cScope: {
    short: 'What to leave alone.',
    what: 'The files, directories or systems that must not be touched.',
    changes:
      'How much collateral change you get. This is the single highest-value line in agent prompting.',
    when: 'Always. Without it, working code gets refactored on the way past.',
  },
  cCheck: {
    short: 'How anyone knows it worked.',
    what: 'A command that exits zero, not a description of success.',
    changes:
      'Whether the agent can tell done from nearly done. Without it, it cannot, and neither can you.',
    when: 'Always. A success criterion that cannot be run is not one.',
  },
  cPattern: {
    short: 'Something in the repo to copy.',
    what: 'An existing file that already does this well.',
    changes: 'Consistency, cheaply. It carries conventions no instruction would think to state.',
    when: 'Whenever such a file exists.',
  },
  aApp: {
    short: 'What the app does.',
    what: 'The product in a sentence or two, from the user’s side.',
    changes: 'The whole architecture the builder reaches for.',
    when: 'Always.',
  },
  aScreens: {
    short: 'What to build in this pass.',
    what: 'The single slice being built now, not the whole product.',
    changes:
      'Whether you get a working slice or an app-shaped demo. Every builder in this category says the same thing.',
    when: 'Always. One screen per prompt.',
  },
  aData: {
    short: 'The data model.',
    what: 'The entities, their fields and how they relate.',
    changes: 'Everything downstream. Screens hang off the data model, not the other way round.',
    when: 'Always, and before the screens.',
  },
  aStyle: {
    short: 'What it should look like.',
    what: 'The look in design vocabulary: weight, spacing, radius, contrast.',
    changes: 'The visual result. "Make it nicer" changes nothing.',
    when: 'Whenever the look matters. Use real design words or expect the house default.',
  },
  rQuestion: {
    short: 'The question to answer.',
    what: 'What you actually want to know, as a question.',
    changes: 'Everything. A topic produces a summary, a question produces an answer.',
    when: 'Always.',
  },
  rDecision: {
    short: 'The decision this feeds.',
    what: 'What you will do differently depending on the answer.',
    changes:
      'What the model prioritises, more than any other line in a research prompt. It turns a summary into an argument.',
    when: 'Always, if there is one.',
  },
  rScope: {
    short: 'The boundaries of the search.',
    what: 'Dates, regions, source types.',
    changes:
      'What is included and what is ignored. Every tool is weak on recent events without one.',
    when: 'Always. State the date range explicitly.',
  },
  rGaps: {
    short: 'What to do when the evidence is missing.',
    what: 'The instruction for a gap: say so, or estimate, or stop.',
    changes: 'Whether you get an honest gap or a plausible-sounding invention.',
    when: 'Always. All three deep-research modes reward this being explicit.',
  },
  rFormat: {
    short: 'What the deliverable is.',
    what: 'A cited brief, a comparison table, a timeline, an annotated source list.',
    changes: 'The structure, and therefore how usable the result is.',
    when: 'Always. Fixing the structure up front saves a second pass.',
  },
};
