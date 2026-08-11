import rss from '@astrojs/rss';
import type { APIContext } from 'astro';

import { getCategoryLabel } from '../lib/recipes/categories';
import { getAllRecipeEntries, getListedRecipes } from '../lib/recipes/service';

export async function GET(context: APIContext) {
  const recipes = getListedRecipes(await getAllRecipeEntries());

  return rss({
    title: 'Malaubid',
    description: 'Malaubid, un site de recettes.',
    site: context.site ?? 'https://malau.bid',
    items: recipes.map((recipe) => ({
      title: recipe.data.title,
      description: recipe.data.description,
      link: `/recettes/${recipe.id}/`,
      categories: [
        getCategoryLabel(recipe.data.category),
        ...(recipe.data.tags ?? []),
      ],
    })),
    customData: '<language>fr</language>',
  });
}
