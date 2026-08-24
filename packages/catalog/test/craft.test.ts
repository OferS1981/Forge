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
