import { describe, expect, it } from 'vitest';

import {
  buildRecipeSearchText,
  matchesSearch,
  normalizeSearchText,
} from '../../src/lib/recipes/search';
import {
  compositeRecipe,
  compositeRecipeIndex,
  groupedRecipe,
} from '../fixtures/recipes';

describe('recipe search', () => {
  it('ignores French accents and case', () => {
    expect(normalizeSearchText('PÂTE Brisée')).toBe('pate brisee');
    expect(matchesSearch('Pâte brisée', 'PATE')).toBe(true);
    expect(matchesSearch('Trois œufs', 'oeuf')).toBe(true);
  });

  it('matches every query token regardless of order', () => {
    expect(
      matchesSearch('Tarte méridionale au potimarron', 'potimarron tarte'),
    ).toBe(true);
  });

  it('does not match a missing token', () => {
    expect(matchesSearch('Tarte tatin', 'tarte chocolat')).toBe(false);
  });

  it('indexes ingredients, alternatives, and instructions', () => {
    const text = buildRecipeSearchText(
      groupedRecipe,
      new Map([[groupedRecipe.id, groupedRecipe]]),
    );

    expect(matchesSearch(text, 'bouillon')).toBe(true);
    expect(matchesSearch(text, 'eau')).toBe(true);
    expect(matchesSearch(text, 'mélanger farine')).toBe(true);
  });

  it('indexes ingredients from nested preparations', () => {
    const text = buildRecipeSearchText(compositeRecipe, compositeRecipeIndex);
    expect(matchesSearch(text, 'épices')).toBe(true);
  });
});
