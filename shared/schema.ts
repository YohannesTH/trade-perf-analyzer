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
export const strategyTypes = ["sma_crossover", "rsi_threshold"] as const;

// Backtest request schema
export const backtestRequestSchema = z.object({
  ticker: z.string().min(1, "Ticker is required").max(10, "Ticker too long"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  strategy: z.enum(strategyTypes),
  parameters: z.record(z.union([z.string(), z.number()])),
  initialCapital: z.number().min(1000, "Minimum capital is $1000"),
});

// SMA Crossover parameters
export const smaParametersSchema = z.object({
  shortPeriod: z.number().min(1).max(50),
  longPeriod: z.number().min(2).max(200),
});

// RSI parameters
export const rsiParametersSchema = z.object({
  period: z.number().min(2).max(50),
  overbought: z.number().min(50).max(100),
  oversold: z.number().min(0).max(50),
});

// Trade record
export const tradeSchema = z.object({
  date: z.string(),
  action: z.enum(["buy", "sell"]),
  price: z.number(),
  shares: z.number(),
  value: z.number(),
});

// Performance metrics
export const performanceMetricsSchema = z.object({
  totalReturn: z.number(),
  annualizedReturn: z.number(),
  volatility: z.number(),
  sharpeRatio: z.number(),
  maxDrawdown: z.number(),
  winRate: z.number(),
  totalTrades: z.number(),
  profitableTrades: z.number(),
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

// Schema types
export const insertUserSchema = createInsertSchema(users);
export const insertBacktestSchema = createInsertSchema(backtests);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBacktest = typeof backtests.$inferInsert;
export type Backtest = typeof backtests.$inferSelect;

// Zod types
export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
export type SmaParameters = z.infer<typeof smaParametersSchema>;
export type RsiParameters = z.infer<typeof rsiParametersSchema>;
export type Trade = z.infer<typeof tradeSchema>;
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;
export type BacktestResult = z.infer<typeof backtestResultSchema>;
