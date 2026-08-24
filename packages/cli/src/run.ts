import {
  CATEGORIES,
  FIELDS,
  FIELD_LIST,
  MODELS,
  categoryById,
  diagnose,
  explain,
  findModel,
  forge,
  match,
  modelLabel,
  TERM_LIST,
  type Brief,
  type FieldId,
  type Mode,
  type Model,
} from '@forge/catalog';
import { nearest, parseArgs, present, value, type Parsed } from './args';

/**
 * The command line, as a pure function.
 *
 * No `process`, no `console`, no `exit`: an argument list in, an exit code and two strings out. The
 * pump in `apps/cli` is the only thing that knows what a terminal is, which means every command,
 * every error and every piece of wording here is tested in Node.
 *
 * It holds no facts. Model names, field names, glossary terms and even the flag list all come out
 * of the catalogue, so this file cannot drift from the product.
 */

export interface Result {
  code: number;
  out: string;
  err: string;
}

const ok = (out: string): Result => ({ code: 0, out, err: '' });
const fail = (err: string): Result => ({ code: 1, out: '', err });

const VERSION = '1.0.0';

const HELP = `forge, a prompt smithy

  forge build <model> [--<field> <value>]...   write a prompt in that model's grammar
  forge doctor <prompt> --model <model>        score a prompt and say what does no work
  forge match <job>                            find the models that are good at a job
  forge models [--category <id>]               the catalogue
  forge explain <term>                         what a term means

Common flags

  --mode simple|advanced|pro   how many choices Forge makes for you. Simple is the default
  --json                   machine-readable output, for a script or another tool
  --help                   this
  --version                the version of the catalogue this was built from

Every field in the catalogue is a flag. "forge models --fields <model>" lists the ones a
given model reads.`;

/** The fields a model actually reads, which is what its flags are. */
function fieldsOf(model: Model): FieldId[] {
  return [...model.core, ...model.craft, ...model.tech];
}

function briefFrom(model: Model, flags: Parsed['flags']): Brief | string {
  const allowed = new Set<string>(fieldsOf(model));
  const reserved = new Set(['mode', 'json', 'help', 'version', 'model', 'category', 'fields']);
  let brief: Brief = {};

  for (const [name, raw] of Object.entries(flags)) {
    if (reserved.has(name)) continue;
    if (!allowed.has(name)) {
      const suggestion = nearest(name, [...allowed]);
      const known = FIELD_LIST.some((f) => f.id === name)
        ? `${modelLabel(model)} does not read --${name}.`
        : `There is no field called ${name}.`;
      return [
        known,
        suggestion === undefined ? '' : `Did you mean --${suggestion}?`,
        `Run forge models --fields ${model.id} for the ones it does read.`,
      ]
        .filter((line) => line.length > 0)
        .join(' ');
    }
    if (raw === true) return `--${name} needs a value.`;
    const field = FIELDS[name as FieldId];
    // A chip field takes several values, and a comma is how a shell gives them.
    const parsed = field.type === 'chips' ? raw.split(',').map((v) => v.trim()) : raw;
    brief = { ...brief, [name]: parsed };
  }
  return brief;
}

/*
 * Two outcomes with their own names, rather than `Mode | string`. A mode is a string, so a union of
 * the two could not be told apart by reading it, and the compiler says so.
 */
function modeFrom(flags: Parsed['flags']): { mode: Mode } | { error: string } {
  const given = value(flags, 'mode');
  if (given === undefined) return { mode: 'simple' };
  if (given === 'simple' || given === 'advanced' || given === 'pro') return { mode: given };
  return { error: `--mode is simple or advanced, not ${given}.` };
}

function unknownModel(id: string): string {
  const suggestion = nearest(
    id,
    MODELS.map((m) => m.id),
  );
  return [
    `There is no model called ${id}.`,
    suggestion === undefined ? '' : `Did you mean ${suggestion}?`,
    'Run forge models for the catalogue.',
  ]
    .filter((line) => line.length > 0)
    .join(' ');
}

