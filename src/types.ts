/** Represents a unit of measurement with optional gram conversion. */
export interface MeasureUnit {
  name: string;
  gramPerUnit?: number;
}

/** A raw ingredient from a menu course with quantity and unit info. */
export interface CourseIngredient {
  name: string;
  rayon: string;
  gram?: number;
  quantity?: number;
  unit?: string;
}

/** An ingredient reference used in a recipe. */
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

/** A recipe with ingredients, instructions, and metadata. */
export interface Recipe {
  id: string;
  title: string;
  type: string;
  person_count: number;
  ingredients: RecipeIngredient[];
  instructions: string;
}

/** A single meal (lunch or dinner) with its recipes. */
export interface Meal {
  recettes: Recipe[];
  mealTime: string;
}

/** A full day's meal plan with lunch and dinner. */
export interface DayPlan {
  day: string;
  lunch: Meal;
  dinner: Meal;
}

/** A weekly meal plan. */
export interface WeeklyPlan {
  personCount: number;
  days: DayPlan[];
  createdAt: Date;
}

/** An aggregated ingredient for the shopping list. */
export interface ShoppingItem {
  name: string;
  rayon: string;
  quantities: { amount: number; unit: string }[];
  units: MeasureUnit[];
}

/** A shopping list grouped by store section. */
export interface ShoppingList {
  items: ShoppingItem[];
  generatedAt: Date;
}

/** Nutritional information for an ingredient (per 100g). */
export interface NutritionalInfo {
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number;
}
