import { describe, expect, it } from 'vitest';
import { FIELDS, MODELS, TERM_LIST } from '@forge/catalog';
import { nearest, parseArgs } from '../src/args';
import { run } from '../src/run';

/**
 * The command line holds no facts of its own: model names, field names, glossary terms and the flag
 * list all come out of the catalogue. So these tests are mostly about that, and about every way a
 * person can get an invocation wrong getting a sentence back rather than a stack trace.
 */

describe('parsing an argument list', () => {
  it('reads the three shapes a flag comes in', () => {
    expect(
      parseArgs(['build', 'veo', '--subject', 'a dragon', '--json', '--mode=advanced']),
    ).toEqual({
      command: 'build',
      positional: ['veo'],
      flags: { subject: 'a dragon', json: true, mode: 'advanced' },
    });
  });

  it('lets a value start with a dash after a bare --', () => {
    expect(parseArgs(['doctor', '--', '--no blur, 8k']).positional).toEqual(['--no blur, 8k']);
  });

  it('treats a flag followed by another flag as a bare flag', () => {
    expect(parseArgs(['models', '--json', '--category', 'image']).flags).toEqual({
      json: true,
      category: 'image',
    });
  });

  it('keeps an empty value rather than turning it into a bare flag', () => {
    expect(parseArgs(['build', 'veo', '--subject=']).flags).toEqual({ subject: '' });
  });
});

describe('suggesting the nearest name', () => {
  it('finds a near miss', () => {
    expect(nearest('subjct', ['subject', 'setting'])).toBe('subject');
    expect(nearest('midjurney', ['midjourney', 'veo'])).toBe('midjourney');
  });

  it('says nothing rather than guessing wildly', () => {
    expect(nearest('completely-different', ['subject', 'setting'])).toBeUndefined();
  });
});

