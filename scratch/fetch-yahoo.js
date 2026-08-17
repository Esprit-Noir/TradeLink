const https = require('https');

https.get('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=15m&range=5d', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const result = json.chart.result[0];
    const quotes = result.indicators.quote[0];
    console.log("lows:", quotes.low.slice(0, 20));
  });
});
