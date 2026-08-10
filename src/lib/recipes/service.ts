import { getCollection, type CollectionEntry } from 'astro:content';

import { sortRecipesByTitle } from './domain';
import type { RecipeData, RecipeSource } from './types';
import { assertValidRecipeRepository } from './validation';

export type RecipeEntry = CollectionEntry<'recipes'>;

export function toRecipeSource(entry: RecipeEntry): RecipeSource {
  return { id: entry.id, data: entry.data as RecipeData };
}

export async function getAllRecipeEntries(): Promise<RecipeEntry[]> {
  const entries = await getCollection('recipes');
  assertValidRecipeRepository(entries.map(toRecipeSource));
  return entries;
}

export function getListedRecipes(
  entries: readonly RecipeEntry[],
): RecipeEntry[] {
  return sortRecipesByTitle(
    entries.filter(({ data }) => data.visibility === 'listed'),
  );
}

export function getRoutableRecipes(
  entries: readonly RecipeEntry[],
  development: boolean,
): RecipeEntry[] {
  return entries.filter(
    (entry) => development || entry.data.visibility !== 'draft',
  );
}

export function createRecipeIndex(
  entries: readonly RecipeEntry[],
): Map<string, RecipeSource> {
  return new Map(entries.map((entry) => [entry.id, toRecipeSource(entry)]));
}
