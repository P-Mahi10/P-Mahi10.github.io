
import React, { createContext, useContext, useState, useEffect } from "react";
import { Budget, Category, Expense, User, ChatMessage } from "@/types";
import { mockUsers, mockExpensesMap, mockBudgetsMap } from "@/services/mockData";
import { v4 as uuidv4 } from "uuid";
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

interface DataContextType {
  currentUser: User | null;
  expenses: Expense[];
  budgets: Budget[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  addExpense: (expense: Omit<Expense, "id" | "userId">) => void;
  updateBudget: (category: Category, amount: number) => void;
  addChatMessage: (content: string, role: 'user' | 'assistant') => void;
  getExpensesByCategory: (timeframe?: 'weekly' | 'monthly') => Record<Category, number>;
  getTotalSpentThisMonth: () => number;
  getTotalSpentThisWeek: () => number;
  getBudgetTotal: () => number;
  clearChatMessages: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initialize with mock data but allow for modifications
let usersData = [...mockUsers];
let expensesData = new Map(mockExpensesMap);
let budgetsData = new Map(mockBudgetsMap);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load stored user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    // Load data when user changes
    if (currentUser) {
      const userExpenses = expensesData.get(currentUser.id) || [];
      const userBudgets = budgetsData.get(currentUser.id) || [];
      
      setExpenses(userExpenses);
      setBudgets(userBudgets);
      
      // Store current user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      setExpenses([]);
      setBudgets([]);
      setChatMessages([]);
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by email (in a real app, you would validate password too)
      const user = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        setCurrentUser(user);
        return true;
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user with this email already exists
      const existingUser = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: uuidv4(),
        name,
        email
      };
      
      // Add to users data
      usersData.push(newUser);
      
      // Initialize empty expenses and budgets for the new user
      expensesData.set(newUser.id, []);
      budgetsData.set(newUser.id, []);
      
      // Log in the new user
      setCurrentUser(newUser);
      
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addExpense = (expense: Omit<Expense, "id" | "userId">) => {
    if (!currentUser) return;
    
    const newExpense: Expense = {
      ...expense,
      id: uuidv4(),
      userId: currentUser.id
    };
    
    // Update local state
    setExpenses(prev => [newExpense, ...prev]);
    
    // Update shared data
    const userExpenses = expensesData.get(currentUser.id) || [];
    expensesData.set(currentUser.id, [newExpense, ...userExpenses]);
  };

  const updateBudget = (category: Category, amount: number) => {
    if (!currentUser) return;
    
    // Update local state
    setBudgets(prev => {
      const existing = prev.find(b => b.category === category);
      
      if (existing) {
        return prev.map(b => 
          b.category === category ? { ...b, amount } : b
        );
      } else {
        return [...prev, { userId: currentUser.id, category, amount }];
      }
    });
    
    // Update shared data
    const userBudgets = budgetsData.get(currentUser.id) || [];
    const existingBudgetIndex = userBudgets.findIndex(b => b.category === category);
    
    if (existingBudgetIndex >= 0) {
      userBudgets[existingBudgetIndex].amount = amount;
    } else {
      userBudgets.push({ userId: currentUser.id, category, amount });
    }
    
    budgetsData.set(currentUser.id, userBudgets);
  };

  const addChatMessage = (content: string, role: 'user' | 'assistant') => {
    setChatMessages(prev => [...prev, { content, role }]);
  };
  
  const clearChatMessages = () => {
    setChatMessages([]);
  };

  const getExpensesByCategory = (timeframe: 'weekly' | 'monthly' = 'monthly'): Record<Category, number> => {
    const result: Partial<Record<Category, number>> = {};
    
    // Get current date range
    const currentDate = new Date();
    let startDate, endDate;
    
    if (timeframe === 'weekly') {
      startDate = startOfWeek(currentDate);
      endDate = endOfWeek(currentDate);
    } else {
      // Monthly is default
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    }
    
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });
    
    // Sum expenses by category
    filteredExpenses.forEach(expense => {
      const { category, amount } = expense;
      result[category] = (result[category] || 0) + amount;
    });
    
    return result as Record<Category, number>;
  };

  const getTotalSpentThisMonth = (): number => {
    const expensesByCategory = getExpensesByCategory('monthly');
    return Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
  };
  
  const getTotalSpentThisWeek = (): number => {
    const expensesByCategory = getExpensesByCategory('weekly');
    return Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
  };

  const getBudgetTotal = (): number => {
    return budgets.reduce((sum, budget) => sum + budget.amount, 0);
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        expenses,
        budgets,
        chatMessages,
        isLoading,
        login,
        logout,
        register,
        addExpense,
        updateBudget,
        addChatMessage,
        getExpensesByCategory,
        getTotalSpentThisMonth,
        getTotalSpentThisWeek,
        getBudgetTotal,
        clearChatMessages
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
