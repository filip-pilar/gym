"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

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

    revalidatePath("/workout-tracker");
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
    await sql`
      UPDATE workouts
      SET sets = ${sets}, reps = ${reps}, weight = ${weight}, time = ${time}, calories = ${calories}
      WHERE id = ${workoutId}
    `;

    revalidatePath("/workout-tracker");
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
