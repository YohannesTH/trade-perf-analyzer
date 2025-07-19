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
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported strategy: {request.strategy}")
        
        # Run the backtest
        result = await backtest_engine.run_backtest(
            ticker=request.ticker,
            start_date=request.start_date,
            end_date=request.end_date,
            strategy=strategy,
            initial_capital=request.initial_capital
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True if os.getenv("NODE_ENV") == "development" else False
    )
