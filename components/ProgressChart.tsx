import React, { useState, useEffect, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { elizaWorkoutSchedule, philWorkoutSchedule } from "@/lib/workoutPlans";
import { fetchAllExerciseData } from "@/lib/actions";
import { Loader2 } from "lucide-react";

const chartConfig = {
  value: {
    label: "Progress",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ProgressChart({ userId }: ProgressChartProps) {
  const [data, setData] = useState<WorkoutDataPoint[]>([]);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(
    null
  );
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCardio, setIsCardio] = useState(false);

  const workoutSchedule =
    userId === "phil" ? philWorkoutSchedule : elizaWorkoutSchedule;

  const { workoutTypes, allCardioExercises } = useMemo(() => {
    const types = workoutSchedule.map((day, index) => ({
      type: day.type,
      id: `${day.type}-${index}`,
    }));

    const cardioSet = new Set<string>();
    workoutSchedule.forEach((day) => {
      if (day.cardio) {
        day.cardio.forEach((exercise) => cardioSet.add(exercise));
      }
    });

    return {
      workoutTypes: types,
      allCardioExercises: Array.from(cardioSet),
    };
  }, [workoutSchedule]);

  const exercisesForSelectedType = useMemo(() => {
    if (!selectedWorkoutType) return [];
    const [type, index] = selectedWorkoutType.split("-");
    const day = workoutSchedule[parseInt(index)];

    if (type === "Cardio") {
      return allCardioExercises;
    } else {
      return day.exercises || [];
    }
  }, [selectedWorkoutType, workoutSchedule, allCardioExercises]);

  const fetchExerciseData = async () => {
    if (!selectedExercise) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = (await fetchAllExerciseData(
        userId,
        selectedExercise
      )) as FetchAllExerciseDataResult;
      if (result.success && result.data) {
        const processedData = result.data.map((item) => ({
          date: new Date(item.date).toISOString(),
          value: item.weight || item.time || item.calories || 0,
          weight: item.weight,
          sets: item.sets,
          reps: item.reps ? item.reps.toString() : null,
          time: item.time,
          calories: item.calories,
        }));
        setData(processedData);
        setIsCardio(
          result.data.some(
            (item) => item.time !== null || item.calories !== null
          )
        );
      } else {
        setError(result.message || "Failed to fetch exercise data");
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching exercise data:", error);
      setError("An error occurred while fetching exercise data");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseData();
    }
  }, [selectedExercise, userId]);

  useEffect(() => {
    setSelectedWorkoutType(null);
    setSelectedExercise(null);
  }, [userId]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return isNaN(date.getTime()) ? tickItem : date.toLocaleDateString();
  };

  const formatYAxis = (tickItem: number) => {
    return tickItem.toFixed(0);
  };

  const calculateDomain = (data: WorkoutDataPoint[]) => {
    if (data.length === 0) return [0, 1];
    const values = data.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    if (minValue === maxValue) {
      return [minValue * 0.9, minValue * 1.1];
    }
    const padding = (maxValue - minValue) * 0.1;
    return [Math.max(0, minValue - padding), maxValue + padding];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-300 rounded shadow">
          {isCardio ? (
            <>
              <p>{`Time: ${data.time} minutes`}</p>
              <p>{`Calories: ${data.calories}`}</p>
              <p className="label">{`Date: ${new Date(
                label
              ).toLocaleDateString()}`}</p>
            </>
          ) : (
            <>
              <p>{`Weight: ${data.weight} kg`}</p>
              <p>{`Sets: ${data.sets}`}</p>
              <p>{`Reps: ${data.reps || "N/A"}`}</p>
              <p className="label">{`Date: ${new Date(
                label
              ).toLocaleDateString()}`}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-full">
      <CardContent className="px-2 sm:p-6 h-full">
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {workoutTypes.map(({ type, id }) => (
              <Button
                key={id}
                onClick={() => {
                  setSelectedWorkoutType(id);
                  setSelectedExercise(null);
                }}
                variant={selectedWorkoutType === id ? "default" : "outline"}
              >
                {type}
              </Button>
            ))}
          </div>
          {selectedWorkoutType && (
            <div className="flex flex-wrap gap-2">
              {exercisesForSelectedType.map((exercise) => (
                <Button
                  key={exercise}
                  onClick={() => setSelectedExercise(exercise)}
                  variant={
                    selectedExercise === exercise ? "default" : "outline"
                  }
                >
                  {exercise}
                </Button>
              ))}
            </div>
          )}
        </div>
        {selectedExercise && (
          <div className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading data...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                {error}
              </div>
            ) : data.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <div className="h-full">
                  <div className="flex justify-between items-center my-2 sm:mb-4">
                    <h4 className="text-lg font-semibold">
                      {selectedExercise}
                    </h4>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={chartConfig.value.color}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={chartConfig.value.color}
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatXAxis}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        minTickGap={16}
                        style={{ fontSize: "10px", userSelect: "none" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        style={{ fontSize: "10px", userSelect: "none" }}
                        width={30}
                        tickFormatter={formatYAxis}
                        domain={calculateDomain(data)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<CustomTooltip />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartConfig.value.color}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span>No data available for this exercise.</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
