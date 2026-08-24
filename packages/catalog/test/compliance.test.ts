import { describe, expect, it } from 'vitest';
import {
  compliance,
  decompose,
  diagnoseRefusal,
  parseRefusal,
  rights,
  splitHalves,
} from '../src/engine';
import { modelById } from '../src/models/registry';

/**
 * The golden cases the phase's definition of done names: a named artist, a negative construction,
 * a Midjourney --no split, an EU person-generation case, and a free-tier rights case. Snapshots,
 * so a wording drift is a red build, same as the composers.
 */
describe('compliance golden cases', () => {
  it('a named artist gets the decomposition, not a scolding', () => {
    const findings = compliance({ ref: 'in the style of Hayao Miyazaki' }, modelById('gptimage'));
    expect(findings).toMatchSnapshot();
    const artist = findings.find((f) => f.id.startsWith('proper-noun'));
    expect(artist).toBeDefined();
    expect(artist?.severity).toBe('caution');
    expect(artist?.decompose).toEqual({ term: 'Hayao Miyazaki', category: 'image' });
    expect(artist?.detail).toContain('refuses living artists by name');
    expect(artist?.detail).toContain('dial');
  });

  it('a negative construction is rewritten positively', () => {
    const findings = compliance(
      { subject: 'a hospital ward with no blood anywhere' },
      modelById('sdxl'),
    );
    expect(findings).toMatchSnapshot();
    const neg = findings.find((f) => f.id.startsWith('negative'));
    expect(neg).toBeDefined();
    expect(neg?.detail).toContain('"no blood" contains "blood"');
    expect(neg?.rewrite).toContain('positive description');
  });

  it('a multi-word --no on Midjourney warns with the vendor-documented split', () => {
    const findings = compliance(
      { subject: 'a medieval market', avoid: 'watermarks, modern clothing' },
      modelById('midjourney'),
    );
    expect(findings).toMatchSnapshot();
    const split = findings.find((f) => f.id === 'mj-no-split');
    expect(split).toBeDefined();
    expect(split?.severity).toBe('caution');
    expect(split?.detail).toContain('"no modern" plus "no clothing"');
  });

  it('children on a Google surface get the regional wall, before submission', () => {
    const findings = compliance(
      { subject: 'children playing football in a park' },
      modelById('veo'),
    );
    expect(findings).toMatchSnapshot();
    const wall = findings.find((f) => f.id === 'google-person-generation');
    expect(wall).toBeDefined();
    expect(wall?.severity).toBe('high');
    expect(wall?.detail).toContain('EU, UK, Switzerland and MENA');
    expect(wall?.detail).toContain('no rewrite exists');
  });

  it('a free-tier rights trap surfaces without any trigger words at all', () => {
    const findings = compliance(
      { subject: 'a product shot of a ceramic mug' },
      modelById('recraft'),
    );
    expect(findings).toMatchSnapshot();
    const trap = findings.find((f) => f.id === 'rights-surprise');
    expect(trap).toBeDefined();
    expect(trap?.detail).toContain('Recraft owns the output');
  });
});

describe('compliance stays quiet when there is nothing to say', () => {
  it('an empty brief returns no findings', () => {
    expect(compliance({}, modelById('midjourney'))).toEqual([]);
  });

  it('an ordinary brief on an ordinary model returns no findings', () => {
    expect(
      compliance(
        { subject: 'a retired boxer taping his hands in a basement gym', medium: 'photograph' },
        modelById('sdxl'),
      ),
    ).toEqual([]);
  });

  it('craft vocabulary with a person inside it is not a name', () => {
    const findings = compliance({ mood: ['moody', 'Rembrandt lighting'] }, modelById('sdxl'));
    expect(findings.filter((f) => f.id.startsWith('proper-noun'))).toEqual([]);
  });

  it('never blocks: every finding is advice with a severity, not a verdict', () => {
    const findings = compliance(
      { ref: 'in the style of Wes Anderson', subject: 'no clutter, horrific mess' },
      modelById('midjourney'),
    );
    for (const f of findings) {
      expect(['note', 'caution', 'high']).toContain(f.severity);
      expect(f.detail.length).toBeGreaterThan(20);
    }
  });
});

