import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameWeek} from "date-fns";
import { Loader2 } from "lucide-react";

export function WorkoutCalendar({ userId, workouts, onWeekChange, isLoading }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const organizedWorkouts = useMemo(() => {
    const organized: Record<string, Workout[]> = {};
    if (workouts) {
      Object.entries(workouts).forEach(([dateString, dayWorkouts]) => {
        const date = new Date(dateString);
        const dateKey = format(date, "yyyy-MM-dd");
        organized[dateKey] = dayWorkouts;
      });
    }
    return organized;
  }, [workouts]);

  useEffect(() => {
    console.log("Workouts:", workouts);
    console.log("Organized Workouts:", organizedWorkouts);
  }, [workouts, organizedWorkouts]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const newWeekStart = startOfWeek(date, { weekStartsOn: 0 });
      
      if (!isSameWeek(newWeekStart, currentWeekStart, { weekStartsOn: 0 })) {
        setCurrentWeekStart(newWeekStart);
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
        onWeekChange(
          format(newWeekStart, "yyyy-MM-dd"),
          format(weekEnd, "yyyy-MM-dd")
        );
      }
    }
  }, [currentWeekStart, onWeekChange]);

  const renderWorkoutList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading workouts...</span>
        </div>
      );
    }

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <ul className="space-y-2">
        {daysOfWeek.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayWorkouts = organizedWorkouts[dateKey] || [];

          return (
            <li key={dateKey} className="border p-2 rounded">
              <span className="font-semibold">
                {format(day, "EEE, MMM d")}:
              </span>
              {dayWorkouts.length > 0 ? (
                <ul className="list-disc pl-5">
                  {dayWorkouts.map((workout: Workout) => (
                    <li key={workout.id}>
                      {workout.exercise}:{" "}
                      {workout.is_cardio
                        ? `${workout.time} min, ${workout.calories} cal`
                        : `${workout.sets} sets of ${workout.reps} @ ${workout.weight}kg`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 ml-5">No workouts logged</p>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Workout Calendar for {userId}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border"
          weekStartsOn={0}
        />
        <div className="flex-1">
          <h3 className="font-bold mb-2">
            Week of{" "}
            {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "MMM d")} -{" "}
            {format(endOfWeek(selectedDate, { weekStartsOn: 0 }), "MMM d, yyyy")}
          </h3>
          {renderWorkoutList()}
        </div>
      </CardContent>
    </Card>
  );
}