
import { Budget, Category, Expense, User } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Mock users
export const mockUsers: User[] = [
  {
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
  },
  {
    id: "user2",
    name: "Jane Smith",
    email: "jane@example.com",
  },
  {
    id: "user3",
    name: "Bob Johnson",
    email: "bob@example.com",
  },
];

// Generate a date string for a specific number of days ago
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

// Generate mock expenses for a user
export const generateMockExpenses = (userId: string): Expense[] => {
  const expenses: Expense[] = [];
  
  // Generate expenses for the last 10 days
  for (let i = 0; i < 10; i++) {
    const date = getDateDaysAgo(i);
    
    // Generate 1-3 expenses per day
    const dailyExpenseCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < dailyExpenseCount; j++) {
      const categories: Category[] = ["Food", "Travel", "Entertainment", "Shopping", "Bills", "Healthcare", "Other"];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Generate an amount between $5 and $200
      const amount = Math.round((Math.random() * 195 + 5) * 100) / 100;
      
      expenses.push({
        id: uuidv4(),
        userId,
        date,
        category,
        amount,
        notes: Math.random() > 0.3 ? `Sample expense for ${category}` : undefined,
      });
    }
  }
  
  return expenses;
};

// Generate mock budgets for a user
export const generateMockBudgets = (userId: string): Budget[] => {
  return [
    { userId, category: "Food", amount: 500 },
    { userId, category: "Travel", amount: 300 },
    { userId, category: "Entertainment", amount: 200 },
    { userId, category: "Shopping", amount: 400 },
    { userId, category: "Bills", amount: 800 },
    { userId, category: "Healthcare", amount: 300 },
    { userId, category: "Other", amount: 200 },
  ];
};

// Create mock data for all users
export const mockExpensesMap = new Map<string, Expense[]>(
  mockUsers.map(user => [user.id, generateMockExpenses(user.id)])
);

export const mockBudgetsMap = new Map<string, Budget[]>(
  mockUsers.map(user => [user.id, generateMockBudgets(user.id)])
);
