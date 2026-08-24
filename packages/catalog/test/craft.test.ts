import { describe, expect, it } from 'vitest';
import { MODELS } from '../src/models';
import { modelById } from '../src/models/registry';
import { forge } from '../src/engine';
import type { Brief } from '../src/types';

/**
 * The judgement, as tests.
 *
 * These came out of a bench of ten real briefs forged against all 57 models and read against what
 * a person would write. Every rule here is a match Forge lost: a mood that ignored the subject, a
 * studio light dropped into a sunlit room, camera language on a line drawing, a label where a
 * sentence belongs, and meta-text inside the thing you paste. The bench briefs live in
 * scripts/bench-briefs.mjs; these are the ones that regress.
 */

const espresso: Brief = {
  subject: 'a matte black espresso machine',
  setting: 'a concrete kitchen counter in soft morning light',
  medium: 'photograph',
  purpose: 'e-commerce hero image',
};

const boxer: Brief = {
  subject: 'a retired boxer taping his hands',
  setting: 'a basement gym at 6am',
  medium: 'photograph',
  purpose: 'social',
};

const fox: Brief = {
  subject: 'a fox reading a folded paper map',
  setting: 'a mossy forest clearing',
  medium: 'ink line art',
  mood: ['playful'],
};

const barista: Brief = {
  subject: 'a barista in a linen apron',
  setting: 'a sunlit cafe counter',
  action: 'she pours a rosetta into a flat white, then slides it across the counter',
  purpose: 'social',
};

describe('the mood reads the subject, not only the channel', () => {
  it('does not call an espresso machine triumphant', () => {
    const out = forge(espresso, modelById('midjourney'), 'simple');
    expect(out.flat).not.toMatch(/triumphant/i);
    // A product shot carries no invented mood at all: the object is the mood.
    expect(out.autoFilled.map((a) => a.field)).not.toContain('mood');
  });

  it('does not call a boxer alone at 6am playful, whatever the channel', () => {
    const out = forge(boxer, modelById('midjourney'), 'simple');
    expect(out.flat).not.toMatch(/playful/i);
    expect(out.flat).toMatch(/austere|melancholic/i);
  });

  it('still lets the channel decide when the subject says nothing', () => {
    const out = forge(barista, modelById('veo'), 'simple');
    expect(out.flat).toMatch(/playful|warm|calm/i);
  });

  it('does not pace a quiet scene like an advert', () => {
    const out = forge(
      { ...boxer, action: 'he wraps one hand, then looks up at the camera' },
      modelById('veo'),
      'simple',
    );
    expect(out.flat).not.toMatch(/escalating|urgent/i);
  });
});

describe('the light defers to the setting', () => {
  it('does not put a softbox in a sunlit cafe', () => {
    const out = forge(barista, modelById('veo'), 'simple');
    expect(out.flat).not.toMatch(/softbox/i);
  });

  it('does not put a softbox on a midnight street', () => {
    const out = forge(
      {
        subject: 'a night courier on a cargo bike',
        setting: 'wet London streets after midnight',
        action: 'he hands over the parcel',
      },
      modelById('veo'),
      'simple',
    );
    expect(out.flat).not.toMatch(/softbox/i);
  });

  it('still lights a scene whose setting says nothing about light', () => {
    const out = forge(
      { subject: 'a chess player mid-game', setting: 'a quiet club room', medium: 'photograph' },
      modelById('midjourney'),
      'simple',
    );
    expect(out.autoFilled.map((a) => a.field)).toContain('light');
  });
});

describe('camera craft belongs to camera media', () => {
  it('does not put a lens, an aperture or a grade on ink line art', () => {
    const out = forge(fox, modelById('midjourney'), 'simple');
    expect(out.flat).not.toMatch(/\b\d+mm\b|f\/\d|golden hour|grade/i);
    for (const field of ['lens', 'aperture', 'light', 'grade'] as const) {
      expect(
        out.autoFilled.map((a) => a.field),
        `autofilled ${field} onto line art`,
      ).not.toContain(field);
    }
  });

  it('keeps the camera for a photograph', () => {
    const out = forge(boxer, modelById('midjourney'), 'simple');
    expect(out.flat).toMatch(/\b\d+mm\b/);
  });
});

