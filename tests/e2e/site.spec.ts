import { expect, test } from '@playwright/test';

test('home lists only public recipes in French alphabetical order', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('[data-recipe-card]');
  await expect(cards).toHaveCount(34);

  const titles = await page.locator('[data-recipe-title]').allTextContents();
  const expected = [...titles].sort(
    new Intl.Collator('fr-FR', { sensitivity: 'base' }).compare,
  );
  expect(titles).toEqual(expected);
  expect(titles).not.toContain('Sauce au yaourt');
  expect(titles).not.toContain('Shortbread');
  await expect(page.getByText(/À table|prêtes à cuisiner/i)).toHaveCount(0);
});

test('simple recipe renders metadata, equipment, ingredients, and steps without duplicating its introduction', async ({
  page,
}) => {
  await page.goto('/recettes/tarte-tatin/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tarte tatin' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Ingrédients' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Matériel' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Préparation' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Avec des demis pommes la tarte est bien épaisse. La crème fraîche apporte un vrai plus.',
      { exact: true },
    ),
  ).toHaveCount(1);
  await expect(page.locator('time[datetime="PT1H30M"]')).toHaveText(
    '1 h 30 min',
  );
});

test('composite recipe renders nested preparations and scales every component from immutable bases', async ({
  page,
}) => {
  await page.goto('/recettes/falafels/');
  await expect(
    page.locator('[data-component-id="falafels-preparation"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-component-id="sauce-au-yaourt"]'),
  ).toBeVisible();

  const chickpeas = page.locator(
    '[data-ingredient-name="pois chiches secs"] .amount',
  );
  const yogurt = page.locator('[data-ingredient-name="yaourt grec"] .amount');
  await expect(chickpeas).toHaveText('500 g');
  await expect(yogurt).toHaveText('225 g');

  const target = page.locator('[data-yield-input]');
  await target.fill('10');
  await expect(chickpeas).toHaveText('1 000 g');
  await expect(yogurt).toHaveText('450 g');

  await target.fill('7');
  await page.locator('[data-yield-reset]').click();
  await expect(chickpeas).toHaveText('500 g');
  await expect(yogurt).toHaveText('225 g');
});

test('invalid target input leaves rendered quantities intact', async ({
  page,
}) => {
  await page.goto('/recettes/pancakes/');
  const flour = page.locator('[data-ingredient-name="farine"] .amount');
  await expect(flour).toHaveText('200 g');

  const target = page.locator('[data-yield-input]');
  await target.fill('24');
  await expect(flour).toHaveText('400 g');
  await target.fill('');
  await expect(flour).toHaveText('400 g');
  await expect(target).toHaveAttribute('aria-invalid', 'true');
});

test('base quantities remain readable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/recettes/pancakes/');
  await expect(
    page.locator('[data-ingredient-name="farine"] .amount'),
  ).toHaveText('200 g');
  await context.close();
});

test('missing hero uses the designed placeholder', async ({ page }) => {
  await page.goto('/recettes/sauce-aubergine-feta/');
  await expect(
    page.locator('.hero-media [data-hero-placeholder]'),
  ).toBeVisible();
});

test('JSON-LD matches visible recipe identity, yield, and ingredient data', async ({
  page,
}) => {
  await page.goto('/recettes/pancakes/');
  const rawJsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  if (rawJsonLd === null) throw new Error('Recipe JSON-LD was not rendered.');
  const jsonLd = JSON.parse(rawJsonLd);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(jsonLd.name);
  expect(jsonLd.recipeYield).toBe('12 pancakes');
  expect(jsonLd.recipeIngredient).toContain('200 g farine');
  await expect(page.locator('[data-ingredient-name="farine"]')).toContainText(
    '200 g',
  );
});

for (const path of [
  '/',
  '/recettes/pancakes/',
  '/recettes/falafels/',
  '/recettes/sauce-aubergine-feta/',
]) {
  test(`${path} has no horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}
