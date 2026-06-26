import { z } from "zod";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Strategy types
export const strategyTypes = ["sma_crossover", "rsi_threshold", "ema_crossover", "macd_crossover", "bollinger_reversion", "custom_composite"] as const;

// Backtest request schema
export const backtestRequestSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10, "Ticker too long"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  strategy: z.enum(strategyTypes),
  parameters: z.record(z.union([z.string(), z.number()])),
  initialCapital: z.number().min(1000, "Minimum capital is $1000"),
  slippage: z.number().optional().default(0.0005),
  commission: z.number().optional().default(0.001),
  marginRatio: z.number().optional().default(1.0),
});

// SMA Crossover parameters
export const smaParametersSchema = z.object({
  shortPeriod: z.number().min(1).max(100),
  longPeriod: z.number().min(2).max(500),
});

// RSI parameters
export const rsiParametersSchema = z.object({
  period: z.number().min(2).max(100),
  overbought: z.number().min(50).max(100),
  oversold: z.number().min(0).max(50),
});

// Trade record
export const tradeSchema = z.object({
  date: z.string(),
  action: z.enum(["buy", "sell", "short", "cover"]),
  price: z.number(),
  shares: z.number(),
  value: z.number(),
  commission: z.number().optional(),
  slippage: z.number().optional(),
  pnl: z.number().optional(),
});

// Performance metrics
export const performanceMetricsSchema = z.object({
  totalReturn: z.number(),
  annualizedReturn: z.number(),
  volatility: z.number(),
  sharpeRatio: z.number(),
  sortinoRatio: z.number().optional(),
  calmarRatio: z.number().optional(),
  maxDrawdown: z.number(),
  winRate: z.number(),
  totalTrades: z.number(),
  profitableTrades: z.number(),
  profitFactor: z.number().optional(),
  expectancy: z.number().optional(),
  recoveryFactor: z.number().optional(),
  skewness: z.number().optional(),
  kurtosis: z.number().optional(),
  var95: z.number().optional(),
  cvar95: z.number().optional(),
});

// Backtest result
export const backtestResultSchema = z.object({
  ticker: z.string(),
  strategy: z.enum(strategyTypes),
  parameters: z.record(z.union([z.string(), z.number()])),
  startDate: z.string(),
  endDate: z.string(),
  initialCapital: z.number(),
  finalValue: z.number(),
  trades: z.array(tradeSchema),
  performance: performanceMetricsSchema,
  portfolioHistory: z.array(z.object({
    date: z.string(),
    portfolioValue: z.number(),
    stockValue: z.number(),
    cash: z.number(),
  })),
  benchmarkHistory: z.array(z.object({
    date: z.string(),
    value: z.number(),
  })),
  monteCarloSimulations: z.array(z.array(z.number())).optional(),
});

// Database Tables

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Strategies Table for UI Builder configurations
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  config: jsonb("config").notNull(), // visual flow chart representation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backtests table to store test parameters and results
export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  startDate: varchar("start_date").notNull(),
  endDate: varchar("end_date").notNull(),
  strategy: varchar("strategy").notNull(),
  parameters: jsonb("parameters").notNull(),
  initialCapital: decimal("initial_capital", { precision: 12, scale: 2 }).notNull(),
  finalValue: decimal("final_value", { precision: 12, scale: 2 }).notNull(),
  totalReturn: decimal("total_return", { precision: 8, scale: 4 }).notNull(),
  results: jsonb("results").notNull(), // Store complete BacktestResult
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolios (Multi-Asset Configurations)
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  rebalanceFrequency: varchar("rebalance_frequency").default("none"), // 'none', 'monthly', 'quarterly', 'yearly'
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio Asset Weights
export const portfolioAssets = pgTable("portfolio_assets", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 4 }).notNull(),
});

// Trade Journal entries
export const tradeJournal = pgTable("trade_journal", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  backtestId: integer("backtest_id").references(() => backtests.id, { onDelete: "set null" }),
  note: text("note").notNull(),
  tags: text("tags").array(),
  rating: integer("rating"), // 1 to 5 rating
  aiSummary: text("ai_summary"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export const insertUserSchema = createInsertSchema(users);
export const insertBacktestSchema = createInsertSchema(backtests);
export const insertStrategySchema = createInsertSchema(strategies);
export const insertPortfolioSchema = createInsertSchema(portfolios);
export const insertPortfolioAssetSchema = createInsertSchema(portfolioAssets);
export const insertTradeJournalSchema = createInsertSchema(tradeJournal);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBacktest = typeof backtests.$inferInsert;
export type Backtest = typeof backtests.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;
export type PortfolioAsset = typeof portfolioAssets.$inferSelect;
export type InsertPortfolioAsset = typeof portfolioAssets.$inferInsert;
export type TradeJournal = typeof tradeJournal.$inferSelect;
export type InsertTradeJournal = typeof tradeJournal.$inferInsert;

// Zod types
export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
export type SmaParameters = z.infer<typeof smaParametersSchema>;
export type RsiParameters = z.infer<typeof rsiParametersSchema>;
export type Trade = z.infer<typeof tradeSchema>;
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;
export type BacktestResult = z.infer<typeof backtestResultSchema>;

