export const UNIT_CODES = [
  'mg',
  'g',
  'kg',
  'ml',
  'cl',
  'l',
  'tsp',
  'tbsp',
  'piece',
  'clove',
  'bunch',
  'stick',
  'pinch',
  'packet',
  'slice',
  'can',
  'jar',
  'leaf',
  'handful',
] as const;

export type UnitCode = (typeof UNIT_CODES)[number];

const INVARIANT_UNITS: Partial<Record<UnitCode, string>> = {
  mg: 'mg',
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'l',
  tsp: 'c. à café',
  tbsp: 'c. à soupe',
};

const COUNT_UNITS: Partial<Record<UnitCode, readonly [string, string]>> = {
  piece: ['pièce', 'pièces'],
  clove: ['gousse', 'gousses'],
  bunch: ['bouquet', 'bouquets'],
  stick: ['bâton', 'bâtons'],
  pinch: ['pincée', 'pincées'],
  packet: ['sachet', 'sachets'],
  slice: ['tranche', 'tranches'],
  can: ['boîte', 'boîtes'],
  jar: ['pot', 'pots'],
  leaf: ['feuille', 'feuilles'],
  handful: ['poignée', 'poignées'],
};

export function formatUnit(unit: UnitCode, value: number): string {
  const invariant = INVARIANT_UNITS[unit];
  if (invariant) return invariant;

  const labels = COUNT_UNITS[unit];
  if (!labels) return unit;
  return Math.abs(value) === 1 ? labels[0] : labels[1];
}
