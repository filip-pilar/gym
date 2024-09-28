"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { fetchWorkouts, logWorkout } from "@/lib/actions";

const workoutSchedule = [
  {
    day: "Day 1",
    type: "Push (Chest, Shoulders, Triceps)",
    exercises: [
      "Chest Press Machine",
      "Incline Chest Press Machine",
      "Seated Shoulder Press Machine",
      "Lateral Raise Machine",
      "Tricep Pushdown Machine",
      "Dip Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 2",
    type: "Pull (Back, Biceps, Rear Deltoids)",
    exercises: [
      "Lat Pulldown Machine",
      "Seated Cable Row Machine",
      "Chest-Supported Row Machine",
      "Face Pull Machine",
      "Bicep Curl Machine",
      "Reverse Pec Deck Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 3",
    type: "Legs (Quadriceps, Hamstrings, Calves, Glutes)",
    exercises: [
      "Leg Press Machine",
      "Leg Extension Machine",
      "Leg Curl Machine",
      "Seated Calf Raise Machine",
      "Standing Calf Raise Machine",
      "Hip Abduction Machine",
      "Hip Adduction Machine",
      "Glute Kickback Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 4",
    type: "Push (Chest, Shoulders, Triceps)",
    exercises: [
      "Chest Press Machine",
      "Incline Chest Press Machine",
      "Seated Shoulder Press Machine",
      "Lateral Raise Machine",
      "Tricep Pushdown Machine",
      "Dip Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 5",
    type: "Pull (Back, Biceps, Rear Deltoids)",
    exercises: [
      "Lat Pulldown Machine",
      "Seated Cable Row Machine",
      "Chest-Supported Row Machine",
      "Face Pull Machine",
      "Bicep Curl Machine",
      "Reverse Pec Deck Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 6",
    type: "Legs (Quadriceps, Hamstrings, Calves, Glutes)",
    exercises: [
      "Leg Press Machine",
      "Leg Extension Machine",
      "Leg Curl Machine",
      "Seated Calf Raise Machine",
      "Standing Calf Raise Machine",
      "Hip Abduction Machine",
      "Hip Adduction Machine",
      "Glute Kickback Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 7",
    type: "Cardio",
    exercises: ["Treadmill", "StairMaster"],
  },
];

interface Workout {
  exercise: string;
  sets?: number;
  weight?: number;
  time?: number;
  calories?: number;
}

interface CompletedWorkouts {
  [key: string]: Workout[];
}

export default function WorkoutTracker() {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkouts>({});
  const [selectedDay, setSelectedDay] = useState("Day 1");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedSets, setSelectedSets] = useState(3);
  const [weightInput, setWeightInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [isCardio, setIsCardio] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch workouts when the component mounts
    fetchWorkouts().then(setCompletedWorkouts);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    try {
      await logWorkout(formData);
      // Refetch workouts to update the state
      const updatedWorkouts = await fetchWorkouts();
      setCompletedWorkouts(updatedWorkouts);

      toast({
        title: "Workout logged",
        description: `Successfully logged workout for ${selectedDay}.`,
      });

      // Reset form fields
      setSelectedExercise("");
      setSelectedSets(3);
      setWeightInput("");
      setTimeInput("");
      setCaloriesInput("");
    } catch (error) {
      console.error('Failed to log workout:', error);
      toast({
        title: "Error",
        description: "Failed to log workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentDayWorkout = workoutSchedule.find(
    (day) => day.day === selectedDay
  );
  const currentDayExercises = currentDayWorkout?.exercises || [];
  const currentDayCardio = currentDayWorkout?.cardio || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">7-Day Workout Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle>Log Your Workout</CardTitle>
          <CardDescription>
            Select a day and exercise to log your workout
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="day" value={selectedDay} />
            <input type="hidden" name="exercise" value={selectedExercise} />
            <input type="hidden" name="isCardio" value={isCardio.toString()} />
            
            {/* Day selection buttons */}
            <div>
              <Label className="mb-2 block">Select Day</Label>
              <div className="grid grid-cols-7 gap-2">
                {workoutSchedule.map((day, index) => (
                  <Button
                    key={day.day}
                    type="button"
                    variant={selectedDay === day.day ? "default" : "outline"}
                    onClick={() => {
                      setSelectedDay(day.day);
                      setIsCardio(false);
                      setSelectedExercise("");
                    }}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Exercise selection buttons */}
            <div>
              <Label className="mb-2 block">Select Exercise</Label>
              <div className="grid grid-cols-2 gap-2">
                {currentDayExercises.map((exercise: string) => (
                  <Button
                    key={exercise}
                    type="button"
                    variant={
                      selectedExercise === exercise && !isCardio
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setSelectedExercise(exercise);
                      setIsCardio(false);
                    }}
                  >
                    {exercise}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cardio selection buttons */}
            <div>
              <Label className="mb-2 block">Cardio</Label>
              <div className="grid grid-cols-2 gap-2">
                {currentDayCardio.map((cardioExercise: string) => (
                  <Button
                    key={cardioExercise}
                    type="button"
                    variant={
                      selectedExercise === cardioExercise && isCardio
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setSelectedExercise(cardioExercise);
                      setIsCardio(true);
                    }}
                  >
                    {cardioExercise}
                  </Button>
                ))}
              </div>
            </div>

            {selectedExercise && (
              <>
                {isCardio ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time (minutes)</Label>
                      <Input
                        id="time"
                        name="time"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        placeholder="Enter time"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories Burned</Label>
                      <Input
                        id="calories"
                        name="calories"
                        value={caloriesInput}
                        onChange={(e) => setCaloriesInput(e.target.value)}
                        placeholder="Enter calories"
                        type="number"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Sets</Label>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant={selectedSets === 3 ? "default" : "outline"}
                          onClick={() => setSelectedSets(3)}
                        >
                          3 Sets
                        </Button>
                        <Button
                          type="button"
                          variant={selectedSets === 4 ? "default" : "outline"}
                          onClick={() => setSelectedSets(4)}
                        >
                          4 Sets
                        </Button>
                      </div>
                      <input type="hidden" name="sets" value={selectedSets} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        placeholder="Enter weight"
                        type="number"
                      />
                    </div>
                  </>
                )}
                <Button type="submit">Log Workout</Button>
              </>
            )}
          </form>
        </CardContent>
        <CardFooter>
          {/* Display completed workouts */}
          <div className="w-full">
            <h3 className="font-semibold mb-2">
              Completed Workouts for {selectedDay}:
            </h3>
            {completedWorkouts[selectedDay] &&
            completedWorkouts[selectedDay].length > 0 ? (
              <ul className="list-disc pl-5">
                {completedWorkouts[selectedDay].map((workout, index) => (
                  <li key={index}>
                    {workout.exercise}:{" "}
                    {workout.time !== undefined
                      ? `${workout.time} minutes, ${workout.calories} calories`
                      : `${workout.sets} sets x ${workout.weight} kg`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No workouts logged for this day yet.
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}