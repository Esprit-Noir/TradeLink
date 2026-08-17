import yahooFinance from "yahoo-finance2";
async function run() {
  const res = await yahooFinance.chart("GC=F", {
    period1: new Date("2024-01-01"),
    period2: new Date("2024-02-01"),
    interval: "15m",
  });
  console.log(res.quotes ? res.quotes.slice(0, 5) : "no quotes");
}
run();
