// Node.js Express proxy for TWSE API (解決 CORS 問題)

import express from "express";
import fetch from "node-fetch";
const app = express();
const PORT = 3001;

// Basic CORS so the Vite dev server (different port) can call this proxy.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health check / root route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "TW Stock Tracker Proxy Server",
    endpoints: [
      "/api/twse - Taiwan Stock Exchange API",
      "/api/yahoo/quote - Yahoo Finance Quote",
      "/api/yahoo/historical - Yahoo Finance Historical Data",
      "/api/yahoo/search - Yahoo Finance Search",
    ],
  });
});

app.get("/api/twse", async (req, res) => {
  const { ex_ch } = req.query;
  if (!ex_ch) return res.status(400).json({ error: "Missing ex_ch param" });
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ex_ch)}&json=1&delay=0&_=${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Node Proxy)",
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yahoo quote proxy - fetch real-time data from Yahoo Finance
app.get("/api/yahoo/quote", async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing symbols param" });

  const symbolArray = symbols.split(",");
  const results = [];

  try {
    // Fetch each symbol individually from Yahoo Finance
    for (const symbol of symbolArray) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            Origin: "https://finance.yahoo.com",
            Referer: "https://finance.yahoo.com/",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data?.chart?.result?.[0];

          if (result) {
            const meta = result.meta;
            const quote = result.indicators?.quote?.[0];
            const lastIdx = quote?.close?.length - 1;

            if (lastIdx >= 0) {
              const currentPrice =
                quote.close[lastIdx] || meta.regularMarketPrice;
              const previousClose =
                meta.chartPreviousClose || meta.previousClose;
              const change = currentPrice - previousClose;
              const changePercent = (change / previousClose) * 100;

              results.push({
                symbol: symbol,
                regularMarketPrice: currentPrice,
                regularMarketChange: change,
                regularMarketChangePercent: changePercent,
                regularMarketDayHigh:
                  quote.high[lastIdx] || meta.regularMarketDayHigh,
                regularMarketDayLow:
                  quote.low[lastIdx] || meta.regularMarketDayLow,
                regularMarketVolume:
                  quote.volume[lastIdx] || meta.regularMarketVolume,
                regularMarketOpen:
                  quote.open[lastIdx] || meta.regularMarketOpen,
                regularMarketPreviousClose: previousClose,
              });

              console.log(
                `[Yahoo Quote] ${symbol}: $${currentPrice.toFixed(2)} (${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
              );
            }
          }
        }
      } catch (symbolErr) {
        console.error(`[Yahoo Quote] Error for ${symbol}:`, symbolErr.message);
      }
    }

    if (results.length > 0) {
      res.json({
        quoteResponse: {
          result: results,
          error: null,
        },
      });
    } else {
      res.status(404).json({ error: "No quotes found" });
    }
  } catch (err) {
    console.error("[Yahoo Quote] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Yahoo search proxy - find TW/TWO tickers
app.get("/api/yahoo/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing q param" });

  const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=zh-TW&region=TW&quotesCount=20&newsCount=0`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        Origin: "https://finance.yahoo.com",
        Referer: "https://finance.yahoo.com/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Yahoo search HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    const quotes = data?.quotes || [];
    const results = quotes
      .filter(
        (item) =>
          item?.symbol?.endsWith(".TW") || item?.symbol?.endsWith(".TWO"),
      )
      .slice(0, 15)
      .map((item) => ({
        id: item.symbol.replace(".TW", "").replace(".TWO", ""),
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        exchange: item.exchDisp || item.exchange || "TW",
      }));

    res.json({ results });
  } catch (err) {
    console.error("[Yahoo Search] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Yahoo historical OHLC data proxy (for K-line charts)
app.get("/api/yahoo/historical", async (req, res) => {
  const { symbol, period = "1mo", interval = "1d" } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol param" });

  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${period}`;

  try {
    const chartResponse = await fetch(chartUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        Origin: "https://finance.yahoo.com",
        Referer: "https://finance.yahoo.com/",
      },
    });

    if (chartResponse.ok) {
      const chartData = await chartResponse.json();

      if (chartData?.chart?.result?.[0]) {
        const result = chartData.chart.result[0];
        const quotes = result.timestamp
          .map((ts, idx) => {
            const quoteData = result.indicators.quote[0];
            return {
              date: new Date(ts * 1000).toISOString().split("T")[0],
              open: quoteData.open[idx],
              high: quoteData.high[idx],
              low: quoteData.low[idx],
              close: quoteData.close[idx],
              volume: quoteData.volume[idx],
            };
          })
          .filter((q) => q.close != null); // Filter out null entries

        if (quotes.length > 0) {
          console.log(
            `[Yahoo Historical] Got ${quotes.length} quotes for ${symbol}`,
          );
          return res.json({ quotes });
        }
      }
    }

    res.status(404).json({ error: "No historical data found" });
  } catch (err) {
    console.error(`[Yahoo Historical Error] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
