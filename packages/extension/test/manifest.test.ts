import { describe, expect, it } from 'vitest';
import { HOSTS, MODELS, modelForHost } from '@forge/catalog';
import { ADAPTERS } from '../src/adapters';
import { manifest, matchPatterns } from '../src/manifest';

/**
 * The manifest is derived from the catalogue, so these tests are really about one thing: that
 * adding a model and its host is the only thing anybody has to do, and that nothing here can drift
 * from the data without the build noticing.
 */

describe('the manifest', () => {
  const m = manifest('1.2.3');

  it('is a valid manifest v3 with the version it was given', () => {
    expect(m.manifest_version).toBe(3);
    expect(m.version).toBe('1.2.3');
    expect(m.background).toEqual({ service_worker: 'service-worker.js', type: 'module' });
    expect(m.side_panel.default_path).toBe('panel.html');
    expect(m.content_scripts[0]?.js).toEqual(['content.js']);
  });

  it('asks for three permissions and no more', () => {
    expect(m.permissions).toEqual(['sidePanel', 'storage', 'scripting']);
    // A tabs permission would let the extension read every open tab, and it does not need to.
    expect(m.permissions).not.toContain('tabs');
    expect(m.permissions).not.toContain('<all_urls>');
    expect(m.host_permissions).not.toContain('<all_urls>');
    expect(m.host_permissions).not.toContain('*://*/*');
  });

  it('covers every host in the catalogue, and nothing that is not one', () => {
    const patterns = matchPatterns();
    for (const host of Object.keys(HOSTS)) {
      const bare = host.replace(/^www\./, '');
      expect(patterns, `no pattern covers ${host}`).toContain(`https://*.${bare}/*`);
    }
    for (const pattern of patterns) {
      const host = pattern.replace('https://*.', '').replace('/*', '');
      expect(modelForHost(host), `${pattern} matches no model`).toBeDefined();
    }
  });

  it('is https only, so the prompt is never put into a page fetched over plain http', () => {
    for (const pattern of m.host_permissions) expect(pattern.startsWith('https://')).toBe(true);
    expect(m.content_scripts[0]?.matches).toEqual(m.host_permissions);
  });

  it('is stable and free of duplicates, so a rebuild is not a diff', () => {
    expect(matchPatterns()).toEqual([...matchPatterns()].sort());
    expect(new Set(matchPatterns()).size).toBe(matchPatterns().length);
  });

  it('carries what Firefox needs, because section 14 asks for it', () => {
    expect(m.browser_specific_settings?.gecko.id).toMatch(/@/);
  });

  it('says nothing about buying anything', () => {
    const text = JSON.stringify(m).toLowerCase();
    for (const word of ['price', 'plan', 'pro', 'upgrade', 'subscription', 'trial', 'billing']) {
      expect(text, `the manifest says "${word}"`).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});

describe('the sites with an adapter', () => {
  it('are all sites the catalogue knows a model for', () => {
    for (const adapter of ADAPTERS) {
      const id = modelForHost(adapter.site);
      expect(id, `${adapter.site} has an adapter but no model`).toBeDefined();
      expect(MODELS.some((model) => model.id === id)).toBe(true);
    }
  });
});
