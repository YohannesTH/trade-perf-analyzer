import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import asyncio

from strategies import TradingStrategy
from models import BacktestResult, Trade, PerformanceMetrics, PortfolioSnapshot, BenchmarkSnapshot

class BacktestEngine:
    """Advanced backtesting engine with support for leverage, commission, slippage, and advanced risk metrics"""
    
    async def fetch_data(self, ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch historical stock data using yfinance"""
        try:
            # Run in executor to avoid blocking async event loop
            loop = asyncio.get_event_loop()
            stock = yf.Ticker(ticker.upper())
            
            # Fetch data with safety cushion
            start_dt = datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=60)
            data = await loop.run_in_executor(
                None, 
                lambda: stock.history(start=start_dt.strftime("%Y-%m-%d"), end=end_date, auto_adjust=True, prepost=False)
            )
            
            if data.empty:
                raise ValueError(f"No data available for {ticker} in the specified date range")
            
            # Ensure we have required columns
            required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            missing_columns = [col for col in required_columns if col not in data.columns]
            
            if missing_columns:
                raise ValueError(f"Missing required data columns: {missing_columns}")
            
            # Filter to actual requested range
            data = data.loc[start_date:]
            return data
            
        except Exception as e:
            raise ValueError(f"Failed to fetch data for {ticker}: {str(e)}")
            
    def calculate_performance_metrics(self, portfolio_history: List[Dict], 
                                    trades: List[Dict], 
                                    initial_capital: float,
                                    benchmark_history: List[Dict]) -> PerformanceMetrics:
        """Calculate comprehensive risk and return metrics"""
        
        if not portfolio_history or len(portfolio_history) < 2:
            return PerformanceMetrics(
                total_return=0.0, annualized_return=0.0, volatility=0.0, 
                sharpe_ratio=0.0, sortino_ratio=0.0, calmar_ratio=0.0,
                max_drawdown=0.0, win_rate=0.0, total_trades=0, profitable_trades=0,
                profit_factor=1.0, expectancy=0.0, recovery_factor=0.0,
                skewness=0.0, kurtosis=0.0, var_95=0.0, cvar_95=0.0
            )
        
        # Portfolio returns
        portfolio_values = [p['portfolio_value'] for p in portfolio_history]
        portfolio_series = pd.Series(portfolio_values)
        portfolio_returns = portfolio_series.pct_change().dropna()
        
        # Benchmark returns
        benchmark_values = [b['value'] for b in benchmark_history]
        benchmark_series = pd.Series(benchmark_values)
        benchmark_returns = benchmark_series.pct_change().dropna()
        
        # Total return
        final_value = portfolio_values[-1]
        total_return = (final_value - initial_capital) / initial_capital * 100
        
        # Annualized return
        days = len(portfolio_history)
        years = days / 252.0  # Trading days per year
        annualized_return = ((final_value / initial_capital) ** (1.0 / years) - 1.0) * 100 if years > 0 else 0.0
        
        # Volatility (annualized)
        volatility = portfolio_returns.std() * np.sqrt(252) * 100 if len(portfolio_returns) > 1 else 0.0
        
        # Sharpe ratio (risk-free rate 2%)
        rf = 0.02
        sharpe_ratio = (annualized_return / 100.0 - rf) / (volatility / 100.0) if volatility > 0 else 0.0
        
        # Downside standard deviation & Sortino Ratio
        downside_returns = portfolio_returns[portfolio_returns < 0]
        downside_vol = downside_returns.std() * np.sqrt(252) * 100 if len(downside_returns) > 1 else 0.0
        sortino_ratio = (annualized_return / 100.0 - rf) / (downside_vol / 100.0) if downside_vol > 0 else 0.0
        
        # Maximum drawdown
        rolling_max = portfolio_series.expanding().max()
        drawdowns = (portfolio_series - rolling_max) / rolling_max * 100
        max_drawdown = abs(drawdowns.min()) if len(drawdowns) > 0 else 0.0
        
        # Calmar Ratio
        calmar_ratio = (annualized_return) / max_drawdown if max_drawdown > 0 else 0.0
        
        # Trade statistics
        total_trades = len(trades)
        profitable_trades = 0
        pnl_list = [t['pnl'] for t in trades if 'pnl' in t]
        
        wins = [pnl for pnl in pnl_list if pnl > 0]
        losses = [pnl for pnl in pnl_list if pnl <= 0]
        
        profitable_trades = len(wins)
        win_rate = (profitable_trades / len(pnl_list)) * 100 if len(pnl_list) > 0 else 0.0
        
        # Profit Factor
        sum_gains = sum(wins)
        sum_losses = abs(sum(losses))
        profit_factor = sum_gains / sum_losses if sum_losses > 0 else (sum_gains if sum_gains > 0 else 1.0)
        
        # Expectancy
        avg_win = np.mean(wins) if wins else 0.0
        avg_loss = np.mean(losses) if losses else 0.0
        pct_win = win_rate / 100.0
        expectancy = (pct_win * avg_win) + ((1 - pct_win) * avg_loss)
        
        # Recovery Factor
        recovery_factor = (final_value - initial_capital) / (max_drawdown / 100.0 * initial_capital) if max_drawdown > 0 else 0.0
        
        # Skewness & Kurtosis
        skewness = portfolio_returns.skew() if len(portfolio_returns) > 2 else 0.0
        kurtosis = portfolio_returns.kurtosis() if len(portfolio_returns) > 3 else 0.0
        
        # Value at Risk (VaR 95%) & Conditional VaR (CVaR 95%)
        if len(portfolio_returns) > 5:
            var_95 = abs(np.percentile(portfolio_returns, 5)) * 100
            cvar_95 = abs(portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)].mean()) * 100
        else:
            var_95 = 0.0
            cvar_95 = 0.0
            
        return PerformanceMetrics(
            total_return=round(total_return, 2),
            annualized_return=round(annualized_return, 2),
            volatility=round(volatility, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            sortino_ratio=round(sortino_ratio, 2),
            calmar_ratio=round(calmar_ratio, 2),
            max_drawdown=round(max_drawdown, 2),
            win_rate=round(win_rate, 2),
            total_trades=total_trades,
            profitable_trades=profitable_trades,
            profit_factor=round(profit_factor, 2),
            expectancy=round(expectancy, 2),
            recovery_factor=round(recovery_factor, 2),
            skewness=round(skewness, 2) if not np.isnan(skewness) else 0.0,
            kurtosis=round(kurtosis, 2) if not np.isnan(kurtosis) else 0.0,
            var_95=round(var_95, 2),
            cvar_95=round(cvar_95, 2)
        )
        
    def generate_monte_carlo(self, final_value: float, portfolio_history: List[Dict], paths: int = 50, days: int = 252) -> List[List[float]]:
        """Generate Monte Carlo simulated future equity paths based on return properties"""
        if len(portfolio_history) < 5:
            return []
            
        portfolio_values = [p['portfolio_value'] for p in portfolio_history]
        returns = pd.Series(portfolio_values).pct_change().dropna()
        
        mu = returns.mean()
        sigma = returns.std()
        
        if np.isnan(mu) or np.isnan(sigma) or sigma == 0:
            mu, sigma = 0.0002, 0.01  # Safe defaults
            
        simulations = []
        for _ in range(paths):
            path = [final_value]
            current = final_value
            # Simulating geometric brownian motion steps
            random_shocks = np.random.normal(mu, sigma, days)
            for shock in random_shocks:
                current = current * (1 + shock)
                path.append(round(current, 2))
            simulations.append(path)
            
        return simulations

    async def run_backtest(self, ticker: str, start_date: str, end_date: str, 
                           strategy: TradingStrategy, initial_capital: float,
                           slippage: float = 0.0005, commission: float = 0.001,
                           margin_ratio: float = 1.0) -> BacktestResult:
        """Run the event-driven backtesting execution loop"""
        
        # Fetch market data
        data = await self.fetch_data(ticker, start_date, end_date)
        
        # Generate signals
        signals = strategy.generate_signals(data)
        
        # Core accounts variables
        cash = initial_capital
        position = 0 # 0=flat, 1=long, -1=short
        shares = 0.0
        entry_price = 0.0
        trades = []
        portfolio_history = []
        
        # Benchmark Buy-and-Hold
        bench_price_init = data['Close'].iloc[0]
        bench_shares = initial_capital / bench_price_init
        benchmark_history = []
        
        # Execution loop
        for date, row in data.iterrows():
            price = row['Close']
            signal = signals.loc[date] if date in signals.index else 0
            
            # Slippage factors
            buy_slip = 1 + slippage
            sell_slip = 1 - slippage
            
            # Logic: Close/Open long & short positions
            if signal == 1: # Buy / Cover Short
                # 1. Close Short position first
                if position == -1:
                    cover_price = price * buy_slip
                    cost = shares * cover_price
                    comm_cost = cost * commission
                    realized_pnl = (entry_price - cover_price) * shares
                    cash = cash + (entry_price * shares) + realized_pnl - comm_cost
                    
                    trades.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'action': 'cover',
                        'price': round(cover_price, 2),
                        'shares': round(shares, 4),
                        'value': round(cost, 2),
                        'commission': round(comm_cost, 2),
                        'slippage': round(cover_price - price, 2),
                        'pnl': round(realized_pnl - comm_cost, 2)
                    })
                    shares = 0.0
                    position = 0
                
                # 2. Enter Long position
                if position == 0:
                    long_price = price * buy_slip
                    # We can use leverage up to margin_ratio
                    buying_power = cash * margin_ratio
                    shares_to_buy = buying_power / long_price
                    if shares_to_buy > 0:
                        trade_val = shares_to_buy * long_price
                        comm_cost = trade_val * commission
                        cash -= (trade_val + comm_cost)
                        shares = shares_to_buy
                        entry_price = long_price
                        position = 1
                        
                        trades.append({
                            'date': date.strftime('%Y-%m-%d'),
                            'action': 'buy',
                            'price': round(long_price, 2),
                            'shares': round(shares, 4),
                            'value': round(trade_val, 2),
                            'commission': round(comm_cost, 2),
                            'slippage': round(price * slippage, 2),
                            'pnl': 0.0
                        })
                        
            elif signal == -1: # Sell / Short Sell
                # 1. Close Long position first
                if position == 1:
                    sell_price = price * sell_slip
                    trade_val = shares * sell_price
                    comm_cost = trade_val * commission
                    realized_pnl = (sell_price - entry_price) * shares
                    cash += (trade_val - comm_cost)
                    
                    trades.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'action': 'sell',
                        'price': round(sell_price, 2),
                        'shares': round(shares, 4),
                        'value': round(trade_val, 2),
                        'commission': round(comm_cost, 2),
                        'slippage': round(price - sell_price, 2),
                        'pnl': round(realized_pnl - comm_cost, 2)
                    })
                    shares = 0.0
                    position = 0
                    
                # 2. Enter Short position
                if position == 0:
                    short_price = price * sell_slip
                    buying_power = cash * margin_ratio
                    shares_to_short = buying_power / short_price
                    if shares_to_short > 0:
                        trade_val = shares_to_short * short_price
                        comm_cost = trade_val * commission
                        # Short sale credits our account cash by trade value, minus commission
                        cash += (trade_val - comm_cost)
                        # Keep track of shorted shares (represented positively here, but logically negative position)
                        shares = shares_to_short
                        entry_price = short_price
                        position = -1
                        
                        trades.append({
                            'date': date.strftime('%Y-%m-%d'),
                            'action': 'short',
                            'price': round(short_price, 2),
                            'shares': round(shares, 4),
                            'value': round(trade_val, 2),
                            'commission': round(comm_cost, 2),
                            'slippage': round(price * slippage, 2),
                            'pnl': 0.0
                        })
            
            # Daily snapshot calculation
            if position == 1:
                asset_value = shares * price
                port_val = cash + asset_value
            elif position == -1:
                # To cover, we must pay current price, so asset liability is shares * price
                asset_liability = shares * price
                # When we entered short, entry cash was added. Now net port value is cash - liability
                port_val = cash - asset_liability
                asset_value = -asset_liability
            else:
                asset_value = 0.0
                port_val = cash
                
            # If account is liquidated
            if port_val <= 0:
                port_val = 0.0
                cash = 0.0
                shares = 0.0
                position = 0
                
            portfolio_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'portfolio_value': round(port_val, 2),
                'stock_value': round(asset_value, 2),
                'cash': round(cash, 2)
            })
            
            benchmark_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(bench_shares * price, 2)
            })
            
        # Final value
        final_val = portfolio_history[-1]['portfolio_value']
        
        # Calculate metrics
        performance = self.calculate_performance_metrics(portfolio_history, trades, initial_capital, benchmark_history)
        
        # Parameter format extraction
        strategy_params = {}
        for attr in ['short_period', 'long_period', 'period', 'overbought', 'oversold', 'fast_period', 'slow_period', 'signal_period', 'num_std']:
            if hasattr(strategy, attr):
                strategy_params[attr] = getattr(strategy, attr)
                
        # Strategy name identification
        strategy_type = "sma_crossover"
        if hasattr(strategy, "overbought"):
            strategy_type = "rsi_threshold"
        elif isinstance(strategy, EMAStrategy):
            strategy_type = "ema_crossover"
        elif isinstance(strategy, MACDStrategy):
            strategy_type = "macd_crossover"
        elif isinstance(strategy, BollingerBandsStrategy):
            strategy_type = "bollinger_reversion"
        elif isinstance(strategy, CustomCompositeStrategy):
            strategy_type = "custom_composite"
            
        # Monte Carlo sims
        mc_paths = self.generate_monte_carlo(final_val, portfolio_history)
        
        return BacktestResult(
            ticker=ticker.upper(),
            strategy=strategy_type,
            parameters=strategy_params,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            final_value=round(final_val, 2),
            trades=[Trade(**t) for t in trades],
            performance=performance,
            portfolio_history=[PortfolioSnapshot(**p) for p in portfolio_history],
            benchmark_history=[BenchmarkSnapshot(**b) for b in benchmark_history],
            monte_carlo_simulations=mc_paths
        )
