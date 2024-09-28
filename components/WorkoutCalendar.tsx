import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

interface Workout {
  date: string;
  exercise: string;
  time?: number;
  calories?: number;
  sets?: number;
  weight?: number;
}

interface WorkoutCalendarProps {
  userId: string;
  workouts: Record<string, Workout[]>;
  onWeekChange: (startDate: string, endDate: string) => void;
}

export function WorkoutCalendar({ userId, workouts, onWeekChange }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const onWeekChangeRef = useRef(onWeekChange);

  useEffect(() => {
    onWeekChangeRef.current = onWeekChange;
  }, [onWeekChange]);

  useEffect(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const formattedStart = format(weekStart, 'yyyy-MM-dd');
    const formattedEnd = format(weekEnd, 'yyyy-MM-dd');
    onWeekChangeRef.current(formattedStart, formattedEnd);
  }, [selectedDate]);

  const selectedWeekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 0 })
  });

  const selectedWeekWorkouts = selectedWeekDays.flatMap(date => {
    const dateString = format(date, 'yyyy-MM-dd');
    return (workouts[dateString] || []).map(workout => ({
      ...workout,
      date: dateString
    }));
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Workout Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
          weekStartsOn={0}
        />
        <div className="flex-1">
          <h3 className="font-bold mb-2">
            Week of {format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')} - {format(endOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}
          </h3>
          {selectedWeekWorkouts.length > 0 ? (
            <ul className="space-y-2">
              {selectedWeekWorkouts.map((workout, index) => (
                <li key={index} className="border p-2 rounded">
                  <span className="font-semibold">{format(parseISO(workout.date), 'MMM d')}: {workout.exercise}</span>: 
                  {workout.time !== undefined ? 
                    ` ${workout.time} min, ${workout.calories} cal` : 
                    ` ${workout.sets} x ${workout.weight}kg`}
                </li>
              ))}
            </ul>
          ) : (
            <p>No workouts logged for this week.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}