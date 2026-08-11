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

test('home search filters recipes without case or accent sensitivity', async ({
  page,
}) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', {
    name: 'Rechercher une recette',
  });
  const visibleCards = page.locator('[data-recipe-card]:visible');

  await search.fill('PATE BRISEE');
  await expect(visibleCards).toHaveCount(3);
  await expect(visibleCards.locator('[data-recipe-title]')).toHaveText([
    'Flamiche aux poireaux',
    'Pâte brisée',
    'Tarte tatin',
  ]);
  await expect(page.locator('[data-search-status]')).toHaveText('3 recettes');

  await search.fill('amande en poudre');
  await expect(visibleCards).toHaveCount(3);
  await expect(visibleCards.locator('[data-recipe-title]')).toHaveText([
    'Baklawa',
    'Financiers',
    'Macarons et crème',
  ]);

  await search.fill('recette inexistante');
  await expect(visibleCards).toHaveCount(0);
  await expect(page.locator('[data-search-status]')).toHaveText(
    'Aucune recette',
  );

  await search.fill('');
  await expect(visibleCards).toHaveCount(34);
  await expect(page.locator('[data-search-status]')).toBeEmpty();
});

test('home restores the GitHub button and a discoverable RSS feed', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('link', { name: 'View on GitHub' }),
  ).toHaveAttribute('href', 'https://github.com/diese-french/malaubid');
  await expect(
    page.getByRole('contentinfo').getByRole('link', {
      name: 'Subscribe via RSS',
    }),
  ).toHaveAttribute('href', '/feed.xml');
  await expect(
    page.locator('link[rel="alternate"][type="application/rss+xml"]'),
  ).toHaveAttribute('href', 'https://malau.bid/feed.xml');

  const response = await page.request.get('/feed.xml');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/xml');
  const feed = await response.text();
  expect(feed.match(/<item>/gu) ?? []).toHaveLength(34);
  expect(feed).toContain('<title>Pâte brisée</title>');
  expect(feed).not.toContain('Tarte aux poils');
});

test('home grid adds columns instead of stretching cards on wide screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1298, height: 900 });
  await page.goto('/');

  const grid = page.locator('#recipe-grid');
  const columnCount = () =>
    grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );

  await expect.poll(columnCount).toBe(3);
  const standardCardWidth = await page
    .locator('[data-recipe-card]')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  const standardTitleSize = await page
    .locator('[data-recipe-title]')
    .first()
    .evaluate((element) => getComputedStyle(element).fontSize);

  await page.setViewportSize({ width: 1915, height: 1080 });
  await expect.poll(columnCount).toBe(5);
  const wideCardWidth = await page
    .locator('[data-recipe-card]')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  const wideTitleSize = await page
    .locator('[data-recipe-title]')
    .first()
    .evaluate((element) => getComputedStyle(element).fontSize);

  expect(wideCardWidth).toBeLessThan(standardCardWidth);
  expect(wideTitleSize).toBe(standardTitleSize);
});

test('recipe renders metadata, equipment, ingredients, and steps without duplicating its introduction', async ({
  page,
}) => {
  await page.goto('/recettes/tarte-tatin/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tarte tatin' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('complementary')
      .getByRole('heading', { level: 2, name: 'Ingrédients' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Matériel' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Préparation',
      exact: true,
    }),
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
  await expect(
    page.locator('[data-component-reference="pate-brisee"]'),
  ).toContainText('1 × Pâte brisée');
});

test('recipe notes appear once beside the title', async ({ page }) => {
  await page.goto('/recettes/brioche-nanterre/');
  await expect(
    page.getByText(
      'Utiliser des ingrédients froids évite la surchauffe au pétrissage, et la fonte du beurre.',
      { exact: true },
    ),
  ).toHaveCount(1);
  await expect(
    page.getByText(
      'Utiliser un bon beurre extra fin et de la farine dite forte (de Gruau), c’est ce qui donnera le bon goût à la brioche.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Notes' }),
  ).toHaveCount(0);
});

