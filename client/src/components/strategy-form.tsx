import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, Settings } from "lucide-react";

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
import { BacktestResult, backtestRequestSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

const formSchema = backtestRequestSchema.extend({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
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
  const [strategy, setStrategy] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: "AAPL",
      startDate: new Date(2023, 0, 1), // Jan 1, 2023
      endDate: new Date(2024, 0, 1), // Jan 1, 2024
      strategy: "sma_crossover",
      parameters: {
        shortPeriod: 20,
        longPeriod: 50,
      },
      initialCapital: 10000,
    },
  });

  const backtestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const requestData = {
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Stock Selection
              </CardTitle>
              <CardDescription>Choose the stock and time period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Ticker</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AAPL"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>Enter a valid stock ticker symbol</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                    <FormLabel>Initial Capital ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1000"
                        step="1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Minimum $1,000</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Strategy Configuration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Strategy Configuration
              </CardTitle>
              <CardDescription>Select and configure your trading strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setStrategy(value);
                        
                        // Update default parameters based on strategy
                        if (value === "sma_crossover") {
                          form.setValue("parameters", {
                            shortPeriod: 20,
                            longPeriod: 50,
                          });
                        } else if (value === "rsi_threshold") {
                          form.setValue("parameters", {
                            period: 14,
                            overbought: 70,
                            oversold: 30,
                          });
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a strategy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
                        <SelectItem value="rsi_threshold">RSI Thresholds</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchedStrategy === "sma_crossover" 
                        ? "Buy when short MA crosses above long MA"
                        : "Buy oversold, sell overbought based on RSI"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SMA Parameters */}
              {watchedStrategy === "sma_crossover" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parameters.shortPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Period</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              {...field}
                              onChange={(e) => {
                                const params = form.getValues("parameters");
                                form.setValue("parameters", {
                                  ...params,
                                  shortPeriod: Number(e.target.value),
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parameters.longPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Long Period</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="200"
                              {...field}
                              onChange={(e) => {
                                const params = form.getValues("parameters");
                                form.setValue("parameters", {
                                  ...params,
                                  longPeriod: Number(e.target.value),
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* RSI Parameters */}
              {watchedStrategy === "rsi_threshold" && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="parameters.period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RSI Period</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="2"
                            max="50"
                            {...field}
                            onChange={(e) => {
                              const params = form.getValues("parameters");
                              form.setValue("parameters", {
                                ...params,
                                period: Number(e.target.value),
                              });
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parameters.oversold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Oversold Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              {...field}
                              onChange={(e) => {
                                const params = form.getValues("parameters");
                                form.setValue("parameters", {
                                  ...params,
                                  oversold: Number(e.target.value),
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parameters.overbought"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overbought Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="50"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                const params = form.getValues("parameters");
                                form.setValue("parameters", {
                                  ...params,
                                  overbought: Number(e.target.value),
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
            className="w-full max-w-md"
          >
            {isLoading || backtestMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Backtest...
              </>
            ) : (
              "Run Backtest"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