describe('the stated purpose does real work', () => {
  it('reads as a sentence, not a label', () => {
    const out = forge(espresso, modelById('midjourney'), 'simple');
    expect(out.flat).not.toMatch(/e-commerce hero image:/);
    expect(out.flat).toMatch(/For e-commerce hero image|For an e-commerce/);
  });

  it('gives a hero image negative space rather than a safety margin', () => {
    const out = forge(espresso, modelById('midjourney'), 'simple');
    expect(out.flat).toMatch(/negative space/i);
  });

  it('sets the aspect ratio when the purpose names the crop', () => {
    const story = forge(
      { subject: 'a runner at dawn', purpose: 'Instagram story', medium: 'photograph' },
      modelById('midjourney'),
      'simple',
    );
    expect(story.flat).toContain('--ar 9:16');
    const banner = forge(espresso, modelById('midjourney'), 'simple');
    expect(banner.flat).toContain('--ar 16:9');
  });

  it('never picks an aspect the model does not offer', () => {
    // Veo offers only 16:9 and 9:16, so a carousel purpose must not invent 4:5.
    const out = forge(
      { subject: 'a runner', action: 'she runs', purpose: 'Instagram carousel' },
      modelById('veo'),
      'simple',
    );
    expect(out.flat).not.toContain('4:5');
  });
});

describe('a person does not repeat themselves', () => {
  it('says negative space once, not once from the composition and once from the purpose', () => {
    const out = forge(espresso, modelById('midjourney'), 'simple');
    expect(out.flat.toLowerCase().split('negative space').length - 1).toBe(1);
  });

  it('folds the pacing into the mood sentence instead of leaving a one-word stub', () => {
    const out = forge(barista, modelById('veo'), 'simple');
    // "Playful in feeling, escalating." rather than "Playful in feeling. Escalating."
    expect(out.flat).not.toMatch(/in feeling\. [A-Z][a-z]+\.$/);
    expect(out.flat).toMatch(/in feeling, [a-z]/);
  });
});

describe('nothing but the prompt in the prompt', () => {
  it('keeps the Hailuo bracket token and drops the usage note', () => {
    const out = forge(barista, modelById('hailuo'), 'simple');
    expect(out.flat).toMatch(/\[(zoom|pan|static)\]/);
    expect(out.flat).not.toMatch(/Strip it before pasting|reads this bracket syntax/);
  });

  it('does not call an ambience bed foley', () => {
    const out = forge(
      { sound: 'rain starting on a tin roof', sfxKind: 'ambience bed' },
      modelById('el-sfx'),
      'simple',
    );
    expect(out.flat).not.toMatch(/foley/i);
    expect(out.flat).not.toMatch(/high-quality, professionally recorded/);
  });

  it('does not invent a mood for a sound', () => {
    const out = forge(
      { sound: 'rain starting on a tin roof', sfxKind: 'ambience bed' },
      modelById('el-sfx'),
      'simple',
    );
    expect(out.autoFilled.map((a) => a.field)).not.toContain('mood');
  });
});

describe('the system prompt knows a writing task from a reading task', () => {
  it('lets a writing task invent', () => {
    const out = forge(
      { goal: 'Write a cold outreach email to a CFO', context: 'A 12-person startup' },
      modelById('claude'),
      'simple',
    );
    expect(out.flat).not.toContain('say so rather than filling the gap');
    expect(out.flat).toMatch(/invent freely/i);
  });

  it('keeps a reading task grounded', () => {
    const out = forge(
      { goal: 'Summarise the attached tenancy agreement', context: 'A 40-page PDF' },
      modelById('claude'),
      'simple',
    );
    expect(out.flat).toContain('say so rather than filling the gap');
  });
});

