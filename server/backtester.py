import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio

from strategies import TradingStrategy
from models import BacktestResult, Trade, PerformanceMetrics, PortfolioSnapshot, BenchmarkSnapshot

class BacktestEngine:
    """Main backtesting engine"""
    
    def __init__(self):
        self.commission = 0.001  # 0.1% commission per trade
        
    async def fetch_data(self, ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch historical stock data using yfinance"""
        try:
            stock = yf.Ticker(ticker.upper())
            data = stock.history(start=start_date, end=end_date, auto_adjust=True, prepost=True)
            
            if data.empty:
                raise ValueError(f"No data available for {ticker} in the specified date range")
            
            # Ensure we have required columns
            required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
            missing_columns = [col for col in required_columns if col not in data.columns]
            
            if missing_columns:
                raise ValueError(f"Missing required data columns: {missing_columns}")
            
            return data
            
        except Exception as e:
            raise ValueError(f"Failed to fetch data for {ticker}: {str(e)}")
    
    def calculate_performance_metrics(self, portfolio_history: List[Dict], 
                                    trades: List[Dict], 
                                    initial_capital: float,
                                    benchmark_history: List[Dict]) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics"""
        
        if not portfolio_history:
            return PerformanceMetrics(
                total_return=0, annualized_return=0, volatility=0, 
                sharpe_ratio=0, max_drawdown=0, win_rate=0,
                total_trades=0, profitable_trades=0
            )
        
        # Portfolio returns
        portfolio_values = [p['portfolio_value'] for p in portfolio_history]
        portfolio_returns = pd.Series(portfolio_values).pct_change().dropna()
        
        # Total return
        final_value = portfolio_values[-1]
        total_return = (final_value - initial_capital) / initial_capital * 100
        
        # Annualized return
        days = len(portfolio_history)
        years = days / 252  # Trading days per year
        if years > 0:
            annualized_return = ((final_value / initial_capital) ** (1/years) - 1) * 100
        else:
            annualized_return = 0
        
        # Volatility (annualized)
        if len(portfolio_returns) > 1:
            volatility = portfolio_returns.std() * np.sqrt(252) * 100
        else:
            volatility = 0
        
        # Sharpe ratio (assuming risk-free rate of 2%)
        risk_free_rate = 0.02
        if volatility > 0:
            sharpe_ratio = (annualized_return/100 - risk_free_rate) / (volatility/100)
        else:
            sharpe_ratio = 0
        
        # Maximum drawdown
        portfolio_series = pd.Series(portfolio_values)
        rolling_max = portfolio_series.expanding().max()
        drawdowns = (portfolio_series - rolling_max) / rolling_max * 100
        max_drawdown = abs(drawdowns.min()) if len(drawdowns) > 0 else 0
        
        # Trade statistics
        total_trades = len(trades)
        if total_trades > 0:
            # Calculate P&L for each trade pair (buy-sell)
            profitable_trades = 0
            i = 0
            while i < len(trades) - 1:
                if trades[i]['action'] == 'buy' and trades[i+1]['action'] == 'sell':
                    if trades[i+1]['price'] > trades[i]['price']:
                        profitable_trades += 1
                    i += 2
                else:
                    i += 1
            
            win_rate = (profitable_trades / (total_trades // 2)) * 100 if total_trades >= 2 else 0
        else:
            profitable_trades = 0
            win_rate = 0
        
        return PerformanceMetrics(
            total_return=round(total_return, 2),
            annualized_return=round(annualized_return, 2),
            volatility=round(volatility, 2),
            sharpe_ratio=round(sharpe_ratio, 2),
            max_drawdown=round(max_drawdown, 2),
            win_rate=round(win_rate, 2),
            total_trades=total_trades,
            profitable_trades=profitable_trades
        )
    
    async def run_backtest(self, ticker: str, start_date: str, end_date: str, 
                          strategy: TradingStrategy, initial_capital: float) -> BacktestResult:
        """Run the complete backtesting process"""
        
        # Fetch market data
        data = await self.fetch_data(ticker, start_date, end_date)
        
        # Generate trading signals
        signals = strategy.generate_signals(data)
        
        # Initialize portfolio
        cash = initial_capital
        shares = 0
        trades = []
        portfolio_history = []
        
        # Create buy-and-hold benchmark
        initial_price = data['Close'].iloc[0]
        benchmark_shares = initial_capital / initial_price
        benchmark_history = []
        
        # Simulate trading
        for date, row in data.iterrows():
            price = row['Close']
            signal = signals.loc[date] if date in signals.index else 0
            
            # Execute trades based on signals
            if signal == 1 and shares == 0:  # Buy signal and no position
                shares_to_buy = int(cash / price)
                if shares_to_buy > 0:
                    trade_value = shares_to_buy * price
                    commission_cost = trade_value * self.commission
                    
                    if cash >= trade_value + commission_cost:
                        shares = shares_to_buy
                        cash -= (trade_value + commission_cost)
                        
                        trades.append({
                            'date': date.strftime('%Y-%m-%d'),
                            'action': 'buy',
                            'price': round(price, 2),
                            'shares': shares_to_buy,
                            'value': round(trade_value, 2)
                        })
            
            elif signal == -1 and shares > 0:  # Sell signal and have position
                trade_value = shares * price
                commission_cost = trade_value * self.commission
                
                cash += (trade_value - commission_cost)
                
                trades.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'action': 'sell',
                    'price': round(price, 2),
                    'shares': shares,
                    'value': round(trade_value, 2)
                })
                
                shares = 0
            
            # Record portfolio state
            stock_value = shares * price
            portfolio_value = cash + stock_value
            
            portfolio_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'portfolio_value': round(portfolio_value, 2),
                'stock_value': round(stock_value, 2),
                'cash': round(cash, 2)
            })
            
            # Record benchmark
            benchmark_value = benchmark_shares * price
            benchmark_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(benchmark_value, 2)
            })
        
        # Final portfolio value
        final_stock_value = shares * data['Close'].iloc[-1]
        final_value = cash + final_stock_value
        
        # Calculate performance metrics
        performance = self.calculate_performance_metrics(
            portfolio_history, trades, initial_capital, benchmark_history
        )
        
        # Convert strategy parameters to serializable format
        strategy_params = {}
        if hasattr(strategy, 'short_period'):
            strategy_params['shortPeriod'] = strategy.short_period
        if hasattr(strategy, 'long_period'):
            strategy_params['longPeriod'] = strategy.long_period
        if hasattr(strategy, 'period'):
            strategy_params['period'] = strategy.period
        if hasattr(strategy, 'overbought'):
            strategy_params['overbought'] = strategy.overbought
        if hasattr(strategy, 'oversold'):
            strategy_params['oversold'] = strategy.oversold
        
        # Determine strategy type
        strategy_type = "sma_crossover" if hasattr(strategy, 'short_period') else "rsi_threshold"
        
        return BacktestResult(
            ticker=ticker.upper(),
            strategy=strategy_type,
            parameters=strategy_params,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            final_value=round(final_value, 2),
            trades=[Trade(**trade) for trade in trades],
            performance=performance,
            portfolio_history=[PortfolioSnapshot(**p) for p in portfolio_history],
            benchmark_history=[BenchmarkSnapshot(**b) for b in benchmark_history]
        )
