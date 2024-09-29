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