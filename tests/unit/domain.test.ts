import { describe, expect, it } from 'vitest';

import {
  calculateScale,
  durationToIso,
  flattenIngredients,
  formatAmount,
  formatNumber,
  resolveRecipeTree,
  scaleAmount,
} from '../../src/lib/recipes/domain';
import {
  compositeRecipe,
  compositeRecipeIndex,
  groupedRecipe,
} from '../fixtures/recipes';

describe('quantity scaling', () => {
  it('scales exact and range amounts', () => {
    expect(scaleAmount({ type: 'exact', value: 125, unit: 'g' }, 1.5)).toEqual({
      type: 'exact',
      value: 187.5,
      unit: 'g',
    });
    expect(
      scaleAmount({ type: 'range', min: 2, max: 3, unit: 'piece' }, 2),
    ).toEqual({
      type: 'range',
      min: 4,
      max: 6,
      unit: 'piece',
    });
  });

  it('does not scale qualitative or explicitly fixed amounts', () => {
    expect(
      scaleAmount({ type: 'qualitative', text: 'selon le goût' }, 4),
    ).toEqual({
      type: 'qualitative',
      text: 'selon le goût',
    });
    expect(
      scaleAmount({ type: 'exact', value: 1, unit: 'pinch' }, 4, false),
    ).toEqual({
      type: 'exact',
      value: 1,
      unit: 'pinch',
    });
  });

  it('scales alternative amount shapes with the same pure function', () => {
    const group = groupedRecipe.data.ingredientGroups.at(0);
    const ingredient = group?.ingredients.at(0);
    const alternative = ingredient?.alternatives?.at(0);
    if (!alternative)
      throw new Error('The grouped fixture requires an alternative.');
    expect(scaleAmount(alternative.amount, 0.5)).toEqual({
      type: 'range',
      min: 5,
      max: 6,
      unit: 'cl',
    });
  });

  it('always recalculates from an immutable base amount', () => {
    const base = { type: 'exact' as const, value: 10, unit: 'g' as const };
    expect(scaleAmount(base, 3)).toEqual({ ...base, value: 30 });
    expect(scaleAmount(base, 0.5)).toEqual({ ...base, value: 5 });
    expect(scaleAmount(base, 1)).toEqual(base);
    expect(base.value).toBe(10);
  });

  it('rejects invalid target yields', () => {
    expect(calculateScale(6, 4)).toBe(1.5);
    expect(calculateScale(0, 4)).toBeNull();
    expect(calculateScale(Number.NaN, 4)).toBeNull();
  });
});

describe('formatting', () => {
  it('uses French numbers with no trailing zeroes and at most two decimals', () => {
    expect(formatNumber(1.5)).toBe('1,5');
    expect(formatNumber(1.234)).toBe('1,23');
    expect(
      formatAmount({ type: 'range', min: 1, max: 2.5, unit: 'piece' }),
    ).toBe('1–2,5 pièces');
  });

  it('serializes durations to ISO 8601', () => {
    expect(durationToIso(0)).toBe('PT0M');
    expect(durationToIso(45)).toBe('PT45M');
    expect(durationToIso(75)).toBe('PT1H15M');
    expect(durationToIso(120)).toBe('PT2H');
  });
});

describe('component traversal', () => {
  it('propagates factors through nested preparations', () => {
    const tree = resolveRecipeTree(compositeRecipe, compositeRecipeIndex);
    const ingredients = flattenIngredients(tree);
    expect(
      ingredients.map(({ ingredient, factor }) => [ingredient.name, factor]),
    ).toEqual([
      ['crème', 2],
      ['épices', 1],
    ]);
  });
});
