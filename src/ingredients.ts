import * as stringSimilarity from 'string-similarity';
import type { CourseIngredient, RecipeIngredient } from './types';
import { normalizeName, getMeasure } from './utils';

/**
 * Finds the best matching ingredient name from a known set
 * using exact match first, then fuzzy string similarity.
 */
export class IngredientFinder {
  private allIngredientNames: string[];
  private ingredientSet: Set<string>;

  constructor(courseIngredients: CourseIngredient[]) {
    this.allIngredientNames = courseIngredients.map((e) => e.name);
    this.ingredientSet = new Set(this.allIngredientNames);
  }

  /**
   * Find the best match for an ingredient name.
   * Returns exact match if found, otherwise the closest fuzzy match.
   */
  find(ingredient: string): string {
    if (this.ingredientSet.has(ingredient)) {
      return ingredient;
    }
    if (this.allIngredientNames.length === 0) {
      return ingredient;
    }
    const matches = stringSimilarity.findBestMatch(ingredient, this.allIngredientNames);
    return matches.bestMatch.target;
  }
}

/**
 * Extract components from a rayon (store section) in the menu data.
 */
export function getRayonComponents(
  components: Array<{
    gram?: number;
    id: string;
    quantity: string | number;
    measure: { measure: string };
  }>,
  rayon: string,
): CourseIngredient[] {
  const items: CourseIngredient[] = [];
  for (const c of components) {
    items.push({
      gram: c.gram,
      name: normalizeName(c.id),
      quantity: getMeasure(c.quantity),
      unit: normalizeName(c.measure.measure),
      rayon,
    });
  }
  return items;
}

/**
 * Parse a list of raw ingredient strings into structured RecipeIngredient objects.
 */
export function getIngredients(
  ingredientList: string[],
  ingrFinder: IngredientFinder,
): RecipeIngredient[] {
  const items: RecipeIngredient[] = [];
  for (const ing of ingredientList) {
    const tab = ing.split('&nbsp;');
    const quantityMatch = tab[1]?.match(/[-]?[\d]*[.]?[\d]+/g);
    items.push({
      name: ingrFinder.find(normalizeName(tab[0])),
      quantity: quantityMatch ? Number(quantityMatch[0]) : 0,
      unit: normalizeName(tab[2] || 'unité'),
    });
  }
  return items;
}

/**
 * Merge an ingredient quantity into the aggregated ingredient map.
 * If the same unit already exists, adds the quantity; otherwise creates a new entry.
 */
export function mergeIngredients(
  allIngredients: Record<string, Array<{ name: string; quantity: number; unit: string }>>,
  ingredient: RecipeIngredient,
  divisor: number,
): void {
  if (!allIngredients[ingredient.name]) {
    allIngredients[ingredient.name] = [];
  }
  for (const item of allIngredients[ingredient.name]) {
    if (item.unit === ingredient.unit) {
      item.quantity += ingredient.quantity / divisor;
      return;
    }
  }
  allIngredients[ingredient.name].push({
    name: ingredient.name,
    quantity: ingredient.quantity / divisor,
    unit: ingredient.unit,
  });
}
