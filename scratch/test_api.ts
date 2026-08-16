import { z } from "zod";
import { MARKET_TIMEFRAMES } from "./src/lib/market/types";

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
    symbol: "BTC/USD",
    timeframe: "15",
    from: 1700000000,
    to: 1700080000,
    strategyName: undefined,
    initialBalance: 10000,
  },
  trade: {
    side: "long",
    symbol: "BTC/USD",
    entryPrice: 50000,
    exitPrice: 51000,
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
  console.log(res.error.issues);
} else {
  console.log("Validation passed!");
}
