import { NextRequest } from "next/server";
import { GET } from "../src/app/api/market-data/route";
import * as authObj from "../src/lib/auth";

// mock auth
(authObj as any).auth = async () => ({ user: { id: "test" } });

async function run() {
  const req = new NextRequest("http://localhost/api/market-data?symbol=US500&timeframe=15m&from=1690000000&to=1720000000");
  const res = await GET(req);
  const json = await res.json();
  const candles = json.candles || [];
  console.log("Total candles:", candles.length);
  // find candles with large wicks
  const largeWicks = candles.filter(c => (c.high - c.low) > (c.open - c.close) * 10);
  console.log("Large wicks:", largeWicks.slice(0, 5));
}
run();
