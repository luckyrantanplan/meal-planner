import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'net';

let server: ReturnType<typeof import('http').createServer>;
let baseUrl: string;

beforeAll(async () => {
  const { default: app } = await import('./server');
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

afterAll(() => {
  if (server) server.close();
});

describe('Server API', () => {
  it('GET /api/recipes returns empty array initially', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it('POST /api/recipes creates a recipe', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Salade',
        type: 'entrée',
        person_count: 2,
        ingredients: [{ name: 'laitue', quantity: 100, unit: 'g' }],
        instructions: 'Mix it up.',
      }),
    });
    expect(res.status).toBe(201);
    const recipe = await res.json();
    expect(recipe.title).toBe('Test Salade');
    expect(recipe.id).toBeDefined();
  });

  it('POST /api/recipes rejects missing fields', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Incomplete' }),
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/recipes returns created recipes', async () => {
    const res = await fetch(`${baseUrl}/api/recipes`);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].title).toBe('Test Salade');
  });

  it('POST /api/meal-plan creates a plan', async () => {
    const recipesRes = await fetch(`${baseUrl}/api/recipes`);
    const recipes = await recipesRes.json();

    const meals = [
      { mealTime: 'lunch', recettes: [recipes[0]] },
      { mealTime: 'dinner', recettes: [] },
    ];

    const res = await fetch(`${baseUrl}/api/meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meals, personCount: 2 }),
    });
    expect(res.status).toBe(200);
    const plan = await res.json();
    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].day).toBe('Monday');
  });

  it('POST /api/shopping-list/text returns text list', async () => {
    const recipesRes = await fetch(`${baseUrl}/api/recipes`);
    const recipes = await recipesRes.json();

    const meals = [
      { mealTime: 'lunch', recettes: [recipes[0]] },
      { mealTime: 'dinner', recettes: [] },
    ];

    const res = await fetch(`${baseUrl}/api/shopping-list/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meals, personCount: 2 }),
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Shopping List');
  });

  it('DELETE /api/recipes/:id removes a recipe', async () => {
    const recipesRes = await fetch(`${baseUrl}/api/recipes`);
    const recipes = await recipesRes.json();
    const id = recipes[0].id;

    const res = await fetch(`${baseUrl}/api/recipes/${id}`, { method: 'DELETE' });
    expect(res.status).toBe(200);

    const afterRes = await fetch(`${baseUrl}/api/recipes`);
    const afterData = await afterRes.json();
    expect(afterData.find((r: { id: string }) => r.id === id)).toBeUndefined();
  });
});
