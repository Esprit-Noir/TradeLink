import { z } from "zod";

const MARKET_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"] as const;

const tradeSchema = z.object({
  side: z.enum(["long", "short"]),
  symbol: z.string().trim().toUpperCase().min(1),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  entryAt: z.number().int().positive(),
  exitAt: z.number().int().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  quantity: z.number().positive(),
  riskAmount: z.number().optional(),
  netPnl: z.number(),
  screenshotUrl: z.string().optional(),
  notes: z.string().optional(),
})

const bodySchema = z.object({
  session: z.object({
    symbol: z.string().trim().toUpperCase().min(1),
    timeframe: z.enum(MARKET_TIMEFRAMES),
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    strategyName: z.string().optional(),
    initialBalance: z.number().positive().default(10000),
  }),
  trade: tradeSchema,
})

const payload = {
  session: {
    symbol: "EUR/USD",
    timeframe: "15m",
    from: 1700000000,
    to: 1700080000,
    strategyName: undefined,
    initialBalance: 10000,
  },
  trade: {
    side: "long",
    symbol: "EUR/USD",
    entryPrice: 1.0500,
    exitPrice: 1.0600,
    entryAt: 1700010000,
    exitAt: 1700020000,
    stopLoss: undefined,
    takeProfit: undefined,
    quantity: 1,
    riskAmount: undefined,
    netPnl: 1000,
    screenshotUrl: undefined,
  },
};

const res = bodySchema.safeParse(payload);
if (!res.success) {
  console.log("Validation failed:");
  console.log(res.error.issues);
} else {
  console.log("Validation passed!");
}
