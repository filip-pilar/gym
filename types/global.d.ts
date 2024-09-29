interface Workout {
    id: number;
    user_id: string;
    date: string;
    exercise: string;
    is_cardio: boolean;
    sets?: number;
    reps?: string;
    weight?: number;
    time?: number;
    calories?: number;
  }
  
  type CompletedWorkouts = Record<string, Workout[]>;
  
  type WorkoutCalendarProps = {
    userId: string;
    workouts: CompletedWorkouts;
    onWeekChange: (start: string, end: string) => void;
    isLoading: boolean;
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