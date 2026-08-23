import { CATEGORIES } from './categories';
import { MODELS } from './models';
import type { CategoryId, Model } from './types';

/**
 * The half of the refresh pipeline that needs no model.
 *
 * Section 18 decides whether Forge is alive in a year: every month, per category, check what each
 * file claims against the vendor's own page, and open one pull request with a citation per change.
 * An agent does the reading. What it reads *from* is this: a list of the claims in a category that
 * a vendor page could contradict, each with the source that should settle it.
 *
 * Deterministic on purpose. The report is the same every run for the same catalogue, so a diff
 * between two months is a real change rather than a model's mood, and the whole thing is testable
 * with no key, no network and no agent.
 */

export interface Claim {
  modelId: string;
  modelName: string;
  /** What part of the file says it, so a diff can be pointed at one line. */
  field: string;
  /** The claim itself, in the file's own words. */
  says: string;
}

export interface ModelReport {
  id: string;
  name: string;
  version: string;
  verifiedOn: string;
  unverified: boolean;
  /** The vendor's own pages. A model with none cannot be checked and fails a test. */
  sources: { url: string; title: string; publisher: string }[];
  claims: Claim[];
}

export interface CategoryReport {
  category: CategoryId;
  categoryName: string;
  models: ModelReport[];
}

function settingClaims(model: Model): Claim[] {
  /*
   * The settings are a function of the brief, so they are read with an empty one: that is the
   * default state, which is exactly what a vendor's parameter page documents. A row's `why` is
   * included because that is where the ranges and defaults are written.
   */
  let rows: ReturnType<Model['settings']> = [];
  try {
    rows = model.settings({}, 'advanced');
  } catch {
    // A settings function that cannot run on an empty brief has nothing to check here.
    return [];
  }
  return rows.map((row) => ({
    modelId: model.id,
    modelName: model.name,
    field: `settings.${row.name}`,
    says:
      row.why.length > 0
        ? `${row.name} defaults to ${row.value}. ${row.why}`
        : `${row.name} defaults to ${row.value}`,
  }));
}

/** Everything in one model file that a vendor page could prove wrong. */
export function claimsFor(model: Model): Claim[] {
  const claim = (field: string, says: string): Claim => ({
    modelId: model.id,
    modelName: model.name,
    field,
    says,
  });

  const claims: Claim[] = [claim('version', `The current version is ${model.version}.`)];

  if (model.aspects !== undefined && model.aspects.length > 0) {
    claims.push(
      claim(
        'aspects',
        `The aspect ratios offered are ${model.aspects.map((a) => a.value).join(', ')}.`,
      ),
    );
  }
  if (model.durations !== undefined && model.durations.length > 0) {
    claims.push(
      claim(
        'durations',
        `The clip lengths offered are ${model.durations.map((d) => d.value).join(', ')}.`,
      ),
    );
  }

  // Some notes are the single word "none", which reads as a sentence fragment in a checklist.
  const note = /^(none|n\/a)?$/i.test(model.negative.note.trim()) ? '' : ` ${model.negative.note}`;
  claims.push(
    claim(
      'negative',
      model.negative.mode === 'none'
        ? `There is no negative prompt.${note}`
        : `The negative prompt is a ${model.negative.mode}${model.negative.label === undefined ? '' : ` called ${model.negative.label}`}.${note}`,
    ),
  );

  claims.push(...settingClaims(model));

  // A warning that names a version is the first thing to go stale.
  for (const warning of model.warnings) {
    if (/\bv\d|\b\d+\.\d/i.test(warning)) claims.push(claim('warnings', warning));
  }

  return claims;
}

export function reportFor(category: CategoryId): CategoryReport {
  const meta = CATEGORIES.find((c) => c.id === category);
  if (meta === undefined) throw new Error(`Unknown category: ${category}`);
  return {
    category,
    categoryName: meta.name,
    models: MODELS.filter((m) => m.category === category).map((model) => ({
      id: model.id,
      name: model.name,
      version: model.version,
      verifiedOn: model.verifiedOn,
      unverified: model.unverified === true,
      sources: model.sources.map((s) => ({ ...s })),
      claims: claimsFor(model),
    })),
  };
}

/** How old a report's checks are, so the workflow can say it rather than the reader working it out. */
export function daysSince(iso: string, today: string): number {
  const then = Date.parse(`${iso}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return 0;
  return Math.floor((now - then) / 86_400_000);
}

/**
 * The report as markdown, which is what the job summary shows and what the agent is given to work
 * from. One checkbox per claim, because the reviewer's job is to tick or change each one.
 */
export function reportAsMarkdown(report: CategoryReport, today: string): string {
  const lines: string[] = [
    `# Catalogue refresh: ${report.categoryName}`,
    '',
    `${String(report.models.length)} models. Every line below is something a vendor page could`,
    'prove wrong. Check each against the sources listed for that model, change what is out of date,',
    'cite the page you read, and bump `verifiedOn`. A human merges: never auto-merge a catalogue',
    'change.',
    '',
  ];

  for (const model of report.models) {
    lines.push(`## ${model.name} (\`${model.id}\`)`);
    lines.push('');
    lines.push(
      `Last checked ${model.verifiedOn}, ${String(daysSince(model.verifiedOn, today))} days ago.` +
        (model.unverified
          ? ' Marked unverified: nothing here has been confirmed against a page.'
          : ''),
    );
    lines.push('');
    if (model.sources.length === 0) {
      lines.push('**No source on file.** This model cannot be checked until one is added.');
    } else {
      lines.push('Sources:');
      for (const source of model.sources) {
        lines.push(`- [${source.title}](${source.url}), ${source.publisher}`);
      }
    }
    lines.push('');
    for (const claim of model.claims) {
      lines.push(`- [ ] \`${claim.field}\`: ${claim.says}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * The body of the pull request the workflow opens. It is written here, beside the report, because
 * the rules a reviewer has to hold are the same rules the report states, and two copies of them
 * would drift.
 */
export function pullRequestBody(reports: CategoryReport[], today: string): string {
  const models = reports.flatMap((r) => r.models);
  const claims = models.flatMap((m) => m.claims);
  const oldest = models.reduce((worst, m) => Math.max(worst, daysSince(m.verifiedOn, today)), 0);

  return [
    `# Catalogue refresh, ${today}`,
    '',
    `Categories: ${reports.map((r) => r.categoryName).join(', ')}.`,
    `${String(models.length)} models, ${String(claims.length)} claims checked against the vendors' own pages.`,
    `The oldest check in this set was ${String(oldest)} days old before this run.`,
    '',
    '## What to check before merging',
    '',
    '- [ ] Every change cites the page it came from.',
    '- [ ] Nothing changed that the cited page does not actually say.',
    '- [ ] `verifiedOn` moved only for models that were checked.',
    '- [ ] `unverified` cleared only where every claim in that model was confirmed.',
    '- [ ] Golden files that moved are explained, and the movement is the intended one.',
    '- [ ] `reference/forge.html` is untouched.',
    '',
    'A human merges this. Nothing in the catalogue is merged by a machine.',
    '',
    '## The claims this run worked from',
    '',
    'The full per-category reports are attached to the workflow run as an artifact.',
  ].join('\n');
}
