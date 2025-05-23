
import { useData } from "@/context/DataContext";
import { CATEGORIES } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CategorySpendingChart() {
  const { getExpensesByCategory, budgets } = useData();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('monthly');
  
  const expensesByCategory = getExpensesByCategory(timeframe);
  
  // Prepare data for chart
  const data = CATEGORIES.map(category => {
    const spent = expensesByCategory[category] || 0;
    const budget = budgets.find(b => b.category === category)?.amount || 0;
    const percentOfBudget = budget > 0 ? (spent / budget) * 100 : 0;
    
    return {
      name: category,
      spent,
      budget,
      percentOfBudget,
    };
  });
  
  // Colors for chart
  const getBarColor = (percentOfBudget: number) => {
    if (percentOfBudget >= 100) return "#ef4444";  // Over budget (red)
    if (percentOfBudget >= 75) return "#f59e0b";   // Near budget (amber)
    return "#10b981";  // Under budget (green)
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            Spent: <span className="font-medium">₹{data.spent.toFixed(2)}</span>
          </p>
          <p className="text-sm">
            Budget: <span className="font-medium">₹{data.budget.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentOfBudget > 0 
              ? `${data.percentOfBudget.toFixed(1)}% of budget`
              : 'No budget set'}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="animate-fade-in col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Category Spending</CardTitle>
          <CardDescription>
            Your {timeframe} spending by category compared to budget
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant={timeframe === 'weekly' ? 'default' : 'outline'}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly
          </Button>
          <Button 
            size="sm" 
            variant={timeframe === 'monthly' ? 'default' : 'outline'}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barGap={2}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                height={60}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tickFormatter={(value) => `₹${value}`} 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="spent" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.percentOfBudget)}
                  />
                ))}
                <LabelList 
                  dataKey="spent" 
                  position="top" 
                  formatter={(value: number) => `₹${value.toFixed(0)}`}
                  style={{ fontSize: 10, fill: '#6B7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
