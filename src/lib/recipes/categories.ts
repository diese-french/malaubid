export const CATEGORIES = {
  apero: 'Apéro',
  confiserie: 'Confiseries',
  dessert: 'Dessert',
  entree: 'Entrée',
  pain: 'Pain',
  plat: 'Plat',
  sauce: 'Sauce',
  base: 'Préparation de base',
} as const;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as [
  CategoryId,
  ...CategoryId[],
];

export type CategoryId = keyof typeof CATEGORIES;

export function getCategoryLabel(category: CategoryId): string {
  return CATEGORIES[category];
}
