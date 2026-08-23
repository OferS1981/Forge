import { describe, expect, it, vi } from 'vitest';
import { modelById } from '@forge/catalog';
import {
  AssistantBusy,
  AssistantFailed,
  AssistantUnavailable,
  KEY_NAME,
  createAssistant,
  createLimiter,
  createNullAssistant,
  createServerAssistant,
  describableFields,
  firstJsonObject,
  forgetKey,
  looksLikeKey,
  maskKey,
  readCritique,
  readDescription,
  readKey,
  writeKey,
  type Ask,
  type Transport,
} from '../src/index';

const MODEL = modelById('midjourney');

function fake(replies: string[]): Transport & { asked: Ask[] } {
  const asked: Ask[] = [];
  let i = 0;
  return {
    asked,
    ask: (input) => {
      asked.push(input);
      const reply = replies[Math.min(i, replies.length - 1)];
      i += 1;
      if (reply === undefined) return Promise.reject(new Error('no reply configured'));
      return Promise.resolve(reply);
    },
  };
}

function store(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    has: (k: string) => map.has(k),
  };
}

describe('the default, which is no assistant at all', () => {
  it('says it is unavailable rather than pretending', () => {
    expect(createNullAssistant().available).toBe(false);
  });

  it('rejects every method with a typed refusal, so a screen can tell it apart from a break', async () => {
    const none = createNullAssistant();
    await expect(none.describeImage(new Blob(['x']), MODEL)).rejects.toBeInstanceOf(
      AssistantUnavailable,
    );
    await expect(none.critique('a prompt', MODEL)).rejects.toBeInstanceOf(AssistantUnavailable);
    await expect(none.freeform({}, MODEL)).rejects.toBeInstanceOf(AssistantUnavailable);
  });

  it('never apologises, and says what to do', async () => {
    await createNullAssistant()
      .critique('x', MODEL)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '';
        expect(message).not.toMatch(/sorry|apolog|error/i);
        expect(message).not.toContain('—');
      });
  });
});

describe('the key', () => {
  it('is kept under one name, and one call removes it', () => {
    const s = store();
    expect(writeKey(s, 'sk-ant-not-a-real-key-000000')).toBe(true);
    expect(readKey(s)).toBe('sk-ant-not-a-real-key-000000');
    forgetKey(s);
    expect(readKey(s)).toBeNull();
    expect(s.has(KEY_NAME)).toBe(false);
  });

  it('refuses something that is obviously not a key, and keeps whatever was there', () => {
    const s = store({ [KEY_NAME]: 'sk-ant-not-a-real-key-000000' });
    expect(writeKey(s, 'hunter2')).toBe(false);
    expect(writeKey(s, 'a key with spaces in it, pasted wrong')).toBe(false);
    expect(readKey(s)).toBe('sk-ant-not-a-real-key-000000');
  });

  it('survives storage being denied entirely', () => {
    const denied = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(readKey(denied)).toBeNull();
    expect(writeKey(denied, 'sk-ant-not-a-real-key-000000')).toBe(false);
    expect(() => {
      forgetKey(denied);
    }).not.toThrow();
  });

  it('shows only the last four characters anywhere it is named', () => {
    const key = 'sk-ant-not-a-real-key-abcd';
    expect(maskKey(key)).toBe('the key ending abcd');
    expect(maskKey(key)).not.toContain('sk-ant');
  });

  it('accepts a key that does not look like this year one', () => {
    expect(looksLikeKey('a'.repeat(40))).toBe(true);
    expect(looksLikeKey('short')).toBe(false);
  });
});

describe('the rate limiter, which exists so a loop cannot burn their credit', () => {
  it('allows a burst and then makes you wait', () => {
    const clock = 0;
    const limiter = createLimiter({ perMinute: 60, burst: 3, now: () => clock });
    expect(limiter.take()).toBe(0);
    expect(limiter.take()).toBe(0);
    expect(limiter.take()).toBe(0);
    expect(limiter.take()).toBeGreaterThan(0);
  });

  it('refills steadily rather than all at once when a window turns over', () => {
    let clock = 0;
    const limiter = createLimiter({ perMinute: 60, burst: 3, now: () => clock });
    for (let i = 0; i < 3; i++) limiter.take();
    clock += 1000;
    expect(limiter.take()).toBe(0);
    expect(limiter.take()).toBeGreaterThan(0);
  });

  it('never lets the bucket grow past the burst, however long you wait', () => {
    let clock = 0;
    const limiter = createLimiter({ perMinute: 60, burst: 3, now: () => clock });
    clock += 10 * 60_000;
    expect(limiter.left()).toBe(3);
  });

  it('hands out nothing free when the clock goes backwards', () => {
    let clock = 10_000;
    const limiter = createLimiter({ perMinute: 60, burst: 2, now: () => clock });
    limiter.take();
    limiter.take();
    clock -= 60_000;
    expect(limiter.take()).toBeGreaterThan(0);
  });
});

