import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import StrategyForm from "@/components/strategy-form";
import BacktestResults from "@/components/backtest-results";
import { BacktestResult } from "@shared/schema";
import { TrendingUp, BarChart3, LogOut, User, Sparkles, Sliders, BookOpen, Clock, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom workspace tabs state
  const [activeTab, setActiveTab] = useState<string>("strategy");
  
  // AI Insights and journal state
  const [journalNote, setJournalNote] = useState<string>("");
  const [journalRating, setJournalRating] = useState<number>(3);
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Portfolio Weights state
  const [stockWeight, setStockWeight] = useState<number>(60);
  const [cryptoWeight, setCryptoWeight] = useState<number>(30);
  const [cashWeight, setCashWeight] = useState<number>(10);

  // Fetch saved journal entries
  const { data: journalEntries } = useQuery<any[]>({
    queryKey: ["/api/journal"],
    enabled: isAuthenticated,
  });

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
    // Auto switch to results tab on run complete
    setActiveTab("results");
  };

  const handleBacktestStart = () => {
    setIsLoading(true);
    setBacktestResult(null);
    setAiInsight(null);
  };

  const handleBacktestEnd = () => {
    setIsLoading(false);
  };

  // Mutation to request AI insights
  const aiMutation = useMutation({
    mutationFn: async () => {
      if (!backtestResult) throw new Error("No backtest result available to analyze");
      const res = await apiRequest("POST", "/api/ai-insight", {
        ticker: backtestResult.ticker,
        strategy: backtestResult.strategy,
        performance: backtestResult.performance,
        finalValue: backtestResult.finalValue,
        initialCapital: backtestResult.initialCapital,
        journalNote: journalNote
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAiInsight(data);
      toast({
        title: "AI Analysis Complete",
        description: "Qualitative insights generated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "AI Copilot Error",
        description: err.message || "Failed to contact AI model",
        variant: "destructive"
      });
    }
  });

  // Save Journal entry mutation
  const saveJournalMutation = useMutation({
    mutationFn: async () => {
      if (!backtestResult) throw new Error("Run backtest to tag journal notes");
      const res = await apiRequest("POST", "/api/journal", {
        backtestId: (backtestResult as any).id || null,
        note: journalNote,
        rating: journalRating,
        aiSummary: aiInsight ? aiInsight.summary : null
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal Saved",
        description: "Your trading thesis and notes have been logged."
      });
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Validating Secure Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary/30">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-semibold tracking-wide text-slate-200">
              AlphaLab Suite <span className="text-xxs text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded ml-2">PRO</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="h-3 w-3 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {user?.firstName || user?.email || 'Quant Developer'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="text-xs bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            >
              <LogOut className="h-3 w-3 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Terminal Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-200">
            Quantitative Research Terminal
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-3xl">
            Analyze multi-asset historical patterns, execute parameter sweeps, configure custom triggers, and apply probabilistic simulations.
          </p>
        </div>

        {/* Core Workspace Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-900 border border-slate-800 p-1 mb-6">
            <TabsTrigger value="strategy">1. Strategy Setup</TabsTrigger>
            <TabsTrigger value="results" disabled={!backtestResult && !isLoading}>2. Analytics & Visuals</TabsTrigger>
            <TabsTrigger value="copilot" disabled={!backtestResult}>3. AI Copilot Journal</TabsTrigger>
            <TabsTrigger value="optimizer">4. Portfolio Weights</TabsTrigger>
          </TabsList>

          {/* Strategy Setup Tab */}
          <TabsContent value="strategy" className="mt-0">
            <Card className="bg-slate-950 border-slate-900">
              <CardHeader className="pb-4 border-b border-slate-900">
                <CardTitle className="text-md font-semibold text-slate-300">Design Algorithmic Strategy</CardTitle>
                <CardDescription className="text-xs">Adjust asset selections, execution thresholds, leverage constraints, and parameters.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <StrategyForm
                  onBacktestComplete={handleBacktestComplete}
                  onBacktestStart={handleBacktestStart}
                  onBacktestEnd={handleBacktestEnd}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Results Tab */}
          <TabsContent value="results" className="mt-0">
            {isLoading ? (
              <Card className="bg-slate-950 border-slate-900">
                <CardContent className="py-24 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <span className="text-slate-400 text-sm">Processing asset bars and optimizing weights...</span>
                </CardContent>
              </Card>
            ) : backtestResult ? (
              <BacktestResults result={backtestResult} />
            ) : (
              <Card className="bg-slate-950 border-slate-900 text-center py-20">
                <CardContent>
                  <BarChart3 className="h-10 w-10 mx-auto text-slate-650 mb-4" />
                  <p className="text-slate-400 text-sm">Run a backtest in the Setup workspace to view analytics charts.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Copilot & Journal Tab */}
          <TabsContent value="copilot" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Journal Notes Input */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-950 border-slate-900 text-slate-100">
                  <CardHeader className="border-b border-slate-900 pb-4">
                    <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Trading Thesis Journal
                    </CardTitle>
                    <CardDescription>Log strategy observations to identify pattern errors.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="note">Thesis or Execution Notes</Label>
                      <Textarea
                        id="note"
                        rows={5}
                        placeholder="Detail macroeconomic tailwinds, transaction cost deviations, or manual overrides here..."
                        className="bg-slate-900 border-slate-800 focus-visible:ring-primary text-slate-200"
                        value={journalNote}
                        onChange={(e) => setJournalNote(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Strategy Confidence Rating (1-5)</Label>
                        <div className="flex gap-1.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={journalRating === val ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0 rounded",
                                journalRating === val ? "bg-primary text-slate-100" : "bg-slate-900 border-slate-800 text-slate-400"
                              )}
                              onClick={() => setJournalRating(val)}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                          onClick={() => saveJournalMutation.mutate()}
                          disabled={saveJournalMutation.isPending}
                        >
                          Save Journal Entry
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/95 text-slate-100 flex items-center gap-2"
                          onClick={() => aiMutation.mutate()}
                          disabled={aiMutation.isPending}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Ask AI Copilot
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Response Display */}
                {aiInsight && (
                  <Card className="bg-slate-950 border-slate-900 text-slate-100">
                    <CardHeader className="bg-slate-900/40 border-b border-slate-900">
                      <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        AI Copilot Quantitative Audit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Executive Summary</h4>
                        <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-3 rounded border border-slate-900">{aiInsight.summary}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Thesis Alignment</h4>
                        <p className="text-sm text-slate-200 leading-relaxed">{aiInsight.journalAnalysis}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide mb-2">Tail Risk Warnings</h4>
                          <ul className="space-y-2">
                            {aiInsight.riskWarnings.map((w: string, idx: number) => (
                              <li key={idx} className="text-xs text-rose-250 flex items-start gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500 mt-0.5" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">Optimization Suggestions</h4>
                          <ul className="space-y-2">
                            {aiInsight.parameterOptimization.map((opt: string, idx: number) => (
                              <li key={idx} className="text-xs text-indigo-250 flex items-start gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-400 mt-0.5" />
                                {opt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Saved Journal Logs */}
              <div className="space-y-4">
                <Card className="bg-slate-950 border-slate-900 text-slate-100">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-450" />
                      Journal History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                    {journalEntries && journalEntries.length > 0 ? (
                      journalEntries.map((entry) => (
                        <div key={entry.id} className="p-3 bg-slate-900/60 rounded border border-slate-850 space-y-2">
                          <div className="flex items-center justify-between text-xxs text-slate-450">
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                            <span className="bg-indigo-950/40 text-indigo-400 px-1 rounded">Rating: {entry.rating}/5</span>
                          </div>
                          <p className="text-xs text-slate-350 line-clamp-3 leading-relaxed">{entry.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">No historical notes recorded.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Weights Tab */}
          <TabsContent value="optimizer" className="mt-0">
            <Card className="bg-slate-950 border-slate-900 text-slate-100">
              <CardHeader className="border-b border-slate-900 pb-4">
                <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  Multi-Asset Allocation & Rebalancing
                </CardTitle>
                <CardDescription>Configure portfolio weights to backtest basket allocation rules (e.g. 60/40 vs Risk Parity).</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-6 max-w-xl">
                  {/* Slider 1: Stocks */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Equities (e.g., AAPL, SPY)</Label>
                      <span className="font-semibold text-slate-300">{stockWeight}%</span>
                    </div>
                    <Slider
                      value={[stockWeight]}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-primary"
                      onValueChange={([val]) => {
                        setStockWeight(val);
                        // Balance remaining
                        const rem = 100 - val;
                        setCryptoWeight(Math.round(rem * 0.7));
                        setCashWeight(Math.round(rem * 0.3));
                      }}
                    />
                  </div>

                  {/* Slider 2: Crypto */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Crypto (e.g., BTC, ETH)</Label>
                      <span className="font-semibold text-slate-300">{cryptoWeight}%</span>
                    </div>
                    <Slider
                      value={[cryptoWeight]}
                      max={100 - stockWeight}
                      step={5}
                      className="[&_[role=slider]]:bg-primary"
                      onValueChange={([val]) => {
                        setCryptoWeight(val);
                        setCashWeight(100 - stockWeight - val);
                      }}
                    />
                  </div>

                  {/* Slider 3: Cash */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Cash Reserve</Label>
                      <span className="font-semibold text-slate-300">{cashWeight}%</span>
                    </div>
                    <Slider
                      value={[cashWeight]}
                      disabled
                      max={100}
                      className="opacity-50"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-900/60 p-4 rounded border border-slate-850 mt-4">
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Rebalancing frequency defaults to <span className="font-semibold text-indigo-400">Quarterly</span>, which matches historical risk-parity strategies to minimize turnover slippage.
                    </p>
                  </div>

                  <Button 
                    type="button" 
                    className="w-full bg-primary hover:bg-primary/95 text-slate-100 font-semibold"
                    onClick={() => {
                      toast({
                        title: "Portfolio Saved",
                        description: `Configured basket weights: Equities ${stockWeight}%, Crypto ${cryptoWeight}%, Cash ${cashWeight}%`
                      });
                    }}
                  >
                    Deploy Portfolio Allocation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
