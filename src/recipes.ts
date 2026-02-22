import type { Recipe, Meal, RecipeIngredient } from './types';
import { IngredientFinder, getIngredients } from './ingredients';
import { normalizeName } from './utils';

/**
 * Parse raw recipe data into structured Recipe objects.
 */
export function getRecettes(
  recettes: Array<{
    nid: string;
    field_recipe_ingredients_list: string[];
    field_recipe_person_count: number;
    field_recipe_type: string;
    field_recipe_description: string;
    title: string;
  }>,
  ingrFinder: IngredientFinder,
): Recipe[] {
  const items: Recipe[] = [];
  for (const r of recettes) {
    items.push({
      id: r.nid,
      ingredients: getIngredients(r.field_recipe_ingredients_list, ingrFinder),
      person_count: r.field_recipe_person_count,
      type: r.field_recipe_type,
      instructions: r.field_recipe_description,
      title: r.title,
    });
  }
  return items;
}

/**
 * Scale recipe ingredients to a different number of servings.
 */
export function scaleRecipe(recipe: Recipe, targetServings: number): RecipeIngredient[] {
  const factor = targetServings / recipe.person_count;
  return recipe.ingredients.map((ing) => ({
    name: ing.name,
    quantity: Math.round(ing.quantity * factor * 100) / 100,
    unit: ing.unit,
  }));
}

/**
 * Filter recipes by type (e.g., 'entrée', 'plat', 'dessert').
 */
export function filterRecipesByType(recipes: Recipe[], type: string): Recipe[] {
  const normalizedType = type.toLowerCase();
  return recipes.filter((r) => r.type.toLowerCase().includes(normalizedType));
}
