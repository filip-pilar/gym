"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { elizaWorkoutSchedule, philWorkoutSchedule } from "@/lib/workoutPlans";
import {
  deleteWorkout,
  fetchExercises,
  fetchLastWorkout,
  logWorkout,
  overwriteWorkout,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { ProgressChart } from "@/components/ProgressChart";
import WorkoutHeatmap from "@/components/WorkoutHeatmap ";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toZonedTime } from "date-fns-tz";
import NutritionTracker from "@/components/NutritionTracker";

export default function WorkoutTracker() {
  const [currentUser, setCurrentUser] = useState<"phil" >("phil");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dubaiTimezone = "Asia/Dubai";
    const nowInDubai = toZonedTime(new Date(), dubaiTimezone);
    return nowInDubai;
  });
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const dubaiTimezone = "Asia/Dubai";
    const nowInDubai = toZonedTime(new Date(), dubaiTimezone);
    return startOfWeek(nowInDubai, { weekStartsOn: 0 });
  });
  const [view, setView] = useState<
    "log" | "calendar" | "progress" | "stats" | "food"
  >("log");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [isCardio, setIsCardio] = useState(false);
  const [selectedSets, setSelectedSets] = useState<3 | 4 | null>(null);
  const [selectedReps, setSelectedReps] = useState<
    "6-8" | "10-12" | "3-4" | null
  >(null);
  const [weight, setWeight] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [workouts, setWorkouts] = useState<CompletedWorkouts>({});
  const [isWorkoutsLoading, setIsWorkoutsLoading] = useState(false);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<string>("");
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<number | null>(
    null
  );

  const getCurrentWorkoutSchedule = useMemo(
    () => (currentUser === "phil" ? philWorkoutSchedule : elizaWorkoutSchedule),
    [currentUser]
  );

  const currentDayWorkout = useMemo(() => {
    if (selectedDaySchedule) {
      return (
        getCurrentWorkoutSchedule.find(
          (day) => day.day.toString() === selectedDaySchedule
        ) || { exercises: [], cardio: [] }
      );
    }
    return (
      getCurrentWorkoutSchedule[selectedDate.getDay()] || {
        exercises: [],
        cardio: [],
      }
    );
  }, [getCurrentWorkoutSchedule, selectedDate, selectedDaySchedule]);

  const handleWeekChange = useCallback((start: string) => {
    const newStartDate = new Date(start);
    setSelectedDate(newStartDate);
    setCurrentWeekStart(startOfWeek(newStartDate, { weekStartsOn: 0 }));
  }, []);

  const fetchWorkoutsForWeek = useCallback(async () => {
    setIsWorkoutsLoading(true);
    const weekStartDate = startOfWeek(currentWeekStart, { weekStartsOn: 0 });
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 0 });
    const startDateStr = format(weekStartDate, "yyyy-MM-dd");
    const endDateStr = format(weekEndDate, "yyyy-MM-dd");

    try {
      const result = await fetchExercises(
        currentUser,
        startDateStr,
        endDateStr
      );
      if (result.success && result.exercises) {
        const workoutsByDate = result.exercises.reduce((acc, workout) => {
          const date = workout.date;
          if (!acc[date]) acc[date] = [];
          acc[date].push({
            ...workout,
            user_id: currentUser, // Add this line
            date: date, // Add this line
          });
          return acc;
        }, {} as CompletedWorkouts);

        setWorkouts(workoutsByDate);
      } else {
        console.error("Failed to fetch workouts:", result.message);
        toast({
          title: "Error",
          description: "Failed to fetch workouts. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching workouts:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWorkoutsLoading(false);
    }
  }, [currentUser, currentWeekStart, toast]);

  useEffect(() => {
    fetchWorkoutsForWeek();
  }, [fetchWorkoutsForWeek]);

  useEffect(() => {
    const fetchLastWorkoutData = async () => {
      if (selectedExercise) {
        try {
          const result = await fetchLastWorkout(currentUser, selectedExercise);
          if (result.success && result.workout) {
            if (!result.workout.is_cardio) {
              setSelectedSets(result.workout.sets);
              setSelectedReps(result.workout.reps);
              setWeight(result.workout.weight.toString());
            } else {
              setTime(result.workout.time.toString());
              setCalories(result.workout.calories.toString());
            }
          } else {
            resetForm();
          }
        } catch (error) {
          console.error("Error fetching last workout:", error);
          toast({
            title: "Error",
            description: "Failed to fetch last workout data. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    fetchLastWorkoutData();
  }, [currentUser, selectedExercise, toast]);

  const resetForm = () => {
    setSelectedSets(null);
    setSelectedReps(null);
    setWeight("");
    setTime("");
    setCalories("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isCardio) {
      if (!selectedSets || !selectedReps || !weight) {
        toast({
          title: "Error",
          description:
            "Please select sets, reps, and input weight for strength training exercises.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else {
      if (!time || !calories) {
        toast({
          title: "Error",
          description: "Please input time and calories for cardio exercises.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const result = await logWorkout(
      currentUser,
      format(selectedDate, "yyyy-MM-dd"),
      selectedExercise,
      isCardio,
      selectedSets,
      selectedReps,
      isCardio ? null : parseFloat(weight),
      isCardio ? parseFloat(time) : null,
      isCardio ? parseFloat(calories) : null
    );

    if (result.success) {
      toast({
        title: "Success",
        description: "Workout logged successfully!",
        variant: "success",
      });

      const date = format(selectedDate, "yyyy-MM-dd");
      setWorkouts((prevWorkouts) => ({
        ...prevWorkouts,
        [date]: [
          ...(prevWorkouts[date] || []),
          {
            id: result.workoutId,
            exercise: selectedExercise,
            is_cardio: isCardio,
            sets: selectedSets,
            reps: selectedReps,
            weight: isCardio ? null : parseFloat(weight),
            time: isCardio ? parseFloat(time) : null,
            calories: isCardio ? parseFloat(calories) : null,
          },
        ],
      }));

      resetForm();
    } else if (result.existingWorkout) {
      toast({
        title: "Workout Already Logged",
        description:
          "A workout for this exercise is already logged for the selected day.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            onClick={() => handleOverwrite(result.existingWorkout.id)}
          >
            Overwrite
          </Button>
        ),
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to log workout. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleOverwrite = async (workoutId: number) => {
    const result = await overwriteWorkout(
      workoutId,
      selectedSets,
      selectedReps,
      isCardio ? null : parseFloat(weight),
      isCardio ? parseFloat(time) : null,
      isCardio ? parseFloat(calories) : null
    );

    if (result.success) {
      toast({
        title: "Success",
        description: "Workout updated successfully!",
        variant: "success",
      });
      resetForm();
    } else {
      toast({
        title: "Error",
        description: "Failed to update workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsCardio(false);
    setSelectedExercise("");
    setSelectedSets(null);
    setSelectedReps(null);
    setSelectedDaySchedule("");
  };

  const handleDayScheduleChange = (value: string) => {
    setSelectedDaySchedule(value);
    setSelectedExercise("");
    setIsCardio(false);
    resetForm();
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    setDeletingWorkoutId(workoutId);
    try {
      const result = await deleteWorkout(workoutId);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "success",
        });

        // Update local state
        setWorkouts((prevWorkouts) => {
          const updatedWorkouts = { ...prevWorkouts };
          for (const date in updatedWorkouts) {
            updatedWorkouts[date] = updatedWorkouts[date].filter(
              (workout) => workout.id !== workoutId
            );
            if (updatedWorkouts[date].length === 0) {
              delete updatedWorkouts[date];
            }
          }
          return updatedWorkouts;
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingWorkoutId(null);
    }
  };

  const renderProgressView = () => {
    if (isWorkoutsLoading) {
      return (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading workout data...</span>
        </div>
      );
    }

    return <ProgressChart userId={currentUser} />;
  };

  const renderExerciseButtons = (
    exercises: string[] | undefined,
    isCardio: boolean
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {exercises?.map((exercise: string) => (
        <Button
          key={exercise}
          type="button"
          variant={
            selectedExercise === exercise && isCardio === isCardio
              ? "default"
              : "outline"
          }
          onClick={() => {
            setSelectedExercise(exercise);
            setIsCardio(isCardio);
          }}
        >
          {exercise}
        </Button>
      ))}
    </div>
  );

  const renderWorkoutForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Day selection buttons */}
      <div>
        <Label className="mb-2 block">Select Day</Label>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) =>
            addDays(currentWeekStart, i)
          ).map((date) => (
            <Button
              key={format(date, "yyyy-MM-dd")}
              type="button"
              variant={isSameDay(selectedDate, date) ? "default" : "outline"}
              onClick={() => handleDayClick(date)}
              className="flex flex-col items-center p-2 h-auto"
            >
              <span className="text-xs">{format(date, "EEE")}</span>
              <span className="text-lg font-bold">{format(date, "d")}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise selection buttons */}
      <div>
        <Label className="mb-2 block">Select Exercise</Label>
        {renderExerciseButtons(currentDayWorkout.exercises, false)}
      </div>

      {/* Cardio selection buttons */}
      <div>
        <Label className="mb-2 block">Cardio</Label>
        {renderExerciseButtons(currentDayWorkout.cardio, true)}
      </div>

      {/* Day overwrite selection */}
      <div className="space-y-2">
        <Label htmlFor="daySchedule">Overwrite Workout Day (Optional)</Label>
        <Select
          onValueChange={handleDayScheduleChange}
          value={selectedDaySchedule}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select workout day to overwrite" />
          </SelectTrigger>
          <SelectContent>
            {getCurrentWorkoutSchedule.map((day) => (
              <SelectItem key={day.day} value={day.day.toString()}>
                {day.day} - {day.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  placeholder="Enter time"
                  type="number"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories Burned</Label>
                <Input
                  id="calories"
                  name="calories"
                  placeholder="Enter calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="mb-2 block">Sets</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedSets === 3 ? "default" : "outline"}
                    onClick={() => setSelectedSets(3)}
                  >
                    3
                  </Button>
                  <Button
                    type="button"
                    variant={selectedSets === 4 ? "default" : "outline"}
                    onClick={() => setSelectedSets(4)}
                  >
                    4
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="mb-2 block">Reps</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedReps === "3-4" ? "default" : "outline"}
                    onClick={() => setSelectedReps("3-4")}
                  >
                    3-4
                  </Button>
                  <Button
                    type="button"
                    variant={selectedReps === "6-8" ? "default" : "outline"}
                    onClick={() => setSelectedReps("6-8")}
                  >
                    6-8
                  </Button>
                  <Button
                    type="button"
                    variant={selectedReps === "10-12" ? "default" : "outline"}
                    onClick={() => setSelectedReps("10-12")}
                  >
                    10-12
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  placeholder="Enter weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
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
  );

  const renderWorkoutList = () => (
    <div className="w-full">
      <h3 className="font-semibold mb-2">Completed Workouts:</h3>
      {isWorkoutsLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading workouts...</span>
        </div>
      ) : Object.keys(workouts).length > 0 ? (
        <ul className="space-y-2">
          {Object.entries(workouts).map(([date, dayWorkouts]) => (
            <li key={date} className="border-b pb-2">
              <span className="font-semibold">
                {format(new Date(date), "MMM d")}:
              </span>
              <ul className="list-disc pl-5 mt-1">
                {dayWorkouts.map((workout) => (
                  <li key={workout.id} className="text-sm flex items-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          disabled={deletingWorkoutId === workout.id}
                        >
                          {deletingWorkoutId === workout.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your workout.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteWorkout(workout.id)}
                          >
                            Yes, delete workout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <span>
                      {workout.exercise}:{" "}
                      {workout.is_cardio
                        ? `${workout.time} min, ${workout.calories} cal`
                        : `${workout.sets} sets of ${workout.reps} @ ${workout.weight}kg`}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No workouts logged yet.</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Progress Tracker</h1>
      <Tabs
        defaultValue="phil"
        onValueChange={(value) => setCurrentUser(value as "phil")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="phil">Phil</TabsTrigger>
        </TabsList>
        <div className="mb-4">
          <Button
            onClick={() => setView("log")}
            variant={view === "log" ? "default" : "outline"}
            className="mr-2"
          >
            Log
          </Button>
          <Button
            onClick={() => setView("calendar")}
            variant={view === "calendar" ? "default" : "outline"}
            className="mr-2"
          >
            Calendar
          </Button>
          <Button
            onClick={() => setView("progress")}
            variant={view === "progress" ? "default" : "outline"}
            className="mr-2"
          >
            Progress
          </Button>
          <Button
            onClick={() => setView("stats")}
            variant={view === "stats" ? "default" : "outline"}
            className="mr-2"
          >
            Stats
          </Button>
          <Button
            onClick={() => setView("food")}
            variant={view === "food" ? "default" : "outline"}
          >
            Food
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
            <CardContent>{renderWorkoutForm()}</CardContent>
            <CardFooter>{renderWorkoutList()}</CardFooter>
          </Card>
        ) : view === "calendar" ? (
          <WorkoutCalendar
            userId={currentUser}
            workouts={workouts}
            onWeekChange={handleWeekChange}
            isLoading={isWorkoutsLoading}
            initialDate={selectedDate}
          />
        ) : view === "progress" ? (
          renderProgressView()
        ) : view === "stats" ? (
          <WorkoutHeatmap userId={currentUser} />
        ) : view === "food" ? (
          <NutritionTracker  userId={currentUser} />
        ) : null}
      </Tabs>
    </div>
  );
}