describe('a model documented as different is written differently', () => {
  const courier: Brief = {
    subject: 'a night courier on a cargo bike',
    setting: 'wet London streets after midnight',
    action: 'he checks the address, then hands over the parcel',
    duration: '10s',
    vaudio: 'Rain on tarmac. No music.',
  };

  it('writes Runway in its own template: camera of subject, action, in environment', () => {
    const out = forge(courier, modelById('runway'), 'simple');
    expect(out.flat).toMatch(/of a night courier on a cargo bike\./i);
    expect(out.flat).toMatch(/, in wet London streets after midnight\./);
  });

  it("holds Seedance's camera back until the performance is told", () => {
    const out = forge(courier, modelById('seedance'), 'simple');
    const camera = out.flat.indexOf('dolly');
    const action = out.flat.indexOf('hands over the parcel');
    expect(camera).toBeGreaterThan(action);
    expect(out.flat).toContain('paced to fill the full');
  });

  it("labels Veo's audio line, which its own note calls the documented syntax", () => {
    const out = forge(courier, modelById('veo'), 'simple');
    expect(out.flat).toContain('SFX and ambience: Rain on tarmac. No music.');
  });

  it('writes Wan and Luma as narrative, which their own notes ask for', () => {
    for (const id of ['wan', 'luma'] as const) {
      const out = forge(courier, modelById(id), 'simple');
      expect(out.flat, id).toMatch(/framed as a/i);
    }
  });

  it('no longer emits one identical string across the prose video models', () => {
    const flats = new Set(
      (['veo', 'runway', 'seedance', 'luma', 'wan', 'higgsfield'] as const).map(
        (id) => forge(courier, modelById(id), 'simple').flat,
      ),
    );
    expect(flats.size).toBeGreaterThanOrEqual(4);
  });
});

describe('a medium brings its own technique', () => {
  it('gives ink line art its working method instead of a lens', () => {
    const out = forge(fox, modelById('midjourney'), 'simple');
    expect(out.flat).toContain('Confident line weight with controlled hatching');
  });

  it('gives every listed medium a technique and every camera medium none', () => {
    for (const [medium, want] of [
      ['oil painting', 'impasto'],
      ['flat vector', 'no gradients'],
      ['risograph print', 'misregistration'],
      ['pencil study', 'construction lines'],
    ] as const) {
      const out = forge({ subject: 'a fox', medium }, modelById('midjourney'), 'simple');
      expect(out.flat, medium).toContain(want);
    }
    const photo = forge(
      { subject: 'a fox', medium: 'photograph' },
      modelById('midjourney'),
      'simple',
    );
    expect(photo.flat).not.toMatch(/line weight|impasto|misregistration/);
  });

  it('carries the technique into the tag and JSON grammars too', () => {
    const tags = forge(fox, modelById('sdxl'), 'simple');
    expect(tags.flat).toContain('confident line weight');
    const json = forge(fox, modelById('ideogram'), 'simple');
    expect(json.flat).toContain('confident line weight');
  });

  it('invents nothing about the scene: technique speaks of the medium only', () => {
    const out = forge(fox, modelById('midjourney'), 'simple');
    // No background colour, no paper, nothing that could contradict the mossy clearing.
    expect(out.flat).not.toMatch(/white background|paper texture|canvas/i);
  });
});

describe('the music tokens follow the vendor order', () => {
  const track: Brief = {
    mGenre: ['bossa nova'],
    mMood: ['nostalgic'],
    mInst: ['nylon-string guitar'],
    mBpm: '120',
    mProd: ['vinyl crackle'],
  };

  it("writes Lyria in Google's formula: genre, mood, instrumentation, tempo", () => {
    const flat = forge(track, modelById('lyria'), 'simple').flat;
    expect(flat).toBe('bossa nova, nostalgic, nylon-string guitar, 120 BPM, vinyl crackle');
  });

  it("writes Stable Audio in Stability's order: style, instruments, mood, details", () => {
    const flat = forge(track, modelById('stableaudio'), 'simple').flat;
    expect(flat).toBe('bossa nova, nylon-string guitar, nostalgic, vinyl crackle, 120 BPM');
  });

  it('keeps Suno on its own documented order, which is the default', () => {
    const flat = forge(track, modelById('suno'), 'simple').flat;
    expect(flat).toBe('bossa nova, 120 BPM, nylon-string guitar, vinyl crackle, nostalgic');
  });

  it('always the same tokens: order is the only thing a flag may change', () => {
    const ids = ['lyria', 'stableaudio', 'el-music', 'suno', 'generic-music'] as const;
    const sorted = ids.map((id) =>
      forge(track, modelById(id), 'simple').flat.split(', ').sort().join('|'),
    );
    expect(new Set(sorted).size).toBe(1);
  });
});

