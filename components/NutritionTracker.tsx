import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";
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
import { nutrientGoals, mealPlans } from "@/lib/mealPlans";
import { NutritionProgressChart } from "./NutritionProgressChart";
import { useToast } from "@/hooks/use-toast";
import {
  logNutrition,
  fetchNutritionLogs,
  deleteNutritionLog,
  fetchTotalNutrients,
} from "@/lib/actions";

const MEAL_SECTIONS = [
  "Breakfast",
  "Snack",
  "Lunch",
  "Dinner",
  "Treat",
] as const;
type MealSection = (typeof MEAL_SECTIONS)[number];

const NutritionTracker: React.FC<{ userId: "phil" | "eliza" }> = ({
  userId,
}) => {
  const [selectedMeals, setSelectedMeals] = useState<
    Record<MealSection, MealWithQuantity | null>
  >({
    Breakfast: null,
    Snack: null,
    Lunch: null,
    Dinner: null,
    Treat: null,
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [totalNutrients, setTotalNutrients] = useState<
    Record<Nutrient, number>
  >({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState<Array<LoggedMeal>>([]);
  const { toast } = useToast();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deletingMealId, setDeletingMealId] = useState<number | null>(null);

  const userNutrientGoals = nutrientGoals[userId];
  const userMealPlan = mealPlans[userId];

  const calculateTotalNutrients = useCallback(() => {
    return Object.values(selectedMeals).reduce(
      (total, meal) => {
        if (!meal) return total;
        const { calories, protein, carbs, fat, quantity } = meal;
        return {
          calories: total.calories + calories * quantity,
          protein: total.protein + protein * quantity,
          carbs: total.carbs + carbs * quantity,
          fat: total.fat + fat * quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 } as Record<Nutrient, number>
    );
  }, [selectedMeals]);

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    await fetchSelectedMeals(currentDate);
    await fetchDailyTotals();
    setIsInitialLoading(false);
  }, [currentDate, userId]); // Add userId as a dependency

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, userId]); // Add userId as a dependency

  useEffect(() => {
    setTotalNutrients(calculateTotalNutrients());
  }, [selectedMeals, calculateTotalNutrients]);

  // New useEffect to handle user changes
  useEffect(() => {
    setSelectedMeals({
      Breakfast: null,
      Snack: null,
      Lunch: null,
      Dinner: null,
      Treat: null,
    });
    loadInitialData();
  }, [userId, loadInitialData]);

  const mapToLoggedMeal = (row: any): LoggedMeal => {
    return {
      id: row.id as number,
      meal_section: row.meal_section as string,
      meal_name: row.meal_name as string,
      quantity: row.quantity as number,
      calories: row.calories as number,
      protein: row.protein as number,
      carbs: row.carbs as number,
      fat: row.fat as number,
    };
  };

  const fetchSelectedMeals = async (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    const result = await fetchNutritionLogs(
      userId,
      formattedDate,
      formattedDate
    );

    const meals: Record<MealSection, MealWithQuantity | null> = {
      Breakfast: null,
      Snack: null,
      Lunch: null,
      Dinner: null,
      Treat: null,
    };

    if (result.success && result.logs) {
      const loggedMeals = result.logs.map((log) => {
        // Convert the date string to a Date object in the local timezone
        const logDate = new Date(log.date);
        return {
          ...mapToLoggedMeal(log),
          date: logDate,
        };
      });

      // Filter logs for the selected date
      const selectedDateLogs = loggedMeals.filter((log) => {
        return log.date.toDateString() === date.toDateString();
      });

      setLoggedMeals(selectedDateLogs);

      selectedDateLogs.forEach((log) => {
        const section = log.meal_section as MealSection;
        if (MEAL_SECTIONS.includes(section)) {
          meals[section] = {
            name: log.meal_name,
            calories: log.calories,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
            quantity: log.quantity,
            id: log.id,
            adjustable: true,
          };
        }
      });

      setSelectedMeals(meals);
    } else {
      console.error("Failed to fetch nutrition logs");
      setSelectedMeals(meals);
      setLoggedMeals([]);
    }
  };

  const handleMealSelection = (section: MealSection, meal: Meal) => {
    setSelectedMeals((prev) => ({
      ...prev,
      [section]: { ...meal, quantity: 1, id: -1 },
    }));
  };

  const handleQuantityChange = (section: MealSection, change: number) => {
    const meal = selectedMeals[section];
    if (!meal) return;

    const newQuantity = Math.max(1, meal.quantity + change);
    setSelectedMeals((prev) => ({
      ...prev,
      [section]: { ...meal, quantity: newQuantity },
    }));
    setTotalNutrients(calculateTotalNutrients());
  };

  const fetchDailyTotals = async () => {
    const formattedDate = currentDate.toISOString().split("T")[0];
    const result = await fetchTotalNutrients(userId, formattedDate);
    if (result.success && result.totals) {
      setTotalNutrients({
        calories: result.totals.total_calories || 0,
        protein: result.totals.total_protein || 0,
        carbs: result.totals.total_carbs || 0,
        fat: result.totals.total_fat || 0,
      });
    } else {
      console.error("Failed to fetch total nutrients:", result.message);
    }
  };

  const changeDate = (days: number) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const logMeal = async (section: MealSection) => {
    const meal = selectedMeals[section];
    if (!meal) return;

    setIsLoading(true);
    const formattedDate = currentDate.toISOString().split("T")[0];
    const result = await logNutrition(
      userId,
      formattedDate,
      section,
      meal.name,
      meal.calories,
      meal.protein,
      meal.carbs,
      meal.fat,
      meal.quantity
    );

    if (result.success) {
      console.log(`Meal logged for ${section}:`, meal);
      toast({
        title: "Meal Logged Successfully",
        description: `${meal.name} (Quantity: ${meal.quantity}) logged for ${section}`,
        variant: "success",
      });
      fetchSelectedMeals(currentDate);
      fetchDailyTotals();
    } else {
      console.error("Failed to log meal:", result.message);
      toast({
        title: "Failed to Log Meal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleDeleteLog = async (logId: number) => {
    setDeletingMealId(logId);
    setIsLoading(true);
    const result = await deleteNutritionLog(userId, logId);
    if (result.success) {
      toast({
        title: "Log Deleted Successfully",
        variant: "success",
      });
      fetchSelectedMeals(currentDate);
      fetchDailyTotals();
    } else {
      toast({
        title: "Failed to Delete Log",
        description: "Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
    setDeletingMealId(null);
  };

  const renderProgressBar = (
    nutrient: Nutrient,
    total: number,
    goal: number
  ) => {
    const percentage = Math.min((total / goal) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium capitalize">{nutrient}</span>
          <span>
            {isInitialLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              `${typeof total === "number" ? total.toFixed(0) : "0"} / ${goal}${
                nutrient === "calories" ? "" : "g"
              }`
            )}
          </span>
        </div>
        <Progress
          value={isInitialLoading ? 0 : percentage}
          className={`h-2 ${isInitialLoading ? "animate-pulse" : ""}`}
        />
      </div>
    );
  };

  const renderLoggedMeals = () => (
    <Card>
      <CardHeader>
        <CardTitle>Logged Meals</CardTitle>
      </CardHeader>
      <CardContent>
        {isInitialLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading logged meals...</span>
          </div>
        ) : loggedMeals.length > 0 ? (
          <ul className="space-y-2">
            {loggedMeals.map((meal) => (
              <li key={meal.id} className="flex items-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 mr-2"
                      disabled={deletingMealId === meal.id}
                    >
                      {deletingMealId === meal.id ? (
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
                        delete your logged meal.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteLog(meal.id)}
                      >
                        Yes, delete meal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <span>
                  {meal.meal_section}: {meal.meal_name} (x{meal.quantity})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No meals logged for today.</p>
        )}
      </CardContent>
    </Card>
  );

  const renderMealButtons = (section: MealSection) => (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(section, -5)}
            disabled={
              !selectedMeals[section] || selectedMeals[section]?.quantity <= 5
            }
          >
            - 5
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(section, -1)}
            disabled={
              !selectedMeals[section] || selectedMeals[section]?.quantity <= 1
            }
          >
            - 1
          </Button>
          <span>{selectedMeals[section]?.quantity || 0}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(section, 1)}
            disabled={!selectedMeals[section]}
          >
            + 1
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(section, 5)}
            disabled={!selectedMeals[section]}
          >
            + 5
          </Button>
        </div>
      </div>
      {selectedMeals[section] && (
        <div className="text-sm text-center">
          <p>
            Total:
            {(
              selectedMeals[section]!.calories *
              selectedMeals[section]!.quantity
            ).toFixed(0)}
            cal,
            {(
              selectedMeals[section]!.protein * selectedMeals[section]!.quantity
            ).toFixed(0)}
            p,
            {(
              selectedMeals[section]!.carbs * selectedMeals[section]!.quantity
            ).toFixed(0)}
            c,
            {(
              selectedMeals[section]!.fat * selectedMeals[section]!.quantity
            ).toFixed(0)}
            f
          </p>
        </div>
      )}
      <Button
        className="w-full"
        onClick={() => logMeal(section)}
        disabled={isLoading || !selectedMeals[section]}
      >
        {isLoading ? "Logging..." : "Log Meal"}
      </Button>
    </div>
  );

  const renderMealCard = (section: MealSection, meal: Meal, index: number) => (
    <Button
      key={index}
      onClick={() => handleMealSelection(section, meal)}
      variant={
        selectedMeals[section]?.name === meal.name ? "default" : "outline"
      }
      className="h-auto py-2 px-3 text-sm relative"
    >
      <div className="text-left">
        <div>{meal.name}</div>
        <div className="text-xs opacity-70">
          {meal.calories} cal, {meal.protein}p, {meal.carbs}c, {meal.fat}f
        </div>
        {selectedMeals[section]?.name === meal.name && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs p-1 rounded-bl">
            x{selectedMeals[section]?.quantity}
          </div>
        )}
      </div>
    </Button>
  );

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Nutrition Tracker for {userId}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {currentDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(Object.keys(userNutrientGoals) as Nutrient[]).map((nutrient) => (
              <div key={nutrient}>
                {renderProgressBar(
                  nutrient,
                  totalNutrients[nutrient] || 0,
                  userNutrientGoals[nutrient]
                )}
              </div>
            ))}
          </div>

          <Accordion type="single" collapsible className="w-full">
            {MEAL_SECTIONS.map((section) => (
              <AccordionItem value={section} key={section}>
                <AccordionTrigger>{section}</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    {userMealPlan[section].map((meal, index) =>
                      renderMealCard(section, meal, index)
                    )}
                  </div>
                  {renderMealButtons(section)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {renderLoggedMeals()}
        </CardContent>
      </Card>

      <Card className="mt-4 w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Nutrition Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isInitialLoading ? (
            <div className="animate-pulse">Loading nutrition progress...</div>
          ) : (
            <NutritionProgressChart userId={userId} />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default NutritionTracker;
