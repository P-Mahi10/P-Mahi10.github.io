
import { useData } from "@/context/DataContext";
import { CATEGORIES, Category } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BudgetForm() {
  const { budgets, updateBudget } = useData();
  
  // Handler for budget changes
  const handleBudgetChange = (category: Category, value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      updateBudget(category, amount);
      toast.success(`${category} budget updated`);
    }
  };
  
  // Get budget for a category
  const getBudget = (category: Category): number => {
    return budgets.find(b => b.category === category)?.amount || 0;
  };
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Monthly Budgets</CardTitle>
        <CardDescription>Set your spending goals</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[240px] pr-4">
          <div className="grid gap-4">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <Label htmlFor={`budget-${category}`} className="font-medium">
                  {category}
                </Label>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-muted-foreground">₹</span>
                  <Input
                    id={`budget-${category}`}
                    type="number"
                    min="0"
                    step="1"
                    className="w-24 text-right"
                    value={getBudget(category).toString()}
                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
