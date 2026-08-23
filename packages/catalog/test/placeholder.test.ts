import { describe, expect, it } from 'vitest';
import { CATALOG_VERSION } from '../src/index';

describe('catalog package', () => {
  it('exists and exports a version', () => {
    expect(CATALOG_VERSION).toBe('0.0.0');
  });
});
