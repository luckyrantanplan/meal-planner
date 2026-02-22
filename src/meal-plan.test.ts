import { describe, it, expect } from 'vitest';
import { createWeeklyPlan, generateShoppingList, formatShoppingList } from './meal-plan';
import type { Meal, CourseIngredient } from './types';

describe('createWeeklyPlan', () => {
  const sampleMeals: Meal[] = [
    {
      mealTime: 'lunch',
      recettes: [
        {
          id: '1',
          title: 'Salade',
          type: 'entrée',
          person_count: 4,
          ingredients: [{ name: 'laitue', quantity: 200, unit: 'g' }],
          instructions: '',
        },
      ],
    },
    {
      mealTime: 'dinner',
      recettes: [
        {
          id: '2',
          title: 'Soupe',
          type: 'plat',
          person_count: 4,
          ingredients: [{ name: 'carotte', quantity: 300, unit: 'g' }],
          instructions: '',
        },
      ],
    },
    {
      mealTime: 'lunch',
      recettes: [],
    },
    {
      mealTime: 'dinner',
      recettes: [],
    },
  ];

  it('should create plan with correct number of days', () => {
    const plan = createWeeklyPlan(sampleMeals, 4);
    expect(plan.days).toHaveLength(2);
  });

  it('should set person count', () => {
    const plan = createWeeklyPlan(sampleMeals, 4);
    expect(plan.personCount).toBe(4);
  });

  it('should assign day names', () => {
    const plan = createWeeklyPlan(sampleMeals, 4);
    expect(plan.days[0].day).toBe('Monday');
    expect(plan.days[1].day).toBe('Tuesday');
  });

  it('should pair meals as lunch and dinner', () => {
    const plan = createWeeklyPlan(sampleMeals, 4);
    expect(plan.days[0].lunch.mealTime).toBe('lunch');
    expect(plan.days[0].dinner.mealTime).toBe('dinner');
  });

  it('should handle empty meals array', () => {
    const plan = createWeeklyPlan([], 2);
    expect(plan.days).toHaveLength(0);
  });
});

describe('generateShoppingList', () => {
  it('should aggregate ingredients from all meals', () => {
    const meals: Meal[] = [
      {
        mealTime: 'lunch',
        recettes: [
          {
            id: '1',
            title: 'R1',
            type: 'plat',
            person_count: 1,
            ingredients: [
              { name: 'carotte', quantity: 200, unit: 'g' },
              { name: 'sel', quantity: 5, unit: 'g' },
            ],
            instructions: '',
          },
        ],
      },
      {
        mealTime: 'dinner',
        recettes: [
          {
            id: '2',
            title: 'R2',
            type: 'plat',
            person_count: 1,
            ingredients: [{ name: 'carotte', quantity: 100, unit: 'g' }],
            instructions: '',
          },
        ],
      },
    ];

    const courseIngredients: CourseIngredient[] = [
      { name: 'carotte', rayon: 'légumes' },
      { name: 'sel', rayon: 'condiments' },
    ];

    const plan = createWeeklyPlan(meals, 1);
    const list = generateShoppingList(plan, courseIngredients);

    expect(list.items.length).toBeGreaterThan(0);
    const carotte = list.items.find((i) => i.name === 'carotte');
    expect(carotte).toBeDefined();
    expect(carotte!.quantities[0].amount).toBe(300);
  });
});

describe('formatShoppingList', () => {
  it('should format list with header and sections', () => {
    const list = {
      items: [
        {
          name: 'sel',
          rayon: 'condiments',
          quantities: [{ amount: 5, unit: 'g' }],
          units: [],
        },
        {
          name: 'carotte',
          rayon: 'légumes',
          quantities: [{ amount: 300, unit: 'g' }],
          units: [],
        },
      ],
      generatedAt: new Date(),
    };

    const text = formatShoppingList(list);
    expect(text).toContain('Shopping List');
    expect(text).toContain('CONDIMENTS');
    expect(text).toContain('sel');
    expect(text).toContain('carotte');
  });
});
