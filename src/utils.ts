import * as dicoPlurals from '../dico.json';

const pluralMap = dicoPlurals as Record<string, string>;

const NUMERIC_REGEXP = /[-]?[\d]*[.]?[\d]+/g;

/**
 * Normalize a French ingredient name by converting plurals to singular
 * and replacing special characters.
 */
export function normalizeName(s: string): string {
  const words = s.split(/\s+/);
  const result: string[] = [];
  for (const word of words) {
    const key = word.toLowerCase().replace(/œ/g, 'oe');
    result.push(pluralMap[key] || key);
  }
  return result.join(' ');
}

/**
 * Parse a numeric quantity from a string or number value.
 * Handles HTML `&nbsp;` separators commonly found in recipe data.
 */
export function getMeasure(quantity: string | number): number {
  if (typeof quantity === 'number') {
    return quantity;
  }
  const parts = quantity.split('&nbsp;');
  const matches = parts[0].match(NUMERIC_REGEXP);
  return matches ? Number(matches[0]) : 0;
}
