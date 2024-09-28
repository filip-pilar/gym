// lib/actions.ts
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export async function logWorkout(formData: FormData) {
  const day = formData.get('day') as string;
  const exercise = formData.get('exercise') as string;
  const isCardio = formData.get('isCardio') === 'true';
  
  let sets: number | null = null;
  let weight: number | null = null;
  let time: number | null = null;
  let calories: number | null = null;

  if (isCardio) {
    time = parseInt(formData.get('time') as string);
    calories = parseInt(formData.get('calories') as string);
  } else {
    sets = parseInt(formData.get('sets') as string);
    weight = parseFloat(formData.get('weight') as string);
  }

  await sql`
    INSERT INTO workouts (day, exercise, sets, weight, time, calories)
    VALUES (${day}, ${exercise}, ${sets}, ${weight}, ${time}, ${calories})
  `;

  revalidatePath('/workout-tracker');
}

export async function fetchWorkouts() {
  const { rows } = await sql`SELECT * FROM workouts`;
  
  // Group workouts by day
  const workoutsByDay = rows.reduce<Record<string, any[]>>((acc, workout) => {
    if (!acc[workout.day]) acc[workout.day] = [];
    acc[workout.day].push(workout);
    return acc;
  }, {});

  return workoutsByDay;
}