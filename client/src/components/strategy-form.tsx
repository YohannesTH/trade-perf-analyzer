import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, Settings, Sliders, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BacktestResult } from "@shared/schema";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10, "Ticker too long"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  strategy: z.string(),
  parameters: z.record(z.union([z.string(), z.number()])),
  initialCapital: z.number().min(1000, "Minimum capital is $1000"),
  slippage: z.number().min(0).max(0.1),
  commission: z.number().min(0).max(0.1),
  marginRatio: z.number().min(1.0).max(10.0),
});

type FormData = z.infer<typeof formSchema>;

interface StrategyFormProps {
  onBacktestComplete: (result: BacktestResult) => void;
  onBacktestStart: () => void;
  onBacktestEnd: () => void;
  isLoading: boolean;
}

export default function StrategyForm({
  onBacktestComplete,
  onBacktestStart,
  onBacktestEnd,
  isLoading,
}: StrategyFormProps) {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState<string>("sma_crossover");

  // Rule conditions state for Custom Strategy builder UI
  const [conditions, setConditions] = useState<Array<{ id: number; left: string; op: string; right: number }>>([
    { id: 1, left: "RSI (14)", op: "<", right: 35 },
    { id: 2, left: "Close Price", op: ">", right: 50 }, // relative to SMA
  ]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "AAPL",
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2024, 0, 1),
      strategy: "sma_crossover",
      parameters: {
        shortPeriod: 20,
        longPeriod: 50,
      },
      initialCapital: 10000,
      slippage: 0.0005,
      commission: 0.001,
      marginRatio: 1.0,
    },
  });

  const backtestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const requestData = {
        ticker: data.ticker,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
        strategy: data.strategy,
        parameters: data.parameters,
        initialCapital: data.initialCapital,
        slippage: data.slippage,
        commission: data.commission,
        marginRatio: data.marginRatio,
      };

      const response = await apiRequest("POST", "/api/backtest", requestData);
      return response.json();
    },
    onSuccess: (result: BacktestResult) => {
      onBacktestComplete(result);
      onBacktestEnd();
      toast({
        title: "Backtest Complete",
        description: `Successfully backtested ${result.ticker} strategy`,
      });
    },
    onError: (error: any) => {
      onBacktestEnd();
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Backtest Failed",
        description: error.message || "An error occurred during backtesting",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    onBacktestStart();
    backtestMutation.mutate(data);
  };

  const watchedStrategy = form.watch("strategy");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Selection */}
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Asset & Timeline
              </CardTitle>
              <CardDescription>Choose target contract and test window</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker Symbol</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AAPL"
                        className="bg-slate-900 border-slate-800 focus-visible:ring-primary"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription className="text-xxs">Supports Stocks, Crypto (e.g. BTC-USD), Forex (e.g. EURUSD=X)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-slate-900 border-slate-800 text-slate-100",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "MM/dd/yyyy") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-slate-900 border-slate-800 text-slate-100",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "MM/dd/yyyy") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="initialCapital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Capital (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1000"
                        step="1000"
                        className="bg-slate-900 border-slate-800 focus-visible:ring-primary"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Slippage, Commission & Leverage Settings */}
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-500" />
                Execution Parameters
              </CardTitle>
              <CardDescription>Slippage, commissions and capital leverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slippage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slippage Rate (e.g. 0.0005 = 0.05%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        className="bg-slate-900 border-slate-800 focus-visible:ring-primary"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate (e.g. 0.001 = 0.1%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0005"
                        min="0"
                        className="bg-slate-900 border-slate-800 focus-visible:ring-primary"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marginRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leverage (Margin Ratio)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                          <SelectValue placeholder="Select Leverage Factor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-950 border-slate-900 text-slate-100">
                        <SelectItem value="1.0">1.0x (No Leverage)</SelectItem>
                        <SelectItem value="2.0">2.0x Margin</SelectItem>
                        <SelectItem value="3.0">3.0x Margin</SelectItem>
                        <SelectItem value="5.0">5.0x Margin</SelectItem>
                        <SelectItem value="10.0">10.0x Margin</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value > 1.0 && (
                      <div className="flex items-center gap-1.5 text-xxs text-amber-400 mt-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Leveraged strategies carry higher liquidation risk.
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Strategy Variables configuration */}
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                Strategy Parameters
              </CardTitle>
              <CardDescription>Select strategy logic and adjust metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicator Template</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setStrategy(value);
                        
                        // Default parameters loadouts
                        if (value === "sma_crossover") {
                          form.setValue("parameters", { shortPeriod: 20, longPeriod: 50 });
                        } else if (value === "rsi_threshold") {
                          form.setValue("parameters", { period: 14, overbought: 70, oversold: 30 });
                        } else if (value === "ema_crossover") {
                          form.setValue("parameters", { shortPeriod: 12, longPeriod: 26 });
                        } else if (value === "macd_crossover") {
                          form.setValue("parameters", { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
                        } else if (value === "bollinger_reversion") {
                          form.setValue("parameters", { period: 20, numStd: 2.0 });
                        } else if (value === "custom_composite") {
                          form.setValue("parameters", { enabled: 1 });
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-100">
                          <SelectValue placeholder="Select indicator template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-950 border-slate-900 text-slate-100">
                        <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
                        <SelectItem value="ema_crossover">EMA Crossover</SelectItem>
                        <SelectItem value="rsi_threshold">RSI Thresholds</SelectItem>
                        <SelectItem value="macd_crossover">MACD Crossover</SelectItem>
                        <SelectItem value="bollinger_reversion">Bollinger Bands</SelectItem>
                        <SelectItem value="custom_composite">Strategy Builder (No-Code)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic Parameter Settings */}
              {watchedStrategy === "sma_crossover" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Short SMA</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.shortPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, shortPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Long SMA</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.longPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, longPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                </div>
              )}

              {watchedStrategy === "ema_crossover" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Short EMA</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.shortPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, shortPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Long EMA</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.longPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, longPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                </div>
              )}

              {watchedStrategy === "rsi_threshold" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Period</Label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        value={form.getValues("parameters.period") || ""}
                        onChange={(e) => {
                          const params = form.getValues("parameters");
                          form.setValue("parameters", { ...params, period: Number(e.target.value) });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Oversold</Label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        value={form.getValues("parameters.oversold") || ""}
                        onChange={(e) => {
                          const params = form.getValues("parameters");
                          form.setValue("parameters", { ...params, oversold: Number(e.target.value) });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Overbought</Label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-slate-100"
                        value={form.getValues("parameters.overbought") || ""}
                        onChange={(e) => {
                          const params = form.getValues("parameters");
                          form.setValue("parameters", { ...params, overbought: Number(e.target.value) });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {watchedStrategy === "macd_crossover" && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fast Period</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.fastPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, fastPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Slow Period</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.slowPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, slowPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Signal</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.signalPeriod") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, signalPeriod: Number(e.target.value) });
                      }}
                    />
                  </div>
                </div>
              )}

              {watchedStrategy === "bollinger_reversion" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Period</Label>
                    <Input
                      type="number"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.period") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, period: Number(e.target.value) });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Std Dev</Label>
                    <Input
                      type="number"
                      step="0.1"
                      className="bg-slate-900 border-slate-800 text-slate-100"
                      value={form.getValues("parameters.numStd") || ""}
                      onChange={(e) => {
                        const params = form.getValues("parameters");
                        form.setValue("parameters", { ...params, numStd: Number(e.target.value) });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* No-Code Strategy Builder visual logic editor */}
              {watchedStrategy === "custom_composite" && (
                <div className="space-y-3 pt-1 border-t border-slate-900">
                  <span className="text-xxs font-bold text-slate-400 block tracking-wider uppercase">Composite Buy Rules</span>
                  
                  <div className="space-y-2">
                    {conditions.map((cond) => (
                      <div key={cond.id} className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded border border-slate-850">
                        <span className="text-xs text-indigo-400 font-semibold">{cond.left}</span>
                        <span className="text-xs text-slate-400">{cond.op}</span>
                        <span className="text-xs text-slate-100 font-mono font-semibold">{cond.right}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-indigo-950/20 text-indigo-300 border-indigo-900/40 hover:bg-indigo-950/40"
                    onClick={() => {
                      setConditions([...conditions, { id: Date.now(), left: "MACD Line", op: "crosses above", right: 0 }]);
                      toast({ title: "Rule added", description: "Configured custom buy signal conditional block." });
                    }}
                  >
                    + Add Conditional Rule Node
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || backtestMutation.isPending}
            className="w-full max-w-md bg-primary hover:bg-primary/95 text-slate-100 font-semibold"
          >
            {isLoading || backtestMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Evaluating Market Context...
              </>
            ) : (
              "Deploy & Run Backtest"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
