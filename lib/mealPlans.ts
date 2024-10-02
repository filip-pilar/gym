export const nutrientGoals: Record<string, NutritionGoals> = {
  phil: {
    calories: 2500,
    protein: 150,
    carbs: 300,
    fat: 80,
  },
  eliza: {
    calories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65,
  },
};

export const mealPlans: Record<string, MealPlan> = {
  phil: {
    Breakfast: [
      {
        name: "Protein Oatmeal",
        calories: 400,
        protein: 30,
        carbs: 50,
        fat: 10,
      },
      {
        name: "Egg White Omelet",
        calories: 300,
        protein: 25,
        carbs: 5,
        fat: 15,
      },
    ],
    Snack: [
      { name: "Protein Shake", calories: 200, protein: 30, carbs: 5, fat: 3 },
      { name: "Greek Yogurt", calories: 150, protein: 20, carbs: 10, fat: 5 },
    ],
    Lunch: [
      {
        name: "Chicken Breast & Quinoa",
        calories: 500,
        protein: 40,
        carbs: 50,
        fat: 10,
      },
      { name: "Tuna Salad", calories: 400, protein: 35, carbs: 20, fat: 20 },
    ],
    Dinner: [
      {
        name: "Steak & Sweet Potato",
        calories: 600,
        protein: 45,
        carbs: 40,
        fat: 25,
      },
      {
        name: "Salmon & Brown Rice",
        calories: 550,
        protein: 40,
        carbs: 45,
        fat: 20,
      },
    ],
    Treat: [
      { name: "Protein Bar", calories: 200, protein: 20, carbs: 20, fat: 8 },
      {
        name: "Protein Ice Cream",
        calories: 250,
        protein: 25,
        carbs: 20,
        fat: 5,
      },
    ],
  },
  eliza: {
    Breakfast: [
      { name: "Avocado Toast", calories: 300, protein: 10, carbs: 30, fat: 15 },
      {
        name: "Fruit Smoothie Bowl",
        calories: 250,
        protein: 8,
        carbs: 45,
        fat: 5,
      },
    ],
    Snack: [
      {
        name: "Apple with Almond Butter",
        calories: 200,
        protein: 5,
        carbs: 20,
        fat: 10,
      },
      {
        name: "Veggie Sticks & Hummus",
        calories: 150,
        protein: 5,
        carbs: 15,
        fat: 8,
      },
    ],
    Lunch: [
      {
        name: "Quinoa Veggie Bowl",
        calories: 400,
        protein: 15,
        carbs: 60,
        fat: 12,
      },
      {
        name: "Mediterranean Wrap",
        calories: 350,
        protein: 12,
        carbs: 45,
        fat: 15,
      },
    ],
    Dinner: [
      {
        name: "Grilled Tofu & Veggies",
        calories: 350,
        protein: 20,
        carbs: 30,
        fat: 18,
      },
      { name: "Lentil Curry", calories: 400, protein: 18, carbs: 50, fat: 15 },
    ],
    Treat: [
      { name: "Dark Chocolate", calories: 150, protein: 2, carbs: 15, fat: 10 },
      { name: "Frozen Yogurt", calories: 200, protein: 5, carbs: 35, fat: 4 },
    ],
  },
};
