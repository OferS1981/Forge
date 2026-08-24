import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { build } from 'vite';
import { BATTLES } from './battle-briefs.mjs';

/**
 * The judge: my prompt-review rubric, executable.
 *
 * Ten battles per model, 570 per round. Each battle holds Forge's output to the bars a senior
 * prompt reviewer applies by hand: nothing lost, nothing invented, nothing contradictory, nothing
 * repeated, the vendor's own grammar where one is documented, and the craft a professional adds
 * without being asked. A battle is won only when every bar passes; one miss is a loss with the
 * reason named, so a round's losses are a worklist rather than a number.
 *
 *   node scripts/judge.mjs            the round, per category and total
 *   node scripts/judge.mjs --losses   every lost battle with its reasons
 */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const r = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    ssr: true,
    lib: { entry: here('./refresh/audit-entry.ts'), formats: ['es'], fileName: 'a' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const out = Array.isArray(r) ? r[0].output : r.output;
const code = out.find((c) => c.type === 'chunk').code;
const cat = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const words = (t) =>
  t
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3);

/** The moods that clash: an output carrying words from opposed sets contradicts itself. */
const CLASHES = [
  [/\b(austere|melancholic|sombre|weary|menacing|tense)\b/i, /\b(playful|whimsical|bubbly)\b/i],
  [/\bsunlit|sunrise|sunset|golden hour|daylight\b/i, /\bsoftbox|studio light\b/i],
  [/\bmidnight|night\b/i, /\bsoftbox\b/i],
  [/\bphotograph\b/i, /\billustration\b/i],
];

const DEAD =
  /\b(masterpiece|8k|best quality|highly detailed|award[- ]winning|trending on artstation|ultra[- ]realistic|hyper[- ]detailed)\b/i;

