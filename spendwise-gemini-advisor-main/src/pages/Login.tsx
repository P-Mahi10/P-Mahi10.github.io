
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const { login, register, isLoading } = useData();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if ((!isLogin && !name) || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (isLogin) {
      const success = await login(email, password);
      if (success) {
        toast.success("Logged in successfully!");
      } else {
        toast.error("Invalid login credentials");
      }
    } else {
      const success = await register(name, email, password);
      if (success) {
        toast.success("Account created and logged in successfully!");
      } else {
        toast.error("Email already in use. Please try another email or login instead.");
      }
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-teal-50 p-4 dark:from-blue-950 dark:to-teal-950">
      <div className="max-w-md w-full animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-finance-primary to-finance-accent text-transparent bg-clip-text">
            SmartSpend
          </h1>
          <p className="text-muted-foreground">
            Your AI-Powered Financial Assistant
          </p>
        </div>
        
        <Tabs value={isLogin ? "login" : "register"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger 
              value="login" 
              onClick={() => setIsLogin(true)}
              className="data-[state=active]:bg-finance-primary data-[state=active]:text-white"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              onClick={() => setIsLogin(false)}
              className="data-[state=active]:bg-finance-primary data-[state=active]:text-white"
            >
              Register
            </TabsTrigger>
          </TabsList>
          
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Enter your credentials to access your account" 
                  : "Fill in your details to create a new account"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <Button variant="link" className="p-0 h-auto text-xs">
                        Forgot password?
                      </Button>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                {/* Demo account information */}
                {isLogin && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-1">Demo accounts:</p>
                    <p>
                      <span className="font-medium">Email:</span> john@example.com
                    </p>
                    <p>
                      <span className="font-medium">Password:</span> any password will work
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-finance-accent hover:bg-finance-accent/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : (
                    <>
                      {isLogin ? "Login" : "Create account"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </Tabs>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          By using this app, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
