import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

/**
 * The prototype's engine, evaluated in Node. The span from the vocabulary banks to the state
 * section is pure JavaScript and touches no DOM, so it runs unchanged. This is the reference the
 * port is measured against: if the ported engine and this disagree, the port is wrong.
 */

const here = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(here, '../../../../reference/forge.html');

export interface ProtoModel {
  id: string;
  n: string;
  cat: string;
  grammar: string;
  core: string[];
  craft: string[];
  tech: string[];
  wild?: true;
  aspects?: string[];
  durations?: string[];
  [key: string]: unknown;
}

export interface ProtoResult {
  blocks: [string, string][];
  flat: string;
  negative: string;
  settings: [string, string, string][];
  notes: string[];
  warn: string[];
  variations: { n: string; t: string }[];
  stripped: string[];
  score: number;
  axes: Record<string, number>;
}

interface ProtoApi {
  MODELS: ProtoModel[];
  forge: (brief: Record<string, unknown>, model: ProtoModel) => ProtoResult;
  diagnose: (text: string, model: ProtoModel) => Record<string, unknown>;
  rebuild: (text: string, model: ProtoModel) => Record<string, unknown>;
  F: Record<string, unknown>;
  V: Record<string, string[]>;
  HEAT: [number, string, string][];
  CATS: { id: string; n: string; c: string }[];
}

function load(): ProtoApi {
  const html = readFileSync(HTML, 'utf8');
  // The engine: vocabulary banks through forge(). Pure JavaScript, no DOM.
  const start = html.indexOf('const V = {');
  const end = html.indexOf('const store = {');
  if (start < 0 || end < 0)
    throw new Error('Could not find the prototype engine span in forge.html');
  const engine = html.slice(start, html.lastIndexOf('/* ==', end));
  // The Doctor: its lexicon, diagnose() and rebuild() are pure too, but sit in a DOM section.
  const docStart = html.indexOf('const LEX = {');
  const docEnd = html.indexOf('const MODEL_ROWS');
  if (docStart < 0 || docEnd < 0)
    throw new Error('Could not find the prototype doctor span in forge.html');
  const doctor = html.slice(docStart, docEnd);
  const code = `${engine}\n${doctor}`;
  const ctx: Record<string, unknown> = {};
  createContext(ctx);
  runInContext(`${code}\nthis.api = { MODELS, forge, diagnose, rebuild, F, V, HEAT, CATS };`, ctx);
  return ctx.api as ProtoApi;
}

export const PROTOTYPE = load();

export function protoModel(id: string): ProtoModel {
  const m = PROTOTYPE.MODELS.find((x) => x.id === id);
  if (!m) throw new Error(`Prototype has no model ${id}`);
  return m;
}
