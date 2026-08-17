import { NextResponse } from "next/server";
import { yahooProvider } from "@/lib/market/providers";

export async function GET() {
  const data = await yahooProvider.fetchCandles({ symbol: "XAU/USD", timeframe: "15m", from: 1710000000, to: 1720000000 });
  return NextResponse.json(data);
}
