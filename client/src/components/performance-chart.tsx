import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BacktestResult } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, ShieldAlert, Award, Hash, Percent } from "lucide-react";

interface PerformanceChartProps {
  result: BacktestResult;
}

export default function PerformanceChart({ result }: PerformanceChartProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("equity");

  // Combine portfolio and benchmark data
  const chartData = result.portfolioHistory.map((portfolio, index) => {
    const benchmark = result.benchmarkHistory[index];
    const initial = result.initialCapital;
    
    // Drawdown calculation
    const currentVal = portfolio.portfolioValue;
    const historyUpToNow = result.portfolioHistory.slice(0, index + 1).map(p => p.portfolioValue);
    const peak = Math.max(...historyUpToNow, initial);
    const dd = peak > 0 ? ((currentVal - peak) / peak) * 100 : 0;

    return {
      date: portfolio.date,
      strategy: currentVal,
      benchmark: benchmark?.value || 0,
      cash: portfolio.cash,
      stockValue: portfolio.stockValue,
      drawdown: dd,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name === "drawdown") return [`${value.toFixed(2)}%`, "Drawdown"];
    const formattedValue = formatCurrency(value);
    const displayName = name === "strategy" ? "Strategy" : 
                       name === "benchmark" ? "Buy & Hold" :
                       name === "cash" ? "Cash" : "Stock Value";
    return [formattedValue, displayName];
  };

  // 1. Process Monthly Returns Heatmap Grid
  const getMonthlyReturns = () => {
    const monthlyData: Record<number, Record<number, number>> = {}; // year -> month (0-11) -> return
    
    // Calculate returns based on historical snapshot changes
    if (result.portfolioHistory.length > 1) {
      let prevValue = result.initialCapital;
      let prevMonth = -1;
      let monthStartVal = result.initialCapital;
      
      result.portfolioHistory.forEach((day, index) => {
        const date = new Date(day.date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0 - 11
        
        if (prevMonth !== month) {
          if (prevMonth !== -1) {
            // Save return for the completed month
            const monthEndVal = result.portfolioHistory[index - 1].portfolioValue;
            const ret = ((monthEndVal - monthStartVal) / monthStartVal) * 100;
            const prevYear = new Date(result.portfolioHistory[index - 1].date).getFullYear();
            
            if (!monthlyData[prevYear]) monthlyData[prevYear] = {};
            monthlyData[prevYear][prevMonth] = ret;
          }
          monthStartVal = day.portfolioValue;
          prevMonth = month;
        }
        
        // Handle final item
        if (index === result.portfolioHistory.length - 1) {
          const ret = ((day.portfolioValue - monthStartVal) / monthStartVal) * 100;
          if (!monthlyData[year]) monthlyData[year] = {};
          monthlyData[year][month] = ret;
        }
      });
    }
    return monthlyData;
  };

  const monthlyReturns = getMonthlyReturns();
  const years = Object.keys(monthlyReturns).map(Number).sort((a, b) => b - a);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // 2. Monte Carlo Chart Formatting
  const mcData = result.monteCarloSimulations || [];
  const mcChartData = Array.from({ length: 252 }, (_, dayIdx) => {
    const dataPoint: Record<string, any> = { day: `Day ${dayIdx}` };
    mcData.slice(0, 15).forEach((path, pathIdx) => {
      dataPoint[`path_${pathIdx}`] = path[dayIdx] || path[path.length - 1] || result.finalValue;
    });
    return dataPoint;
  });

  // 3. Correlation calculation
  const getCorrelation = () => {
    if (chartData.length < 5) return 1.0;
    const stratReturns = chartData.map((d, i) => i === 0 ? 0 : (d.strategy - chartData[i-1].strategy)/chartData[i-1].strategy);
    const benchReturns = chartData.map((d, i) => i === 0 ? 0 : (d.benchmark - chartData[i-1].benchmark)/chartData[i-1].benchmark);
    
    const meanStrat = stratReturns.reduce((sum, r) => sum + r, 0) / stratReturns.length;
    const meanBench = benchReturns.reduce((sum, r) => sum + r, 0) / benchReturns.length;
    
    let num = 0;
    let denStrat = 0;
    let denBench = 0;
    for (let i = 0; i < stratReturns.length; i++) {
      const diffStrat = stratReturns[i] - meanStrat;
      const diffBench = benchReturns[i] - meanBench;
      num += diffStrat * diffBench;
      denStrat += diffStrat * diffStrat;
      denBench += diffBench * diffBench;
    }
    const den = Math.sqrt(denStrat * denBench);
    return den > 0 ? num / den : 1.0;
  };

  const correlation = getCorrelation();

  const getHeatmapColor = (val: number | undefined) => {
    if (val === undefined) return "bg-slate-900/40 text-slate-600";
    if (val > 5) return "bg-emerald-950/80 text-emerald-300 border border-emerald-900";
    if (val > 2) return "bg-emerald-900/60 text-emerald-200 border border-emerald-950";
    if (val > 0) return "bg-emerald-950/30 text-emerald-100/90 border border-emerald-950";
    if (val < -5) return "bg-rose-950/80 text-rose-300 border border-rose-900";
    if (val < -2) return "bg-rose-900/60 text-rose-200 border border-rose-950";
    if (val < 0) return "bg-rose-950/30 text-rose-100/90 border border-rose-950";
    return "bg-slate-800 text-slate-300 border border-slate-750";
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs configuration */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="equity" className="data-[state=active]:bg-primary">Equity Curve</TabsTrigger>
            <TabsTrigger value="drawdown" className="data-[state=active]:bg-primary">Drawdown</TabsTrigger>
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-primary">Monthly Heatmap</TabsTrigger>
            <TabsTrigger value="montecarlo" className="data-[state=active]:bg-primary">Monte Carlo Forecast</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-primary">Risk Indicators</TabsTrigger>
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-slate-950 border border-slate-900 px-3 py-1.5 rounded">
            <span className="font-semibold text-slate-400">Benchmark Correlation:</span> 
            <span className={correlation >= 0.7 ? "text-blue-400" : "text-amber-400"}>
              {correlation.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Equity Curve Tab */}
        <TabsContent value="equity" className="pt-4 space-y-4">
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Capital Performance vs Buy & Hold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-900" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#f8fafc"
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <ReferenceLine 
                      y={result.initialCapital} 
                      stroke="#475569" 
                      strokeDasharray="4 4"
                    />
                    <Line
                      type="monotone"
                      dataKey="strategy"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                      name="strategy"
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmark"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      name="benchmark"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drawdown Area Tab */}
        <TabsContent value="drawdown" className="pt-4">
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                Strategy Drawdown Exposure (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-900" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#f8fafc"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#f43f5e"
                      fill="rgba(244, 63, 94, 0.15)"
                      strokeWidth={1.5}
                      name="drawdown"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Return Heatmap Tab */}
        <TabsContent value="heatmap" className="pt-4">
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-slate-300">Monthly Returns Heatmap (%)</CardTitle>
              <CardDescription>Systematic distribution of strategy returns mapped across cycles</CardDescription>
            </CardHeader>
            <CardContent>
              {years.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-4 text-left font-medium">Year</th>
                        {months.map((m) => (
                          <th key={m} className="py-3 px-2 text-center font-medium w-16">{m}</th>
                        ))}
                        <th className="py-3 px-4 text-center font-medium w-20">YTD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {years.map((year) => {
                        const yearData = monthlyReturns[year] || {};
                        let ytd = 1.0;
                        months.forEach((_, idx) => {
                          if (yearData[idx] !== undefined) {
                            ytd *= (1 + yearData[idx] / 100);
                          }
                        });
                        const ytdPct = (ytd - 1.0) * 100;

                        return (
                          <tr key={year} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                            <td className="py-3 px-4 font-semibold text-slate-300">{year}</td>
                            {months.map((_, idx) => {
                              const val = yearData[idx];
                              return (
                                <td key={idx} className="py-2 px-1 text-center">
                                  <div className={`py-1.5 px-1 rounded text-xs font-semibold ${getHeatmapColor(val)}`}>
                                    {val !== undefined ? `${val >= 0 ? "+" : ""}${val.toFixed(1)}%` : "-"}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="py-2 px-4 text-center">
                              <div className={`py-1.5 px-1 rounded text-xs font-bold ${getHeatmapColor(ytdPct)}`}>
                                {ytdPct >= 0 ? "+" : ""}{ytdPct.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Insufficient data points to map monthly return cycles.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monte Carlo Simulated Paths Tab */}
        <TabsContent value="montecarlo" className="pt-4">
          <Card className="bg-slate-950 border-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-md font-semibold text-slate-300">Monte Carlo Forecast Paths</CardTitle>
              <CardDescription>50 simulated equity paths modeled using geometric brownian distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {mcData.length > 0 ? (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mcChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-900" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <YAxis 
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      />
                      {Array.from({ length: 15 }).map((_, idx) => (
                        <Line
                          key={idx}
                          type="monotone"
                          dataKey={`path_${idx}`}
                          stroke={idx === 0 ? "#10b981" : "rgba(100, 116, 139, 0.15)"}
                          strokeWidth={idx === 0 ? 2 : 1}
                          dot={false}
                          name={`Sim ${idx}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Run a complete backtest with daily data to view simulation forecast runs.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Indicators Tab */}
        <TabsContent value="risk" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-950 border-slate-900 text-slate-100">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-400">Sortino Ratio</CardTitle>
                <Award className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">
                  {result.performance.sortinoRatio?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xxs text-muted-foreground mt-1">Downside risk-adjusted return ratio</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-900 text-slate-100">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-400">Calmar Ratio</CardTitle>
                <Activity className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">
                  {result.performance.calmarRatio?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xxs text-muted-foreground mt-1">Annualized return divided by max drawdown</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-900 text-slate-100">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-400">Profit Factor</CardTitle>
                <Percent className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-slate-100">
                  {result.performance.profitFactor?.toFixed(2) || "1.00"}
                </div>
                <p className="text-xxs text-muted-foreground mt-1">Gross profit divided by gross loss</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-900 text-slate-100">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-semibold text-slate-400">Value at Risk (95% VaR)</CardTitle>
                <ShieldAlert className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-rose-500">
                  -{result.performance.var95?.toFixed(2) || "0.00"}%
                </div>
                <p className="text-xxs text-muted-foreground mt-1">Maximum expected daily loss with 95% confidence</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-950 border-slate-900 text-slate-100 mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-300">Advanced Probability Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Expectancy</span>
                  <span className={`text-base font-bold ${result.performance.expectancy && result.performance.expectancy >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {result.performance.expectancy !== undefined ? formatCurrency(result.performance.expectancy) : "$0.00"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Skewness (Daily returns)</span>
                  <span className="text-base font-bold text-slate-200">
                    {result.performance.skewness?.toFixed(3) || "0.000"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Kurtosis</span>
                  <span className="text-base font-bold text-slate-200">
                    {result.performance.kurtosis?.toFixed(3) || "0.000"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">95% Conditional VaR</span>
                  <span className="text-base font-bold text-rose-500">
                    -{result.performance.cvar95?.toFixed(2) || "0.00"}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
