import type { Brief, ImageStats, Model } from '../types';
import { has } from '../compose/text';

/**
 * What a browser can honestly measure about a picture, and nothing it cannot. The canvas belongs
 * to the browser; the arithmetic does not, so this takes raw pixels and stays testable without
 * one. Ported from the prototype's analyser.
 *
 * None of this can see what the picture is *of*. That is the point, and the interface says so
 * rather than guessing.
 */

const RATIOS: readonly (readonly [string, number])[] = [
  ['1:1', 1],
  ['4:5', 0.8],
  ['5:4', 1.25],
  ['2:3', 0.667],
  ['3:2', 1.5],
  ['3:4', 0.75],
  ['4:3', 1.333],
  ['9:16', 0.5625],
  ['16:9', 1.778],
  ['21:9', 2.333],
  ['1:2', 0.5],
  ['2:1', 2],
];

/** The supported ratio closest to the real one, compared in log space so it is scale-free. */
export function nearestRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '1:1';
  const r = width / height;
  let best = RATIOS[0];
  let distance = Infinity;
  for (const candidate of RATIOS) {
    const d = Math.abs(Math.log(r / candidate[1]));
    if (d < distance) {
      distance = d;
      best = candidate;
    }
  }
  return best?.[0] ?? '1:1';
}

function hex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

interface Bin {
  n: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Measure a downscaled RGBA buffer. `width` and `height` describe the buffer; `naturalWidth` and
 * `naturalHeight` are the real dimensions of the source, which is what the user is told.
 */
export function analysePixels(
  data: Uint8ClampedArray | number[],
  width: number,
  height: number,
  naturalWidth: number,
  naturalHeight: number,
): ImageStats {
  const bins = new Map<string, Bin>();
  const lum: number[] = [];
  let lsum = 0;
  let l2 = 0;
  let ssum = 0;
  let n = 0;
  let warm = 0;
  let cool = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lum.push(L);
    lsum += L;
    l2 += L * L;
    n++;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    ssum += mx === 0 ? 0 : (mx - mn) / mx;
    if (r > b + 8) warm++;
    else if (b > r + 8) cool++;
    const key = `${String(r >> 5)},${String(g >> 5)},${String(b >> 5)}`;
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n++;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bins.set(key, bin);
  }

  // Edge density: how often neighbouring pixels differ in brightness. A proxy for detail.
  let edges = 0;
  for (let y = 0; y < height - 1; y++)
    for (let x = 0; x < width - 1; x++) {
      const i = y * width + x;
      const here = lum[i] ?? 0;
      if (Math.abs(here - (lum[i + 1] ?? 0)) + Math.abs(here - (lum[i + width] ?? 0)) > 0.16)
        edges++;
    }

  const mean = n === 0 ? 0 : lsum / n;
  const sd = n === 0 ? 0 : Math.sqrt(Math.max(0, l2 / n - mean * mean));
  const sat = n === 0 ? 0 : ssum / n;
  const cells = Math.max(1, (width - 1) * (height - 1));
  const dens = edges / cells;
  const top = [...bins.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((o) => hex(o.r / o.n, o.g / o.n, o.b / o.n));

  return {
    width: naturalWidth,
    height: naturalHeight,
    ratio: nearestRatio(naturalWidth, naturalHeight),
    mean,
    sd,
    sat,
    dens,
    top,
    key: mean > 0.62 ? 'high-key' : mean < 0.3 ? 'low-key' : 'mid-key',
    contrast: sd > 0.26 ? 'high contrast' : sd < 0.14 ? 'flat, low contrast' : 'normal contrast',
    satWord: sat > 0.5 ? 'saturated' : sat < 0.22 ? 'desaturated' : 'moderately saturated',
    temp: warm > cool * 1.3 ? 'warm' : cool > warm * 1.3 ? 'cool' : 'neutral',
    detail:
      dens > 0.28
        ? 'dense detail throughout'
        : dens < 0.1
          ? 'clean, minimal detail'
          : 'moderate detail',
  };
}

/**
 * Turn measurements into a brief, filling only what the pixels can justify and leaving the rest
 * for the user. Ported from the prototype. What the picture is of is never invented here.
 */
export function briefFromStats(brief: Brief, model: Model, stats?: ImageStats): Brief {
  const b: Brief = { ...brief };
  if (stats) {
    const aspects = model.aspects ?? [];
    const matched = aspects.find((o) => o.value.startsWith(stats.ratio)) ?? aspects[0];
    if (matched) b.aspect = matched.value;
    if (!has(b.palette)) b.palette = stats.top.slice(0, 4).join(', ');
    b.grade =
      stats.temp === 'warm'
        ? 'warm highlights, cool shadows'
        : stats.temp === 'cool'
          ? 'desaturated earth tones'
          : stats.satWord === 'saturated'
            ? 'teal and orange'
            : 'lifted matte blacks';
    b.light = [
      stats.key === 'low-key'
        ? 'low-key'
        : stats.key === 'high-key'
          ? 'high-key'
          : 'softbox key camera-left',
    ];
    b.comp = stats.dens > 0.28 ? 'foreground occlusion' : 'generous negative space';
    if (!has(b.medium))
      b.medium = stats.dens > 0.3 && stats.sat > 0.45 ? 'cinematic still' : 'photograph';
    b.aperture = stats.dens < 0.14 ? 'f/1.4, creamy bokeh' : 'f/5.6';
    if (!has(b.shot))
      b.shot = [stats.dens > 0.3 ? 'wide shot' : stats.dens < 0.08 ? 'close-up' : 'medium shot'];
    if (!has(b.lens)) b.lens = stats.dens < 0.14 ? '85mm portrait' : '35mm';
    if (!has(b.mood))
      b.mood = [stats.key === 'low-key' ? 'austere' : stats.sat > 0.5 ? 'playful' : 'calm'];
  }
  if (!has(b.subject)) b.subject = 'the subject in the reference';
  if (model.category === 'video') {
    if (!has(b.action)) b.action = 'the scene holds, with slow ambient motion';
    b.camMove = 'slow dolly in';
  }
  if (!has(b.avoid)) b.avoid = 'watermarks, borders, text artefacts';
  return b;
}

/** The measurements, as rows a table can render. */
export function measurementRows(stats: ImageStats): { name: string; value: string; why: string }[] {
  return [
    {
      name: 'Dimensions',
      value: `${String(stats.width)} by ${String(stats.height)} px`,
      why: `Nearest supported ratio: ${stats.ratio}`,
    },
    { name: 'Exposure key', value: stats.key, why: `Mean luminance ${stats.mean.toFixed(2)}` },
    { name: 'Contrast', value: stats.contrast, why: `Standard deviation ${stats.sd.toFixed(3)}` },
    { name: 'Saturation', value: stats.satWord, why: `Mean chroma ${stats.sat.toFixed(2)}` },
    { name: 'Temperature', value: stats.temp, why: 'From the warm and cool pixel balance' },
    {
      name: 'Detail density',
      value: stats.detail,
      why: `Edge density ${(stats.dens * 100).toFixed(1)} percent`,
    },
    {
      name: 'Dominant colours',
      value: stats.top.slice(0, 4).join('  '),
      why: 'Quantised, sorted by area',
    },
  ];
}