test('linked preparation factors and ingredients scale with their parent recipe', async ({
  page,
}) => {
  await page.goto('/recettes/flamiche-poireaux/');

  const reference = page.locator('[data-component-reference="pate-brisee"]');
  await expect(reference).toContainText('1,2 × Pâte brisée');
  await expect(
    reference.getByRole('link', { name: 'Pâte brisée' }),
  ).toHaveAttribute('href', '/recettes/pate-brisee/');

  const factor = page.locator('[data-component-factor="pate-brisee"]');
  const componentFlour = page.locator(
    '[data-component-id="pate-brisee"] [data-ingredient-name="farine"] .amount',
  );
  await expect(componentFlour).toHaveText('300 g');

  await page.locator('[data-yield-input]').fill('12');
  await expect(factor).toHaveText('2,4');
  await expect(componentFlour).toHaveText('600 g');
});

test('prose recommendations link to related recipes without composing them', async ({
  page,
}) => {
  await page.goto('/recettes/pain-pita/');
  await expect(
    page.getByRole('link', { name: /houmous de potimarron/ }),
  ).toHaveAttribute('href', '/recettes/houmous-potimarron/');
  await expect(page.locator('[data-component-reference]')).toHaveCount(0);
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

test('yield control advances by half units from the first step', async ({
  page,
}) => {
  await page.goto('/recettes/gnocchi/');
  const target = page.locator('[data-yield-input]');
  await expect(target).toHaveValue('4');
  await target.press('ArrowUp');
  await expect(target).toHaveValue('4.5');
  await target.press('ArrowUp');
  await expect(target).toHaveValue('5');
});

test('recipe keeps the screen awake and reacquires the lock when visible again', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let requests = 0;
    let visibility: DocumentVisibilityState = 'visible';
    let currentLock: WakeLockSentinel | null = null;

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          requests += 1;
          let released = false;
          const lock = new EventTarget() as WakeLockSentinel;
          Object.defineProperties(lock, {
            released: { get: () => released },
            type: { value: 'screen' },
          });
          lock.release = async () => {
            if (released) return;
            released = true;
            lock.dispatchEvent(new Event('release'));
          };
          currentLock = lock;
          return lock;
        },
      },
    });
    Object.defineProperty(window, 'wakeLockTest', {
      value: {
        get requests() {
          return requests;
        },
        setVisibility(nextVisibility: DocumentVisibilityState) {
          visibility = nextVisibility;
          if (visibility === 'hidden') void currentLock?.release();
          document.dispatchEvent(new Event('visibilitychange'));
        },
      },
    });
  });

  await page.goto('/recettes/gnocchi/');
  const requestCount = () =>
    page.evaluate(
      () =>
        (
          window as typeof window & {
            wakeLockTest: { requests: number };
          }
        ).wakeLockTest.requests,
    );

  await expect.poll(requestCount).toBe(1);
  await page.evaluate(() => {
    (
      window as typeof window & {
        wakeLockTest: {
          setVisibility(visibility: DocumentVisibilityState): void;
        };
      }
    ).wakeLockTest.setVisibility('hidden');
  });
  await page.evaluate(() => {
    (
      window as typeof window & {
        wakeLockTest: {
          setVisibility(visibility: DocumentVisibilityState): void;
        };
      }
    ).wakeLockTest.setVisibility('visible');
  });
  await expect.poll(requestCount).toBe(2);
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

test('missing recipe image uses the designed placeholder', async ({ page }) => {
  await page.goto('/recettes/sauce-aubergine-feta/');
  await expect(
    page.locator('.recipe-image [data-image-placeholder]'),
  ).toBeVisible();
});

test('recipe image is constrained to the viewport', async ({ page }) => {
  await page.goto('/recettes/gnocchi/');
  const recipeImage = page.locator('.recipe-image img');
  await expect(recipeImage).toBeVisible();
  const box = await recipeImage.boundingBox();
  const titleBox = await page.getByRole('heading', { level: 1 }).boundingBox();
  const viewport = page.viewportSize();
  if (!box || !titleBox || !viewport) {
    throw new Error('Recipe header dimensions unavailable.');
  }
  expect(box.height).toBeLessThanOrEqual(
    Math.min(30 * 16, viewport.height * 0.55) + 1,
  );
  if (viewport.width > 48 * 16) {
    expect(box.x + box.width).toBeLessThan(titleBox.x);
    expect(titleBox.y).toBeLessThan(box.y + box.height);
  } else {
    expect(titleBox.y).toBeGreaterThanOrEqual(box.y + box.height);
  }
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
