import { describe, expect, it } from 'vitest';

import { normalizeAmount } from '../../src/lib/recipes/authoring';

describe('recipe authoring normalization', () => {
  it('infers exact, range, and qualitative amount variants from their shape', () => {
    expect(normalizeAmount({ value: 250, unit: 'g' })).toEqual({
      type: 'exact',
      value: 250,
      unit: 'g',
    });
    expect(normalizeAmount({ min: 2, max: 3, unit: 'tbsp' })).toEqual({
      type: 'range',
      min: 2,
      max: 3,
      unit: 'tbsp',
    });
    expect(normalizeAmount({ text: 'selon le goût' })).toEqual({
      type: 'qualitative',
      text: 'selon le goût',
    });
  });

  it('normalizes explicit legacy discriminators to the same domain model', () => {
    expect(normalizeAmount({ type: 'exact', value: 1 })).toEqual({
      type: 'exact',
      value: 1,
    });
  });
});
