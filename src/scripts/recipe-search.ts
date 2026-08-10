import { matchesSearch } from '../lib/recipes/search';

export function initializeRecipeSearch(root: ParentNode = document): void {
  const input = root.querySelector<HTMLInputElement>('[data-recipe-search]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const cards = Array.from(
    root.querySelectorAll<HTMLElement>('[data-recipe-card]'),
  );
  if (!input || !status || cards.length === 0) return;

  const update = (): void => {
    let visible = 0;
    for (const card of cards) {
      const matches = matchesSearch(card.dataset.searchText ?? '', input.value);
      card.hidden = !matches;
      if (matches) visible += 1;
    }

    if (!input.value.trim()) {
      status.textContent = '';
    } else if (visible === 0) {
      status.textContent = 'Aucune recette';
    } else {
      status.textContent = `${visible} recette${visible > 1 ? 's' : ''}`;
    }
  };

  input.addEventListener('input', update);
}

if (typeof document !== 'undefined') initializeRecipeSearch();
