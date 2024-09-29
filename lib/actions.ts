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

    // Insert the new workout
    await sql`
      INSERT INTO workouts (user_id, date, exercise, is_cardio, sets, reps, weight, time, calories)
      VALUES (${userId}, ${date}, ${exercise}, ${isCardio}, ${sets}, ${reps}, ${weight}, ${time}, ${calories})
    `;

    revalidatePath("/");
    return { success: true, message: "Workout logged successfully" };
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

export async function fetchAllExerciseData(userId: string, exerciseName: string): Promise<FetchAllExerciseDataResult> {
  try {
    await ensureTableExists();

    const exerciseData = await sql`
      SELECT date, weight, sets, reps, time, calories FROM workouts
      WHERE user_id = ${userId} AND exercise = ${exerciseName}
      ORDER BY date ASC
    `;

    return { 
      success: true, 
      data: exerciseData.rows.map(row => ({
        date: row.date,
        weight: row.weight || null,
        sets: row.sets || null,
        reps: row.reps || null,
        time: row.time || null,
        calories: row.calories || null
      }))
    };
  } catch (error) {
    console.error("Failed to fetch exercise data:", error);
    return { success: false, message: "Failed to fetch exercise data" };
  }
}