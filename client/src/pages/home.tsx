import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyForm from "@/components/strategy-form";
import BacktestResults from "@/components/backtest-results";
import { BacktestResult } from "@shared/schema";
import { TrendingUp, BarChart3, DollarSign, Activity, LogOut, User } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const handleBacktestComplete = (result: BacktestResult) => {
    setBacktestResult(result);
  };

  const handleBacktestStart = () => {
    setIsLoading(true);
    setBacktestResult(null);
  };

  const handleBacktestEnd = () => {
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header with user info and logout */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Welcome, {user?.firstName || user?.email || 'User'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Trading Strategy Backtester
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Test your trading strategies on historical market data. Analyze performance metrics, 
            visualize results, and optimize your approach before risking real capital.
          </p>
        </div>

        {/* Feature Cards */}
        {!backtestResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <CardTitle className="text-sm">Multiple Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  SMA Crossover, RSI Thresholds, and more
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <BarChart3 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <CardTitle className="text-sm">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Returns, Sharpe ratio, drawdowns
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <DollarSign className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <CardTitle className="text-sm">Real Market Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Yahoo Finance historical data
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <Activity className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <CardTitle className="text-sm">Interactive Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Visualize strategy vs benchmark
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="strategy">Strategy Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={!backtestResult && !isLoading}>
              Backtest Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configure Your Trading Strategy</CardTitle>
                <CardDescription>
                  Select a strategy, set parameters, and run a backtest on historical data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StrategyForm
                  onBacktestComplete={handleBacktestComplete}
                  onBacktestStart={handleBacktestStart}
                  onBacktestEnd={handleBacktestEnd}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">
                      Running backtest...
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : backtestResult ? (
              <BacktestResults result={backtestResult} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      Run a backtest to see results here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
