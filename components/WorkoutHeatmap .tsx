import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dumbbell,
  Flame,
  Trophy,
  CalendarCheck,
} from "lucide-react";
import { fetchAllWorkouts } from "@/lib/actions";

Date.prototype.getWeek = function (): number {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const DAYS_IN_WEEK = 7;
const WEEKS_TO_SHOW = 52;
const CELL_SIZE = 14;
const CELL_MARGIN = 2;
const MONTH_LABEL_HEIGHT = 20;
const DAY_LABEL_WIDTH = 30;

export default function WorkoutHeatmap({ userId }: WorkoutHeatmapProps) {
  const [workoutCounts, setWorkoutCounts] = useState<Record<string, number>>(
    {}
  );
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchAllWorkouts(userId);
      if (result.success && result.workouts) {
        processWorkouts(result.workouts);
        setError(null);
      } else {
        setError(result.message || "Failed to fetch workout data");
      }
    };
    fetchData();
  }, [userId]);

  const processWorkouts = (workouts: Workout[]) => {
    const counts: Record<string, number> = {};
    let currentStreak = 0;
    let bestStreak = 0;
    let currentWeeklyStreak = 0;
    let bestWeeklyStreak = 0;
    let lastWorkoutDate: Date | null = null;
    let totalDaysWorkedOut = 0;
    const weekSet = new Set<string>();

    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date);
      const dateString = workoutDate.toISOString().split("T")[0];
      const weekString = `${workoutDate.getFullYear()}-${workoutDate.getWeek()}`;

      if (!counts[dateString]) {
        counts[dateString] = 1;
        totalDaysWorkedOut++;
        weekSet.add(weekString);

        if (lastWorkoutDate) {
          const dayDiff =
            (workoutDate.getTime() - lastWorkoutDate.getTime()) /
            (1000 * 3600 * 24);
          if (dayDiff === 1) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastWorkoutDate = workoutDate;
      } else {
        counts[dateString]++;
      }
    });

    // Calculate weekly streak
    const sortedWeeks = Array.from(weekSet).sort();
    let lastWeekNum = -1;
    sortedWeeks.forEach((week) => {
      const weekNum = parseInt(week.split("-")[1]);
      if (lastWeekNum === -1 || weekNum === lastWeekNum + 1) {
        currentWeeklyStreak++;
        bestWeeklyStreak = Math.max(bestWeeklyStreak, currentWeeklyStreak);
      } else {
        currentWeeklyStreak = 1;
      }
      lastWeekNum = weekNum;
    });

    setWorkoutCounts(counts);

    // Handle the case when there are no workouts
    const totalWeeks = workouts.length > 0 ? Math.ceil(workouts.length / 7) : 1;
    const avgDaysPerWeek = totalWeeks > 0 ? totalDaysWorkedOut / totalWeeks : 0;

    setStats({
      totalWorkouts: workouts.length,
      avgDaysPerWeek,
      bestStreak,
      currentWeeklyStreak,
    });
  };

  const shiftDateRange = (weeks: number) => {
    setStartDate(
      new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
    );
  };

  const getColor = (count: number) => {
    if (!count) return "#ebedf0";
    if (count === 1) return "#c6e48b";
    if (count === 2) return "#7bc96f";
    if (count === 3) return "#239a3b";
    return "#196127";
  };

  const renderHeatmap = () => {
    const cells = [];
    let currentDate = new Date(startDate);

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      for (let day = 0; day < DAYS_IN_WEEK; day++) {
        const dateString = currentDate.toISOString().split("T")[0];
        const count = workoutCounts[dateString] || 0;

        cells.push(
          <Tooltip key={dateString}>
            <TooltipTrigger asChild>
              <rect
                x={week * (CELL_SIZE + CELL_MARGIN) + DAY_LABEL_WIDTH}
                y={day * (CELL_SIZE + CELL_MARGIN) + MONTH_LABEL_HEIGHT}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={getColor(count)}
                rx={2}
                ry={2}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{`${dateString}: ${count} workouts logged`}</p>
            </TooltipContent>
          </Tooltip>
        );

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return cells;
  };

  const renderMonthLabels = () => {
    const months = [];
    let currentDate = new Date(startDate);
    let currentMonth = currentDate.getMonth();

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      if (currentDate.getMonth() !== currentMonth) {
        months.push(
          <text
            key={`month-${week}`}
            x={week * (CELL_SIZE + CELL_MARGIN) + DAY_LABEL_WIDTH}
            y={MONTH_LABEL_HEIGHT / 2}
            fontSize="12"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {new Intl.DateTimeFormat("en-US", { month: "short" }).format(
              currentDate
            )}
          </text>
        );
        currentMonth = currentDate.getMonth();
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return months;
  };

  const renderDayLabels = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day, index) => (
      <text
        key={`day-${index}`}
        x={DAY_LABEL_WIDTH - 5}
        y={(index + 0.5) * (CELL_SIZE + CELL_MARGIN) + MONTH_LABEL_HEIGHT}
        fontSize="12"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {day}
      </text>
    ));
  };

  const StatCard = ({
    icon,
    title,
    value,
    color,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <Card className="flex-1 min-w-[150px]">
      <CardContent className="flex items-center p-4">
        <div className={`mr-4 text-${color}`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Workout Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <>
              <div className="flex justify-between mb-4 items-center">
                <Button onClick={() => shiftDateRange(-52)}>
                  Previous Year
                </Button>
                <span className="text-lg font-semibold">
                  {startDate.getFullYear()} - {startDate.getFullYear() + 1}
                </span>
                <Button onClick={() => shiftDateRange(52)}>Next Year</Button>
              </div>
              <div className="workout-heatmap" style={{ overflowX: "auto" }}>
                <svg
                  width={
                    WEEKS_TO_SHOW * (CELL_SIZE + CELL_MARGIN) + DAY_LABEL_WIDTH
                  }
                  height={
                    DAYS_IN_WEEK * (CELL_SIZE + CELL_MARGIN) +
                    MONTH_LABEL_HEIGHT
                  }
                >
                  {renderMonthLabels()}
                  {renderDayLabels()}
                  {renderHeatmap()}
                </svg>
              </div>
              {stats && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Workout Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      icon={<Dumbbell size={24} />}
                      title="Total Workouts"
                      value={stats.totalWorkouts}
                      color="blue-500"
                    />
                    <StatCard
                      icon={<CalendarCheck size={24} />}
                      title="Avg. Days/Week"
                      value={stats.avgDaysPerWeek.toFixed(1)}
                      color="green-500"
                    />
                    <StatCard
                      icon={<Trophy size={24} />}
                      title="Best Streak"
                      value={stats.bestStreak}
                      color="yellow-500"
                    />
                    <StatCard
                      icon={<Flame size={24} />}
                      title="Weekly Streak"
                      value={stats.currentWeeklyStreak}
                      color="purple-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
