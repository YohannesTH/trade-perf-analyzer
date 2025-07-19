import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional

class TradingStrategy(ABC):
    """Base class for all trading strategies"""
    
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """
        Generate trading signals from market data
        Returns: Series with 1 for buy, -1 for sell, 0 for hold
        """
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Return strategy name"""
        pass

class SMAStrategy(TradingStrategy):
    """Simple Moving Average Crossover Strategy"""
    
    def __init__(self, short_period: int = 20, long_period: int = 50):
        self.short_period = short_period
        self.long_period = long_period
        
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """
        Generate signals based on SMA crossover
        Buy when short MA crosses above long MA
        Sell when short MA crosses below long MA
        """
        if len(data) < self.long_period:
            return pd.Series(0, index=data.index)
        
        # Calculate moving averages
        short_ma = data['Close'].rolling(window=self.short_period).mean()
        long_ma = data['Close'].rolling(window=self.long_period).mean()
        
        # Initialize signals
        signals = pd.Series(0, index=data.index)
        
        # Generate crossover signals
        for i in range(1, len(data)):
            if (short_ma.iloc[i] > long_ma.iloc[i] and 
                short_ma.iloc[i-1] <= long_ma.iloc[i-1]):
                signals.iloc[i] = 1  # Buy signal
            elif (short_ma.iloc[i] < long_ma.iloc[i] and 
                  short_ma.iloc[i-1] >= long_ma.iloc[i-1]):
                signals.iloc[i] = -1  # Sell signal
        
        return signals
    
    def get_name(self) -> str:
        return f"SMA Crossover ({self.short_period}/{self.long_period})"

class RSIStrategy(TradingStrategy):
    """RSI (Relative Strength Index) Strategy"""
    
    def __init__(self, period: int = 14, overbought: float = 70, oversold: float = 30):
        self.period = period
        self.overbought = overbought
        self.oversold = oversold
        
    def calculate_rsi(self, prices: pd.Series) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """
        Generate signals based on RSI levels
        Buy when RSI crosses below oversold level
        Sell when RSI crosses above overbought level
        """
        if len(data) < self.period + 1:
            return pd.Series(0, index=data.index)
        
        rsi = self.calculate_rsi(data['Close'])
        signals = pd.Series(0, index=data.index)
        
        # Track position state
        position = 0  # 0 = no position, 1 = long position
        
        for i in range(1, len(data)):
            if pd.isna(rsi.iloc[i]) or pd.isna(rsi.iloc[i-1]):
                continue
                
            # Buy signal: RSI crosses below oversold from above
            if (rsi.iloc[i] < self.oversold and rsi.iloc[i-1] >= self.oversold and position == 0):
                signals.iloc[i] = 1
                position = 1
            # Sell signal: RSI crosses above overbought from below
            elif (rsi.iloc[i] > self.overbought and rsi.iloc[i-1] <= self.overbought and position == 1):
                signals.iloc[i] = -1
                position = 0
        
        return signals
    
    def get_name(self) -> str:
        return f"RSI Strategy ({self.period}, {self.oversold}/{self.overbought})"
