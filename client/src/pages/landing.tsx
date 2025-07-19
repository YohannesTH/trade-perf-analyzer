import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, DollarSign, Activity, Shield, Database } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Trading Strategy Backtester
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            Test your trading strategies on historical market data before risking real capital. 
            Analyze performance metrics, visualize results, and optimize your trading approach with 
            our comprehensive backtesting platform.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="text-lg px-8 py-4"
          >
            Get Started - Sign In
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="text-center border-2 hover:border-blue-200 transition-colors">
            <CardHeader className="pb-4">
              <TrendingUp className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle className="text-xl">Multiple Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Test SMA crossover, RSI thresholds, and more trading strategies 
                with customizable parameters for optimal results.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-green-200 transition-colors">
            <CardHeader className="pb-4">
              <BarChart3 className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-xl">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Comprehensive metrics including returns, Sharpe ratio, maximum drawdown, 
                win rates, and detailed trade analysis.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-yellow-200 transition-colors">
            <CardHeader className="pb-4">
              <DollarSign className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
              <CardTitle className="text-xl">Real Market Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Historical OHLCV data from Yahoo Finance ensures your backtests 
                reflect actual market conditions and price movements.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-purple-200 transition-colors">
            <CardHeader className="pb-4">
              <Activity className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle className="text-xl">Interactive Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Visualize portfolio performance vs benchmarks with interactive 
                charts showing equity curves and portfolio composition.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-red-200 transition-colors">
            <CardHeader className="pb-4">
              <Shield className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <CardTitle className="text-xl">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Your trading strategies and results are securely stored with 
                user authentication protecting your private backtesting data.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-2 hover:border-indigo-200 transition-colors">
            <CardHeader className="pb-4">
              <Database className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
              <CardTitle className="text-xl">Historical Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Save and review your backtest history, compare strategies, 
                and track your trading algorithm development over time.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Ready to Test Your Trading Strategies?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Join thousands of traders who use our platform to validate their strategies 
            before putting real money at risk.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="text-lg px-8 py-4"
          >
            Start Backtesting Now
          </Button>
        </div>
      </div>
    </div>
  );
}