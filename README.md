# 🍽️ Meal Planner

A TypeScript library for planning recipes, meals, weekly menus, and generating grocery lists with ingredient normalization for French cuisine.

## Features

- **Recipe Management** — Parse, store, and scale recipes by serving count
- **Ingredient Matching** — Fuzzy string matching to identify ingredients across recipes and store sections
- **French Language Support** — Automatic plural-to-singular normalization for French ingredient names
- **Weekly Meal Planning** — Organize meals into structured weekly plans with lunch and dinner
- **Shopping List Generation** — Aggregate ingredients across all meals into a consolidated, section-organized grocery list
- **Recipe Filtering** — Filter recipes by type (entrée, plat, dessert, etc.)

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Usage

```typescript
import {
  IngredientFinder,
  createWeeklyPlan,
  generateShoppingList,
  formatShoppingList,
  scaleRecipe,
} from 'meal-planner';

// Create an ingredient finder for fuzzy matching
const finder = new IngredientFinder([
  { name: 'carotte', rayon: 'légumes' },
  { name: 'pomme de terre', rayon: 'légumes' },
  { name: 'sel', rayon: 'condiments' },
]);

// Find the best match for a misspelled ingredient
console.log(finder.find('carottes')); // → 'carotte'

// Scale a recipe to different servings
const recipe = {
  id: '1',
  title: 'Gratin dauphinois',
  type: 'plat',
  person_count: 4,
  ingredients: [
    { name: 'pomme de terre', quantity: 800, unit: 'g' },
    { name: 'crème fraîche', quantity: 200, unit: 'ml' },
  ],
  instructions: 'Éplucher les pommes de terre...',
};
const scaled = scaleRecipe(recipe, 6); // Scale to 6 servings

// Generate a shopping list from a weekly plan
const plan = createWeeklyPlan(meals, 4);
const shoppingList = generateShoppingList(plan, courseIngredients);
console.log(formatShoppingList(shoppingList));
```

## Project Structure

```
src/
├── index.ts           # Public API exports
├── types.ts           # TypeScript type definitions
├── utils.ts           # Utility functions (name normalization, measurement parsing)
├── ingredients.ts     # Ingredient finding, parsing, and merging
├── recipes.ts         # Recipe parsing, scaling, and filtering
├── meal-plan.ts       # Weekly meal planning and shopping list generation
├── utils.test.ts      # Tests for utility functions
├── ingredients.test.ts # Tests for ingredient logic
├── recipes.test.ts    # Tests for recipe logic
└── meal-plan.test.ts  # Tests for meal planning and shopping lists
```

## Data Files

- **`dico.json`** — French plural-to-singular word dictionary used for ingredient name normalization
- **`exampleMenu.js`** — Sample menu data from the La Fabrique à Menus service
- **`cliqual/`** — CIQUAL French food composition database (nutritional reference data)
- **`createDict.js`** — Script to regenerate `dico.json` from the DELA French dictionary XML

## API Reference

### `normalizeName(name: string): string`
Normalize a French ingredient name by converting plurals to singular form.

### `getMeasure(quantity: string | number): number`
Parse a numeric quantity from a value that may contain HTML entities.

### `IngredientFinder`
Class that matches ingredient names using exact or fuzzy string matching.
- `constructor(courseIngredients: CourseIngredient[])` — Initialize with known ingredients
- `find(ingredient: string): string` — Find the best matching ingredient name

### `scaleRecipe(recipe: Recipe, targetServings: number): RecipeIngredient[]`
Scale recipe ingredients to a different number of servings.

### `filterRecipesByType(recipes: Recipe[], type: string): Recipe[]`
Filter recipes by type (case-insensitive, partial match).

### `createWeeklyPlan(meals: Meal[], personCount: number): WeeklyPlan`
Create a structured weekly meal plan from a list of meals.

### `generateShoppingList(plan: WeeklyPlan, courseIngredients: CourseIngredient[]): ShoppingList`
Generate a consolidated shopping list from a weekly meal plan.

### `formatShoppingList(shoppingList: ShoppingList): string`
Format a shopping list as human-readable text organized by store section.

## License

GPL-3.0 — see [LICENSE](LICENSE) for details.
