import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "recharts";

interface PerformanceChartProps {
  result: BacktestResult;
}

export default function PerformanceChart({ result }: PerformanceChartProps) {
  // Combine portfolio and benchmark data
  const chartData = result.portfolioHistory.map((portfolio, index) => {
    const benchmark = result.benchmarkHistory[index];
    return {
      date: portfolio.date,
      strategy: portfolio.portfolioValue,
      benchmark: benchmark?.value || 0,
      cash: portfolio.cash,
      stockValue: portfolio.stockValue,
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
    const formattedValue = formatCurrency(value);
    const displayName = name === "strategy" ? "Strategy" : 
                       name === "benchmark" ? "Buy & Hold" :
                       name === "cash" ? "Cash" : "Stock Value";
    return [formattedValue, displayName];
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>
            Strategy performance vs buy-and-hold benchmark
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <ReferenceLine 
                  y={result.initialCapital} 
                  stroke="var(--muted-foreground)" 
                  strokeDasharray="5 5"
                  label="Initial Capital"
                />
                <Line
                  type="monotone"
                  dataKey="strategy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="strategy"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="benchmark"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Composition Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Composition</CardTitle>
          <CardDescription>
            Cash vs stock holdings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  name="cash"
                />
                <Line
                  type="monotone"
                  dataKey="stockValue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="stockValue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Strategy Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {result.performance.totalReturn >= 0 ? "+" : ""}{result.performance.totalReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(result.finalValue - result.initialCapital)} profit/loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Benchmark Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const benchmarkReturn = result.benchmarkHistory.length > 0 
                  ? ((result.benchmarkHistory[result.benchmarkHistory.length - 1].value - result.initialCapital) / result.initialCapital) * 100
                  : 0;
                return `${benchmarkReturn >= 0 ? "+" : ""}${benchmarkReturn.toFixed(2)}%`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Buy and hold performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Excess Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const benchmarkReturn = result.benchmarkHistory.length > 0 
                  ? ((result.benchmarkHistory[result.benchmarkHistory.length - 1].value - result.initialCapital) / result.initialCapital) * 100
                  : 0;
                const excessReturn = result.performance.totalReturn - benchmarkReturn;
                return `${excessReturn >= 0 ? "+" : ""}${excessReturn.toFixed(2)}%`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Outperformance vs benchmark
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
