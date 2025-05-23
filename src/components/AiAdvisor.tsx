
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Proxy endpoint that will handle the Gemini API call
const AI_PROXY_ENDPOINT = "/api/gemini-proxy";

export function AiAdvisor() {
  const { chatMessages, addChatMessage, getExpensesByCategory, budgets, clearChatMessages } = useData();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Handler for sending a message to the AI
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    addChatMessage(message, "user");
    setMessage("");
    
    // Set loading state and reset error state
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Get expense and budget data
      const expenses = getExpensesByCategory('monthly');
      const userBudgets = budgets.reduce((acc, budget) => {
        acc[budget.category] = budget.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Prepare data for API call
      const overSpendingCategories = [];
      const underSpendingCategories = [];
      
      for (const category in userBudgets) {
        const budget = userBudgets[category];
        const spent = expenses[category as keyof typeof expenses] || 0;
        
        if (spent > budget) {
          overSpendingCategories.push({ category, amount: spent - budget });
        } else if (spent < budget * 0.9 && spent > 0) {
          // Only consider categories where at least something was spent
          // and they are under budget by at least 10%
          underSpendingCategories.push({ category, amount: budget - spent });
        }
      }
      
      // Calculate total budget and spending
      const totalBudget = Object.values(userBudgets).reduce((sum, amount) => sum + amount, 0);
      const totalSpent = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
      
      // Create context for the AI
      const contextPrompt = `
        Here is the user's financial data:
        - Monthly budgets: ${JSON.stringify(userBudgets)}
        - Current month spending: ${JSON.stringify(expenses)}
        - Total budget: ₹${totalBudget}
        - Total spent: ₹${totalSpent}
        - Overbudget categories: ${JSON.stringify(overSpendingCategories)}
        - Underbudget categories: ${JSON.stringify(underSpendingCategories)}
        
        Based on this financial data, respond to the user's query: "${message}"
        
        Give specific, actionable advice for each category where relevant. Focus on practical suggestions to help the user improve their financial situation.
        Present your response in a clear, organized format with emojis for readability.
        Use Indian Rupee (₹) for all monetary values.
      `;
      
      let response;
      
      // Try to fetch from our proxy endpoint first
      try {
        // The proxy endpoint will make the actual call to Gemini API
        const apiResponse = await fetch(AI_PROXY_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: contextPrompt,
            apiKey: "AIzaSyDO1pAiQDnStkTxAkuUql7g6A7aubmZMmU" // This will be handled securely by the proxy
          })
        });
        
        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();
        response = data.response;
        
        if (!response || response.trim() === '') {
          throw new Error('Empty response received');
        }
      } catch (error) {
        console.error('Error calling proxy API:', error);
        
        // Fall back to generated responses if proxy fails
        response = generateFallbackResponse(message, overSpendingCategories, underSpendingCategories, expenses, userBudgets);
        toast.warning("Using offline mode for financial advice");
      }
      
      // Add AI response to chat
      addChatMessage(response, "assistant");
      
      // Show presets after each message
      setShowPresets(true);
    } catch (error) {
      console.error("AI response error:", error);
      setHasError(true);
      toast.error("Failed to get financial advice. Please try again later.");
      
      // Add fallback message in case of error
      addChatMessage("I'm sorry, I couldn't process your request at the moment. Please try again later or try one of the suggested questions below.", "assistant");
      setShowPresets(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to generate fallback responses when API call fails
  const generateFallbackResponse = (
    userMessage: string,
    overSpendingCategories: Array<{category: string, amount: number}>,
    underSpendingCategories: Array<{category: string, amount: number}>,
    expenses: Record<string, number>,
    budgets: Record<string, number>
  ) => {
    // Determine which type of fallback response to generate based on the user message
    const normalizedMessage = userMessage.toLowerCase();
    
    if (normalizedMessage.includes("budget") || normalizedMessage.includes("month")) {
      return generateBudgetAnalysis(budgets, expenses);
    } else if (normalizedMessage.includes("save") || normalizedMessage.includes("saving")) {
      return generateSavingsTips(overSpendingCategories);
    } else if (normalizedMessage.includes("advice") || normalizedMessage.includes("help")) {
      return generateFinancialAdvice(overSpendingCategories, underSpendingCategories, expenses, budgets);
    } else if (normalizedMessage.includes("overspend") || normalizedMessage.includes("cut")) {
      return generateOverspendingAnalysis(overSpendingCategories);
    } else {
      return generateGeneralAdvice(expenses, budgets);
    }
  };

  // Helper function to generate financial advice (fallback if API call fails)
  const generateFinancialAdvice = (
    overSpendingCategories: Array<{category: string, amount: number}>,
    underSpendingCategories: Array<{category: string, amount: number}>,
    expenses: Record<string, number>,
    budgets: Record<string, number>
  ) => {
    // Modify this prompt to change how financial advice is generated based on spending vs budget.
    if (Object.keys(expenses).length === 0) {
      return "I don't see any expenses recorded yet. Start logging your expenses, and I'll be able to provide personalized financial advice based on your spending patterns.";
    }
    
    let advice = "Based on your current spending patterns:\n\n";
    
    if (overSpendingCategories.length > 0) {
      advice += "⚠️ **Categories where you're over budget:**\n";
      overSpendingCategories.forEach(({ category, amount }) => {
        advice += `- ${category}: You've exceeded your budget by ₹${amount.toFixed(2)}. `;
        
        // Add category-specific advice
        if (category === "Food") {
          advice += "Consider meal prepping or cutting back on dining out to save money.\n";
        } else if (category === "Entertainment") {
          advice += "Look for free or low-cost entertainment options to enjoy while getting back on track.\n";
        } else if (category === "Shopping") {
          advice += "Try implementing a 24-hour rule before making non-essential purchases to reduce impulse buying.\n";
        } else {
          advice += "Review your expenses in this category to identify opportunities for savings.\n";
        }
      });
      advice += "\n";
    }
    
    if (underSpendingCategories.length > 0) {
      advice += "✅ **Categories where you're under budget:**\n";
      underSpendingCategories.forEach(({ category, amount }) => {
        advice += `- ${category}: You're ₹${amount.toFixed(2)} under budget. Great job managing these expenses!\n`;
      });
      advice += "\n";
    }
    
    // Generate category-specific advice
    advice += "💡 **Category-wise Recommendations:**\n";
    
    const categories = [...new Set([
      ...overSpendingCategories.map(item => item.category),
      ...underSpendingCategories.map(item => item.category)
    ])];
    
    if (categories.length === 0) {
      advice += "You're doing well overall with your budgeting. Keep monitoring your expenses regularly.\n";
    } else {
      categories.forEach(category => {
        const spent = expenses[category] || 0;
        const budget = budgets[category] || 0;
        
        if (spent > budget) {
          if (category === "Food") {
            advice += "**Food**: Try cooking at home more often and batch cooking meals for the week.\n";
          } else if (category === "Entertainment") {
            advice += "**Entertainment**: Look for free events in your area or try a streaming service instead of multiple subscriptions.\n";
          } else if (category === "Shopping") {
            advice += "**Shopping**: Create a wishlist and wait for sales, or try a 30-day waiting period for non-essential purchases.\n";
          } else if (category === "Travel") {
            advice += "**Travel**: Consider budget-friendly destinations or plan trips during off-peak seasons for better rates.\n";
          } else {
            advice += `**${category}**: Review your expenses in this category and identify non-essential items you can cut back.\n`;
          }
        } else {
          advice += `**${category}**: Great job staying under budget! Consider allocating some of the savings to your emergency fund or investments.\n`;
        }
      });
    }
    
    return advice;
  };
  
  // Helper function to generate budget analysis (fallback if API call fails)
  const generateBudgetAnalysis = (
    budgets: Record<string, number>,
    expenses: Record<string, number>
  ) => {
    const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
    const totalSpent = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    let analysis = `**Budget Analysis**\n\n`;
    analysis += `Total Budget: ₹${totalBudget.toFixed(2)}\n`;
    analysis += `Total Spent: ₹${totalSpent.toFixed(2)}\n`;
    analysis += `Remaining: ₹${remainingBudget.toFixed(2)}\n\n`;
    
    if (percentUsed < 50) {
      analysis += "🌟 You're well under budget! Consider allocating some funds to savings or investments.";
    } else if (percentUsed < 80) {
      analysis += "👍 You're on track with your budget. Keep monitoring your expenses to stay on target.";
    } else if (percentUsed < 100) {
      analysis += "⚠️ You're getting close to your budget limit. Be mindful of additional spending for the rest of the month.";
    } else {
      analysis += "❗ You've exceeded your budget. Review your spending and consider adjusting your budget or cutting back on non-essential expenses.";
    }
    
    return analysis;
  };
  
  // Helper function to generate savings tips (fallback if API call fails)
  const generateSavingsTips = (
    overSpendingCategories: Array<{category: string, amount: number}>
  ) => {
    let tips = "**Tips to Increase Your Savings**\n\n";
    
    if (overSpendingCategories.length > 0) {
      tips += "1. **Address Overspending:**\n";
      overSpendingCategories.forEach(({ category }) => {
        if (category === "Food") {
          tips += "   - For Food: Meal prep, use grocery lists, and limit dining out\n";
        } else if (category === "Entertainment") {
          tips += "   - For Entertainment: Look for free events, use streaming services instead of multiple subscriptions\n";
        } else if (category === "Shopping") {
          tips += "   - For Shopping: Implement a 30-day rule for non-essential purchases\n";
        } else {
          tips += `   - For ${category}: Review expenses and identify non-essential items you can cut back\n`;
        }
      });
      tips += "\n";
    }
    
    tips += "2. **General Savings Tips:**\n";
    tips += "   - Automate savings by setting up automatic transfers to a savings account\n";
    tips += "   - Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings\n";
    tips += "   - Consider using cashback apps or credit cards with rewards\n";
    tips += "   - Review and cancel unused subscriptions\n\n";
    
    tips += "3. **Next Steps:**\n";
    tips += "   - Set a specific savings goal with a deadline\n";
    tips += "   - Track your progress weekly\n";
    tips += "   - Celebrate small wins to stay motivated";
    
    return tips;
  };
  
  // Helper function to generate spending analysis (fallback if API call fails)
  const generateOverspendingAnalysis = (
    overSpendingCategories: Array<{category: string, amount: number}>
  ) => {
    let analysis = "**Overspending Analysis**\n\n";
    
    if (overSpendingCategories.length === 0) {
      analysis += "🎉 Great news! You're not overspending in any category right now. Keep up the good work!\n\n";
      analysis += "💡 Some tips to maintain this good habit:\n";
      analysis += "1. Continue tracking expenses regularly\n";
      analysis += "2. Review your budget periodically to ensure it's realistic\n";
      analysis += "3. Plan for upcoming expenses to avoid surprises";
    } else {
      analysis += "Here are the categories where you're spending more than budgeted:\n\n";
      
      overSpendingCategories.forEach(({ category, amount }) => {
        analysis += `**${category}** - ₹${amount.toFixed(2)} over budget\n`;
        
        // Category-specific recommendations
        if (category === "Food") {
          analysis += "• Try meal planning and grocery shopping with a list\n";
          analysis += "• Reduce dining out to once a week\n";
          analysis += "• Prepare breakfast and lunch at home\n\n";
        } else if (category === "Entertainment") {
          analysis += "• Look for free community events\n";
          analysis += "• Share streaming subscriptions with family\n";
          analysis += "• Use library resources instead of buying books/movies\n\n";
        } else if (category === "Shopping") {
          analysis += "• Create a 30-day waiting period for non-essential purchases\n";
          analysis += "• Unsubscribe from store newsletters to avoid temptation\n";
          analysis += "• Try a no-spend challenge for the rest of the month\n\n";
        } else {
          analysis += `• Review your ${category.toLowerCase()} expenses for non-essential items\n`;
          analysis += `• Create a more detailed budget for ${category.toLowerCase()} expenses\n`;
          analysis += `• Consider alternatives to reduce ${category.toLowerCase()} costs\n\n`;
        }
      });
    }
    
    return analysis;
  };
  
  // Helper function to generate general advice when input is ambiguous
  const generateGeneralAdvice = (
    expenses: Record<string, number>,
    budgets: Record<string, number>
  ) => {
    const totalSpent = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const totalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0);
    
    let advice = "**General Financial Advice**\n\n";
    
    if (Object.keys(expenses).length === 0) {
      advice += "I notice you haven't recorded any expenses yet. Here are some tips to get started:\n\n";
      advice += "1. **Begin tracking** your daily expenses in each category\n";
      advice += "2. **Set realistic budgets** for each spending category\n";
      advice += "3. **Review your finances weekly** to stay on track\n";
      advice += "4. **Start small** - focus on one or two categories first if tracking everything feels overwhelming\n\n";
      advice += "I'm here to provide more specific advice once you have some spending data recorded!";
      return advice;
    }
    
    if (totalSpent <= totalBudget) {
      advice += "🌟 **You're doing well overall!** You're staying within your total budget.\n\n";
    } else {
      advice += "⚠️ **Your total spending exceeds your budget.** Let's look at ways to get back on track.\n\n";
    }
    
    // Top spending categories
    const sortedExpenses = Object.entries(expenses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    if (sortedExpenses.length > 0) {
      advice += "**Your top spending categories:**\n";
      sortedExpenses.forEach(([category, amount]) => {
        const budget = budgets[category] || 0;
        const status = budget > 0 
          ? (amount > budget 
              ? `⚠️ ₹${(amount - budget).toFixed(2)} over budget` 
              : `✅ ₹${(budget - amount).toFixed(2)} under budget`)
          : '(no budget set)';
        
        advice += `- ${category}: ₹${amount.toFixed(2)} ${status}\n`;
      });
      advice += "\n";
    }
    
    advice += "**General recommendations:**\n";
    advice += "1. Review your spending in high-expense categories\n";
    advice += "2. Set specific financial goals for the coming month\n";
    advice += "3. Ensure your budgets are realistic based on your spending patterns\n";
    advice += "4. Consider automating savings or bill payments\n";
    advice += "5. Try using the 50/30/20 rule (50% needs, 30% wants, 20% savings)\n\n";
    
    advice += "Ask me specific questions about your budget or spending for more tailored advice!";
    
    return advice;
  };
  
  const handleClearChat = () => {
    clearChatMessages();
    setShowPresets(false);
  };
  
  // Function to handle preset prompts
  const handlePresetPrompt = (presetMessage: string) => {
    setMessage(presetMessage);
    setTimeout(() => handleSendMessage(), 100);
  };
  
  return (
    <Card className="animate-fade-in col-span-1 lg:col-span-2 flex flex-col h-[500px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Financial Advisor</CardTitle>
          <CardDescription>
            Ask for personalized financial advice
          </CardDescription>
        </div>
        {chatMessages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearChat}>
            Clear Chat
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Financial AI Assistant</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Ask me anything about your finances, budgeting advice, or savings tips!
              </p>
              <div className="grid gap-2 mt-6">
                <Button
                  variant="outline"
                  className="text-left"
                  onClick={() => handlePresetPrompt("How am I doing with my budget this month?")}
                >
                  How am I doing with my budget?
                </Button>
                <Button
                  variant="outline"
                  className="text-left"
                  onClick={() => handlePresetPrompt("What can I do to save more money?")}
                >
                  How can I save more money?
                </Button>
                <Button
                  variant="outline"
                  className="text-left"
                  onClick={() => handlePresetPrompt("Give me financial advice based on my spending")}
                >
                  Analyze my spending patterns
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4 pb-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex w-full",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-max max-w-[80%] rounded-lg px-4 py-2",
                        msg.role === "user"
                          ? "bg-finance-primary text-white"
                          : "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md border bg-background">
                          {msg.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-line">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex w-max max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md border bg-background">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex gap-1">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {hasError && !isLoading && (
                  <div className="flex justify-start">
                    <div className="flex w-max max-w-[80%] rounded-lg px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-md border bg-background">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                          Sorry, I couldn't connect to the AI service. Please try again later.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {showPresets && chatMessages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 mt-4">
            <Button 
              variant="outline"
              size="sm"
              className="text-left"
              onClick={() => handlePresetPrompt("How can I save better next month?")}
            >
              How can I save better next month?
            </Button>
            <Button 
              variant="outline"
              size="sm" 
              className="text-left"
              onClick={() => handlePresetPrompt("Where am I overspending the most?")}
            >
              Where am I overspending the most?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-left"
              onClick={() => handlePresetPrompt("Am I sticking to my travel budget?")}
            >
              Am I sticking to my travel budget?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-left"
              onClick={() => handlePresetPrompt("Suggest areas I can cut back.")}
            >
              Suggest areas I can cut back
            </Button>
          </div>
        )}
        
        <div className="mt-4 flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for financial advice..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
