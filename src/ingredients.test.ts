import { describe, it, expect } from 'vitest';
import { IngredientFinder, mergeIngredients, getRayonComponents, getIngredients } from './ingredients';
import type { CourseIngredient } from './types';

describe('IngredientFinder', () => {
  const sampleIngredients: CourseIngredient[] = [
    { name: 'pomme de terre', rayon: 'légumes' },
    { name: 'carotte', rayon: 'légumes' },
    { name: 'oignon', rayon: 'légumes' },
    { name: 'sel', rayon: 'condiments' },
    { name: 'poivre', rayon: 'condiments' },
  ];

  it('should find exact match', () => {
    const finder = new IngredientFinder(sampleIngredients);
    expect(finder.find('carotte')).toBe('carotte');
  });

  it('should find fuzzy match for similar name', () => {
    const finder = new IngredientFinder(sampleIngredients);
    const result = finder.find('carottes');
    expect(typeof result).toBe('string');
    // Should find 'carotte' as closest match
    expect(result).toBe('carotte');
  });

  it('should return input when ingredient list is empty', () => {
    const finder = new IngredientFinder([]);
    expect(finder.find('anything')).toBe('anything');
  });
});

describe('mergeIngredients', () => {
  it('should add new ingredient when not present', () => {
    const allIngredients: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {};
    mergeIngredients(allIngredients, { name: 'sel', quantity: 10, unit: 'g' }, 1);
    expect(allIngredients['sel']).toHaveLength(1);
    expect(allIngredients['sel'][0]).toEqual({ name: 'sel', quantity: 10, unit: 'g' });
  });

  it('should merge quantities with same unit', () => {
    const allIngredients: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {
      sel: [{ name: 'sel', quantity: 5, unit: 'g' }],
    };
    mergeIngredients(allIngredients, { name: 'sel', quantity: 10, unit: 'g' }, 1);
    expect(allIngredients['sel']).toHaveLength(1);
    expect(allIngredients['sel'][0].quantity).toBe(15);
  });

  it('should add separate entry for different unit', () => {
    const allIngredients: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {
      farine: [{ name: 'farine', quantity: 100, unit: 'g' }],
    };
    mergeIngredients(allIngredients, { name: 'farine', quantity: 2, unit: 'cuillère' }, 1);
    expect(allIngredients['farine']).toHaveLength(2);
  });

  it('should apply divisor to quantity', () => {
    const allIngredients: Record<string, Array<{ name: string; quantity: number; unit: string }>> = {};
    mergeIngredients(allIngredients, { name: 'sucre', quantity: 20, unit: 'g' }, 4);
    expect(allIngredients['sucre'][0].quantity).toBe(5);
  });
});

describe('getRayonComponents', () => {
  it('should parse components into CourseIngredient array', () => {
    const components = [
      { gram: 100, id: 'Pommes', quantity: '2&nbsp;pièces', measure: { measure: 'pièce' } },
    ];
    const result = getRayonComponents(components, 'fruits');
    expect(result).toHaveLength(1);
    expect(result[0].rayon).toBe('fruits');
    expect(result[0].gram).toBe(100);
    expect(result[0].quantity).toBe(2);
  });

  it('should normalize ingredient names', () => {
    const components = [
      { id: 'Carottes', quantity: 3, measure: { measure: 'pièce' } },
    ];
    const result = getRayonComponents(components, 'légumes');
    expect(result[0].name).not.toBe('Carottes'); // should be normalized/lowercased
  });
});

describe('getIngredients', () => {
  it('should parse ingredient strings', () => {
    const ingredients: CourseIngredient[] = [
      { name: 'sel', rayon: 'condiments' },
      { name: 'poivre', rayon: 'condiments' },
    ];
    const finder = new IngredientFinder(ingredients);
    const result = getIngredients(['sel&nbsp;5&nbsp;g', 'poivre&nbsp;2&nbsp;g'], finder);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('sel');
    expect(result[0].quantity).toBe(5);
    expect(result[0].unit).toBe('g');
  });
});
