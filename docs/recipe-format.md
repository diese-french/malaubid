# Recipe format v1

This document is normative for recipe and reusable-preparation content. Astro validates every entry at build time; `npm run validate:recipes` validates relationships across entries.

## Storage

Each entry has its own directory:

```text
src/content/recipes/<lowercase-kebab-case-id>/
├── index.md
├── image.jpg             # optional main image
└── other-local-image.*   # optional
```

The directory name is the stable recipe ID. The Markdown body after frontmatter is optional and only contains introduction, provenance, tips, or narrative notes. Put ingredients and instructions in frontmatter, never in the body.

## Minimal recipe

```yaml
---
schemaVersion: 1
title: Pommes rôties
description: Des pommes rôties simplement au four.
author: Camille
kind: recipe
visibility: listed
category: dessert
yield:
  quantity: 4
  label: personnes
durations:
  prepMinutes: 10
  cookMinutes: 30
  totalMinutes: 40
ingredientGroups:
  - ingredients:
      - key: pommes
        name: pommes
        amount:
          value: 4
instructionSections:
  - title: Préparation
    steps:
      - text: Éplucher et couper les pommes.
        ingredientKeys: [pommes]
      - text: Rôtir jusqu’à ce qu’elles soient tendres.
        timerMinutes: 30
---
```

## Grouped ingredients, alternatives, and qualitative amounts

```yaml
---
schemaVersion: 1
title: Exemple de tarte
description: Un exemple montrant les formes d’ingrédients disponibles.
author: Camille
kind: recipe
visibility: draft
category: dessert
tags: [exemple, tarte]
yield:
  quantity: 8
  label: parts
durations:
  prepMinutes: 25
ingredientGroups:
  - title: Pâte
    ingredients:
      - name: farine
        amount: { value: 250, unit: g }
      - name: eau
        approximate: true
        amount: { min: 50, max: 70, unit: ml }
      - name: sel
        scalable: false
        amount: { text: selon le goût }
  - title: Garniture
    ingredients:
      - name: pommes
        amount: { value: 6 }
        alternatives:
          - name: poires
            amount: { value: 6 }
            note: mûres mais fermes
      - name: cannelle
        optional: true
        amount: { value: 1, unit: tsp }
equipment:
  - name: moule à tarte
    quantity: 1
instructionSections:
  - title: Pâte
    steps:
      - Mélanger les ingrédients de la pâte.
  - title: Montage
    steps:
      - Garnir la pâte avec les fruits puis cuire.
---
```

The authoring shape determines the amount variant:

- Exact: `{ value: 125, unit: g }`
- Range: `{ min: 10, max: 12, unit: piece }`
- Qualitative: `{ text: selon le goût }`

Astro normalizes these shapes to the internal discriminated union with `type: exact`, `type: range`, or `type: qualitative`. Recipe files omit that derived `type` field.

Numeric values must be positive. A range requires `max >= min`. Numeric amounts scale by default; qualitative amounts do not. Set `scalable: false` only when a numeric amount must remain fixed. Alternatives have their own `name`, `amount`, and optional `note`, but cannot contain further alternatives.

## Composite recipe

A reusable entry is a normal collection entry with `kind: preparation`, an unlisted visibility, and a neutral yield when no natural yield exists:

```yaml
---
schemaVersion: 1
title: Sauce exemple
description: Une préparation réutilisable.
author: Camille
kind: preparation
visibility: unlisted
category: base
yield: { quantity: 1, label: batch }
durations: { prepMinutes: 5 }
ingredientGroups:
  - ingredients:
      - name: yaourt
        amount: { value: 200, unit: g }
instructionSections:
  - title: Préparation
    steps:
      - Mélanger jusqu’à obtenir une sauce lisse.
---
```

Another entry refers to it by directory ID and an explicit positive factor:

```yaml
---
schemaVersion: 1
title: Assiette composée
description: Une assiette servie avec sa sauce.
author: Camille
kind: recipe
visibility: listed
category: plat
yield: { quantity: 4, label: personnes }
durations: { prepMinutes: 20 }
ingredientGroups:
  - ingredients:
      - name: légumes rôtis
        amount: { value: 800, unit: g }
instructionSections:
  - title: Assemblage
    steps:
      - Servir les légumes avec la sauce.
components:
  - id: sauce-exemple
    factor: 0.5
---
```

The component graph must be acyclic. A parent yield scale propagates as `parent scale × component factor`, including nested preparations.

Omit `components` when an entry has none; Astro normalizes the missing field to an empty array. When components exist, keep their IDs and factors explicit.

## Identity and visibility

