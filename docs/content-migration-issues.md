# Content migration issues

This file records source ambiguities found while converting the Jekyll collections. The migration preserves the source values or makes the narrow representation choice documented below; it does not silently correct cooking data.

## Durations

The following legacy totals are less than the sum of their preparation and cooking fields. They are preserved exactly because the source does not say whether some activities overlap:

- `choufleur-sesame-caramelise`: 30 min preparation + 30 min cooking, total 45 min.
- `gnocchi`: 60 min preparation + 30 min cooking, total 70 min.
- `houmous-potimarron`: 20 min preparation + 120 min cooking, total 120 min.
- `pate-brisee`: 10 min preparation + 30 min cooking, total 30 min.
- `tartepotimarron`: 25 min preparation + 45 min cooking, total 65 min.
- `tzatziki`: 10 min preparation + 120 min cooking, total 120 min.

Additional duration anomalies:

- `pain-semoule` has the malformed legacy value `totalTime: minutes`; `totalMinutes` is omitted while the 105 min preparation and 15 min cooking fields are retained.
- `tzatziki` has `cookTime: 120 minutes` despite describing draining/resting rather than cooking. It remains `cookMinutes` pending an author decision.
- `brioche-nanterre`, `brioche-tressee`, and `buns` have totals that include long rises or rests not represented by a separate legacy field. Their total values are preserved.

## Yields and amounts

- The five legacy components and `shortbread-millionaire` had no yield. Each uses the schema's neutral fallback of `1 batch`.
- `flamiche-poireaux` said `4-6 personnes`. The numeric base yield is 6 with label `personnes`, preserving the upper bound required by the scalar yield schema.
- `pate-brisee` said `1 tarte 6/8 parts`. It is represented as quantity 1 with label `tarte 6/8 parts`; the slash remains unresolved.
- `pain-semoule` said `un pain de 24 cm`. It is represented as quantity 1 with label `pain de 24 cm`.
- `flamiche-poireaux` uses 1.2 times the base yield of `pate-brisee`. It is represented as a component with `factor: 1.2`, so parent yield scaling propagates to the linked recipe.
- `baklawa` describes `250 g de pâte filo (10/12 feuilles)`. The mass is canonical and the leaf count remains a note because the slash is ambiguous.
- `pancakes` describes `3 g de sel (ou beurre salé)`. The note is preserved; the source does not provide a quantity of salted butter for a valid structured alternative.
- Source ingredients without quantities (`huile de sésame`, `feta`, `sauce soja`, spices, herbs, and similar items) use qualitative, non-scalable amounts such as `selon le goût` rather than invented numbers.

## Structural choices

- The source heading `Béchamel :` in `moussaka` and `Pour la pâte:` in `tartepotimarron` are ingredient-group titles, not ingredients.
- Macaron ingredients are grouped into `Base`, `Meringue`, and `Crème et parfums` from their source annotations.
- The `moule à tatin` entry moved from ingredients to equipment.
- The pâte brisée consumed by `flamiche-poireaux` and `tarte-tatin` is represented by a typed `pate-brisee` component reference rather than a duplicated plain ingredient. Their factors are 1.2 and 1 respectively.
- The reciprocal serving suggestions between `pain-pita` and `houmous-potimarron` remain ordinary prose links because neither recipe consumes or scales the other.
- The brioche tressée source amount `3 œufs (+ 1 pour la dorure)` is represented as two ingredient lines so both quantities scale coherently.
- Baklawa's 120 g of butter is split into the source-prescribed 20 g for the filling and 100 g for the pastry layers. The total remains 120 g.
- The old gnocchi step link pointed to a generated Jekyll image path. The original image is now colocated as a step image with alt text.
- `sauce-aubergine-feta` referenced `missing.jpg`, which did not exist. The entry deliberately has no hero and exercises the site placeholder.
- `tarte-aux-poils.jpg` and `vanilla-custard.jpg` had no recipe entries at migration time and are not copied into the canonical collection.

## Instruction rewordings for scaling

These are the only changes made to remove absolute scalable ingredient quantities from prose. Cooking meaning is unchanged:

- `baklawa`, filling: `20 g de beurre`, `2 cs de miel`, `1 cs de cannelle`, and `4 cs d'eau de fleur d'oranger` were replaced with references to the named filling ingredients.
- `baklawa`, pastry layers: `100 g de beurre` became `le beurre pour le feuilletage`.
- `beignets-aubergine`: `les 3 jaunes d'œufs` became `les jaunes d'œufs`.
- `macarons`: `220g de blancs` became `les blancs prévus pour la base`.

All other numeric step text denotes time, temperature, shaping dimensions, batch division, or per-item size rather than an absolute scalable ingredient amount.