function buildCommand(parsed: Parsed): Result {
  const id = parsed.positional[0];
  if (id === undefined) return fail('forge build needs a model. Run forge models for the list.');
  const model = findModel(id);
  if (model === undefined) return fail(unknownModel(id));

  const mode = modeFrom(parsed.flags);
  if ('error' in mode) return fail(mode.error);

  const brief = briefFrom(model, parsed.flags);
  if (typeof brief === 'string') return fail(brief);

  const filled = model.core.some((field) => {
    const v = brief[field];
    return v !== undefined && (Array.isArray(v) ? v.length > 0 : v.trim().length > 0);
  });
  if (!filled) {
    return fail(
      `Give ${modelLabel(model)} something to work with: --${String(model.core[0])} "..." at least.`,
    );
  }

  const result = forge(brief, model, mode.mode);

  if (present(parsed.flags, 'json')) {
    return ok(
      JSON.stringify(
        {
          model: model.id,
          mode: mode.mode,
          score: result.score,
          prompt: result.flat,
          negative: result.negative,
          settings: result.settings.map((r) => ({ name: r.name, value: r.value, why: r.why })),
          autoFilled: result.autoFilled,
          warnings: result.warnings,
        },
        null,
        2,
      ),
    );
  }

  const lines = [result.flat, ''];
  if (result.negative !== null && result.negative.length > 0) {
    lines.push(`${model.negative.label ?? 'NEGATIVE'}: ${result.negative}`, '');
  }
  if (result.settings.length > 0) {
    lines.push('SETTINGS');
    for (const row of result.settings) lines.push(`  ${row.name}: ${row.value}`);
    lines.push('');
  }
  if (result.autoFilled.length > 0) {
    lines.push('FORGE CHOSE');
    for (const chosen of result.autoFilled) lines.push(`  ${chosen.value}, because ${chosen.why}`);
    lines.push('');
  }
  if (result.warnings.length > 0) {
    lines.push('WATCH OUT');
    for (const warning of result.warnings) lines.push(`  ${warning}`);
    lines.push('');
  }
  lines.push(`Score ${String(result.score)}`);
  return ok(lines.join('\n'));
}

function doctorCommand(parsed: Parsed): Result {
  const prompt = parsed.positional.join(' ').trim();
  if (prompt.length === 0) return fail('forge doctor needs a prompt to look at.');
  const id = value(parsed.flags, 'model') ?? 'midjourney';
  const model = findModel(id);
  if (model === undefined) return fail(unknownModel(id));

  const diagnosis = diagnose(prompt, model);
  if (present(parsed.flags, 'json')) return ok(JSON.stringify(diagnosis, null, 2));

  const lines = [`Score ${String(diagnosis.score)} for ${modelLabel(model)}`, ''];
  if (diagnosis.findings.length > 0) {
    lines.push('NOT DOING ANY WORK');
    for (const finding of diagnosis.findings) lines.push(`  ${finding}`);
    lines.push('');
  }
  if (diagnosis.working.length > 0) {
    lines.push('DOING WORK');
    for (const working of diagnosis.working) lines.push(`  ${working}`);
    lines.push('');
  }
  if (diagnosis.stripped.length > 0) {
    lines.push(`STRIPPED: ${diagnosis.stripped.join(', ')}`, '');
  }
  lines.push(`${String(diagnosis.words)} words`);
  return ok(lines.join('\n'));
}

function matchCommand(parsed: Parsed): Result {
  const job = parsed.positional.join(' ').trim();
  if (job.length === 0) return fail('forge match needs a job to match against.');
  const result = match(job);

  if (present(parsed.flags, 'json')) {
    return ok(
      JSON.stringify(
        {
          multi: result.multi,
          groups: result.groups.map((g) => ({
            category: g.category,
            job: g.job,
            models: g.models.map((m) => ({ id: m.model.id, score: m.score })),
          })),
        },
        null,
        2,
      ),
    );
  }

  /*
   * Match never comes back empty: a job it cannot read falls through to each category's own
   * default, which is more useful than a shrug. So there is no empty branch here to write.
   */
  const lines: string[] = [];
  for (const group of result.groups) {
    lines.push(group.job.toUpperCase());
    for (const entry of group.models) {
      lines.push(`  ${entry.model.id.padEnd(16)} ${modelLabel(entry.model)}`);
    }
    lines.push('');
  }
  return ok(lines.join('\n').trimEnd());
}

