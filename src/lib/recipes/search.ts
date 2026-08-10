import { getCategoryLabel } from './categories';
import { resolveRecipeTree } from './domain';
import type { RecipeData, RecipeSource, ResolvedRecipe } from './types';

const DIACRITICS = /\p{Diacritic}/gu;

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLocaleLowerCase('fr-FR')
    .replaceAll('œ', 'oe')
    .replaceAll('æ', 'ae')
    .trim();
}

export function matchesSearch(text: string, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  const normalizedText = normalizeSearchText(text);
  return normalizedQuery
    .split(/\s+/u)
    .every((token) => normalizedText.includes(token));
}

function recipeDataSearchParts(data: RecipeData): string[] {
  return [
    data.title,
    data.description,
    data.author,
    getCategoryLabel(data.category),
    ...(data.tags ?? []),
    data.yield.label,
    ...(data.equipment ?? []).flatMap((item) => [item.name, item.note]),
    ...data.ingredientGroups.flatMap((group) => [
      group.title,
      ...group.ingredients.flatMap((ingredient) => [
        ingredient.name,
        ingredient.note,
        ingredient.amount.type === 'qualitative'
          ? ingredient.amount.text
          : undefined,
        ...(ingredient.alternatives ?? []).flatMap((alternative) => [
          alternative.name,
          alternative.note,
          alternative.amount.type === 'qualitative'
            ? alternative.amount.text
            : undefined,
        ]),
      ]),
    ]),
    ...data.instructionSections.flatMap((section) => [
      section.title,
      ...section.steps.map((step) => step.text),
    ]),
  ].filter((part): part is string => Boolean(part));
}

function treeSearchParts(tree: ResolvedRecipe): string[] {
  return [
    ...recipeDataSearchParts(tree.recipe.data),
    ...tree.components.flatMap(treeSearchParts),
  ];
}

export function buildRecipeSearchText(
  recipe: RecipeSource,
  recipes: ReadonlyMap<string, RecipeSource>,
): string {
  return treeSearchParts(resolveRecipeTree(recipe, recipes)).join(' ');
}