describe('facts fetched from the vendors, this round', () => {
  it('writes Midjourney Video as motion only, which its own note documents', () => {
    const out = forge(barista, modelById('mjvideo'), 'simple');
    // Only the motion is pasted; the still carries the look.
    expect(out.flat).not.toContain('linen apron');
    expect(out.flat).toContain('pours a rosetta');
    // And nothing typed is lost: the subject lives in the start-frame block.
    expect(out.blocks.map((b) => b.body).join(' ')).toContain('linen apron');
  });

  it('names the Higgsfield preset instead of shrugging "nearest named preset"', () => {
    const out = forge(barista, modelById('higgsfield'), 'simple');
    const preset = out.settings.find((r) => r.name === 'Camera preset');
    expect(preset?.value).toBe('Super Dolly In');
  });

  it('builds the Hume acting line from what was given, and never invents one', () => {
    const given = forge(
      { script: 'We need to move, now!', vTone: ['urgent'], vTexture: ['gravelly'] },
      modelById('hume'),
      'advanced',
    );
    const direction = given.blocks.find((b) => b.label === 'Direction');
    expect(direction?.body).toContain('urgent, gravelly');
    const bare = forge({ script: 'We need to move, now!' }, modelById('hume'), 'advanced');
    const bareDirection = bare.blocks.find((b) => b.label === 'Direction');
    expect(bareDirection?.body ?? '').not.toContain('measured, warm');
  });

  it('carries the punctuation guidance the vendors document, as notes', () => {
    for (const [id, want] of [
      ['el-tts', 'ellipses add pauses'],
      ['cartesia', 'MM/DD/YYYY'],
      ['hume', 'excited but whispering'],
    ] as const) {
      expect(modelById(id).notes.join(' ')).toContain(want);
    }
  });
});

describe('round seven: three more vendors, read and obeyed', () => {
  const courier7: Brief = {
    subject: 'a night courier on a cargo bike',
    setting: 'wet London streets after midnight',
    action: 'he checks the address, then hands over the parcel',
    shots: '2',
    duration: '8s',
  };

  it('writes Kling in its official formula: subject, movement, scene, then camera', () => {
    const flat = forge(courier7, modelById('kling'), 'simple').flat;
    const first = flat.split('\n')[0] ?? '';
    expect(first.indexOf('courier')).toBeLessThan(first.indexOf('Camera:'));
    expect(first.indexOf('midnight')).toBeLessThan(first.indexOf('Camera:'));
  });

  it('writes LTX as one flowing paragraph, never the shot list its guide forbids', () => {
    const out = forge(courier7, modelById('ltx'), 'simple');
    expect(out.flat).not.toMatch(/Shot 1:/);
    expect(out.flat).not.toContain('\n');
    // The character arrives before the pronouns that refer to it.
    expect(out.flat.indexOf('courier')).toBeLessThan(out.flat.indexOf('He checks'));
  });

  it('writes a voice design in the documented order, language first', () => {
    const flat = forge(
      {
        lang: 'en-GB',
        voiceChar: 'a weathered man in his sixties',
        vArch: 'noir detective',
        vTone: ['weary'],
      },
      modelById('el-voicedesign'),
      'advanced',
    ).flat;
    expect(flat.startsWith('Native en-GB.')).toBe(true);
    expect(flat).toContain('Persona: noir detective.');
    expect(flat).toContain('Emotion: weary.');
  });
});

describe('round eight: the arrangement in the vendor syntax', () => {
  it('turns a written arrangement into Suno metatags carrying the user words', () => {
    const out = forge(
      { mGenre: ['indie rock'], mStruct: 'quiet verse, building pre-chorus, huge chorus' },
      modelById('suno'),
      'advanced',
    );
    const tags = out.blocks.find((b) => b.label === 'Lyrics field metatags');
    expect(tags?.body).toBe('[Verse: quiet] [Pre-Chorus: building] [Chorus: huge]');
  });

  it('emits a bare section tag when the user gave no descriptor', () => {
    const out = forge(
      { mGenre: ['ambient'], mStruct: 'intro, chorus, outro' },
      modelById('suno'),
      'advanced',
    );
    expect(out.blocks.find((b) => b.label === 'Lyrics field metatags')?.body).toBe(
      '[Intro] [Chorus] [Outro]',
    );
  });

  it('passes an arrangement naming no known section through untouched', () => {
    const out = forge(
      { mGenre: ['ambient'], mStruct: 'slow build over three minutes' },
      modelById('suno'),
      'advanced',
    );
    expect(out.blocks.find((b) => b.label === 'Lyrics field metatags')?.body).toBe(
      'slow build over three minutes.',
    );
  });

  it('leaves the other music models writing prose arrangements', () => {
    const out = forge(
      { mGenre: ['ambient'], mStruct: 'quiet verse, huge chorus' },
      modelById('el-music'),
      'advanced',
    );
    expect(out.blocks.find((b) => b.label === 'Arrangement')?.body).toBe(
      'quiet verse, huge chorus.',
    );
  });
});

