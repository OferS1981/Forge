import { describe, expect, it } from 'vitest';
import { HOSTS, modelForHost } from '../src/hosts';
import { modelById } from '../src/models/registry';

describe('host map', () => {
  it('points every host at a real model', () => {
    for (const [host, id] of Object.entries(HOSTS)) {
      expect(modelById(id).id, `${host} points at a missing model`).toBe(id);
      expect(host).toMatch(/^[a-z0-9.-]+$/);
    }
  });

  it('matches a host exactly', () => {
    expect(modelForHost('midjourney.com')).toBe('midjourney');
    expect(modelForHost('CLAUDE.AI')).toBe('claude');
    expect(modelForHost('www.midjourney.com')).toBe('midjourney');
  });

  it('falls back to the registrable domain for a subdomain', () => {
    expect(modelForHost('beta.suno.com')).toBe('suno');
    expect(modelForHost('some.thing.elevenlabs.io')).toBe('el-tts');
  });

  it('returns nothing for a site Forge does not know', () => {
    expect(modelForHost('example.com')).toBeUndefined();
  });
});
