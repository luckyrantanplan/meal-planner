import { describe, it, expect } from 'vitest';
import { scaleRecipe, filterRecipesByType } from './recipes';
import type { Recipe } from './types';

describe('scaleRecipe', () => {
  const sampleRecipe: Recipe = {
    id: '1',
    title: 'Gratin dauphinois',
    type: 'plat',
    person_count: 4,
    ingredients: [
      { name: 'pomme de terre', quantity: 800, unit: 'g' },
      { name: 'crème fraîche', quantity: 200, unit: 'ml' },
      { name: 'gruyère', quantity: 100, unit: 'g' },
    ],
    instructions: 'Éplucher les pommes de terre...',
  };

  it('should scale up ingredients', () => {
    const scaled = scaleRecipe(sampleRecipe, 8);
    expect(scaled[0].quantity).toBe(1600);
    expect(scaled[1].quantity).toBe(400);
    expect(scaled[2].quantity).toBe(200);
  });

  it('should scale down ingredients', () => {
    const scaled = scaleRecipe(sampleRecipe, 2);
    expect(scaled[0].quantity).toBe(400);
    expect(scaled[1].quantity).toBe(100);
    expect(scaled[2].quantity).toBe(50);
  });

  it('should keep same quantities for same serving count', () => {
    const scaled = scaleRecipe(sampleRecipe, 4);
    expect(scaled[0].quantity).toBe(800);
  });

  it('should preserve ingredient names and units', () => {
    const scaled = scaleRecipe(sampleRecipe, 6);
    expect(scaled[0].name).toBe('pomme de terre');
    expect(scaled[0].unit).toBe('g');
  });
});

describe('filterRecipesByType', () => {
  const recipes: Recipe[] = [
    {
      id: '1',
      title: 'Salade verte',
      type: 'entrée',
      person_count: 4,
      ingredients: [],
      instructions: '',
    },
    {
      id: '2',
      title: 'Poulet rôti',
      type: 'plat principal',
      person_count: 4,
      ingredients: [],
      instructions: '',
    },
    {
      id: '3',
      title: 'Tarte aux pommes',
      type: 'dessert',
      person_count: 4,
      ingredients: [],
      instructions: '',
    },
  ];

  it('should filter by type', () => {
    const result = filterRecipesByType(recipes, 'dessert');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tarte aux pommes');
  });

  it('should be case-insensitive', () => {
    const result = filterRecipesByType(recipes, 'DESSERT');
    expect(result).toHaveLength(1);
  });

  it('should match partial type names', () => {
    const result = filterRecipesByType(recipes, 'plat');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Poulet rôti');
  });

  it('should return empty for no match', () => {
    const result = filterRecipesByType(recipes, 'boisson');
    expect(result).toHaveLength(0);
  });
});
