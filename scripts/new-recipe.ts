import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const slug = process.argv[2];
if (!slug)
  throw new Error('Usage: npm run recipe:new -- <lowercase-kebab-case-slug>');
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error(`Invalid recipe slug "${slug}". Use lowercase kebab-case.`);
}

const recipesDirectory = fileURLToPath(
  new URL('../src/content/recipes/', import.meta.url),
);
const recipeDirectory = path.join(recipesDirectory, slug);

const template = `---
# Recipe schema version. Breaking format changes increment this value.
schemaVersion: 1
title: "Titre de la recette"
description: "Une courte description pour la future fiche."
author: "Votre nom"
kind: recipe
# Change to listed only when the recipe is ready to publish.
visibility: draft
category: plat
yield:
  quantity: 4
  label: personnes
durations:
  prepMinutes: 15
ingredientGroups:
  - title: "Ingrédients"
    ingredients:
      - name: "ingrédient exemple"
        amount:
          value: 100
          unit: g
instructionSections:
  - title: "Préparation"
    steps:
      - "Préparer l’ingrédient exemple."
---

Ajoutez ici, si nécessaire, une introduction, la provenance, des astuces ou des notes narratives.
`;

try {
  await mkdir(recipeDirectory);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
    throw new Error(
      `Recipe "${slug}" already exists; refusing to overwrite it.`,
      { cause: error },
    );
  }
  throw error;
}
await writeFile(path.join(recipeDirectory, 'index.md'), template, 'utf8');
console.log(
  `Created draft recipe: ${path.relative(process.cwd(), recipeDirectory)}/index.md`,
);
