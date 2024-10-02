"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        exercise TEXT NOT NULL,
        is_cardio BOOLEAN NOT NULL,
        sets INTEGER,
        reps TEXT,
        weight NUMERIC,
        time INTEGER,
        calories INTEGER
      )
    `;
    //console.log("Workouts table created or already exists");
  } catch (error) {
    console.error("Failed to create workouts table:", error);
    throw error;
  }
}

export async function logWorkout(
  userId: string,
  date: string,
  exercise: string,
  isCardio: boolean,
  sets: number | null,
  reps: string | null,
  weight: number | null,
  time: number | null,
  calories: number | null
) {
  try {
    await ensureTableExists();

    // Check if a workout already exists for this user and date
    const existingWorkout = await sql`
        SELECT * FROM workouts
        WHERE user_id = ${userId} AND date = ${date} AND exercise = ${exercise}
      `;

    if (existingWorkout.rows.length > 0) {
      return {
        success: false,
        message: "Workout already logged for this day",
        existingWorkout: existingWorkout.rows[0],
      };
    }

    // Insert the new workout and return the ID
    const result = await sql`
        INSERT INTO workouts (user_id, date, exercise, is_cardio, sets, reps, weight, time, calories)
        VALUES (${userId}, ${date}, ${exercise}, ${isCardio}, ${sets}, ${reps}, ${weight}, ${time}, ${calories})
        RETURNING id
      `;

    const newWorkoutId = result.rows[0].id;

    revalidatePath("/");
    return {
      success: true,
      message: "Workout logged successfully",
      workoutId: newWorkoutId,
    };
  } catch (error) {
    console.error("Failed to log workout:", error);
    return { success: false, message: "Failed to log workout" };
  }
}

export async function overwriteWorkout(
  workoutId: number,
  sets: number | null,
  reps: string | null,
  weight: number | null,
  time: number | null,
  calories: number | null
) {
  try {
    await ensureTableExists();

    await sql`
      UPDATE workouts
      SET sets = ${sets}, reps = ${reps}, weight = ${weight}, time = ${time}, calories = ${calories}
      WHERE id = ${workoutId}
    `;

    revalidatePath("/");
    return { success: true, message: "Workout updated successfully" };
  } catch (error) {
    console.error("Failed to update workout:", error);
    return { success: false, message: "Failed to update workout" };
  }
}

export async function fetchExercises(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    await ensureTableExists();

    const exercises = await sql`
        SELECT * FROM workouts
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        ORDER BY date ASC, exercise ASC
      `;

    return { success: true, exercises: exercises.rows };
  } catch (error) {
    console.error("Failed to fetch exercises:", error);
    return { success: false, message: "Failed to fetch exercises" };
  }
}

export async function fetchLastWorkout(userId: string, exerciseName: string) {
  try {
    await ensureTableExists();

    const lastWorkout = await sql`
        SELECT * FROM workouts
        WHERE user_id = ${userId} AND exercise = ${exerciseName}
        ORDER BY date DESC
        LIMIT 1
      `;

    if (lastWorkout.rows.length > 0) {
      return { success: true, workout: lastWorkout.rows[0] };
    } else {
      return {
        success: false,
        message: "No previous workout found for this exercise",
      };
    }
  } catch (error) {
    console.error("Failed to fetch last workout:", error);
    return { success: false, message: "Failed to fetch last workout data" };
  }
}

export async function fetchAllExerciseData(
  userId: string,
  exerciseName: string
): Promise<FetchAllExerciseDataResult> {
  try {
    await ensureTableExists();

    const exerciseData = await sql`
      SELECT date, weight, sets, reps, time, calories FROM workouts
      WHERE user_id = ${userId} AND exercise = ${exerciseName}
      ORDER BY date ASC
    `;

    return {
      success: true,
      data: exerciseData.rows.map((row) => ({
        date: row.date,
        weight: row.weight || null,
        sets: row.sets || null,
        reps: row.reps || null,
        time: row.time || null,
        calories: row.calories || null,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch exercise data:", error);
    return { success: false, message: "Failed to fetch exercise data" };
  }
}

export async function fetchAllWorkouts(
  userId: string
): Promise<{ success: boolean; workouts?: Workout[]; message?: string }> {
  try {
    const { rows } = await sql`
        SELECT date, exercise
        FROM workouts
        WHERE user_id = ${userId}
        ORDER BY date
      `;

    return { success: true, workouts: rows as Workout[] };
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return { success: false, message: "Failed to fetch workout data" };
  }
}

export async function deleteWorkout(workoutId: number) {
  try {
    await ensureTableExists();

    await sql`
        DELETE FROM workouts
        WHERE id = ${workoutId}
      `;

    revalidatePath("/");
    return { success: true, message: "Workout deleted successfully" };
  } catch (error) {
    console.error("Failed to delete workout:", error);
    return { success: false, message: "Failed to delete workout" };
  }
}

async function ensureNutritionTableExists() {
  try {
    await sql`
        CREATE TABLE IF NOT EXISTS nutrition_logs (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          meal_section TEXT NOT NULL,
          meal_name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein NUMERIC NOT NULL,
          carbs NUMERIC NOT NULL,
          fat NUMERIC NOT NULL,
          quantity INTEGER NOT NULL
        )
      `;
    console.log("Nutrition logs table created or already exists");
  } catch (error) {
    console.error("Failed to create nutrition logs table:", error);
    throw error;
  }
}

export async function logNutrition(
  userId: string,
  date: string,
  mealSection: string,
  mealName: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  quantity: number
) {
  try {
    await ensureNutritionTableExists();

    const result = await sql`
        INSERT INTO nutrition_logs (user_id, date, meal_section, meal_name, calories, protein, carbs, fat, quantity)
        VALUES (${userId}, ${date}, ${mealSection}, ${mealName}, ${calories}, ${protein}, ${carbs}, ${fat}, ${quantity})
        RETURNING id
      `;

    const newLogId = result.rows[0].id;

    revalidatePath("/");
    return {
      success: true,
      message: "Nutrition logged successfully",
      logId: newLogId,
    };
  } catch (error) {
    console.error("Failed to log nutrition:", error);
    return { success: false, message: "Failed to log nutrition" };
  }
}

export async function fetchNutritionLogs(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    await ensureNutritionTableExists();

    const logs = await sql`
        SELECT * FROM nutrition_logs
        WHERE user_id = ${userId}
          AND date >= ${startDate}
          AND date <= ${endDate}
        ORDER BY date ASC, meal_section ASC
      `;

    return { success: true, logs: logs.rows };
  } catch (error) {
    console.error("Failed to fetch nutrition logs:", error);
    return { success: false, message: "Failed to fetch nutrition logs" };
  }
}

export async function deleteNutritionLog(userId: string, logId: number) {
  try {
    await ensureNutritionTableExists();

    await sql`
          DELETE FROM nutrition_logs
          WHERE id = ${logId} AND user_id = ${userId}
        `;

    revalidatePath("/");
    return { success: true, message: "Nutrition log deleted successfully" };
  } catch (error) {
    console.error("Failed to delete nutrition log:", error);
    return { success: false, message: "Failed to delete nutrition log" };
  }
}

export async function fetchTotalNutrients(userId: string, date: string) {
  try {
    await ensureNutritionTableExists();

    const totals = await sql`
        SELECT 
          COALESCE(SUM(calories * quantity), 0) as total_calories,
          COALESCE(SUM(protein * quantity), 0) as total_protein,
          COALESCE(SUM(carbs * quantity), 0) as total_carbs,
          COALESCE(SUM(fat * quantity), 0) as total_fat
        FROM nutrition_logs
        WHERE user_id = ${userId} AND date = ${date}
      `;

    const result = totals.rows[0];

    // Ensure all values are numbers
    const parsedTotals = {
      total_calories: parseFloat(result.total_calories) || 0,
      total_protein: parseFloat(result.total_protein) || 0,
      total_carbs: parseFloat(result.total_carbs) || 0,
      total_fat: parseFloat(result.total_fat) || 0,
    };

    return {
      success: true,
      totals: parsedTotals,
    };
  } catch (error) {
    console.error("Failed to fetch total nutrients:", error);
    return {
      success: false,
      message: "Failed to fetch total nutrients",
      totals: {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      },
    };
  }
}

export async function fetchNutritionData(
  userId: string,
  date: Date,
  viewMode: "week" | "month"
): Promise<{
  success: boolean;
  data?: NutritionDataPoint[];
  message?: string;
}> {
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);

    if (viewMode === "week") {
      startDate.setDate(startDate.getDate() - startDate.getDay());
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    } else {
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
    }

    const result = await sql`
        SELECT 
          date,
          SUM(calories * quantity) as calories,
          SUM(protein * quantity) as protein,
          SUM(carbs * quantity) as carbs,
          SUM(fat * quantity) as fat
        FROM nutrition_logs
        WHERE user_id = ${userId}
          AND date >= ${startDate.toISOString().split("T")[0]}
          AND date <= ${endDate.toISOString().split("T")[0]}
        GROUP BY date
        ORDER BY date ASC
      `;

    const data: NutritionDataPoint[] = result.rows.map((row) => ({
      date: row.date.toISOString(),
      calories: parseFloat(row.calories) || 0,
      protein: parseFloat(row.protein) || 0,
      carbs: parseFloat(row.carbs) || 0,
      fat: parseFloat(row.fat) || 0,
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    return {
      success: false,
      message: "An error occurred while fetching nutrition data",
    };
  }
}