- `schemaVersion` is exactly `1` for this format.
- `title` and `author` are non-empty display strings.
- `kind` is `recipe` or `preparation`.
- `visibility` is `listed`, `unlisted`, or `draft`.
- Listed entries require a non-empty `description`.
- The production build creates routes for listed and unlisted entries, but not drafts. Development creates draft routes for preview. Only listed entries appear on the home page.
- `tags`, when present, is an array of unique non-empty strings.

## Categories

Categories are stable IDs. Their public French labels are defined once in `src/lib/recipes/categories.ts`:

| ID           | Label               |
| ------------ | ------------------- |
| `apero`      | Apéro               |
| `confiserie` | Confiseries         |
| `dessert`    | Dessert             |
| `entree`     | Entrée              |
| `pain`       | Pain                |
| `plat`       | Plat                |
| `sauce`      | Sauce               |
| `base`       | Préparation de base |

Adding a category requires changing the typed module, this table, and relevant tests in the same change.

## Units

Unitless numeric counts are valid. Otherwise use only these canonical codes:

| Family     | Codes                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Mass       | `mg`, `g`, `kg`                                                                                 |
| Volume     | `ml`, `cl`, `l`                                                                                 |
| Measures   | `tsp`, `tbsp`                                                                                   |
| Count-like | `piece`, `clove`, `bunch`, `stick`, `pinch`, `packet`, `slice`, `can`, `jar`, `leaf`, `handful` |

Canonical units are preserved during scaling; v1 performs no automatic conversion. A new code requires schema, formatter, documentation, and test updates together.

## Yield and scaling

Every entry has a positive numeric base `yield.quantity` and a non-empty `yield.label`. Preparations without a natural yield use `{ quantity: 1, label: batch }`.

For a recipe with a base yield of 4, entering 6 computes a scale of `6 / 4 = 1.5`:

- `200 g` becomes `300 g`.
- `10–12 piece` becomes `15–18 pièces`.
- A numeric alternative scales by the same factor.
- A component with factor `0.5` receives an effective factor of `1.5 × 0.5 = 0.75`.
- `{ text: selon le goût }` does not change.
- A numeric ingredient with `scalable: false` does not change.
- Equipment, timers, prose, and duration metadata do not change.

The browser always recalculates from immutable base values. It never rescales already rounded display text. French number formatting uses at most two decimal places and removes trailing zeroes.

## Durations, equipment, and instructions

`durations` accepts optional non-negative integer `prepMinutes`, `cookMinutes`, `restMinutes`, and `totalMinutes`; at least one must exist. `totalMinutes` is explicit and is never derived automatically.

Equipment items contain `name` and optional positive `quantity`, `optional`, and `note` fields. Do not encode cookware as an ingredient.

`instructionSections` and their `steps` are ordered. Every section has at least one step. Write a plain step directly as a string. Use an object with required `text` only when the step also has `timerMinutes`, `image`, or `ingredientKeys`:

```yaml
steps:
  - Mélanger les ingrédients.
  - text: Laisser reposer la pâte.
    timerMinutes: 60
```

Astro normalizes string steps to `{ text: "…" }` for the internal typed model. Ingredient keys are only needed when a step explicitly references ingredients; they must be unique within the entry and every reference must resolve.

Do not repeat an absolute scalable ingredient quantity in step text. Write “Ajouter la farine” instead of “Ajouter 220 g de farine”; the visible ingredient list is the scaling authority. Temperatures, times, shaping sizes, and batch divisions can remain in prose.

## Images and alt text

The main image is optional:

```yaml
image:
  src: ./image.jpg
  alt: Tarte dorée posée sur une assiette claire
  credit: https://example.test/source # optional
```

Paths are relative to `index.md`. Astro validates and imports the local image. Alt text is mandatory whenever an image exists and should communicate useful visual content, not a filename or “image de…”. A missing main image uses the designed placeholder.

Step images use the same shape and may add `caption`:

```yaml
image:
  src: ./faconnage.jpg
  alt: Trois étapes du façonnage des gnocchi à la fourchette
  caption: Creuser chaque gnocchi sans traverser la pâte.
```

## Authoring workflow

1. Use Node 24 and install dependencies with `npm ci`.
2. Run `npm run recipe:new -- mon-nouveau-slug`.
3. Edit the generated draft and place local images in the same directory.
4. Preview with `npm run dev`; drafts have development routes but do not appear on the home page.
5. Run `npm run validate` and fix every content, type, lint, unit, build, and browser-test failure.
6. Publish by changing `visibility: draft` to `listed` and ensuring the description is complete. Use `unlisted` only when a directly accessible route is intentional but the home listing is not.

The generator validates lowercase kebab-case and refuses to overwrite an existing directory.

## Schema evolution

Any breaking content-format change must increment `schemaVersion`, update all examples and tests, and migrate every collection entry in the same change. Do not leave mixed schema versions or compatibility fields in canonical content.
