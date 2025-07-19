import {
  users,
  backtests,
  type User,
  type UpsertUser,
  type BacktestResult,
  type Backtest,
  type InsertBacktest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Storage interface for the backtesting application
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Backtest operations
  saveBacktestResult(userId: string, result: BacktestResult): Promise<Backtest>;
  getBacktestResult(id: number): Promise<Backtest | undefined>;
  getUserBacktests(userId: string, limit?: number): Promise<Backtest[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Backtest operations
  async saveBacktestResult(userId: string, result: BacktestResult): Promise<Backtest> {
    const insertData: InsertBacktest = {
      userId,
      ticker: result.ticker,
      startDate: result.startDate,
      endDate: result.endDate,
      strategy: result.strategy,
      parameters: result.parameters,
      initialCapital: result.initialCapital.toString(),
      finalValue: result.finalValue.toString(),
      totalReturn: result.performance.totalReturn.toString(),
      results: result,
    };

    const [backtest] = await db
      .insert(backtests)
      .values(insertData)
      .returning();
    
    return backtest;
  }

  async getBacktestResult(id: number): Promise<Backtest | undefined> {
    const [backtest] = await db
      .select()
      .from(backtests)
      .where(eq(backtests.id, id));
    return backtest;
  }

  async getUserBacktests(userId: string, limit = 10): Promise<Backtest[]> {
    return await db
      .select()
      .from(backtests)
      .where(eq(backtests.userId, userId))
      .orderBy(desc(backtests.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
