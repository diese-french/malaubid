import type { ImageMetadata } from 'astro';

import type { CategoryId } from './categories';
import type { UnitCode } from './units';

export interface ExactAmount {
  type: 'exact';
  value: number;
  unit?: UnitCode;
}

export interface RangeAmount {
  type: 'range';
  min: number;
  max: number;
  unit?: UnitCode;
}

export interface QualitativeAmount {
  type: 'qualitative';
  text: string;
}

export type Amount = ExactAmount | RangeAmount | QualitativeAmount;

export interface IngredientAlternative {
  name: string;
  amount: Amount;
  note?: string;
}

export interface Ingredient {
  key?: string;
  name: string;
  amount: Amount;
  note?: string;
  optional?: boolean;
  approximate?: boolean;
  scalable: boolean;
  alternatives?: IngredientAlternative[];
}

export interface IngredientGroup {
  title?: string;
  ingredients: Ingredient[];
}

export interface RecipeImage {
  src: ImageMetadata;
  alt: string;
  credit?: string;
  caption?: string;
}

export interface InstructionStep {
  text: string;
  timerMinutes?: number;
  image?: RecipeImage;
  ingredientKeys?: string[];
}

export interface InstructionSection {
  title?: string;
  steps: InstructionStep[];
}

export interface RecipeData {
  schemaVersion: 1;
  title: string;
  description?: string;
  author: string;
  kind: 'recipe' | 'preparation';
  visibility: 'listed' | 'unlisted' | 'draft';
  category: CategoryId;
  tags?: string[];
  image?: RecipeImage;
  yield: {
    quantity: number;
    label: string;
  };
  durations: {
    prepMinutes?: number;
    cookMinutes?: number;
    restMinutes?: number;
    totalMinutes?: number;
  };
  equipment?: Array<{
    name: string;
    quantity?: number;
    optional?: boolean;
    note?: string;
  }>;
  ingredientGroups: IngredientGroup[];
  instructionSections: InstructionSection[];
  components: Array<{
    id: string;
    factor: number;
  }>;
}

export interface RecipeSource {
  id: string;
  data: RecipeData;
}

export interface ResolvedRecipe {
  recipe: RecipeSource;
  factor: number;
  components: ResolvedRecipe[];
}