describe('the vendor-specific voices', () => {
  it('suno says stripped, not blocked', () => {
    const [f] = compliance({ mGenre: ['sounds like Taylor Swift'] }, modelById('suno'));
    expect(f?.detail).toContain('silently deletes the name');
  });

  it('el-music says contractually prohibited', () => {
    const [f] = compliance({ mGenre: ['sounds like Frank Ocean'] }, modelById('el-music'));
    expect(f?.detail).toContain('contractually prohibits');
  });

  it('a shower on midjourney quotes their own list', () => {
    const findings = compliance(
      { subject: 'a man singing in the shower' },
      modelById('midjourney'),
    );
    const f = findings.find((x) => x.id === 'mj-domestic');
    expect(f?.detail).toContain('people in showers, on toilets');
  });

  it('a register-worthy brief without a purpose is offered the one clause', () => {
    const findings = compliance(
      { subject: 'a surgical incision being sutured' },
      modelById('gptimage'),
    );
    const f = findings.find((x) => x.id === 'register');
    expect(f).toBeDefined();
    expect(f?.field).toBe('purpose');
    // and with the purpose filled, the finding clears
    const cleared = compliance(
      {
        subject: 'a surgical incision being sutured',
        purpose: 'a clinical reference figure for a nursing textbook',
      },
      modelById('gptimage'),
    );
    expect(cleared.find((x) => x.id === 'register')).toBeUndefined();
  });
});

describe('decompose', () => {
  it('visual categories get the eight axes', () => {
    const s = decompose('Hayao Miyazaki', 'image');
    expect(s.kind).toBe('visual');
    expect(s.axes).toHaveLength(8);
    expect(s.note).toContain('one dial you cannot turn');
  });

  it('audio categories get the nine axes', () => {
    const s = decompose('Frank Ocean', 'music');
    expect(s.kind).toBe('audio');
    expect(s.axes).toHaveLength(9);
    expect(s.axes.map((a) => a.id)).toContain('genre');
  });

  it('prefills only what the category itself implies', () => {
    const voice = decompose('someone', 'voice');
    expect(voice.axes.find((a) => a.id === 'instrumentation')?.prefill).toContain('a single voice');
    const image = decompose('someone', 'image');
    expect(image.axes.every((a) => a.prefill === undefined)).toBe(true);
  });
});

describe('rights', () => {
  it('recraft leads with the trap', () => {
    const r = rights(modelById('recraft'));
    expect(r.owner).toContain('depends on your tier');
    expect(r.owner).toContain('no commercial rights');
    expect(r.indemnified).toContain('No');
  });

  it('suno explains the retroactive caps in the export line', () => {
    const r = rights(modelById('suno'));
    expect(r.exportNote).toContain('retroactive');
    expect(r.exportNote).toContain('7 lifetime');
    expect(r.unverified).toBe(true);
  });

  it('an honest disclose line for a vendor with no persistence warranty', () => {
    const r = rights(modelById('higgsfield'));
    expect(r.disclose).toContain('add your own disclosure');
  });

  it('openai reads clean', () => {
    const r = rights(modelById('gptimage'));
    expect(r.owner).toContain('You own the output');
    expect(r.indemnified).toContain('Copyright Shield');
    expect(r.unverified).toBe(false);
  });
});

