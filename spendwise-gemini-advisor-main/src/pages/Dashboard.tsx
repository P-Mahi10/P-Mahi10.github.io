
import { DashboardStats } from "@/components/DashboardStats";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { CategorySpendingChart } from "@/components/CategorySpendingChart";
import { BudgetForm } from "@/components/BudgetForm";
import { AiAdvisor } from "@/components/AiAdvisor";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

// This file simulates a server-side proxy endpoint for educational purposes
// In a real app, this would be a server-side API endpoint
if (typeof window !== 'undefined') {
  // Mock the proxy endpoint on the client side
  const mockProxyHandler = async (req: Request) => {
    try {
      // Extract the request body
      const body = await req.json();
      const { prompt, apiKey } = body;
      
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Make the real request to the Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      
      return new Response(JSON.stringify({ response: textResponse }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ error: 'Failed to process request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
  
  // Register the mock endpoint
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    if (typeof input === 'string' && input === '/api/gemini-proxy') {
      return mockProxyHandler(new Request(input, init));
    }
    return originalFetch(input, init);
  };
}

export default function Dashboard() {
  const { currentUser, logout } = useData();
  
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };
  
  useEffect(() => {
    // Initialize theme based on stored preferences
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-background pb-10 transition-colors duration-200">
      <header className="sticky top-0 z-10 bg-background border-b py-4 px-6 mb-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-500 to-indigo-500 text-transparent bg-clip-text">
              SmartSpend
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm hidden md:block">
              Welcome, <span className="font-medium">{currentUser?.name}</span>
            </p>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* First row: Stats */}
          <div className="col-span-full">
            <DashboardStats />
          </div>
          
          {/* Left column: Expense Form + Chart */}
          <div className="col-span-1 space-y-6">
            <ExpenseForm />
            <BudgetForm />
          </div>
          
          {/* Middle column: Recent Expenses */}
          <div className="col-span-1 space-y-6">
            <ExpenseList />
          </div>
          
          {/* Right column: Category Chart */}
          <div className="col-span-1 space-y-6">
            <CategorySpendingChart />
          </div>
          
          {/* Bottom row: AI Advisor */}
          <div className="col-span-full">
            <AiAdvisor />
          </div>
        </div>
      </main>
    </div>
  );
}