describe('finding the answer inside whatever came back', () => {
  it('reads a bare object', () => {
    expect(firstJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('reads one wrapped in prose and a fence, which is what actually happens', () => {
    expect(firstJsonObject('Sure. ```json\n{"a":1}\n``` Hope that helps.')).toEqual({ a: 1 });
  });

  it('is not fooled by a brace inside a string', () => {
    expect(firstJsonObject('{"a":"} not the end"}')).toEqual({ a: '} not the end' });
    expect(firstJsonObject('{"a":"an escaped \\" quote {"}')).toEqual({
      a: 'an escaped " quote {',
    });
  });

  it('gives back null rather than throwing on nonsense', () => {
    expect(firstJsonObject('no json here')).toBeNull();
    expect(firstJsonObject('{ unclosed')).toBeNull();
    expect(firstJsonObject('{ not: json }')).toBeNull();
  });
});

describe('reading a described picture', () => {
  it('keeps fields the model actually has', () => {
    const read = readDescription(
      '{"summary":"A boxer in a gym.","brief":{"subject":"a retired boxer taping his hands"}}',
      MODEL,
    );
    expect(read?.summary).toBe('A boxer in a gym.');
    expect(read?.brief).toEqual({ subject: 'a retired boxer taping his hands' });
  });

  it('drops a field the catalogue does not know, rather than smuggling it into the brief', () => {
    const read = readDescription(
      '{"summary":"x","brief":{"subject":"a boxer","vibe":"gritty","mGenre":"shoegaze"}}',
      MODEL,
    );
    expect(read?.brief).toEqual({ subject: 'a boxer' });
  });

  it('drops a value that is not in that field own vocabulary', () => {
    const fields = describableFields(MODEL);
    const withOptions = fields.find((id) => id === 'lens' || id === 'grade');
    expect(withOptions).toBeDefined();
    const read = readDescription(
      `{"summary":"x","brief":{"${String(withOptions)}":"something the vocabulary has never heard of"}}`,
      MODEL,
    );
    expect(read?.brief).toEqual({});
  });

  it('refuses an answer with no summary, because an unexplained brief is not reviewable', () => {
    expect(readDescription('{"brief":{"subject":"a boxer"}}', MODEL)).toBeNull();
    expect(readDescription('not json', MODEL)).toBeNull();
  });
});

describe('reading a critique', () => {
  it('keeps findings and a suggestion', () => {
    expect(
      readCritique('{"findings":["No light named."],"suggestion":"Say where the sun is."}'),
    ).toEqual({ findings: ['No light named.'], suggestion: 'Say where the sun is.' });
  });

  it('drops anything that is not a sentence', () => {
    expect(readCritique('{"findings":["ok", 3, "", null],"suggestion":"x"}')?.findings).toEqual([
      'ok',
    ]);
  });

  it('is null when there is nothing in it', () => {
    expect(readCritique('{"findings":[],"suggestion":""}')).toBeNull();
    expect(readCritique('nope')).toBeNull();
  });
});

describe('the assistant, over a transport', () => {
  it('asks with the field menu of the model the workspace is targeting', async () => {
    const transport = fake(['{"summary":"A boxer.","brief":{"subject":"a boxer"}}']);
    const assistant = createAssistant({ transport });
    const out = await assistant.describeImage(
      new Blob(['fake bytes'], { type: 'image/png' }),
      MODEL,
    );
    expect(out.brief).toEqual({ subject: 'a boxer' });
    const asked = transport.asked[0];
    expect(asked?.system).toContain('subject');
    expect(asked?.parts[0]?.kind).toBe('image');
    // Only what is visible: the question itself has to forbid inventing.
    expect(asked?.system).toContain('Do not guess');
  });

  it('never asks the assistant to write a prompt', async () => {
    const transport = fake([
      '{"findings":["No light named."],"suggestion":"Say where the sun is."}',
    ]);
    await createAssistant({ transport }).critique('a robot, 8k', MODEL);
    expect(transport.asked[0]?.system).toContain('Never rewrite the prompt');
  });

  it('refuses a picture too large to be worth sending', async () => {
    const transport = fake(['{}']);
    const huge = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: 'image/png' });
    await expect(createAssistant({ transport }).describeImage(huge, MODEL)).rejects.toBeInstanceOf(
      AssistantFailed,
    );
    expect(transport.asked).toHaveLength(0);
  });

  it('stops a loop before it reaches the vendor at all', async () => {
    const clock = 0;
    const transport = fake(['{"findings":["x"],"suggestion":"y"}']);
    const assistant = createAssistant({ transport, perMinute: 60, burst: 2, now: () => clock });
    await assistant.critique('a', MODEL);
    await assistant.critique('b', MODEL);
    await expect(assistant.critique('c', MODEL)).rejects.toBeInstanceOf(AssistantBusy);
    expect(transport.asked).toHaveLength(2);
  });

  it('says how long to wait, in the sentence itself', async () => {
    const clock = 0;
    const assistant = createAssistant({
      transport: fake(['{"findings":["x"],"suggestion":"y"}']),
      perMinute: 6,
      burst: 1,
      now: () => clock,
    });
    await assistant.critique('a', MODEL);
    await assistant.critique('b', MODEL).catch((error: unknown) => {
      expect(error).toBeInstanceOf(AssistantBusy);
      expect((error as Error).message).toMatch(/Wait \d+ seconds/);
    });
  });

  it('turns a transport failure into one typed failure with a sentence', async () => {
    const transport: Transport = { ask: () => Promise.reject(new Error('401 unauthorized')) };
    await expect(createAssistant({ transport }).critique('a', MODEL)).rejects.toBeInstanceOf(
      AssistantFailed,
    );
  });

  it('says so when the answer is not a shape Forge can read, rather than guessing', async () => {
    const transport = fake(['I would rather write you an essay about photography.']);
    await expect(createAssistant({ transport }).critique('a', MODEL)).rejects.toBeInstanceOf(
      AssistantFailed,
    );
  });

  it('gives a freeform subject back as one line', async () => {
    const transport = fake(['  A retired boxer taping his hands.  ']);
    expect(await createAssistant({ transport }).freeform({ subject: 'a boxer' }, MODEL)).toBe(
      'A retired boxer taping his hands.',
    );
  });
});

describe('the server assistant, which nobody funds yet', () => {
  it('is honestly unavailable with no address, and is not a second null in disguise', async () => {
    const send = vi.fn();
    const assistant = createServerAssistant(null, send);
    expect(assistant.available).toBe(false);
    await expect(assistant.critique('a', MODEL)).rejects.toBeInstanceOf(AssistantUnavailable);
    expect(send).not.toHaveBeenCalled();
  });

  it('works the moment there is one, through the same interface', async () => {
    const send = vi.fn(() => Promise.resolve('{"findings":["x"],"suggestion":"y"}'));
    const assistant = createServerAssistant('https://ai.example/', send);
    expect(assistant.available).toBe(true);
    expect(await assistant.critique('a', MODEL)).toEqual({ findings: ['x'], suggestion: 'y' });
    expect(send).toHaveBeenCalledWith('https://ai.example/ask', expect.anything());
  });
});

describe('what a picture may be', () => {
  it('accepts the formats an assistant can actually read', async () => {
    const transport = fake(['{"summary":"A boxer.","brief":{}}']);
    // Four in a row is exactly the sort of burst the limiter is there to slow, so it is lifted.
    const assistant = createAssistant({ transport, perMinute: 600, burst: 10 });
    for (const type of ['image/png', 'image/jpeg', 'image/gif', 'image/webp']) {
      await expect(
        assistant.describeImage(new Blob(['x'], { type }), MODEL),
      ).resolves.toBeDefined();
    }
  });

  it('refuses one it cannot, and names the ones that work', async () => {
    const transport = fake(['{}']);
    await expect(
      createAssistant({ transport }).describeImage(new Blob(['x'], { type: 'image/bmp' }), MODEL),
    ).rejects.toThrow(/JPEG, PNG, GIF and WebP/);
    expect(transport.asked).toHaveLength(0);
  });
});