describe('the refusal engine', () => {
  it('reads a Vertex RAI input code and names the layer', () => {
    const read = parseRefusal('Blocked. Reason code: 61493863.');
    expect(read.codes).toEqual([{ code: '61493863', category: 'Violence', side: 'input' }]);
    expect(read.layer).toBe('input-classifier');
    expect(diagnoseRefusal(read, null).fix).toContain('Change the word');
  });

  it('a hard-line category refuses wordsmithing outright', () => {
    // Section 0 of the manual, binding: no vocabulary advice on child or sexual categories,
    // whatever the layer. The legitimate routes are the documented capability ones.
    const read = parseRefusal('Blocked. Reason code: 58061214.');
    const d = diagnoseRefusal(read, true);
    expect(d.name).toContain('hard line');
    expect(d.fix).toContain('Do not rephrase around this one');
    expect(d.fix).not.toContain('Change the word');
  });

  it('an explicit output code outranks the every-time answer', () => {
    const read = parseRefusal('raiReason 56562880');
    expect(diagnoseRefusal(read, true).layer).toBe('output-classifier');
  });

  it('reads an output code and points at the depiction', () => {
    const read = parseRefusal('raiReason 56562880');
    expect(read.layer).toBe('output-classifier');
    expect(diagnoseRefusal(read, null).fix).toContain('medium');
  });

  it('knows a capability gate is not a content judgement', () => {
    const read = parseRefusal(
      'Generating images containing people is currently an allowlist-only feature.',
    );
    expect(read.capabilityGate).toBe(true);
    expect(diagnoseRefusal(read, null).fix).toContain('No rewrite fixes this');
  });

  it('the one question picks the fix when there is no code', () => {
    const read = parseRefusal('I cannot assist with that.');
    expect(read.layer).toBe('unknown');
    expect(diagnoseRefusal(read, true).layer).toBe('input-classifier');
    expect(diagnoseRefusal(read, false).layer).toBe('model');
    expect(diagnoseRefusal(read, null).layer).toBe('unknown');
  });

  it('bisect splits at the sentence boundary nearest the middle', () => {
    const [a, b] = splitHalves(
      'A fox runs through birch trees. The light is cold. Snow is falling on the hills.',
    );
    expect(a).toBe('A fox runs through birch trees.');
    expect(b).toBe('The light is cold. Snow is falling on the hills.');
    const [c, d] = splitHalves('one two three four');
    expect(c).toBe('one two');
    expect(d).toBe('three four');
  });
});

describe('the adversarial round, pinned', () => {
  it('a baby blue car and a school of fish are not children', () => {
    expect(
      compliance({ subject: 'a baby blue vintage car on a coast road' }, modelById('veo')),
    ).toEqual([]);
    expect(
      compliance({ subject: 'a school of fish turning as one' }, modelById('nanobanana')),
    ).toEqual([]);
  });

  it('actual children still meet the wall', () => {
    const findings = compliance(
      { subject: 'toddlers chasing pigeons in a square' },
      modelById('veo'),
    );
    expect(findings.find((f) => f.id === 'google-person-generation')).toBeDefined();
  });

  it('a real person as the subject is flagged for publicity, not style', () => {
    const findings = compliance(
      { subject: 'a portrait of Taylor Swift on stage' },
      modelById('gptimage'),
    );
    const f = findings.find((x) => x.id.startsWith('proper-noun'));
    expect(f).toBeDefined();
    expect(f?.detail).toContain('right of publicity');
  });

  it('a possessive name is one finding, not two', () => {
    const findings = compliance({ mGenre: ["sounds like Adele's voice"] }, modelById('suno'));
    expect(findings.filter((f) => f.id.startsWith('proper-noun'))).toHaveLength(1);
  });

  it('suno surfaces the ownership surprise AND the retroactive export cap', () => {
    const findings = compliance({ subject: 'a folk song about tides' }, modelById('suno'));
    expect(findings.find((f) => f.id === 'rights-surprise')).toBeDefined();
    expect(findings.find((f) => f.id === 'rights-export')?.detail).toContain('retroactive');
  });

  it('a "without" construction is quoted as written, never misquoted as "no"', () => {
    const findings = compliance(
      { subject: 'a field without weeds under a big sky' },
      modelById('sdxl'),
    );
    const f = findings.find((x) => x.id.startsWith('negative'));
    expect(f?.detail).toContain('"without weeds"');
    expect(f?.detail).not.toContain('"no weeds"');
  });
});
