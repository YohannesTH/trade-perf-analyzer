import {
  users,
  backtests,
  strategies,
  portfolios,
  portfolioAssets,
  tradeJournal,
  type User,
  type UpsertUser,
  type BacktestResult,
  type Backtest,
  type InsertBacktest,
  type Strategy,
  type InsertStrategy,
  type Portfolio,
  type InsertPortfolio,
  type PortfolioAsset,
  type InsertPortfolioAsset,
  type TradeJournal,
  type InsertTradeJournal,
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

  // Strategy operations
  createStrategy(userId: string, strategy: Omit<InsertStrategy, "userId">): Promise<Strategy>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  getUserStrategies(userId: string): Promise<Strategy[]>;
  deleteStrategy(id: number): Promise<void>;

  // Portfolio operations
  createPortfolio(userId: string, portfolio: Omit<InsertPortfolio, "userId">, assets: Omit<InsertPortfolioAsset, "portfolioId">[]): Promise<Portfolio & { assets: PortfolioAsset[] }>;
  getPortfolio(id: number): Promise<(Portfolio & { assets: PortfolioAsset[] }) | undefined>;
  getUserPortfolios(userId: string): Promise<(Portfolio & { assets: PortfolioAsset[] })[]>;
  deletePortfolio(id: number): Promise<void>;

  // Journal operations
  createJournalEntry(userId: string, entry: Omit<InsertTradeJournal, "userId">): Promise<TradeJournal>;
  getJournalEntries(userId: string): Promise<TradeJournal[]>;
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

  // Strategy operations
  async createStrategy(userId: string, strategyData: Omit<InsertStrategy, "userId">): Promise<Strategy> {
    const [strategy] = await db
      .insert(strategies)
      .values({ ...strategyData, userId })
      .returning();
    return strategy;
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy;
  }

  async getUserStrategies(userId: string): Promise<Strategy[]> {
    return await db.select().from(strategies).where(eq(strategies.userId, userId)).orderBy(desc(strategies.createdAt));
  }

  async deleteStrategy(id: number): Promise<void> {
    await db.delete(strategies).where(eq(strategies.id, id));
  }

  // Portfolio operations
  async createPortfolio(
    userId: string, 
    portfolioData: Omit<InsertPortfolio, "userId">, 
    assetsData: Omit<InsertPortfolioAsset, "portfolioId">[]
  ): Promise<Portfolio & { assets: PortfolioAsset[] }> {
    const [portfolio] = await db
      .insert(portfolios)
      .values({ ...portfolioData, userId })
      .returning();

    const assets: PortfolioAsset[] = [];
    if (assetsData.length > 0) {
      const insertedAssets = await db
        .insert(portfolioAssets)
        .values(assetsData.map(asset => ({ ...asset, portfolioId: portfolio.id })))
        .returning();
      assets.push(...insertedAssets);
    }

    return { ...portfolio, assets };
  }

  async getPortfolio(id: number): Promise<(Portfolio & { assets: PortfolioAsset[] }) | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    if (!portfolio) return undefined;

    const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, id));
    return { ...portfolio, assets };
  }

  async getUserPortfolios(userId: string): Promise<(Portfolio & { assets: PortfolioAsset[] })[]> {
    const userPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    const results: (Portfolio & { assets: PortfolioAsset[] })[] = [];

    for (const portfolio of userPortfolios) {
      const assets = await db.select().from(portfolioAssets).where(eq(portfolioAssets.portfolioId, portfolio.id));
      results.push({ ...portfolio, assets });
    }

    return results;
  }

  async deletePortfolio(id: number): Promise<void> {
    await db.delete(portfolios).where(eq(portfolios.id, id));
  }

  // Journal operations
  async createJournalEntry(userId: string, entryData: Omit<InsertTradeJournal, "userId">): Promise<TradeJournal> {
    const [entry] = await db
      .insert(tradeJournal)
      .values({ ...entryData, userId })
      .returning();
    return entry;
  }

  async getJournalEntries(userId: string): Promise<TradeJournal[]> {
    return await db
      .select()
      .from(tradeJournal)
      .where(eq(tradeJournal.userId, userId))
      .orderBy(desc(tradeJournal.createdAt));
  }
}

export const storage = new DatabaseStorage();
