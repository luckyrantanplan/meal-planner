import type {
  Meal,
  DayPlan,
  WeeklyPlan,
  ShoppingItem,
  ShoppingList,
  CourseIngredient,
} from './types';
import { mergeIngredients } from './ingredients';

/**
 * Create a weekly meal plan from an array of meals.
 * Pairs meals into days (lunch/dinner).
 */
export function createWeeklyPlan(meals: Meal[], personCount: number): WeeklyPlan {
  const days: DayPlan[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let i = 0; i < meals.length; i += 2) {
    const dayIndex = Math.floor(i / 2);
    days.push({
      day: dayNames[dayIndex % 7],
      lunch: meals[i],
      dinner: meals[i + 1] || { recettes: [], mealTime: 'dinner' },
    });
  }

  return {
    personCount,
    days,
    createdAt: new Date(),
  };
}

/**
 * Generate a shopping list from a weekly meal plan.
 * Aggregates all ingredients across meals and groups by store section.
 */
export function generateShoppingList(
  weeklyPlan: WeeklyPlan,
  courseIngredients: CourseIngredient[],
): ShoppingList {
  const allIngredientMap: Record<string, Array<{ name: string; quantity: number; unit: string }>> =
    {};

  for (const day of weeklyPlan.days) {
    const meals = [day.lunch, day.dinner];
    for (const meal of meals) {
      for (const recette of meal.recettes) {
        for (const ingredient of recette.ingredients) {
          mergeIngredients(allIngredientMap, ingredient, recette.person_count);
        }
      }
    }
  }

  const items: ShoppingItem[] = [];
  const ingredientRayonMap = new Map<string, string>();
  for (const ci of courseIngredients) {
    ingredientRayonMap.set(ci.name, ci.rayon);
  }

  for (const [name, quantities] of Object.entries(allIngredientMap)) {
    items.push({
      name,
      rayon: ingredientRayonMap.get(name) || 'other',
      quantities: quantities.map((q) => ({ amount: q.quantity, unit: q.unit })),
      units: [],
    });
  }

  // Sort by store section for efficient shopping
  items.sort((a, b) => a.rayon.localeCompare(b.rayon) || a.name.localeCompare(b.name));

  return {
    items,
    generatedAt: new Date(),
  };
}

/**
 * Format a shopping list as a human-readable text string.
 */
export function formatShoppingList(shoppingList: ShoppingList): string {
  const lines: string[] = ['🛒 Shopping List', '================', ''];

  let currentRayon = '';
  for (const item of shoppingList.items) {
    if (item.rayon !== currentRayon) {
      currentRayon = item.rayon;
      lines.push(`--- ${currentRayon.toUpperCase()} ---`);
    }
    const qty = item.quantities
      .map((q) => `${q.amount.toFixed(1)} ${q.unit}`)
      .join(' + ');
    lines.push(`  • ${item.name}: ${qty}`);
  }

  return lines.join('\n');
}
