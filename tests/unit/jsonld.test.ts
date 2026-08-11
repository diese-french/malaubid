import { describe, expect, it } from 'vitest';

import { serializeRecipeJsonLd } from '../../src/lib/recipes/jsonld';
import {
  compositeRecipe,
  compositeRecipeIndex,
  simpleRecipe,
} from '../fixtures/recipes';

describe('Recipe JSON-LD', () => {
  it('serializes a simple recipe deterministically', () => {
    const json = serializeRecipeJsonLd(
      simpleRecipe,
      new Map([[simpleRecipe.id, simpleRecipe]]),
      {
        canonicalUrl: 'https://malau.bid/recettes/simple/',
      },
    );
    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: 'Recette simple',
      prepTime: 'PT10M',
      cookTime: 'PT20M',
      totalTime: 'PT30M',
      recipeYield: '4 personnes',
      recipeIngredient: ['200 g farine'],
    });
  });

  it('flattens component ingredients and includes component instructions', () => {
    const json = serializeRecipeJsonLd(compositeRecipe, compositeRecipeIndex, {
      canonicalUrl: 'https://malau.bid/recettes/composite/',
    });
    expect(json.recipeIngredient).toEqual(['200 g crème', '10 g épices']);
    expect(json.recipeInstructions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Préparation — Crème' }),
        expect.objectContaining({ name: 'Préparation imbriquée — Mélange' }),
      ]),
    );
  });
});
