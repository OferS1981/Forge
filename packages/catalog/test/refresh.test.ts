import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/categories';
import { MODELS } from '../src/models';
import { claimsFor, daysSince, pullRequestBody, reportAsMarkdown, reportFor } from '../src/refresh';

/**
 * The refresh report is the deterministic half of section 18. It is what an agent is given to check
 * against the vendor's own pages, so it has to be complete, stable, and unable to ask for something
 * there is no source for.
 */

const TODAY = '2026-12-01';

describe('the claims in a model file', () => {
  it('names the version, which is the first thing to go stale', () => {
    for (const model of MODELS) {
      const claims = claimsFor(model);
      expect(claims.some((c) => c.field === 'version')).toBe(true);
    }
  });

  it('gives every model something to check', () => {
    for (const model of MODELS) {
      expect(claimsFor(model).length, `${model.id} has nothing checkable`).toBeGreaterThan(1);
    }
  });

  it('reads the settings out of the file rather than describing them', () => {
    const midjourney = MODELS.find((m) => m.id === 'midjourney');
    expect(midjourney).toBeDefined();
    if (midjourney === undefined) return;
    const claims = claimsFor(midjourney);
    const stylize = claims.find((c) => c.field === 'settings.--stylize');
    expect(stylize?.says).toContain('default 100');
    expect(claims.some((c) => c.field === 'aspects' && c.says.includes('139:100'))).toBe(true);
  });

  it('picks up a warning that names a version, because that is what dates first', () => {
    const midjourney = MODELS.find((m) => m.id === 'midjourney');
    if (midjourney === undefined) throw new Error('midjourney is missing from the catalogue');
    const warnings = claimsFor(midjourney).filter((c) => c.field === 'warnings');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => /V\d/.test(w.says))).toBe(true);
  });

  it('is the same list every time it is asked', () => {
    for (const model of MODELS.slice(0, 6)) {
      expect(claimsFor(model)).toEqual(claimsFor(model));
    }
  });
});

describe('a category report', () => {
  it('covers every category, and every model lands in exactly one', () => {
    const seen = new Set<string>();
    for (const category of CATEGORIES) {
      const report = reportFor(category.id);
      expect(report.models.length, `${category.id} has no models`).toBeGreaterThan(0);
      for (const model of report.models) {
        expect(seen.has(model.id), `${model.id} is in two reports`).toBe(false);
        seen.add(model.id);
      }
    }
    expect(seen.size).toBe(MODELS.length);
  });

  it('refuses a category that does not exist rather than reporting nothing', () => {
    // The cast is the point: this is what a typo in a workflow input looks like at run time.
    expect(() => reportFor('sculpture' as never)).toThrow(/Unknown category/);
  });

  it('carries the source that should settle each claim', () => {
    for (const category of CATEGORIES) {
      for (const model of reportFor(category.id).models) {
        expect(model.sources.length, `${model.id} has no source to check against`).toBeGreaterThan(
          0,
        );
        for (const source of model.sources) expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe('the report as markdown', () => {
  const markdown = reportAsMarkdown(reportFor('image'), TODAY);

  it('gives the reviewer a checkbox per claim', () => {
    const claims = reportFor('image').models.flatMap((m) => m.claims);
    expect(markdown.split('- [ ] ').length - 1).toBe(claims.length);
  });

  it('says a human merges, because nothing here may be merged by a machine', () => {
    expect(markdown).toContain('never auto-merge a catalogue');
  });

  it('says how old each check is, rather than leaving it to be worked out', () => {
    expect(markdown).toMatch(/Last checked \d{4}-\d{2}-\d{2}, \d+ days ago/);
  });

  it('links every source, so nothing has to be searched for', () => {
    for (const model of reportFor('image').models) {
      for (const source of model.sources) expect(markdown).toContain(source.url);
    }
  });

  it('holds to the house style, so a pull request body reads like the product', () => {
    expect(markdown).not.toContain('—');
    expect(markdown).not.toContain('!');
  });

  it('is byte-identical between two runs, so a monthly diff is a real change', () => {
    expect(reportAsMarkdown(reportFor('image'), TODAY)).toBe(markdown);
  });
});

describe('counting the days', () => {
  it('counts them', () => {
    expect(daysSince('2026-08-23', '2026-08-23')).toBe(0);
    expect(daysSince('2026-08-23', '2026-12-01')).toBe(100);
  });

  it('gives zero rather than a NaN on a date it cannot read', () => {
    expect(daysSince('not a date', '2026-12-01')).toBe(0);
    expect(daysSince('2026-08-23', 'not a date')).toBe(0);
  });
});

describe('the pull request body', () => {
  const body = pullRequestBody([reportFor('image'), reportFor('video')], TODAY);

  it('says what was checked, in numbers a reviewer can sanity check', () => {
    const models = [...reportFor('image').models, ...reportFor('video').models];
    expect(body).toContain(`${String(models.length)} models`);
    expect(body).toContain('Image, Video');
  });

  it('carries the checklist that stops a bad merge', () => {
    for (const line of ['cites the page', 'verifiedOn', 'unverified', 'Golden files']) {
      expect(body).toContain(line);
    }
  });

  it('says a human merges, in the pull request itself and not only in the report', () => {
    expect(body).toContain('Nothing in the catalogue is merged by a machine');
  });

  it('holds to the house style', () => {
    expect(body).not.toContain('—');
    expect(body).not.toContain('!');
  });
});
