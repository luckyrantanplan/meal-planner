# Agents

Instructions for AI agents working on the Meal Planner project.

## Project Overview

This is a TypeScript library for meal planning, recipe management, and grocery list generation with French language support. The codebase is organized into modular source files under `src/`.

## Architecture

- **`src/types.ts`** — All shared TypeScript interfaces and types
- **`src/utils.ts`** — Low-level utilities: French name normalization, measurement parsing
- **`src/ingredients.ts`** — Ingredient matching (fuzzy search), parsing, and merging logic
- **`src/recipes.ts`** — Recipe parsing, scaling, and filtering
- **`src/meal-plan.ts`** — Weekly plan creation, shopping list generation and formatting
- **`src/index.ts`** — Public API barrel file

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Build**: `npm run build` (compiles TypeScript to `dist/`)
3. **Test**: `npm test` (runs Vitest)
4. **Lint**: `npm run lint`

## Key Patterns

- All ingredient names go through `normalizeName()` for French plural-to-singular conversion
- `IngredientFinder` uses `string-similarity` for fuzzy matching when exact matches fail
- Shopping lists aggregate ingredients by merging quantities with matching units
- The `dico.json` dictionary maps French plural words to their singular forms

## Testing

Tests are co-located with source files (`*.test.ts`). Run with `npm test`. Use Vitest.

## Data Files

- `dico.json` is a large generated dictionary — do not edit manually
- `exampleMenu.js` contains sample data for development and testing
- `cliqual/` contains French nutritional reference data (CIQUAL database)
- `createDict.js` regenerates `dico.json` from the DELA dictionary XML

## Adding New Features

When adding features:
1. Define types in `src/types.ts`
2. Implement logic in the appropriate module
3. Export from `src/index.ts`
4. Add tests in a co-located `*.test.ts` file
5. Update the README API reference
