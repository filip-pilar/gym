interface Workout {
  id: number;
  user_id?: string;
  date?: Date | string;
  exercise: string;
  is_cardio: boolean;
  sets?: number | null;
  reps?: string | null;
  weight?: number | null;
  time?: number | null;
  calories?: number | null;
}

type CompletedWorkouts = Record<string, Workout[]>;

type WorkoutCalendarProps = {
  userId: string;
  workouts: CompletedWorkouts;
  onWeekChange: (start: string, end: string) => void;
  isLoading: boolean;
  initialDate: Date;
};

type WorkoutDay = { exercises: string[]; cardio: string[] };

type WorkoutSchedule = {
  [key in 0 | 1 | 2 | 3 | 4 | 5 | 6]: WorkoutDay;
};

interface WorkoutDataPoint {
  date: string;
  value: number;
  weight: number | null;
  sets: number | null;
  reps: string | null;
  time: number | null;
  calories: number | null;
}

type ProgressChartProps = {
  userId: "phil" | "eliza";
};

interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

type FetchAllExerciseDataResult = {
  success: boolean;
  data?: {
    date: string;
    weight: number | null;
    sets: number | null;
    reps: string | null;
    time: number | null;
    calories: number | null;
  }[];
  message?: string;
};

interface WorkoutStats {
  totalWorkouts: number;
  avgDaysPerWeek: number;
  bestStreak: number;
  currentWeeklyStreak: number;
}

interface WorkoutHeatmapProps {
  userId: string;
}

interface HeatmapValue {
  date: string;
  count: number;
}

interface Date {
  getWeek(): number;
}

interface NutritionTrackerProps {
  userId: string;
}

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlan {
  Breakfast: Meal[];
  Snack: Meal[];
  Lunch: Meal[];
  Dinner: Meal[];
  Treat: Meal[];
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SelectedMeals {
  [key in MealSection]?: Meal;
}

interface NutritionTrackerProps {
  userId: string;
}

interface Meal {
  id?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealWithQuantity {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  id: number;

}

type Nutrient = "calories" | "protein" | "carbs" | "fat";

interface NutritionDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FetchNutritionDataResult {
  success: boolean;
  data?: NutritionDataPoint[];
  message?: string;
}

interface LoggedMeal {
    id: number;
    meal_section: string;
    meal_name: string;
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }