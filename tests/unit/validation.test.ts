import { describe, expect, it } from 'vitest';

import { assertValidRecipeRepository } from '../../src/lib/recipes/validation';
import type { RecipeSource } from '../../src/lib/recipes/types';
import {
  compositeRecipe,
  compositeRecipeIndex,
  simpleRecipe,
} from '../fixtures/recipes';

describe('repository validation', () => {
  it('accepts the representative composite graph', () => {
    expect(() =>
      assertValidRecipeRepository([...compositeRecipeIndex.values()]),
    ).not.toThrow();
  });

  it('rejects component cycles', () => {
    const cyclic: RecipeSource = {
      ...compositeRecipe,
      data: {
        ...compositeRecipe.data,
        components: [{ id: compositeRecipe.id, factor: 1 }],
      },
    };
    expect(() => assertValidRecipeRepository([cyclic])).toThrow(/cycle/i);
  });

  it('rejects unknown ingredient-key references', () => {
    const invalid: RecipeSource = {
      ...simpleRecipe,
      data: {
        ...simpleRecipe.data,
        instructionSections: [
          { steps: [{ text: 'Mélanger.', ingredientKeys: ['inconnu'] }] },
        ],
      },
    };
    expect(() => assertValidRecipeRepository([invalid])).toThrow(
      /unknown ingredient key/i,
    );
  });
});
