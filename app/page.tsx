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
import { fetchWorkouts, logWorkout } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { format, addDays, startOfWeek, parseISO } from "date-fns";

// Phil's workout schedule
const philWorkoutSchedule = [
  {
    day: "Day 1",
    type: "Push",
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
    type: "Pull",
    exercises: [
      "Lat Pulldown Machine",
      "Seated Cable Row Machine",
      "Chest-Supported Row Machine",
      "Rear Delt Fly",
      "Bicep Curl Machine",
      "Reverse Pec Deck Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 3",
    type: "Legs",
    exercises: [
      "Leg Press Machine",
      "Leg Extension Machine",
      "Leg Curl Machine",
      "Seated Calf Raise Machine",
      "Hip Abduction Machine",
      "Hip Adduction Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 4",
    type: "Push",
    exercises: [
      "Pec Deck Machine (Chest Fly)",
      "Machine Shoulder Press",
      "Lateral Raise",
      "Assisted Dip Machine",
      "Close-Grip Chest Press Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 5",
    type: "Pull",
    exercises: [
      "Assisted Pull-Up Machine",
      "Row Machine",
      "Lat Pulldown",
      "Preacher Curl Machine",
      "Reverse Grip Bicep Curl Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 6",
    type: "Legs",
    exercises: [
      "Hack Squat Machine",
      "Leg Press Machine",
      "Leg Curl Machine",
      "Seated Calf Raise Machine",
      "Adductor Machine",
      "Abductor Machine",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 7",
    type: "Cardio",
    exercises: ["Treadmill", "StairMaster"],
  },
];

// Eliza's workout schedule
const elizaWorkoutSchedule = [
  {
    day: "Day 1 (Sunday)",
    type: "Glutes and Hamstrings",
    exercises: [
      "Seated Leg Curl - 10-12 reps",
      "RDL - 10-12 reps",
      "Hip Thrust Machine - 10-12 reps",
      "Glute Seat - 10-12 reps",
      "Adductors - 10-12 reps",
      "Abductors - 10-12 reps",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 2 (Monday)",
    type: "Upper Body (Pull Focus)",
    exercises: [
      "Pull Ups - 3-4 reps",
      "Lat Pull Down - 10-12 reps",
      "Seated Row - 10-12 reps",
      "Pec Fly - 10-12 reps",
      "Shoulder Press - 10-12 reps",
      "Lateral Raises - 10-12 reps",
      "Reverse Pec Deck - 10-12 reps",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 3 (Tuesday)",
    type: "Cardio",
    exercises: ["Cardio of choice"],
  },
  {
    day: "Day 4 (Wednesday)",
    type: "Quads and Abs",
    exercises: [
      "Leg Extensions - 10-12 reps",
      "Leg Press - 10-12 reps",
      "Belt Squats - 10-12 reps",
      "Bulgarian Split Squat - 10-12 reps",
      "Leg Raises - 10-12 reps",
      "Abs (crunches, leg raises) - 10-12 reps",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 5 (Thursday)",
    type: "Upper Body (Push Focus)",
    exercises: [
      "Assisted Pull-ups - 8-10 reps",
      "Barbell Row - 10-12 reps",
      "Dumbbell Biceps Curl - 10-12 reps",
      "Rope Hammer Curl - 10-12 reps",
      "Rope Triceps Extension - 10-12 reps",
      "Triceps Bar Pushdown - 10-12 reps",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 6 (Friday)",
    type: "Glutes and Hamstrings",
    exercises: [
      "Adductors - 10-12 reps",
      "Lying Leg Curls - 10-12 reps",
      "Sumo Squats - 10-12 reps",
      "Good Mornings - 10-12 reps",
      "Cable Kick Backs - 10-12 reps",
      "Abs - 10-12 reps",
    ],
    cardio: ["Treadmill", "StairMaster"],
  },
  {
    day: "Day 7 (Saturday)",
    type: "Rest or Light Activity",
    exercises: ["Rest or light cardio/stretching"],
  },
];

interface Workout {
  date: string;
  exercise: string;
  time?: number;
  calories?: number;
  sets?: number;
  weight?: number;
}

interface CompletedWorkouts {
  [key: string]: Workout[];
}

export default function WorkoutTracker() {
  const [currentUser, setCurrentUser] = useState<"phil" | "eliza">("phil");
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkouts>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedSets, setSelectedSets] = useState(3);
  const [weightInput, setWeightInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [isCardio, setIsCardio] = useState(false);
  const [isFetchingWorkouts, setIsFetchingWorkouts] = useState(false);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [view, setView] = useState<"log" | "calendar">("log");
  const { toast } = useToast();

  // Function to get the current workout schedule based on the selected user
  const getCurrentWorkoutSchedule = useCallback(() => {
    return currentUser === "phil" ? philWorkoutSchedule : elizaWorkoutSchedule;
  }, [currentUser]);

  const fetchWorkoutsForWeek = useCallback(async () => {
    setIsFetchingWorkouts(true);
    try {
      const fetchedWorkouts = await fetchWorkouts(
        currentUser,
        format(weekStartDate, "yyyy-MM-dd"),
        format(addDays(weekStartDate, 6), "yyyy-MM-dd")
      );
      setCompletedWorkouts(fetchedWorkouts);
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingWorkouts(false);
    }
  }, [currentUser, weekStartDate, toast]);

  useEffect(() => {
    fetchWorkoutsForWeek();
  }, [fetchWorkoutsForWeek]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingWorkout(true);

    const formData = new FormData(e.currentTarget);
    formData.append("user", currentUser);
    formData.append("date", format(selectedDate, "yyyy-MM-dd"));

    try {
      await logWorkout(formData);
      await fetchWorkoutsForWeek();

      toast({
        title: "Workout logged",
        description: `Successfully logged workout for ${currentUser} on ${format(
          selectedDate,
          "yyyy-MM-dd"
        )}.`,
        variant: "success",
      });

      // Reset form fields
      setSelectedExercise("");
      setSelectedSets(3);
      setWeightInput("");
      setTimeInput("");
      setCaloriesInput("");
    } catch (error) {
      console.error("Failed to log workout:", error);
      toast({
        title: "Error",
        description: "Failed to log workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingWorkout(false);
    }
  };

  const handleWeekChange = useCallback(
    async (startDateString: string, endDate: string) => {
      console.log(`Week changed: ${startDateString} to ${endDate}`);
      const startDate = parseISO(startDateString);
      setWeekStartDate(startDate);
      setSelectedDate(startDate);
      console.log("selectedDate", selectedDate);
      await fetchWorkoutsForWeek();
    },
    [fetchWorkoutsForWeek, selectedDate]
  );

  const currentDayWorkout = getCurrentWorkoutSchedule()[selectedDate.getDay()];
  const currentDayExercises = currentDayWorkout?.exercises || [];
  const currentDayCardio = currentDayWorkout?.cardio || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Progress Tracker</h1>
      <Tabs
        defaultValue="phil"
        onValueChange={(value) => {
          setCurrentUser(value as "phil" | "eliza");
          setSelectedExercise(""); // Reset selected exercise when changing users
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="phil">Phil</TabsTrigger>
          <TabsTrigger value="eliza">Eliza</TabsTrigger>
        </TabsList>
        <div className="mb-4">
          <Button
            onClick={() => setView("log")}
            variant={view === "log" ? "default" : "outline"}
            className="mr-2"
          >
            Log Workout
          </Button>
          <Button
            onClick={() => setView("calendar")}
            variant={view === "calendar" ? "default" : "outline"}
          >
            Calendar View
          </Button>
        </div>
        {view === "log" ? (
          <Card>
            <CardHeader>
              <CardTitle>Log Your Workout, {currentUser}</CardTitle>
              <CardDescription>
                Select a day and exercise to log your workout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="hidden"
                  name="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                />
                <input type="hidden" name="exercise" value={selectedExercise} />
                <input
                  type="hidden"
                  name="isCardio"
                  value={isCardio.toString()}
                />

                {/* Day selection buttons */}
                <div>
                  <Label className="mb-2 block">Select Day</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) =>
                      addDays(weekStartDate, i)
                    ).map((date) => (
                      <Button
                        key={format(date, "yyyy-MM-dd")}
                        type="button"
                        variant={
                          selectedDate.getTime() === date.getTime()
                            ? "default"
                            : "outline"
                        }
                        onClick={() => {
                          setSelectedDate(date);
                          setIsCardio(false);
                          setSelectedExercise("");
                        }}
                        className="flex flex-col items-center p-2 h-auto"
                      >
                        <span className="text-xs">{format(date, "EEE")}</span>
                        <span className="text-lg font-bold">
                          {format(date, "d")}
                        </span>
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
                              variant={
                                selectedSets === 3 ? "default" : "outline"
                              }
                              onClick={() => setSelectedSets(3)}
                            >
                              3 Sets
                            </Button>
                            <Button
                              type="button"
                              variant={
                                selectedSets === 4 ? "default" : "outline"
                              }
                              onClick={() => setSelectedSets(4)}
                            >
                              4 Sets
                            </Button>
                          </div>
                          <input
                            type="hidden"
                            name="sets"
                            value={selectedSets}
                          />
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
                    <Button
                      type="submit"
                      disabled={isLoggingWorkout || !selectedExercise}
                    >
                      {isLoggingWorkout ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging...
                        </>
                      ) : (
                        "Log Workout"
                      )}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-semibold mb-2">
                  Completed Workouts for {format(selectedDate, "yyyy-MM-dd")}:
                </h3>
                {isFetchingWorkouts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading workouts...</span>
                  </div>
                ) : completedWorkouts[format(selectedDate, "yyyy-MM-dd")] &&
                  completedWorkouts[format(selectedDate, "yyyy-MM-dd")].length >
                    0 ? (
                  <ul className="list-disc pl-5">
                    {completedWorkouts[format(selectedDate, "yyyy-MM-dd")].map(
                      (workout, index) => (
                        <li key={index}>
                          {workout.exercise}:{" "}
                          {workout.time !== undefined
                            ? `${workout.time} minutes, ${workout.calories} calories`
                            : `${workout.sets} sets x ${workout.weight} kg`}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No workouts logged for this day yet.
                  </p>
                )}
              </div>
            </CardFooter>
          </Card>
        ) : (
          <WorkoutCalendar
            userId={currentUser}
            workouts={completedWorkouts}
            onWeekChange={handleWeekChange}
          />
        )}
      </Tabs>
    </div>
  );
}