describe('forge, with nothing to do', () => {
  it('prints help for no arguments, for help and for --help', () => {
    for (const argv of [[], ['help'], ['build', '--help']]) {
      const result = run(argv);
      expect(result.code).toBe(0);
      expect(result.out).toContain('forge build <model>');
    }
  });

  it('names a version', () => {
    expect(run(['--version']).out).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('suggests the command that was meant', () => {
    const result = run(['buidl', 'veo']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('Did you mean build');
  });
});

describe('forge build', () => {
  it('writes a prompt in the grammar of the model it was given', () => {
    const result = run(['build', 'midjourney', '--subject', 'a dragon breathing fire']);
    expect(result.code).toBe(0);
    expect(result.out).toContain('dragon');
    // Midjourney carries its parameters on the end of the prompt itself.
    expect(result.out).toContain('--ar');
    expect(result.out).toMatch(/Score \d+/);
  });

  it('writes a different grammar for a different model, from the same subject', () => {
    const image = run(['build', 'midjourney', '--subject', 'a dragon']).out;
    const music = run(['build', 'suno', '--mGenre', 'shoegaze', '--subject', 'a dragon']).out;
    expect(image).not.toBe(music);
  });

  it('takes every field the model reads as a flag, straight from the catalogue', () => {
    const model = MODELS.find((m) => m.id === 'midjourney');
    if (model === undefined) throw new Error('midjourney is missing');
    for (const id of [...model.core, ...model.craft]) {
      const field = FIELDS[id];
      if (field.type !== 'text' && field.type !== 'area') continue;
      const result = run(['build', 'midjourney', '--subject', 'a dragon', `--${id}`, 'something']);
      expect(result.code, `--${id} was refused`).toBe(0);
    }
  });

  it('splits a chip field on commas, which is how a shell gives several values', () => {
    const result = run([
      'build',
      'midjourney',
      '--subject',
      'a dragon',
      '--mode',
      'advanced',
      '--light',
      'softbox key camera-left,Rembrandt lighting',
      '--json',
    ]);
    expect(result.code).toBe(0);
    // Both values arrive, and the composer capitalises the clause it starts.
    expect(result.out).toContain('Softbox key camera-left, Rembrandt lighting');
  });

  it('refuses a flag that is not a field, and suggests one that is', () => {
    const result = run(['build', 'midjourney', '--subjct', 'a dragon']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('There is no field called subjct');
    expect(result.err).toContain('Did you mean --subject');
  });

  it('says when a field is real but this model does not read it', () => {
    const result = run(['build', 'midjourney', '--subject', 'a dragon', '--mGenre', 'shoegaze']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('does not read --mGenre');
    expect(result.err).toContain('forge models --fields midjourney');
  });

  it('refuses a flag given no value', () => {
    expect(run(['build', 'midjourney', '--subject']).err).toContain('--subject needs a value');
  });

  it('asks for something to work with rather than forging an empty brief', () => {
    const result = run(['build', 'midjourney']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('--subject');
  });

  it('suggests the model that was meant', () => {
    expect(run(['build', 'midjurney', '--subject', 'x']).err).toContain('Did you mean midjourney');
  });

  it('refuses a mode that is neither', () => {
    expect(run(['build', 'midjourney', '--subject', 'x', '--mode', 'sideways']).err).toContain(
      'simple or advanced',
    );
  });

  it('gives Simple mode fewer decisions than Advanced, here as well', () => {
    const simple: unknown = JSON.parse(
      run(['build', 'midjourney', '--subject', 'a dragon', '--json']).out,
    );
    const advanced: unknown = JSON.parse(
      run(['build', 'midjourney', '--subject', 'a dragon', '--mode', 'advanced', '--json']).out,
    );
    const chosen = (v: unknown): number => (v as { autoFilled: unknown[] }).autoFilled.length;
    expect(chosen(simple)).toBeGreaterThan(chosen(advanced));
  });

  it('gives a script the whole result as JSON', () => {
    const parsed: unknown = JSON.parse(
      run(['build', 'veo', '--subject', 'a dragon', '--json']).out,
    );
    const result = parsed as { model: string; prompt: string; settings: unknown[]; score: number };
    expect(result.model).toBe('veo');
    expect(result.prompt.length).toBeGreaterThan(0);
    expect(result.settings.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('forge doctor', () => {
  it('scores a bad prompt and names the dead weight', () => {
    const result = run(['doctor', 'a cool picture of a robot, 8k, masterpiece, trending']);
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/Score \d+/);
    expect(result.out).toContain('NOT DOING ANY WORK');
    expect(result.out.toLowerCase()).toContain('8k');
  });

  it('takes a prompt beginning with a dash, after a bare --', () => {
    const result = run(['doctor', '--', '--no blur, a robot in a city']);
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/Score \d+/);
  });

  it('needs a prompt', () => {
    expect(run(['doctor']).err).toContain('needs a prompt');
  });
});

describe('forge match', () => {
  it('splits a job that needs three kinds of model into three answers', () => {
    const result = run(['match', 'a 30 second advert with a voiceover and a music bed']);
    expect(result.code).toBe(0);
    const parsed: unknown = JSON.parse(
      run(['match', 'a 30 second advert with a voiceover and a music bed', '--json']).out,
    );
    expect((parsed as { groups: unknown[] }).groups.length).toBeGreaterThan(1);
  });

  it('falls through to the sensible default when it cannot read the job at all', () => {
    // The engine never shrugs: a job it does not recognise gets each category's own default,
    // which is more useful than an empty list and is what the website does too.
    const result = run(['match', 'zzzz']);
    expect(result.code).toBe(0);
    expect(result.out).toContain('midjourney');
  });
});

describe('forge models', () => {
  it('lists the whole catalogue', () => {
    const result = run(['models']);
    expect(result.code).toBe(0);
    for (const model of MODELS) expect(result.out).toContain(model.id);
  });

  it('filters by category, and refuses one that does not exist', () => {
    const image = run(['models', '--category', 'image']).out;
    expect(image).toContain('midjourney');
    expect(image).not.toContain('suno');
    expect(run(['models', '--category', 'sculpture']).err).toContain(
      'no category called sculpture',
    );
  });

  it('lists the flags a model reads, which is what --fields is for', () => {
    const result = run(['models', '--fields', 'suno']);
    expect(result.code).toBe(0);
    expect(result.out).toContain('--mGenre');
    expect(result.out).not.toContain('--lens');
  });

  it('gives a script the catalogue as JSON', () => {
    const parsed: unknown = JSON.parse(run(['models', '--json']).out);
    expect((parsed as unknown[]).length).toBe(MODELS.length);
  });
});

describe('forge explain', () => {
  it('explains a term by its label', () => {
    const result = run(['explain', 'aperture']);
    expect(result.code).toBe(0);
    expect(result.out).toContain('Changes:');
    expect(result.out).toContain('Use it:');
  });

  it('explains a term by its id', () => {
    const first = TERM_LIST[0];
    if (first === undefined) throw new Error('the glossary is empty');
    expect(run(['explain', first.id]).code).toBe(0);
  });

  it('suggests the term that was meant', () => {
    const result = run(['explain', 'apreture']);
    expect(result.code).toBe(1);
    expect(result.err).toContain('Did you mean aperture');
  });

  it('needs a term', () => {
    expect(run(['explain']).err).toContain('needs a term');
  });
});

describe('the wording, everywhere', () => {
  it('never apologises and never uses an em dash', () => {
    const said = [
      run([]).out,
      run(['buidl']).err,
      run(['build', 'midjourney']).err,
      run(['build', 'midjourney', '--subjct', 'x']).err,
      run(['explain', 'apreture']).err,
      run(['models', '--category', 'nope']).err,
      run(['doctor']).err,
    ];
    for (const text of said) {
      expect(text).not.toMatch(/sorry|apolog/i);
      expect(text).not.toContain('—');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('says nothing about buying anything', () => {
    const help = run([]).out.toLowerCase();
    for (const word of ['price', 'plan', 'upgrade', 'subscription', 'trial', 'billing']) {
      expect(help).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});
