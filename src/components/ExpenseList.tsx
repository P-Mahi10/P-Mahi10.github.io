
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Category } from "@/types";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

export function ExpenseList() {
  const { expenses } = useData();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Filter expenses based on selected date if any
  const filteredExpenses = selectedDate 
    ? expenses.filter(expense => expense.date === format(selectedDate, 'yyyy-MM-dd'))
    : expenses;
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Limit to 10 latest expenses if no date is selected
  const limitedExpenses = selectedDate ? sortedExpenses : sortedExpenses.slice(0, 10);
  
  // Group expenses by date
  const expensesByDate = limitedExpenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);
  
  // Get category badge color
  const getCategoryColor = (category: Category): string => {
    const colors: Record<Category, string> = {
      "Food": "bg-blue-100 text-blue-800",
      "Travel": "bg-purple-100 text-purple-800",
      "Entertainment": "bg-pink-100 text-pink-800",
      "Shopping": "bg-yellow-100 text-yellow-800",
      "Bills": "bg-red-100 text-red-800",
      "Healthcare": "bg-green-100 text-green-800",
      "Other": "bg-gray-100 text-gray-800",
    };
    return colors[category];
  };
  
  // Handle date selection and clear
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  const handleClearDate = () => {
    setSelectedDate(undefined);
  };
  
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              {selectedDate 
                ? `Expenses for ${format(selectedDate, 'MMMM d, yyyy')}`
                : 'Your latest transactions'
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8" 
                onClick={handleClearDate}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.keys(expensesByDate).length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {selectedDate 
                ? `No expenses for ${format(selectedDate, 'MMMM d, yyyy')}`
                : 'No expenses to display'
              }
            </div>
          ) : (
            Object.entries(expensesByDate).map(([date, dateExpenses]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="flex-shrink-0 px-2 text-sm text-muted-foreground">
                    {format(parseISO(date), "MMMM d, yyyy")}
                  </span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="space-y-3">
                  {dateExpenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="expense-card flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getCategoryColor(expense.category)}`}>
                            {expense.category}
                          </span>
                          {expense.notes && (
                            <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                              {expense.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-base font-medium">
                        ₹{expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
