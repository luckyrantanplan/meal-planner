import express from 'express';
import path from 'path';
import type { Recipe, Meal, CourseIngredient } from './types';
import { createWeeklyPlan, generateShoppingList, formatShoppingList } from './meal-plan';
import { scaleRecipe, filterRecipesByType } from './recipes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

// In-memory data store
const recipes: Recipe[] = [];
const courseIngredients: CourseIngredient[] = [];

// --- Recipe endpoints ---

app.get('/api/recipes', (_req, res) => {
  const { type } = _req.query;
  if (typeof type === 'string' && type) {
    return res.json(filterRecipesByType(recipes, type));
  }
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  const { title, type, person_count, ingredients, instructions } = req.body;
  if (!title || !type || !person_count || !ingredients) {
    return res.status(400).json({ error: 'Missing required fields: title, type, person_count, ingredients' });
  }
  const recipe: Recipe = {
    id: String(Date.now()),
    title,
    type,
    person_count: Number(person_count),
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    instructions: instructions || '',
  };
  recipes.push(recipe);
  res.status(201).json(recipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const idx = recipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Recipe not found' });
  const removed = recipes.splice(idx, 1);
  res.json(removed[0]);
});

app.post('/api/recipes/:id/scale', (req, res) => {
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  const { targetServings } = req.body;
  if (!targetServings) return res.status(400).json({ error: 'Missing targetServings' });
  const scaled = scaleRecipe(recipe, Number(targetServings));
  res.json(scaled);
});

// --- Meal plan endpoints ---

app.post('/api/meal-plan', (req, res) => {
  const { meals, personCount } = req.body;
  if (!meals || !personCount) {
    return res.status(400).json({ error: 'Missing required fields: meals, personCount' });
  }
  const plan = createWeeklyPlan(meals as Meal[], Number(personCount));
  res.json(plan);
});

// --- Shopping list endpoints ---

app.post('/api/shopping-list', (req, res) => {
  const { meals, personCount } = req.body;
  if (!meals || !personCount) {
    return res.status(400).json({ error: 'Missing required fields: meals, personCount' });
  }
  const plan = createWeeklyPlan(meals as Meal[], Number(personCount));
  const list = generateShoppingList(plan, courseIngredients);
  res.json(list);
});

app.post('/api/shopping-list/text', (req, res) => {
  const { meals, personCount } = req.body;
  if (!meals || !personCount) {
    return res.status(400).json({ error: 'Missing required fields: meals, personCount' });
  }
  const plan = createWeeklyPlan(meals as Meal[], Number(personCount));
  const list = generateShoppingList(plan, courseIngredients);
  res.type('text/plain').send(formatShoppingList(list));
});

// --- Ingredients endpoint ---

app.get('/api/ingredients', (_req, res) => {
  res.json(courseIngredients);
});

app.post('/api/ingredients', (req, res) => {
  const { name, rayon } = req.body;
  if (!name || !rayon) {
    return res.status(400).json({ error: 'Missing required fields: name, rayon' });
  }
  const ingredient: CourseIngredient = { name, rayon };
  courseIngredients.push(ingredient);
  res.status(201).json(ingredient);
});

// Serve frontend for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🍽️  Meal Planner running at http://localhost:${PORT}`);
  });
}

export default app;
