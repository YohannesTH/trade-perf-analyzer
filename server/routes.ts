import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

let pythonProcess: any = null;

// Start Python FastAPI server
function startPythonBackend() {
  if (pythonProcess) {
    return;
  }
  
  console.log("[python] Starting FastAPI backend...");
  pythonProcess = spawn("python", ["main.py"], {
    cwd: "./server",
    stdio: ["inherit", "inherit", "inherit"]
  });
  
  pythonProcess.on("exit", (code: number) => {
    console.log(`[python] FastAPI backend exited with code ${code}`);
    pythonProcess = null;
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Start Python backend
  startPythonBackend();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Protected backtest endpoint - requires authentication
  app.post("/api/backtest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const response = await fetch("http://localhost:8001/api/backtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python backend error: ${response.status} ${errorText}`);
      }
      
      const backtestResult = await response.json();
      
      // Save backtest result to database
      const savedBacktest = await storage.saveBacktestResult(userId, backtestResult);
      
      // Return result with database ID
      res.json({
        ...backtestResult,
        id: savedBacktest.id,
      });
    } catch (error) {
      console.error("Backtest error:", error);
      res.status(500).json({ 
        error: "Backtest failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get user's backtest history
  app.get("/api/backtests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const backtests = await storage.getUserBacktests(userId, limit);
      res.json(backtests);
    } catch (error) {
      console.error("Error fetching backtests:", error);
      res.status(500).json({ 
        error: "Failed to fetch backtests", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get specific backtest by ID
  app.get("/api/backtest/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const backtestId = parseInt(req.params.id);
      
      const backtest = await storage.getBacktestResult(backtestId);
      
      if (!backtest) {
        return res.status(404).json({ error: "Backtest not found" });
      }
      
      // Ensure user owns this backtest
      if (backtest.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(backtest);
    } catch (error) {
      console.error("Error fetching backtest:", error);
      res.status(500).json({ 
        error: "Failed to fetch backtest", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Ticker validation (protected)
  app.get("/api/validate-ticker/:ticker", isAuthenticated, async (req, res) => {
    try {
      const response = await fetch(`http://localhost:8001/api/validate-ticker/${req.params.ticker}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python backend error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Ticker validation error:", error);
      res.status(500).json({ 
        error: "Ticker validation failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Strategy Builder CRUD (protected)
  app.get("/api/strategies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userStrategies = await storage.getUserStrategies(userId);
      res.json(userStrategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.post("/api/strategies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const newStrategy = await storage.createStrategy(userId, req.body);
      res.json(newStrategy);
    } catch (error) {
      console.error("Error saving strategy:", error);
      res.status(500).json({ error: "Failed to save strategy" });
    }
  });

  app.delete("/api/strategies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      const strategy = await storage.getStrategy(strategyId);
      if (!strategy || strategy.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied or strategy not found" });
      }
      await storage.deleteStrategy(strategyId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  // Portfolios CRUD (protected)
  app.get("/api/portfolios", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userPortfolios = await storage.getUserPortfolios(userId);
      res.json(userPortfolios);
    } catch (error) {
      console.error("Error fetching portfolios:", error);
      res.status(500).json({ error: "Failed to fetch portfolios" });
    }
  });

  app.post("/api/portfolios", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, rebalanceFrequency, assets } = req.body;
      const newPortfolio = await storage.createPortfolio(userId, { name, description, rebalanceFrequency }, assets);
      res.json(newPortfolio);
    } catch (error) {
      console.error("Error creating portfolio:", error);
      res.status(500).json({ error: "Failed to create portfolio" });
    }
  });

  app.delete("/api/portfolios/:id", isAuthenticated, async (req: any, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const portfolio = await storage.getPortfolio(portfolioId);
      if (!portfolio || portfolio.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied or portfolio not found" });
      }
      await storage.deletePortfolio(portfolioId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      res.status(500).json({ error: "Failed to delete portfolio" });
    }
  });

  // Trade Journal CRUD (protected)
  app.get("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.createJournalEntry(userId, req.body);
      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  // AI Insights Endpoint (protected, forwards to Python backend)
  app.post("/api/ai-insight", isAuthenticated, async (req: any, res) => {
    try {
      const response = await fetch("http://localhost:8001/api/ai-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...req.body,
          userId: req.user.claims.sub,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python AI service error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("AI Insight error:", error);
      res.status(500).json({
        error: "AI Insight generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
