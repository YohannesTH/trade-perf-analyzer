import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { storage } from "./storage";

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
  // Start Python backend
  startPythonBackend();
  
  // Proxy backtest requests to Python FastAPI backend
  app.post("/api/backtest", async (req, res) => {
    try {
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
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Backtest error:", error);
      res.status(500).json({ 
        error: "Backtest failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Proxy ticker validation to Python backend
  app.get("/api/validate-ticker/:ticker", async (req, res) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
