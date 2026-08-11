# Malaubid contributor guide

## Commands

- Use Node 24 and npm. Run `nvm use` before installing or validating.
- Install exactly from the lockfile with `npm ci`.
- Start local development with `npm run dev`.
- Run the complete acceptance suite with `npm run validate`.
- Individual checks are `npm run format:check`, `npm run lint`, `npm run check`, `npm run validate:recipes`, `npm run test`, `npm run build`, and `npm run test:e2e`.
- Create a draft with `npm run recipe:new -- <slug>`.

## Architecture

- This is a static Astro 7 site. Do not add a deployment adapter or server-rendered routes.
- Keep `site` set to `https://new.malau.bid` until an explicitly separate production cutover changes it. Do not alter `malau.bid` DNS or deployment from this repository migration.
- Store the only canonical recipe representation at `src/content/recipes/<id>/index.md`, with local images beside it.
- Keep content schema and image validation in `src/content.config.ts`.
- Keep categories in `src/lib/recipes/categories.ts` and units in `src/lib/recipes/units.ts`; update `docs/recipe-format.md` and tests in the same change when either vocabulary changes.
- Keep scaling, formatting, component traversal, durations, validation, and JSON-LD as framework-free pure TypeScript under `src/lib/recipes/`.
- Client behavior stays framework-free. Do not add React, Vue, or another client framework for quantity scaling.
- Use global vanilla CSS for tokens, reset, and layout primitives; use scoped Astro component styles for component-specific presentation.

## Content invariants

- Every entry uses `schemaVersion: 1` and passes both the Astro collection schema and `npm run validate:recipes`.
- Listed entries require descriptions. Preparations remain unlisted unless product requirements change.
- Numeric amounts and yields are positive; ranges have `max >= min`; durations are non-negative whole minutes.
- Numeric ingredient amounts scale by default. Qualitative amounts do not. Explicit `scalable: false` always wins.
- Component IDs must exist, factors must be positive, and component graphs must remain acyclic.
- Ingredient keys are unique inside an entry. Every key referenced by a step must exist in that entry.
- Author amount variants by shape (`value`, `min`/`max`, or `text`) without a derived `type` field; collection validation restores the discriminated domain type.
- Write plain instruction steps as strings. Use `{ text, ...metadata }` only for steps with timers, images, or ingredient keys, and omit empty `components` lists.
- Every local image requires useful alt text. A missing main image is valid and must render the designed placeholder.
- Do not repeat scalable absolute ingredient quantities in step prose. Refer to the named ingredient instead.
- Preserve canonical units during scaling; v1 performs no unit conversion.
- Breaking schema changes increment `schemaVersion`, update docs and tests, and migrate every entry in the same change.

## Astro documentation requirement

Before changing content collections, image handling, testing integration, routing, build output, or Netlify deployment, consult the current official Astro documentation through the Astro docs MCP. Do not rely on remembered APIs for these subsystems.
