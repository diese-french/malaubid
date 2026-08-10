import type { RecipeSource } from './types';

export function assertValidRecipeRepository(
  recipes: readonly RecipeSource[],
): void {
  const ids = recipes.map(({ id }) => id);
  if (new Set(ids).size !== ids.length)
    throw new Error('Recipe IDs must be unique.');

  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  for (const recipe of recipes) {
    if (recipe.data.visibility === 'listed' && !recipe.data.description) {
      throw new Error(`Listed recipe "${recipe.id}" requires a description.`);
    }

    const ingredients = recipe.data.ingredientGroups.flatMap(
      (group) => group.ingredients,
    );
    if (ingredients.length === 0 && recipe.data.components.length === 0) {
      throw new Error(
        `Recipe "${recipe.id}" requires local ingredients or components.`,
      );
    }

    const keys = ingredients.flatMap((ingredient) =>
      ingredient.key ? [ingredient.key] : [],
    );
    if (new Set(keys).size !== keys.length)
      throw new Error(`Recipe "${recipe.id}" has duplicate ingredient keys.`);
    const knownKeys = new Set(keys);

    for (const section of recipe.data.instructionSections) {
      if (section.steps.length === 0)
        throw new Error(
          `Recipe "${recipe.id}" has an empty instruction section.`,
        );
      for (const step of section.steps) {
        for (const key of step.ingredientKeys ?? []) {
          if (!knownKeys.has(key))
            throw new Error(
              `Recipe "${recipe.id}" references unknown ingredient key "${key}".`,
            );
        }
      }
    }

    for (const component of recipe.data.components) {
      if (!Number.isFinite(component.factor) || component.factor <= 0) {
        throw new Error(
          `Recipe "${recipe.id}" has an invalid factor for component "${component.id}".`,
        );
      }
      if (!byId.has(component.id))
        throw new Error(
          `Recipe "${recipe.id}" references unknown component "${component.id}".`,
        );
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string, path: readonly string[]): void => {
    if (visiting.has(id))
      throw new Error(
        `Component cycle detected: ${[...path, id].join(' -> ')}`,
      );
    if (visited.has(id)) return;

    visiting.add(id);
    const recipe = byId.get(id);
    if (!recipe) return;
    for (const component of recipe.data.components)
      visit(component.id, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of ids) visit(id, []);
}
