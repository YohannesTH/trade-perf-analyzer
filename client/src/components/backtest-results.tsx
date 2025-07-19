import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BacktestResult } from "@shared/schema";
import PerformanceChart from "./performance-chart";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity } from "lucide-react";

interface BacktestResultsProps {
  result: BacktestResult;
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getStrategyDisplay = () => {
    if (result.strategy === "sma_crossover") {
      return `SMA Crossover (${result.parameters.shortPeriod}/${result.parameters.longPeriod})`;
    } else if (result.strategy === "rsi_threshold") {
      return `RSI Strategy (${result.parameters.period}, ${result.parameters.oversold}/${result.parameters.overbought})`;
    }
    return result.strategy;
  };

  const profitLoss = result.finalValue - result.initialCapital;
  const isProfit = profitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {result.ticker} - {getStrategyDisplay()}
              </CardTitle>
              <CardDescription>
                {result.startDate} to {result.endDate}
              </CardDescription>
            </div>
            <Badge variant={isProfit ? "default" : "destructive"} className="text-lg px-4 py-2">
              {formatPercentage(result.performance.totalReturn)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">Initial Capital</p>
              <p className="text-lg font-semibold">{formatCurrency(result.initialCapital)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">Final Value</p>
              <p className="text-lg font-semibold">{formatCurrency(result.finalValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">Profit/Loss</p>
              <p className={`text-lg font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profitLoss)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Trades</p>
              <p className="text-lg font-semibold">{result.performance.totalTrades}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(result.performance.totalReturn)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Annualized: {formatPercentage(result.performance.annualizedReturn)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volatility</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.performance.volatility.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Annualized standard deviation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.performance.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk-adjusted return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{result.performance.maxDrawdown.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Peak-to-trough decline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.performance.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.performance.profitableTrades} of {Math.floor(result.performance.totalTrades / 2)} round trips
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Final Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(result.finalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {formatCurrency(result.initialCapital)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>
                Comprehensive analysis of strategy performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Returns</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Return:</span>
                      <span className={isProfit ? "text-green-600" : "text-red-600"}>
                        {formatPercentage(result.performance.totalReturn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annualized Return:</span>
                      <span>{formatPercentage(result.performance.annualizedReturn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit/Loss:</span>
                      <span className={isProfit ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(profitLoss)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Risk Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Volatility:</span>
                      <span>{result.performance.volatility.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sharpe Ratio:</span>
                      <span>{result.performance.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Drawdown:</span>
                      <span className="text-red-600">-{result.performance.maxDrawdown.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Trading Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Trades:</span>
                      <span>{result.performance.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profitable Trades:</span>
                      <span className="text-green-600">{result.performance.profitableTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span>{result.performance.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Portfolio Values</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Initial Capital:</span>
                      <span>{formatCurrency(result.initialCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Final Value:</span>
                      <span>{formatCurrency(result.finalValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Value:</span>
                      <span>{formatCurrency(Math.max(...result.portfolioHistory.map(p => p.portfolioValue)))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>
                All executed trades during the backtest period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.trades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.trades.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{trade.date}</TableCell>
                        <TableCell>
                          <Badge variant={trade.action === "buy" ? "default" : "secondary"}>
                            {trade.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(trade.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {trade.shares.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(trade.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">
                    No trades were executed during this backtest period.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <PerformanceChart result={result} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
