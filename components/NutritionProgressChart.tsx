import React, { useState, useEffect } from "react";
import {
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ComposedChart,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchNutritionData } from "@/lib/actions";
import { nutrientGoals } from "@/lib/mealPlans";

const chartConfig: ChartConfig = {
  calories: {
    label: "Calories",
    color: "hsl(var(--chart-1))",
  },
  protein: {
    label: "Protein",
    color: "hsl(var(--chart-2))",
  },
  carbs: {
    label: "Carbs",
    color: "hsl(var(--chart-3))",
  },
  fat: {
    label: "Fat",
    color: "hsl(var(--chart-4))",
  },
};

export function NutritionProgressChart({ userId }: { userId: string }) {
  const [data, setData] = useState<NutritionDataPoint[]>([]);
  const [selectedNutrient, setSelectedNutrient] =
    useState<Nutrient>("calories");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const userGoals = nutrientGoals[userId] || nutrientGoals.eliza;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchNutritionData(userId, selectedDate, viewMode);
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to fetch nutrition data");
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching nutrition data:", error);
        setError("An error occurred while fetching nutrition data");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, selectedDate, viewMode]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return isNaN(date.getTime()) ? tickItem : date.toLocaleDateString();
  };

  const formatYAxis = (tickItem: number) => {
    return tickItem.toFixed(0);
  };

  const calculateDomain = (data: NutritionDataPoint[]): [number, number] => {
    if (data.length === 0) return [0, 1];
    const values = data.map((item) => item[selectedNutrient]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const goal = userGoals[selectedNutrient];
    if (minValue === maxValue) {
      return [
        Math.min(minValue * 0.9, goal * 0.9),
        Math.max(minValue * 1.1, goal * 1.1),
      ];
    }
    const padding = (maxValue - minValue) * 0.1;
    return [
      Math.min(0, minValue - padding, goal * 0.9),
      Math.max(maxValue + padding, goal * 1.1),
    ];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as NutritionDataPoint;
      const goal = userGoals[selectedNutrient];
      const value = data[selectedNutrient];
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-300 rounded shadow">
          <p>{`${chartConfig[selectedNutrient].label}: ${value.toFixed(0)}`}</p>
          <p>{`Goal: ${goal}`}</p>
          <p className="label">{`Date: ${new Date(
            label
          ).toLocaleDateString()}`}</p>
        </div>
      );
    }
    return null;
  };

  const changeDate = (amount: number) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (viewMode === "week") {
        newDate.setDate(newDate.getDate() + amount * 7);
      } else {
        newDate.setMonth(newDate.getMonth() + amount);
      }
      return newDate;
    });
  };

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "week" ? "month" : "week"));
  };

  return (
    <div className="h-[600px] sm:h-[500px]">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
          {(Object.keys(chartConfig) as Nutrient[]).map((nutrient) => (
            <Button
              key={nutrient}
              onClick={() => setSelectedNutrient(nutrient)}
              variant={selectedNutrient === nutrient ? "default" : "outline"}
              className="w-full sm:w-auto"
            >
              {chartConfig[nutrient].label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
          <div className="flex items-center justify-between sm:justify-start space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => changeDate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {viewMode === "week"
                ? `Week of ${selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
            </span>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={toggleViewMode} className="w-full sm:w-auto">
            {viewMode === "week" ? "Weekly" : "Monthly"}
          </Button>
        </div>
      </div>
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
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig[selectedNutrient].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[selectedNutrient].color}
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
              <ChartTooltip cursor={false} content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey={selectedNutrient}
                stroke={chartConfig[selectedNutrient].color}
                fillOpacity={1}
                fill="url(#colorValue)"
                isAnimationActive={false}
              />
              <ReferenceLine
                y={userGoals[selectedNutrient]}
                stroke="red"
                strokeDasharray="3 3"
                label={{ value: "Goal", position: "insideTopRight" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span>No data available for this period.</span>
        </div>
      )}
    </div>
  );
}
