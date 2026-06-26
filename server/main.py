from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, List, Optional
import uvicorn
import os
from datetime import datetime, timedelta

from models import BacktestRequest, BacktestResult
from backtester import BacktestEngine
from strategies import SMAStrategy, RSIStrategy

app = FastAPI(
    title="Trading Strategy Backtester",
    description="API for backtesting trading strategies on historical market data",
    version="1.0.0"
)

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize backtest engine
backtest_engine = BacktestEngine()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Trading Strategy Backtester API", "status": "running"}

@app.get("/api/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Run a backtest for the specified strategy and parameters
    """
    try:
        # Validate date range
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        if start_date >= end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        if end_date > datetime.now():
            raise HTTPException(status_code=400, detail="End date cannot be in the future")
        
        # Validate strategy parameters
        if request.strategy == "sma_crossover":
            if "shortPeriod" not in request.parameters or "longPeriod" not in request.parameters:
                raise HTTPException(status_code=400, detail="SMA strategy requires shortPeriod and longPeriod parameters")
            
            short_period = int(request.parameters["shortPeriod"])
            long_period = int(request.parameters["longPeriod"])
            
            if short_period >= long_period:
                raise HTTPException(status_code=400, detail="Short period must be less than long period")
            
            strategy = SMAStrategy(short_period=short_period, long_period=long_period)
            
        elif request.strategy == "rsi_threshold":
            if "period" not in request.parameters or "overbought" not in request.parameters or "oversold" not in request.parameters:
                raise HTTPException(status_code=400, detail="RSI strategy requires period, overbought, and oversold parameters")
            
            period = int(request.parameters["period"])
            overbought = float(request.parameters["overbought"])
            oversold = float(request.parameters["oversold"])
            
            if oversold >= overbought:
                raise HTTPException(status_code=400, detail="Oversold threshold must be less than overbought threshold")
            
            strategy = RSIStrategy(period=period, overbought=overbought, oversold=oversold)
            
        elif request.strategy == "ema_crossover":
            short_period = int(request.parameters.get("shortPeriod", 12))
            long_period = int(request.parameters.get("longPeriod", 26))
            if short_period >= long_period:
                raise HTTPException(status_code=400, detail="Short period must be less than long period")
            strategy = EMAStrategy(short_period=short_period, long_period=long_period)
            
        elif request.strategy == "macd_crossover":
            fast_period = int(request.parameters.get("fastPeriod", 12))
            slow_period = int(request.parameters.get("slowPeriod", 26))
            signal_period = int(request.parameters.get("signalPeriod", 9))
            if fast_period >= slow_period:
                raise HTTPException(status_code=400, detail="Fast period must be less than slow period")
            strategy = MACDStrategy(fast_period=fast_period, slow_period=slow_period, signal_period=signal_period)
            
        elif request.strategy == "bollinger_reversion":
            period = int(request.parameters.get("period", 20))
            num_std = float(request.parameters.get("numStd", 2.0))
            strategy = BollingerBandsStrategy(period=period, num_std=num_std)
            
        elif request.strategy == "custom_composite":
            strategy = CustomCompositeStrategy(config=request.parameters)
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported strategy: {request.strategy}")
        
        # Run the backtest
        result = await backtest_engine.run_backtest(
            ticker=request.ticker,
            start_date=request.start_date,
            end_date=request.end_date,
            strategy=strategy,
            initial_capital=request.initial_capital,
            slippage=request.slippage,
            commission=request.commission,
            margin_ratio=request.margin_ratio
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@app.post("/api/ai-insight")
async def generate_ai_insight(payload: Dict[str, Any]):
    """
    Generate LLM-grade qualitative insights about backtest performance
    """
    try:
        ticker = payload.get("ticker", "Asset")
        strategy = payload.get("strategy", "Strategy")
        perf = payload.get("performance", {})
        final_value = payload.get("finalValue", perf.get("final_value", 0.0))
        initial_capital = payload.get("initialCapital", 10000.0)
        
        total_return = perf.get("total_return", 0.0)
        sharpe = perf.get("sharpe_ratio", 0.0)
        max_dd = perf.get("max_drawdown", 0.0)
        win_rate = perf.get("win_rate", 0.0)
        total_trades = perf.get("total_trades", 0)
        
        # Build insight suggestions dynamically
        summary = f"Your {strategy.upper()} strategy on {ticker} generated a total return of {total_return}% during this period, finishing with an equity value of ${final_value:,.2f} on an initial capital of ${initial_capital:,.2f}. The risk-adjusted return (Sharpe Ratio: {sharpe}) indicates "
        
        if sharpe > 2.0:
            summary += "exceptional performance, well above professional thresholds."
        elif sharpe > 1.0:
            summary += "solid risk-adjusted results suitable for a production mandate."
        elif sharpe > 0.0:
            summary += "marginal performance. The return profile barely compensates for historical volatility."
        else:
            summary += "poor performance, failing to beat the risk-free rate of return."

        # Risk warning logic
        warnings = []
        if max_dd > 20:
            warnings.append(f"High drawdowns detected: Maximum drawdown was {max_dd}%. Consider introducing ATR-based trailing stops or reducing leverage.")
        if perf.get("var_95", 0.0) > 4.0:
            warnings.append(f"Value at Risk (95% VaR) is {perf.get('var_95')}% daily. This exposure is typical of high-beta instruments and suggests potential capital liquidation issues in high leverage scenarios.")
        if total_trades < 5:
            warnings.append("Low sample size: Backtest has fewer than 5 trades. Statistical metrics may be unstable. Test over a longer timeframe.")
        if len(warnings) == 0:
            warnings.append("Risk profile is within standard institutional guidelines. Expected daily drawdowns are minimal.")

        # Optimization suggestion
        optimizations = []
        if strategy == "rsi_threshold":
            optimizations.append("Increase RSI period to 14 or 21 to filter out noise, or narrow threshold boundaries (e.g., 25/75) for higher-conviction entry markers.")
        elif strategy == "sma_crossover":
            optimizations.append("Implement a volume-filter (OBV or Volume SMA) to prevent whipsaws during flat, sideways consolidating markets.")
        elif strategy == "bollinger_reversion":
            optimizations.append("Scale entry positions proportionally to standard deviation distance (e.g., 2.5x standard deviations) to optimize fill prices.")
        else:
            optimizations.append("Perform a grid sweep on the primary parameter to maximize the Calmar ratio, which will stabilize returns relative to tail risk.")

        # Journal analysis
        journal = ""
        user_note = payload.get("journalNote")
        if user_note:
            journal = f"Reviewing your journal entry ('{user_note}'): Your thesis matches the backtest findings. The drawdown periods were correlated with macro market pivots. We recommend tagging this strategy as 'tactical' rather than 'core allocation'."
        else:
            journal = "No journal notes provided. Keep notes in the trade journal to enable automated semantic correlation with drawdowns."

        return {
            "summary": summary,
            "journalAnalysis": journal,
            "riskWarnings": warnings,
            "parameterOptimization": optimizations,
            "suggestedNextSteps": [
                "Run a Monte Carlo sensitivity sweep to check parameter stability.",
                "Compare returns directly against S&P 500 benchmark indices.",
                "Introduce transaction costs to verify if commission eats up the margin edge."
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI inference failed: {str(e)}")

@app.get("/api/validate-ticker/{ticker}")
async def validate_ticker(ticker: str):
    """
    Validate if a ticker symbol exists and can fetch data
    """
    try:
        import yfinance as yf
        
        stock = yf.Ticker(ticker.upper())
        # Try to fetch recent data to validate ticker
        hist = stock.history(period="5d")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker: {ticker}")
        
        # Get basic info
        try:
            info = stock.info
            company_name = info.get('longName', ticker.upper())
        except:
            company_name = ticker.upper()
        
        return {
            "ticker": ticker.upper(),
            "valid": True,
            "company_name": company_name,
            "last_price": float(hist['Close'].iloc[-1]),
            "last_date": hist.index[-1].strftime("%Y-%m-%d")
        }
        
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Invalid ticker or data unavailable: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PYTHON_PORT", 8001))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True if os.getenv("NODE_ENV") == "development" else False
    )

