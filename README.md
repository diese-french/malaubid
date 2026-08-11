# Malaubid

Malaubid is a static French recipe site built with Astro 7. Recipe quantities can be adapted in the browser while the base content remains readable without JavaScript.

## Development

```sh
nvm use
npm ci
npm run dev
```

Create a draft recipe with:

```sh
npm run recipe:new -- ma-nouvelle-recette
```

Use [Tarte aux poils](src/content/recipes/tarte-aux-poils/index.md) as a concise recipe template.

Run the full local acceptance suite with:

```sh
npm run validate
```

The canonical content format is documented in [`docs/recipe-format.md`](docs/recipe-format.md). Repository-specific contributor rules are in [`AGENTS.md`](AGENTS.md).

## Deployment

Astro builds a static site into `dist` with `npm run build`. Netlify uses the committed `netlify.toml` and Node 24. The migration target is `https://new.malau.bid`; the existing `malau.bid` site is outside this branch's cutover scope.
