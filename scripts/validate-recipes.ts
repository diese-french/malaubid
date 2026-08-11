import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import { CATEGORY_IDS } from '../src/lib/recipes/categories';
import {
  normalizeAmount,
  type AmountInput,
} from '../src/lib/recipes/authoring';
import type {
  Amount,
  RecipeData,
  RecipeSource,
} from '../src/lib/recipes/types';
import { UNIT_CODES } from '../src/lib/recipes/units';
import { assertValidRecipeRepository } from '../src/lib/recipes/validation';

const RECIPES_DIRECTORY = path.resolve('src/content/recipes');
const KNOWN_CATEGORIES = new Set<string>(CATEGORY_IDS);
const KNOWN_UNITS = new Set<string>(UNIT_CODES);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateAmount(amount: Amount, location: string): void {
  if (amount.type === 'qualitative') {
    assert(
      amount.text.trim().length > 0,
      `${location}: qualitative text is required.`,
    );
    return;
  }

  if (amount.unit)
    assert(
      KNOWN_UNITS.has(amount.unit),
      `${location}: unknown unit "${amount.unit}".`,
    );
  if (amount.type === 'exact') {
    assert(
      Number.isFinite(amount.value) && amount.value > 0,
      `${location}: exact amount must be positive.`,
    );
    return;
  }
  assert(
    Number.isFinite(amount.min) && amount.min > 0,
    `${location}: range minimum must be positive.`,
  );
  assert(
    Number.isFinite(amount.max) && amount.max >= amount.min,
    `${location}: range maximum must be at least its minimum.`,
  );
}

async function validateImage(
  image: { src: unknown; alt?: string },
  entryDirectory: string,
  location: string,
): Promise<void> {
  assert(
    typeof image.alt === 'string' && image.alt.trim().length > 0,
    `${location}: image alt text is required.`,
  );
  assert(
    typeof image.src === 'string' && image.src.startsWith('./'),
    `${location}: image src must be a local relative path.`,
  );
  await access(path.resolve(entryDirectory, image.src));
}

async function loadRecipe(directoryName: string): Promise<RecipeSource> {
  const entryDirectory = path.join(RECIPES_DIRECTORY, directoryName);
  const markdown = await readFile(
    path.join(entryDirectory, 'index.md'),
    'utf8',
  );
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert(frontmatter, `${directoryName}: index.md requires YAML frontmatter.`);
  const yaml = frontmatter[1];
  assert(
    yaml,
    `${directoryName}: index.md requires non-empty YAML frontmatter.`,
  );
  const parsedData = parse(yaml) as RecipeData;
  const data: RecipeData = {
    ...parsedData,
    components: parsedData.components ?? [],
    ingredientGroups: parsedData.ingredientGroups.map((group) => ({
      ...group,
      ingredients: group.ingredients.map((ingredient) => {
        const alternatives = ingredient.alternatives?.map((alternative) => ({
          ...alternative,
          amount: normalizeAmount(alternative.amount as AmountInput),
        }));
        return {
          ...ingredient,
          amount: normalizeAmount(ingredient.amount as AmountInput),
          ...(alternatives ? { alternatives } : {}),
        };
      }),
    })),
    instructionSections: parsedData.instructionSections.map((section) => ({
      ...section,
      steps: section.steps.map((step) =>
        typeof step === 'string' ? { text: step } : step,
      ),
    })),
  };

  assert(
    data.schemaVersion === 1,
    `${directoryName}: unsupported schemaVersion.`,
  );
  assert(data.title.trim().length > 0, `${directoryName}: title is required.`);
  assert(
    data.author.trim().length > 0,
    `${directoryName}: author is required.`,
  );
  assert(
    KNOWN_CATEGORIES.has(data.category),
    `${directoryName}: unknown category "${data.category}".`,
  );
  assert(
    Number.isFinite(data.yield.quantity) && data.yield.quantity > 0,
    `${directoryName}: yield must be positive.`,
  );
  assert(
    data.yield.label.trim().length > 0,
    `${directoryName}: yield label is required.`,
  );

  if (data.image)
    await validateImage(
      data.image as unknown as { src: unknown; alt?: string },
      entryDirectory,
      `${directoryName}.image`,
    );

  for (const [groupIndex, group] of data.ingredientGroups.entries()) {
    for (const [ingredientIndex, ingredient] of group.ingredients.entries()) {
      const location = `${directoryName}.ingredientGroups[${groupIndex}].ingredients[${ingredientIndex}]`;
      validateAmount(ingredient.amount, `${location}.amount`);
      for (const [alternativeIndex, alternative] of (
        ingredient.alternatives ?? []
      ).entries()) {
        validateAmount(
          alternative.amount,
          `${location}.alternatives[${alternativeIndex}].amount`,
        );
      }
    }
  }

  for (const [sectionIndex, section] of data.instructionSections.entries()) {
    assert(
      section.steps.length > 0,
      `${directoryName}: instruction section ${sectionIndex} is empty.`,
    );
    for (const [stepIndex, step] of section.steps.entries()) {
      assert(
        step.text.trim().length > 0,
        `${directoryName}: instruction step text is required.`,
      );
      if (step.image) {
        await validateImage(
          step.image as unknown as { src: unknown; alt?: string },
          entryDirectory,
          `${directoryName}.instructionSections[${sectionIndex}].steps[${stepIndex}].image`,
        );
      }
    }
  }

  return { id: directoryName, data };
}

const directoryEntries = await readdir(RECIPES_DIRECTORY, {
  withFileTypes: true,
});
const directoryNames = directoryEntries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const recipes = await Promise.all(directoryNames.map(loadRecipe));
assertValidRecipeRepository(recipes);

const recipeCount = recipes.filter(({ data }) => data.kind === 'recipe').length;
const preparationCount = recipes.filter(
  ({ data }) => data.kind === 'preparation',
).length;
console.log(
  `Validated ${recipes.length} entries (${recipeCount} recipes, ${preparationCount} preparations).`,
);
