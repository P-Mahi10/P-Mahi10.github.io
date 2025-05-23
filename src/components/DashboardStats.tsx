
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { CATEGORIES } from "@/types";
import { ArrowDown, ArrowUp, DollarSign, PiggyBank, TrendingUp } from "lucide-react";

export function DashboardStats() {
  const { getExpensesByCategory, getTotalSpentThisMonth, getBudgetTotal } = useData();
  
  const totalSpent = getTotalSpentThisMonth();
  const totalBudget = getBudgetTotal();
  const remaining = totalBudget - totalSpent;
  
  const expensesByCategory = getExpensesByCategory();
  
  // Find highest expense category
  let highestCategory = CATEGORIES[0];
  let highestAmount = expensesByCategory[highestCategory] || 0;
  
  CATEGORIES.forEach(category => {
    const amount = expensesByCategory[category] || 0;
    if (amount > highestAmount) {
      highestCategory = category;
      highestAmount = amount;
    }
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Current month expenses
          </p>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in" style={{animationDelay: "0.1s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Budget Remaining
          </CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold">${remaining.toFixed(2)}</div>
            {remaining > 0 ? (
              <ArrowUp className="ml-2 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining > 0 
              ? `${((remaining / totalBudget) * 100).toFixed(1)}% under budget` 
              : `${((Math.abs(remaining) / totalBudget) * 100).toFixed(1)}% over budget`}
          </p>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Budget
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Monthly budget goal
          </p>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in" style={{animationDelay: "0.3s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Highest Expense
          </CardTitle>
          <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
            {highestCategory}
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${highestAmount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {highestAmount > 0 
              ? `${((highestAmount / totalSpent) * 100).toFixed(1)}% of spending`
              : "No expenses yet"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
