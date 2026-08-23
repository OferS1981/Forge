import { describe, expect, it } from 'vitest';
import { analysePixels, briefFromStats, measurementRows, nearestRatio } from '../src/engine/image';
import { modelById } from '../src/models/registry';
import type { ImageStats } from '../src/types';

/** Build an RGBA buffer of one flat colour. */
function flat(w: number, h: number, r: number, g: number, b: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

/** A checkerboard, which is the densest edge pattern there is. */
function checker(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = (x + y) % 2 === 0 ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  return data;
}

describe('nearestRatio', () => {
  it('names the exact ratios exactly', () => {
    expect(nearestRatio(1000, 1000)).toBe('1:1');
    expect(nearestRatio(1920, 1080)).toBe('16:9');
    expect(nearestRatio(1080, 1920)).toBe('9:16');
    expect(nearestRatio(1200, 1500)).toBe('4:5');
  });

  it('picks the closest supported ratio for anything in between', () => {
    expect(nearestRatio(1000, 1010)).toBe('1:1');
    expect(nearestRatio(3000, 1280)).toBe('21:9');
  });

  it('refuses to divide by zero', () => {
    expect(nearestRatio(0, 100)).toBe('1:1');
    expect(nearestRatio(100, 0)).toBe('1:1');
  });
});

describe('analysePixels', () => {
  it('reads a bright flat image as high-key, flat and desaturated', () => {
    const s = analysePixels(flat(8, 8, 230, 230, 230), 8, 8, 1600, 1600);
    expect(s.key).toBe('high-key');
    expect(s.contrast).toBe('flat, low contrast');
    expect(s.satWord).toBe('desaturated');
    expect(s.temp).toBe('neutral');
    expect(s.detail).toBe('clean, minimal detail');
    expect(s.mean).toBeGreaterThan(0.8);
    expect(s.sd).toBeCloseTo(0, 5);
  });

  it('reads a dark flat image as low-key', () => {
    const s = analysePixels(flat(8, 8, 20, 20, 20), 8, 8, 800, 600);
    expect(s.key).toBe('low-key');
    expect(s.ratio).toBe('4:3');
  });

  it('calls a warm image warm and a cool one cool', () => {
    expect(analysePixels(flat(4, 4, 200, 120, 60), 4, 4, 100, 100).temp).toBe('warm');
    expect(analysePixels(flat(4, 4, 60, 120, 200), 4, 4, 100, 100).temp).toBe('cool');
  });

  it('reads saturation from the chroma, not the brightness', () => {
    expect(analysePixels(flat(4, 4, 255, 0, 0), 4, 4, 10, 10).satWord).toBe('saturated');
    expect(analysePixels(flat(4, 4, 128, 128, 128), 4, 4, 10, 10).satWord).toBe('desaturated');
  });

  it('reads a checkerboard as dense detail and high contrast', () => {
    const s = analysePixels(checker(16, 16), 16, 16, 512, 512);
    expect(s.detail).toBe('dense detail throughout');
    expect(s.contrast).toBe('high contrast');
    expect(s.dens).toBeGreaterThan(0.9);
  });

  it('reports the natural size, not the buffer it measured', () => {
    const s = analysePixels(flat(4, 4, 128, 128, 128), 4, 4, 4000, 3000);
    expect(s.width).toBe(4000);
    expect(s.height).toBe(3000);
  });

  it('quantises a palette and returns it as hex', () => {
    const s = analysePixels(flat(4, 4, 11, 61, 46), 4, 4, 100, 100);
    expect(s.top[0]).toMatch(/^#[0-9a-f]{6}$/);
    expect(s.top[0]).toBe('#0b3d2e');
  });

  it('survives an empty buffer without dividing by zero', () => {
    const s = analysePixels(new Uint8ClampedArray(0), 0, 0, 0, 0);
    expect(Number.isFinite(s.mean)).toBe(true);
    expect(Number.isFinite(s.dens)).toBe(true);
    expect(s.top).toEqual([]);
  });
});

const STATS: ImageStats = {
  width: 1600,
  height: 900,
  ratio: '16:9',
  mean: 0.2,
  sd: 0.3,
  sat: 0.6,
  dens: 0.35,
  top: ['#0b3d2e', '#c0430a', '#f2f2ef', '#191512', '#848377', '#655c52'],
  key: 'low-key',
  contrast: 'high contrast',
  satWord: 'saturated',
  temp: 'warm',
  detail: 'dense detail throughout',
};

describe('briefFromStats', () => {
  it('fills only what the pixels justify, and never the subject', () => {
    const b = briefFromStats({}, modelById('midjourney'), STATS);
    expect(b.aspect).toBe('16:9');
    expect(b.palette).toBe('#0b3d2e, #c0430a, #f2f2ef, #191512');
    expect(b.grade).toBe('warm highlights, cool shadows');
    expect(b.light).toEqual(['low-key']);
    expect(b.comp).toBe('foreground occlusion');
    expect(b.shot).toEqual(['wide shot']);
    // The one thing a browser cannot see is the one thing it does not invent.
    expect(b.subject).toBe('the subject in the reference');
  });

  it('leaves what the user already said alone', () => {
    const b = briefFromStats(
      { subject: 'A retired boxer', medium: 'oil painting', palette: 'brand green' },
      modelById('midjourney'),
      STATS,
    );
    expect(b.subject).toBe('A retired boxer');
    expect(b.medium).toBe('oil painting');
    expect(b.palette).toBe('brand green');
  });

  it('adds the motion a video model needs and an image model does not', () => {
    const video = briefFromStats({}, modelById('veo'), STATS);
    expect(video.action).toBe('the scene holds, with slow ambient motion');
    expect(video.camMove).toBe('slow dolly in');
    expect(briefFromStats({}, modelById('midjourney'), STATS).camMove).toBeUndefined();
  });

  it('works with no image at all, because a text file is also a reference', () => {
    const b = briefFromStats({ subject: 'A quiet street' }, modelById('midjourney'));
    expect(b.subject).toBe('A quiet street');
    expect(b.aspect).toBeUndefined();
    expect(b.avoid).toBe('watermarks, borders, text artefacts');
  });

  it('chooses a close-up and a portrait lens for a clean, simple image', () => {
    const clean: ImageStats = { ...STATS, dens: 0.05, key: 'high-key', sat: 0.1, temp: 'cool' };
    const b = briefFromStats({}, modelById('midjourney'), clean);
    expect(b.shot).toEqual(['close-up']);
    expect(b.lens).toBe('85mm portrait');
    expect(b.aperture).toBe('f/1.4, creamy bokeh');
    expect(b.light).toEqual(['high-key']);
  });
});

describe('measurementRows', () => {
  it('says what was measured and how', () => {
    const rows = measurementRows(STATS);
    expect(rows).toHaveLength(7);
    expect(rows[0]?.value).toBe('1600 by 900 px');
    expect(rows[0]?.why).toContain('16:9');
    expect(rows.map((r) => r.name)).toContain('Detail density');
    for (const r of rows) expect(r.why.length).toBeGreaterThan(0);
  });
});
