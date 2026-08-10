import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { normalizeAmount } from './lib/recipes/authoring';
import { CATEGORY_IDS } from './lib/recipes/categories';
import { UNIT_CODES } from './lib/recipes/units';

const nonEmptyString = z.string().trim().min(1);
const positiveNumber = z.number().positive();
const minutes = z.number().int().nonnegative();
const unit = z.enum(UNIT_CODES);

const exactAmount = z
  .object({
    type: z.literal('exact').optional(),
    value: positiveNumber,
    unit: unit.optional(),
  })
  .strict()
  .transform(normalizeAmount);

const rangeAmount = z
  .object({
    type: z.literal('range').optional(),
    min: positiveNumber,
    max: positiveNumber,
    unit: unit.optional(),
  })
  .strict()
  .refine(
    ({ min, max }) => max >= min,
    'A range maximum must be greater than or equal to its minimum.',
  )
  .transform(normalizeAmount);

const qualitativeAmount = z
  .object({
    type: z.literal('qualitative').optional(),
    text: nonEmptyString,
  })
  .strict()
  .transform(normalizeAmount);

const amount = z.union([exactAmount, rangeAmount, qualitativeAmount]);

const alternative = z.object({
  name: nonEmptyString,
  amount,
  note: nonEmptyString.optional(),
});

const ingredient = z
  .object({
    key: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    name: nonEmptyString,
    amount,
    note: nonEmptyString.optional(),
    optional: z.boolean().optional(),
    approximate: z.boolean().optional(),
    scalable: z.boolean().optional(),
    alternatives: z.array(alternative).min(1).optional(),
  })
  .transform((value) => ({
    ...value,
    scalable: value.scalable ?? value.amount.type !== 'qualitative',
  }));

const recipes = defineCollection({
  loader: glob({
    base: './src/content/recipes',
    pattern: '**/index.md',
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) => {
    const recipeImage = z.object({
      src: image(),
      alt: nonEmptyString,
      credit: nonEmptyString.optional(),
      caption: nonEmptyString.optional(),
    });
    const structuredInstructionStep = z.object({
      text: nonEmptyString,
      timerMinutes: positiveNumber.optional(),
      image: recipeImage.optional(),
      ingredientKeys: z.array(nonEmptyString).min(1).optional(),
    });
    const instructionStep = z.union([
      structuredInstructionStep,
      nonEmptyString.transform(
        (text): z.output<typeof structuredInstructionStep> => ({ text }),
      ),
    ]);

    return z
      .object({
        schemaVersion: z.literal(1),
        title: nonEmptyString,
        description: nonEmptyString.optional(),
        author: nonEmptyString,
        kind: z.enum(['recipe', 'preparation']),
        visibility: z.enum(['listed', 'unlisted', 'draft']),
        category: z.enum(CATEGORY_IDS),
        tags: z
          .array(nonEmptyString)
          .refine(
            (values) => new Set(values).size === values.length,
            'Tags must be unique.',
          )
          .optional(),
        hero: recipeImage.optional(),
        yield: z.object({
          quantity: positiveNumber,
          label: nonEmptyString,
        }),
        durations: z
          .object({
            prepMinutes: minutes.optional(),
            cookMinutes: minutes.optional(),
            restMinutes: minutes.optional(),
            totalMinutes: minutes.optional(),
          })
          .refine(
            (value) =>
              Object.values(value).some((duration) => duration !== undefined),
            'At least one duration is required.',
          ),
        equipment: z
          .array(
            z.object({
              name: nonEmptyString,
              quantity: positiveNumber.optional(),
              optional: z.boolean().optional(),
              note: nonEmptyString.optional(),
            }),
          )
          .optional(),
        ingredientGroups: z.array(
          z.object({
            title: nonEmptyString.optional(),
            ingredients: z.array(ingredient).min(1),
          }),
        ),
        instructionSections: z.array(
          z.object({
            title: nonEmptyString.optional(),
            steps: z.array(instructionStep).min(1),
          }),
        ),
        components: z
          .array(
            z.object({
              id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
              factor: positiveNumber.default(1),
            }),
          )
          .default([]),
      })
      .superRefine((recipe, context) => {
        if (recipe.visibility === 'listed' && !recipe.description) {
          context.addIssue({
            code: 'custom',
            path: ['description'],
            message: 'Listed recipes require a description.',
          });
        }

        const ingredients = recipe.ingredientGroups.flatMap(
          (group) => group.ingredients,
        );
        if (ingredients.length === 0 && recipe.components.length === 0) {
          context.addIssue({
            code: 'custom',
            path: ['ingredientGroups'],
            message: 'A recipe requires local ingredients or components.',
          });
        }

        const keys = ingredients.flatMap((item) =>
          item.key ? [item.key] : [],
        );
        if (new Set(keys).size !== keys.length) {
          context.addIssue({
            code: 'custom',
            path: ['ingredientGroups'],
            message: 'Ingredient keys must be unique within an entry.',
          });
        }

        const knownKeys = new Set(keys);
        for (const [
          sectionIndex,
          section,
        ] of recipe.instructionSections.entries()) {
          for (const [stepIndex, step] of section.steps.entries()) {
            for (const key of step.ingredientKeys ?? []) {
              if (!knownKeys.has(key)) {
                context.addIssue({
                  code: 'custom',
                  path: [
                    'instructionSections',
                    sectionIndex,
                    'steps',
                    stepIndex,
                    'ingredientKeys',
                  ],
                  message: `Unknown ingredient key: ${key}`,
                });
              }
            }
          }
        }
      });
  },
});

export const collections = { recipes };