function modelsCommand(parsed: Parsed): Result {
  const fieldsOfModel = value(parsed.flags, 'fields');
  if (fieldsOfModel !== undefined) {
    const model = findModel(fieldsOfModel);
    if (model === undefined) return fail(unknownModel(fieldsOfModel));
    const lines = fieldsOf(model).map((id) => {
      const field = FIELDS[id];
      const options = field.options?.map((o) => o.value).join(', ');
      return `  --${id.padEnd(12)} ${field.label}${options === undefined ? '' : ` (${options})`}`;
    });
    return ok([`Fields ${modelLabel(model)} reads`, '', ...lines].join('\n'));
  }

  const only = value(parsed.flags, 'category');
  if (only !== undefined && !CATEGORIES.some((c) => c.id === only)) {
    return fail(
      `There is no category called ${only}. One of: ${CATEGORIES.map((c) => c.id).join(', ')}.`,
    );
  }
  const shown = MODELS.filter((m) => only === undefined || m.category === only);

  if (present(parsed.flags, 'json')) {
    return ok(
      JSON.stringify(
        shown.map((m) => ({
          id: m.id,
          name: modelLabel(m),
          version: m.version,
          category: m.category,
          grammar: m.grammar,
          unverified: m.unverified === true,
        })),
        null,
        2,
      ),
    );
  }

  const lines: string[] = [];
  for (const category of CATEGORIES) {
    const inCategory = shown.filter((m) => m.category === category.id);
    if (inCategory.length === 0) continue;
    lines.push(categoryById(category.id).name.toUpperCase());
    for (const model of inCategory) {
      lines.push(`  ${model.id.padEnd(16)} ${modelLabel(model)}  ${model.version}`);
    }
    lines.push('');
  }
  return ok(lines.join('\n').trimEnd());
}

function explainCommand(parsed: Parsed): Result {
  const wanted = parsed.positional.join(' ').trim();
  if (wanted.length === 0) return fail('forge explain needs a term. Try forge explain aperture.');

  const term =
    TERM_LIST.find((t) => t.id === wanted) ??
    TERM_LIST.find((t) => t.label.toLowerCase() === wanted.toLowerCase()) ??
    TERM_LIST.find((t) => t.id.endsWith(`.${wanted}`));
  if (term === undefined) {
    const suggestion = nearest(
      wanted,
      TERM_LIST.map((t) => t.label.toLowerCase()),
    );
    return fail(
      [
        `The glossary has nothing called ${wanted}.`,
        suggestion === undefined ? '' : `Did you mean ${suggestion}?`,
      ]
        .filter((line) => line.length > 0)
        .join(' '),
    );
  }

  const full = explain(term.id);
  if (full === undefined) return fail(`The glossary has nothing called ${wanted}.`);
  if (present(parsed.flags, 'json')) return ok(JSON.stringify(full, null, 2));

  const lines = [full.label, '', full.what, '', `Changes: ${full.changes}`, `Use it: ${full.when}`];
  if (full.range !== undefined) lines.push(`Range: ${full.range}`);
  if (full.example !== undefined) {
    lines.push(`Low: ${full.example.low}`, `High: ${full.example.high}`);
  }
  return ok(lines.join('\n'));
}

export function run(argv: readonly string[]): Result {
  const parsed = parseArgs(argv);

  if (present(parsed.flags, 'version')) return ok(VERSION);
  if (present(parsed.flags, 'help') || parsed.command === undefined || parsed.command === 'help') {
    return ok(HELP);
  }

  switch (parsed.command) {
    case 'build':
      return buildCommand(parsed);
    case 'doctor':
      return doctorCommand(parsed);
    case 'match':
      return matchCommand(parsed);
    case 'models':
      return modelsCommand(parsed);
    case 'explain':
      return explainCommand(parsed);
    default: {
      const suggestion = nearest(parsed.command, ['build', 'doctor', 'match', 'models', 'explain']);
      return fail(
        [
          `forge has no command called ${parsed.command}.`,
          suggestion === undefined ? '' : `Did you mean ${suggestion}?`,
          'Run forge --help.',
        ]
          .filter((line) => line.length > 0)
          .join(' '),
      );
    }
  }
}
