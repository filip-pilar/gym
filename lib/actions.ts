"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";

export async function createOrUpdateWorkoutsTable() {
  try {
    // First, check if the table exists
    const { rows } = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'workouts'
      );
    `;

    const tableExists = rows[0].exists;

    if (!tableExists) {
      // If the table doesn't exist, create it with the new structure
      await sql`
        CREATE TABLE workouts (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          workout_date DATE NOT NULL,
          exercise VARCHAR(255) NOT NULL,
          sets INT,
          weight FLOAT,
          time INT,
          calories INT,
          is_cardio BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } else {
      // If the table exists, check if the workout_date column exists
      const { rows: columnCheck } = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'workouts' AND column_name = 'workout_date'
        );
      `;

      const workoutDateExists = columnCheck[0].exists;

      if (!workoutDateExists) {
        // If workout_date doesn't exist, it means we have the old 'date' column
        // Rename 'date' to 'workout_date'
        await sql`ALTER TABLE workouts ADD COLUMN workout_date DATE NOT NULL DEFAULT CURRENT_DATE;`;
        //await sql`ALTER TABLE workouts RENAME COLUMN date TO workout_date;`;
      }
    }

    // Ensure the unique constraint exists
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_constraint 
          WHERE conname = 'workouts_user_date_exercise_key'
        ) THEN
          ALTER TABLE workouts
          ADD CONSTRAINT workouts_user_date_exercise_key UNIQUE (user_id, workout_date, exercise);
        END IF;
      END $$;
    `;

    //console.log("Workouts table created or updated successfully");
  } catch (error) {
    console.error("Error creating or updating workouts table:", error);
    throw error;
  }
}

export async function logWorkout(formData: FormData) {
  try {
    await createOrUpdateWorkoutsTable();

    const userId = formData.get("user") as string;
    const date = new Date(formData.get("date") as string);
    const dateString = date.toISOString().split("T")[0]; // Convert to 'YYYY-MM-DD' format
    const exercise = formData.get("exercise") as string;
    const isCardio = formData.get("isCardio") === "true";

    let sets: number | null = null;
    let weight: number | null = null;
    let time: number | null = null;
    let calories: number | null = null;

    if (isCardio) {
      time = parseInt(formData.get("time") as string) || null;
      calories = parseInt(formData.get("calories") as string) || null;
    } else {
      sets = parseInt(formData.get("sets") as string) || null;
      weight = parseFloat(formData.get("weight") as string) || null;
    }

    await sql`
          INSERT INTO workouts (user_id, workout_date, exercise, sets, weight, time, calories, is_cardio)
          VALUES (${userId}, ${dateString}, ${exercise}, ${sets}, ${weight}, ${time}, ${calories}, ${isCardio})
          ON CONFLICT (user_id, workout_date, exercise) DO UPDATE
          SET sets = EXCLUDED.sets,
              weight = EXCLUDED.weight,
              time = EXCLUDED.time,
              calories = EXCLUDED.calories,
              is_cardio = EXCLUDED.is_cardio,
              created_at = CURRENT_TIMESTAMP;
        `;

    //console.log("Workout logged successfully");
    revalidatePath("/");
  } catch (error) {
    console.error("Error logging workout:", error);
    throw error;
  }
}

export async function fetchWorkouts(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  try {
    await createOrUpdateWorkoutsTable();

    let query = `
        SELECT * FROM workouts 
        WHERE user_id = $1
      `;
    const params: any[] = [userId];

    if (startDate && endDate) {
      query += ` AND workout_date >= $2 AND workout_date <= $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY workout_date ASC, created_at DESC`;

    const { rows } = await sql.query(query, params);

    const workoutsByDay: Record<string, any[]> = {};

    // Initialize all dates in the range
    if (startDate && endDate) {
      const currentDate = new Date(startDate);
      const end = new Date(endDate);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        workoutsByDay[dateStr] = [];
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Populate with actual workouts
    rows.forEach((workout) => {
      const dateStr = workout.workout_date.toISOString().split("T")[0];
      if (!workoutsByDay[dateStr]) workoutsByDay[dateStr] = [];

      const formattedWorkout = workout.is_cardio
        ? {
            exercise: workout.exercise,
            time: workout.time,
            calories: workout.calories,
          }
        : {
            exercise: workout.exercise,
            sets: workout.sets,
            weight: workout.weight,
          };

      workoutsByDay[dateStr].push(formattedWorkout);
    });

    //console.log("workoutsByDay:", workoutsByDay);
    return workoutsByDay;
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return {};
  }
}