function judge(model, brief, result) {
  const reasons = [];
  const flat = result.flat;
  const everything = [flat, ...result.blocks.map((b) => b.body), result.negative ?? ''].join('\n');
  const lower = everything.toLowerCase();

  // 1. Nothing the user typed is lost.
  for (const value of Object.values(brief)) {
    for (const text of Array.isArray(value) ? value : [value]) {
      for (const w of words(text)) {
        if (!lower.includes(w)) {
          reasons.push(`lost "${w}"`);
          break;
        }
      }
    }
  }

  // 2. Nothing invented about the subject: no dead-weight quality words either way.
  if (DEAD.test(flat)) reasons.push('dead-weight quality words');

  // 3. No self-contradiction.
  for (const [a, b] of CLASHES) {
    if (a.test(flat) && b.test(flat)) reasons.push(`contradiction: ${String(a)} vs ${String(b)}`);
  }

  // 4. No sentence said twice, no meta-text, no placeholder shipped.
  const lines = flat
    .split(/(?<=[.!?])\s+/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.split(' ').length >= 4);
  if (new Set(lines).size !== lines.length) reasons.push('a sentence repeats');
  if (/paste this|strip it|forge\b/i.test(flat)) reasons.push('meta-text in the prompt');
  if (/state the task here|describe the/i.test(flat) && Object.keys(brief).length > 0)
    reasons.push('placeholder shipped');
  if (flat.includes('undefined') || flat.includes('[object')) reasons.push('broken interpolation');
  if (/—/.test(flat)) reasons.push('em dash');

  // 5. The vendor's documented grammar, where the catalogue records one.
  const notes = model.notes.join(' ').toLowerCase();
  if (
    model.videoOrder === 'action-in-environment' &&
    brief.subject &&
    brief.action &&
    (brief.camMove || brief.shot || model.category === 'video')
  ) {
    const first = words(brief.subject)[0];
    const ofAt = flat.toLowerCase().indexOf(' of ');
    const subjectAt = first ? flat.toLowerCase().indexOf(first) : -1;
    if (first && (ofAt < 0 || subjectAt < ofAt)) reasons.push('runway template order missed');
  }
  if (
    model.motionOnly &&
    brief.subject &&
    flat.toLowerCase().includes(words(brief.subject).slice(-1)[0] ?? '')
  ) {
    reasons.push('motion-only prompt carries the subject');
  }
  if (
    model.structureTags &&
    brief.mStruct &&
    /verse|chorus|intro|outro|bridge/i.test(brief.mStruct)
  ) {
    if (!/\[(Verse|Chorus|Intro|Outro|Pre-Chorus|Bridge|Breakdown)/.test(everything))
      reasons.push('metatags missing');
  }
  if (model.audioLabels && brief.vaudio && !flat.includes('SFX and ambience:'))
    reasons.push('audio label missing');
  if (
    notes.includes('shot list') &&
    notes.includes('do not use') === false &&
    model.grammar === 'prose' &&
    /Shot 1:/.test(flat)
  ) {
    reasons.push('shot list where prose documented');
  }

  // 6. The craft a professional adds unprompted, in Simple mode.
  if (model.category === 'image' || model.category === 'video') {
    const scene = [brief.subject, brief.setting, brief.action]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (/night|midnight|6am|dark|alone|rain|fog|wasteland/.test(scene) && /playful/i.test(flat)) {
      reasons.push('mood ignores a sombre scene');
    }
  }
  if (
    model.category === 'image' &&
    typeof brief.medium === 'string' &&
    !/photo|cinematic|render|film/.test(brief.medium)
  ) {
    if (/\b\d+mm\b|f\/\d/.test(flat)) reasons.push('camera craft on non-camera medium');
  }
  // A purpose that names a crop gets the crop, when the model offers aspects at all.
  if (typeof brief.purpose === 'string' && model.aspects?.length) {
    const p = brief.purpose.toLowerCase();
    const offered = new Set(model.aspects.map((a) => a.value));
    const settings =
      result.settings.map((row) => `${row.name}=${row.value}`).join(' ') +
      ' ' +
      result.autoFilled.map((a) => a.value).join(' ') +
      ' ' +
      flat;
    if (/story|reel|tiktok|vertical/.test(p) && offered.has('9:16') && !settings.includes('9:16'))
      reasons.push('story purpose but no 9:16');
    if (/carousel/.test(p) && offered.has('4:5') && !settings.includes('4:5'))
      reasons.push('carousel purpose but no 4:5');
  }

  // 7. The coding bars: what I do without thinking, so Forge must too.
  if (model.category === 'code' && typeof brief.cTask === 'string') {
    const task = brief.cTask.toLowerCase();
    if (/\b(fix|flaky|failing|bug|broken|crash)\b/.test(task) && !/reproduce/i.test(flat)) {
      reasons.push('bug task without reproduce-first');
    }
    if (
      /\b(migrat|upgrade|zero downtime|refactor across|monorepo)\b/.test(task) &&
      !/roll ?back|revert path/i.test(flat)
    ) {
      reasons.push('risky task without a rollback line');
    }
    if (!brief.cCheck && !/ask|propose.*check|before implementing/i.test(flat)) {
      reasons.push('no done-check and the agent is never told to ask for one');
    }
  }
  // The app grammar has the same duty: a pass with no scope fence invites scope creep.
  if (
    model.category === 'app' &&
    typeof brief.aApp === 'string' &&
    !brief.aScreens &&
    !/restate|wait/i.test(flat)
  ) {
    reasons.push('unscoped app brief without a restate-and-wait gate');
  }

  // 8. The record is complete: a settings row never ships empty in advanced mode.
  for (const row of result.settings) {
    if (row.name.trim().length === 0 || String(row.value).trim().length === 0) {
      reasons.push(`empty settings row ${row.name || '?'}`);
    }
  }

  return reasons;
}

const showLosses = process.argv.includes('--losses');
const byCategory = {};
let won = 0;
let fought = 0;
const losses = [];
for (const model of cat.MODELS) {
  const bank = BATTLES[model.category] ?? [];
  for (const [i, wanted] of bank.entries()) {
    const reads = new Set([...model.core, ...model.craft, ...model.tech]);
    const brief = Object.fromEntries(Object.entries(wanted).filter(([k]) => reads.has(k)));
    if (Object.keys(brief).length === 0) continue;
    const result = cat.forge(brief, model, 'simple');
    const reasons = judge(model, brief, result);
    fought += 1;
    byCategory[model.category] ??= { won: 0, fought: 0 };
    byCategory[model.category].fought += 1;
    if (reasons.length === 0) {
      won += 1;
      byCategory[model.category].won += 1;
    } else {
      losses.push(`${model.id} #${i + 1}: ${reasons.join('; ')}`);
    }
  }
}
for (const [category, score] of Object.entries(byCategory)) {
  console.log(`${category.padEnd(10)} ${score.won}/${score.fought}`);
}
console.log(`TOTAL      ${won}/${fought}  (${((won / fought) * 100).toFixed(1)}%)`);
if (showLosses) for (const loss of losses) console.log('LOSS', loss);
writeFileSync(here('../battle-losses.txt'), losses.join('\n'));