describe('the coding grammar works the way a senior works', () => {
  it('tells a bug task to reproduce the failure before changing anything', () => {
    const out = forge({ cTask: 'Fix the flaky checkout test' }, modelById('claudecode'), 'simple');
    expect(out.flat).toMatch(/[Rr]eproduce/);
    // And the reproduction comes before the plan, because that is the order the work happens in.
    expect(out.flat.indexOf('eproduce')).toBeLessThan(out.flat.indexOf('plan'));
  });

  it('gives a risky task a rollback line', () => {
    const out = forge(
      { cTask: 'Migrate the user table to UUIDs with zero downtime' },
      modelById('cursor'),
      'simple',
    );
    expect(out.flat).toMatch(/roll ?back/i);
  });

  it('makes the agent ask for the done-check when none was given', () => {
    const out = forge(
      { cTask: 'Add CSV export to the reports page' },
      modelById('claudecode'),
      'simple',
    );
    expect(out.flat).toMatch(/propose the check|ask.*before implementing/i);
    // And when a check was given, no asking: the answer is already there.
    const given = forge(
      { cTask: 'Add CSV export', cCheck: 'The export test passes' },
      modelById('claudecode'),
      'simple',
    );
    expect(given.flat).not.toMatch(/propose the check/i);
  });

  it('a plain feature task with a check stays lean: no bug or rollback boilerplate', () => {
    const out = forge(
      { cTask: 'Add dark mode to the settings screen', cCheck: 'Both themes screenshot-tested' },
      modelById('cursor'),
      'simple',
    );
    expect(out.flat).not.toMatch(/reproduce|roll ?back/i);
  });
});

describe('small finish', () => {
  it('ends the app brief first line like the others', () => {
    const out = forge(
      { aApp: 'an invoice-chasing tool for freelancers' },
      modelById('v0'),
      'simple',
    );
    const first = out.flat.split('\n')[0] ?? '';
    expect(first.endsWith('.')).toBe(true);
  });

  it('every autofilled why is still a sentence a person learns from', () => {
    for (const model of MODELS.filter((m) => m.category === 'image').slice(0, 3)) {
      const out = forge(boxer, model, 'simple');
      for (const chosen of out.autoFilled) {
        expect(chosen.why.length).toBeGreaterThan(10);
        expect(chosen.why).not.toContain('—');
      }
    }
  });
});

describe('subject classes', () => {
  // The day a bare "a dragon" got a softbox and a calm mood is the day these were written.
  it('a creature is shot from below with a rim of light and its menace intact', () => {
    const r = forge({ subject: 'a dragon' }, modelById('nanobanana'), 'simple');
    expect(r.flat).toContain('low angle');
    expect(r.flat).toContain('rim light');
    expect(r.flat).toContain('menacing');
    expect(r.flat).not.toContain('softbox');
  });

  it('a built place gets width and raking light', () => {
    const r = forge({ subject: 'a football stadium' }, modelById('nanobanana'), 'simple');
    expect(r.flat).toContain('wide shot');
    expect(r.flat).toContain('golden hour');
    expect(r.flat).toContain('leading lines');
  });

  it('a machine gets the hero angle', () => {
    const r = forge({ subject: 'a spaceship' }, modelById('nanobanana'), 'simple');
    expect(r.flat).toContain('low angle');
    expect(r.flat).toContain('rim light');
  });

  it('the user words still outrank the class', () => {
    const r = forge(
      { subject: 'a dragon', setting: 'a sunlit meadow at noon' },
      modelById('nanobanana'),
      'simple',
    );
    // LIGHT_IN_SETTING: the user named the light, so no rim light lands on top of it.
    expect(r.flat).not.toContain('rim light');
  });
});
