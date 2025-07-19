import { type BacktestResult } from "@shared/schema";

// Storage interface for the backtesting application
export interface IStorage {
  // For now, we mainly proxy to Python backend so minimal storage needed
  saveBacktestResult(result: BacktestResult): Promise<string>;
  getBacktestResult(id: string): Promise<BacktestResult | undefined>;
}

export class MemStorage implements IStorage {
  private backtestResults: Map<string, BacktestResult>;
  currentId: number;

  constructor() {
    this.backtestResults = new Map();
    this.currentId = 1;
  }

  async saveBacktestResult(result: BacktestResult): Promise<string> {
    const id = `backtest_${this.currentId++}`;
    this.backtestResults.set(id, result);
    return id;
  }

  async getBacktestResult(id: string): Promise<BacktestResult | undefined> {
    return this.backtestResults.get(id);
  }
}

export const storage = new MemStorage();
