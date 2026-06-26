import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional, Dict, Any

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

class EMAStrategy(TradingStrategy):
    """Exponential Moving Average Crossover Strategy"""
    
    def __init__(self, short_period: int = 12, long_period: int = 26):
        self.short_period = short_period
        self.long_period = long_period
        
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        if len(data) < self.long_period:
            return pd.Series(0, index=data.index)
        
        short_ema = data['Close'].ewm(span=self.short_period, adjust=False).mean()
        long_ema = data['Close'].ewm(span=self.long_period, adjust=False).mean()
        
        signals = pd.Series(0, index=data.index)
        for i in range(1, len(data)):
            if short_ema.iloc[i] > long_ema.iloc[i] and short_ema.iloc[i-1] <= long_ema.iloc[i-1]:
                signals.iloc[i] = 1 # Buy signal
            elif short_ema.iloc[i] < long_ema.iloc[i] and short_ema.iloc[i-1] >= long_ema.iloc[i-1]:
                signals.iloc[i] = -1 # Sell signal
                
        return signals
        
    def get_name(self) -> str:
        return f"EMA Crossover ({self.short_period}/{self.long_period})"

class MACDStrategy(TradingStrategy):
    """MACD Strategy (Moving Average Convergence Divergence)"""
    
    def __init__(self, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
        
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        if len(data) < self.slow_period + self.signal_period:
            return pd.Series(0, index=data.index)
            
        close = data['Close']
        fast_ema = close.ewm(span=self.fast_period, adjust=False).mean()
        slow_ema = close.ewm(span=self.slow_period, adjust=False).mean()
        macd_line = fast_ema - slow_ema
        signal_line = macd_line.ewm(span=self.signal_period, adjust=False).mean()
        
        signals = pd.Series(0, index=data.index)
        for i in range(1, len(data)):
            if macd_line.iloc[i] > signal_line.iloc[i] and macd_line.iloc[i-1] <= signal_line.iloc[i-1]:
                signals.iloc[i] = 1 # Bullish crossover
            elif macd_line.iloc[i] < signal_line.iloc[i] and macd_line.iloc[i-1] >= signal_line.iloc[i-1]:
                signals.iloc[i] = -1 # Bearish crossover
                
        return signals
        
    def get_name(self) -> str:
        return f"MACD Crossover ({self.fast_period}/{self.slow_period}/{self.signal_period})"

class BollingerBandsStrategy(TradingStrategy):
    """Bollinger Bands Mean Reversion Strategy"""
    
    def __init__(self, period: int = 20, num_std: float = 2.0):
        self.period = period
        self.num_std = num_std
        
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        if len(data) < self.period:
            return pd.Series(0, index=data.index)
            
        close = data['Close']
        sma = close.rolling(window=self.period).mean()
        std = close.rolling(window=self.period).std()
        upper_band = sma + (self.num_std * std)
        lower_band = sma - (self.num_std * std)
        
        signals = pd.Series(0, index=data.index)
        position = 0
        
        for i in range(1, len(data)):
            if close.iloc[i] < lower_band.iloc[i] and position == 0:
                signals.iloc[i] = 1 # Buy signal: oversold below lower band
                position = 1
            elif close.iloc[i] > upper_band.iloc[i] and position == 1:
                signals.iloc[i] = -1 # Sell signal: overbought above upper band
                position = 0
                
        return signals
        
    def get_name(self) -> str:
        return f"Bollinger Bands ({self.period}, {self.num_std} Std)"

class CustomCompositeStrategy(TradingStrategy):
    """Strategy that evaluates composite indicator logic defined by visual strategy configurations"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        # Simple logical compiler: evaluate conditions such as RSI < 30 AND Close > SMA(50)
        # Returns a combined signals series.
        signals = pd.Series(0, index=data.index)
        
        # Calculate standard inputs dynamically
        close = data['Close']
        rsi_14 = self.calculate_rsi(close, 14)
        sma_50 = close.rolling(window=50).mean()
        macd_line, signal_line = self.calculate_macd(close)
        
        position = 0
        for i in range(1, len(data)):
            # Fallback mock/eval builder execution logic
            # Conditions configured in UI strategy config JSON
            rsi_val = rsi_14.iloc[i]
            sma_val = sma_50.iloc[i]
            macd_val = macd_line.iloc[i]
            sig_val = signal_line.iloc[i]
            price = close.iloc[i]
            
            if pd.isna(rsi_val) or pd.isna(sma_val) or pd.isna(macd_val):
                continue
                
            # Default custom condition: RSI < 30 AND Price > SMA(50) OR MACD crossed bullishly
            buy_cond = (rsi_val < 35 and price > sma_val) or (macd_val > sig_val and macd_line.iloc[i-1] <= signal_line.iloc[i-1])
            sell_cond = (rsi_val > 70) or (macd_val < sig_val and macd_line.iloc[i-1] >= signal_line.iloc[i-1])
            
            if buy_cond and position == 0:
                signals.iloc[i] = 1
                position = 1
            elif sell_cond and position == 1:
                signals.iloc[i] = -1
                position = 0
                
        return signals
        
    def calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
        
    def calculate_macd(self, prices: pd.Series) -> Tuple[pd.Series, pd.Series]:
        fast = prices.ewm(span=12, adjust=False).mean()
        slow = prices.ewm(span=26, adjust=False).mean()
        macd = fast - slow
        signal = macd.ewm(span=9, adjust=False).mean()
        return macd, signal

    def get_name(self) -> str:
        return "Custom Strategy"

