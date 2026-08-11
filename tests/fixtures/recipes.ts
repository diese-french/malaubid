import type {
  Ingredient,
  RecipeData,
  RecipeSource,
} from '../../src/lib/recipes/types';

function recipeData(overrides: Partial<RecipeData> = {}): RecipeData {
  return {
    schemaVersion: 1,
    title: 'Recette simple',
    description: 'Une recette de test.',
    author: 'Test',
    kind: 'recipe',
    visibility: 'listed',
    category: 'plat',
    yield: { quantity: 4, label: 'personnes' },
    durations: { prepMinutes: 10, cookMinutes: 20, totalMinutes: 30 },
    ingredientGroups: [
      {
        ingredients: [
          {
            key: 'farine',
            name: 'farine',
            amount: { type: 'exact', value: 200, unit: 'g' },
            scalable: true,
          },
        ],
      },
    ],
    instructionSections: [
      {
        title: 'Préparation',
        steps: [{ text: 'Mélanger la farine.', ingredientKeys: ['farine'] }],
      },
    ],
    components: [],
    ...overrides,
  };
}

export const simpleRecipe: RecipeSource = { id: 'simple', data: recipeData() };

const seasonedIngredient: Ingredient = {
  name: 'bouillon',
  amount: { type: 'range', min: 10, max: 12, unit: 'cl' },
  scalable: true,
  alternatives: [
    {
      name: 'eau',
      amount: { type: 'range', min: 10, max: 12, unit: 'cl' },
    },
  ],
};

export const groupedRecipe: RecipeSource = {
  id: 'grouped',
  data: recipeData({
    title: 'Recette groupée',
    ingredientGroups: [
      { title: 'Base', ingredients: [seasonedIngredient] },
      {
        title: 'Assaisonnement',
        ingredients: [
          {
            name: 'sel',
            amount: { type: 'qualitative', text: 'selon le goût' },
            scalable: false,
          },
          {
            name: 'piment',
            amount: { type: 'exact', value: 1, unit: 'pinch' },
            scalable: false,
          },
        ],
      },
    ],
  }),
};

export const nestedPreparation: RecipeSource = {
  id: 'nested-preparation',
  data: recipeData({
    title: 'Préparation imbriquée',
    description: 'Une préparation imbriquée de test.',
    kind: 'preparation',
    visibility: 'unlisted',
    category: 'base',
    yield: { quantity: 1, label: 'batch' },
    ingredientGroups: [
      {
        ingredients: [
          {
            name: 'épices',
            amount: { type: 'exact', value: 10, unit: 'g' },
            scalable: true,
          },
        ],
      },
    ],
    instructionSections: [
      { title: 'Mélange', steps: [{ text: 'Mélanger les épices.' }] },
    ],
  }),
};

export const preparation: RecipeSource = {
  id: 'preparation',
  data: recipeData({
    title: 'Préparation',
    description: 'Une préparation de test.',
    kind: 'preparation',
    visibility: 'unlisted',
    category: 'base',
    yield: { quantity: 1, label: 'batch' },
    ingredientGroups: [
      {
        ingredients: [
          {
            name: 'crème',
            amount: { type: 'exact', value: 100, unit: 'g' },
            scalable: true,
          },
        ],
      },
    ],
    instructionSections: [
      { title: 'Crème', steps: [{ text: 'Mélanger la crème.' }] },
    ],
    components: [{ id: 'nested-preparation', factor: 0.5 }],
  }),
};

export const compositeRecipe: RecipeSource = {
  id: 'composite',
  data: recipeData({
    title: 'Recette composite',
    description: 'Une recette avec des préparations imbriquées.',
    ingredientGroups: [],
    instructionSections: [
      { title: 'Assemblage', steps: [{ text: 'Assembler les préparations.' }] },
    ],
    components: [{ id: 'preparation', factor: 2 }],
  }),
};

export const missingImageRecipe: RecipeSource = {
  id: 'missing-image',
  data: recipeData({ title: 'Sans image' }),
};

export const ambiguousDurationRecipe: RecipeSource = {
  id: 'ambiguous-duration',
  data: recipeData({
    durations: { prepMinutes: 20, cookMinutes: 20, totalMinutes: 30 },
  }),
};

export const compositeRecipeIndex = new Map(
  [compositeRecipe, preparation, nestedPreparation].map((recipe) => [
    recipe.id,
    recipe,
  ]),
);
