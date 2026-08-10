import {
  durationToIso,
  flattenIngredients,
  formatIngredient,
  formatYield,
  resolveRecipeTree,
} from './domain';
import type { RecipeSource } from './types';
import { getCategoryLabel } from './categories';

export interface RecipeJsonLdOptions {
  canonicalUrl: string;
  imageUrl?: string;
}

export function serializeRecipeJsonLd(
  recipe: RecipeSource,
  recipes: ReadonlyMap<string, RecipeSource>,
  options: RecipeJsonLdOptions,
): Record<string, unknown> {
  const tree = resolveRecipeTree(recipe, recipes);
  const durations = recipe.data.durations;
  const instructionSections = [tree, ...collectDescendants(tree)].flatMap(
    (resolved) =>
      resolved.recipe.data.instructionSections.map((section) => ({
        '@type': 'HowToSection',
        name:
          resolved.recipe.id === recipe.id
            ? (section.title ?? 'Préparation')
            : `${resolved.recipe.data.title}${section.title ? ` — ${section.title}` : ''}`,
        itemListElement: section.steps.map((step) => ({
          '@type': 'HowToStep',
          text: step.text,
          ...(step.image
            ? { image: new URL(step.image.src.src, options.canonicalUrl).href }
            : {}),
        })),
      })),
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.data.title,
    description: recipe.data.description,
    author: { '@type': 'Person', name: recipe.data.author },
    recipeCategory: getCategoryLabel(recipe.data.category),
    recipeYield: formatYield(
      recipe.data.yield.quantity,
      recipe.data.yield.label,
    ),
    recipeIngredient: flattenIngredients(tree).map(({ ingredient, factor }) =>
      formatIngredient(ingredient, factor),
    ),
    recipeInstructions: instructionSections,
    url: options.canonicalUrl,
    ...(options.imageUrl ? { image: options.imageUrl } : {}),
    ...(durations.prepMinutes !== undefined
      ? { prepTime: durationToIso(durations.prepMinutes) }
      : {}),
    ...(durations.cookMinutes !== undefined
      ? { cookTime: durationToIso(durations.cookMinutes) }
      : {}),
    ...(durations.totalMinutes !== undefined
      ? { totalTime: durationToIso(durations.totalMinutes) }
      : {}),
  };
}

function collectDescendants(
  tree: ReturnType<typeof resolveRecipeTree>,
): ReturnType<typeof resolveRecipeTree>[] {
  return tree.components.flatMap((component) => [
    component,
    ...collectDescendants(component),
  ]);
}
