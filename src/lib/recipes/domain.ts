import { getCategoryLabel } from './categories';
import type { Amount, Ingredient, RecipeSource, ResolvedRecipe } from './types';
import { formatUnit } from './units';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
  useGrouping: true,
});

export const FRENCH_TITLE_COLLATOR = new Intl.Collator('fr-FR', {
  sensitivity: 'base',
  usage: 'sort',
});

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function calculateScale(
  targetYield: number,
  baseYield: number,
): number | null {
  if (
    !Number.isFinite(targetYield) ||
    targetYield <= 0 ||
    !Number.isFinite(baseYield) ||
    baseYield <= 0
  ) {
    return null;
  }
  return targetYield / baseYield;
}

export function scaleAmount(
  amount: Amount,
  scale: number,
  scalable = true,
): Amount {
  if (!scalable || amount.type === 'qualitative') return { ...amount };
  if (amount.type === 'exact')
    return { ...amount, value: amount.value * scale };
  return { ...amount, min: amount.min * scale, max: amount.max * scale };
}

export function formatAmount(amount: Amount): string {
  if (amount.type === 'qualitative') return amount.text;

  if (amount.type === 'exact') {
    const unit = amount.unit
      ? `\u00a0${formatUnit(amount.unit, amount.value)}`
      : '';
    return `${formatNumber(amount.value)}${unit}`;
  }

  const unit = amount.unit
    ? `\u00a0${formatUnit(amount.unit, amount.max)}`
    : '';
  return `${formatNumber(amount.min)}–${formatNumber(amount.max)}${unit}`;
}

export function formatIngredient(ingredient: Ingredient, factor = 1): string {
  const amount = scaleAmount(ingredient.amount, factor, ingredient.scalable);
  const qualifier = ingredient.approximate ? 'environ ' : '';
  const optional = ingredient.optional ? ' (facultatif)' : '';
  const note = ingredient.note ? ` (${ingredient.note})` : '';
  const alternatives = (ingredient.alternatives ?? []).map((alternative) => {
    const alternativeAmount = scaleAmount(
      alternative.amount,
      factor,
      ingredient.scalable,
    );
    const alternativeNote = alternative.note ? ` (${alternative.note})` : '';
    return `${formatAmount(alternativeAmount)} ${alternative.name}${alternativeNote}`;
  });
  return `${[
    `${qualifier}${formatAmount(amount)} ${ingredient.name}${note}`,
    ...alternatives,
  ].join(' ou ')}${optional}`;
}

export function formatYield(quantity: number, label: string): string {
  return `${formatNumber(quantity)} ${label}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} h`;
  return `${hours} h ${remainingMinutes} min`;
}

export function durationToIso(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new RangeError(
      'A duration must be a non-negative integer number of minutes.',
    );
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `PT${remainingMinutes}M`;
  if (remainingMinutes === 0) return `PT${hours}H`;
  return `PT${hours}H${remainingMinutes}M`;
}

export function sortRecipesByTitle<T extends { data: { title: string } }>(
  recipes: readonly T[],
): T[] {
  return [...recipes].sort((left, right) =>
    FRENCH_TITLE_COLLATOR.compare(left.data.title, right.data.title),
  );
}

export function resolveRecipeTree(
  root: RecipeSource,
  recipes: ReadonlyMap<string, RecipeSource>,
): ResolvedRecipe {
  const visit = (
    recipe: RecipeSource,
    factor: number,
    ancestors: readonly string[],
  ): ResolvedRecipe => {
    if (ancestors.includes(recipe.id)) {
      throw new Error(
        `Component cycle detected: ${[...ancestors, recipe.id].join(' -> ')}`,
      );
    }

    const nextAncestors = [...ancestors, recipe.id];
    return {
      recipe,
      factor,
      components: recipe.data.components.map((component) => {
        const child = recipes.get(component.id);
        if (!child)
          throw new Error(
            `Unknown component "${component.id}" referenced by "${recipe.id}".`,
          );
        return visit(child, factor * component.factor, nextAncestors);
      }),
    };
  };

  return visit(root, 1, []);
}

export interface FlattenedIngredient {
  recipeId: string;
  recipeTitle: string;
  category: string;
  groupTitle?: string;
  ingredient: Ingredient;
  factor: number;
}

export function flattenIngredients(
  tree: ResolvedRecipe,
): FlattenedIngredient[] {
  const local = tree.recipe.data.ingredientGroups.flatMap((group) =>
    group.ingredients.map((ingredient) => ({
      recipeId: tree.recipe.id,
      recipeTitle: tree.recipe.data.title,
      category: getCategoryLabel(tree.recipe.data.category),
      ...(group.title ? { groupTitle: group.title } : {}),
      ingredient,
      factor: tree.factor,
    })),
  );
  return [...local, ...tree.components.flatMap(flattenIngredients)];
}
