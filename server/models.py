from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Union
from datetime import datetime
from enum import Enum

class StrategyType(str, Enum):
    SMA_CROSSOVER = "sma_crossover"
    RSI_THRESHOLD = "rsi_threshold"

class BacktestRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    start_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="End date in YYYY-MM-DD format")
    strategy: StrategyType = Field(..., description="Trading strategy to backtest")
    parameters: Dict[str, Union[str, int, float]] = Field(..., description="Strategy parameters")
    initial_capital: float = Field(..., ge=1000, description="Initial capital in USD")

    class Config:
        schema_extra = {
            "example": {
                "ticker": "AAPL",
                "start_date": "2023-01-01",
                "end_date": "2024-01-01",
                "strategy": "sma_crossover",
                "parameters": {
                    "shortPeriod": 20,
                    "longPeriod": 50
                },
                "initial_capital": 10000
            }
        }

class Trade(BaseModel):
    date: str = Field(..., description="Trade execution date")
    action: str = Field(..., pattern=r'^(buy|sell)$', description="Trade action")
    price: float = Field(..., gt=0, description="Execution price")
    shares: int = Field(..., gt=0, description="Number of shares")
    value: float = Field(..., description="Total trade value")

class PerformanceMetrics(BaseModel):
    total_return: float = Field(..., description="Total return percentage")
    annualized_return: float = Field(..., description="Annualized return percentage")
    volatility: float = Field(..., description="Annualized volatility")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    max_drawdown: float = Field(..., description="Maximum drawdown percentage")
    win_rate: float = Field(..., description="Percentage of profitable trades")
    total_trades: int = Field(..., description="Total number of trades")
    profitable_trades: int = Field(..., description="Number of profitable trades")

class PortfolioSnapshot(BaseModel):
    date: str = Field(..., description="Date of snapshot")
    portfolio_value: float = Field(..., description="Total portfolio value")
    stock_value: float = Field(..., description="Value of stock holdings")
    cash: float = Field(..., description="Cash available")

class BenchmarkSnapshot(BaseModel):
    date: str = Field(..., description="Date of snapshot")
    value: float = Field(..., description="Buy-and-hold portfolio value")

class BacktestResult(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol")
    strategy: StrategyType = Field(..., description="Strategy used")
    parameters: Dict[str, Union[str, int, float]] = Field(..., description="Strategy parameters")
    start_date: str = Field(..., description="Backtest start date")
    end_date: str = Field(..., description="Backtest end date")
    initial_capital: float = Field(..., description="Initial capital")
    final_value: float = Field(..., description="Final portfolio value")
    trades: List[Trade] = Field(..., description="List of executed trades")
    performance: PerformanceMetrics = Field(..., description="Performance metrics")
    portfolio_history: List[PortfolioSnapshot] = Field(..., description="Portfolio value over time")
    benchmark_history: List[BenchmarkSnapshot] = Field(..., description="Buy-and-hold benchmark")
