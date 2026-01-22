// Node.js Express proxy for TWSE API (解決 CORS 問題)

import express from "express";
import fetch from "node-fetch";
const app = express();
const PORT = 3001;

// Basic CORS so the Vite dev server (different port) can call this proxy.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,User-Agent,Accept,Cache-Control",
  );
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
      "/api/index/weights - Index Component Weights",
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

// Yahoo quote proxy - fetch individual quotes using v8 chart endpoint (reliable)
app.get("/api/yahoo/quote", async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing symbols param" });

  const symbolArray = symbols
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbolArray.length === 0) {
    return res.status(400).json({ error: "No valid symbols" });
  }

  // Fetch quote for a single symbol using v8 chart endpoint
  const fetchQuote = async (symbol) => {
    try {
      // For stocks and index, use Yahoo Finance
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      if (!response.ok) {
        console.warn(`[Quote] ${symbol}: HTTP ${response.status}`);
        return null;
      }

      const data = await response.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        console.warn(`[Quote] ${symbol}: No chart result`);
        return null;
      }

      // Extract quote data from chart
      const meta = result?.meta || {};
      const regularMarketPrice = meta.regularMarketPrice || 0;
      // Use chartPreviousClose for accurate percentage calculations (more reliable than regularMarketPreviousClose)
      const previousClose =
        meta.chartPreviousClose ||
        meta.previousClose ||
        meta.regularMarketPreviousClose ||
        regularMarketPrice;
      const change = regularMarketPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      if (regularMarketPrice > 0) {
        console.log(
          `[Quote] ${symbol}: $${regularMarketPrice.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%) [${meta.marketState || "unknown"}]`,
        );
      }

      return {
        symbol,
        regularMarketPrice,
        regularMarketChange: change,
        regularMarketChangePercent: changePercent,
        regularMarketDayHigh: meta.regularMarketDayHigh,
        regularMarketDayLow: meta.regularMarketDayLow,
        regularMarketVolume: meta.regularMarketVolume,
        regularMarketOpen: meta.regularMarketOpen,
        // Use chartPreviousClose (more accurate than regularMarketPreviousClose)
        regularMarketPreviousClose: previousClose,
      };
    } catch (err) {
      console.error(`[Quote] ${symbol}: ${err.message}`);
      return null;
    }
  };

  try {
    console.log(`[Quote] Fetching ${symbolArray.length} symbols...`);

    // Fetch all quotes in parallel (individual calls for reliability)
    const results = await Promise.all(
      symbolArray.map((sym) => fetchQuote(sym)),
    );

    // Filter out null results
    const validResults = results.filter(Boolean);

    if (validResults.length === 0) {
      console.warn("[Quote] No valid quotes returned");
      return res.status(404).json({ error: "No quotes found" });
    }

    console.log(
      `[Quote] Returning ${validResults.length}/${symbolArray.length} quotes`,
    );
    res.json({
      quoteResponse: {
        result: validResults,
        error: null,
      },
    });
  } catch (err) {
    console.error("[Quote] Error:", err.message);
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

// Index component weights endpoint
// 获取加权指数成分股权重数据
app.get("/api/index/weights", async (req, res) => {
  try {
    console.log("[Index Weights] Fetching component weights...");

    // 方法1: 尝试从台湾证交所获取实时数据
    // 证交所API: https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU
    // 这个API提供每日收盘后的市值和权重数据

    const twseUrl = `https://www.twse.com.tw/rwd/zh/afterTrading/BWIBBU?date=${new Date().toISOString().split("T")[0].replace(/-/g, "")}&response=json`;

    try {
      const response = await fetch(twseUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
          Referer: "https://www.twse.com.tw/",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 解析证交所返回的数据格式
        if (data && data.data && Array.isArray(data.data)) {
          const weights = {};

          data.data.forEach((row) => {
            // row格式: [股票代码, 股票名称, 市值, 权重, ...]
            const stockId = row[0]?.trim();
            const weight = parseFloat(row[3]);

            if (stockId && !isNaN(weight)) {
              weights[stockId] = weight;
            }
          });

          if (Object.keys(weights).length > 0) {
            console.log(
              `[Index Weights] Fetched ${Object.keys(weights).length} weights from TWSE`,
            );
            return res.json({
              weights,
              source: "TWSE",
              lastUpdate: new Date().toISOString(),
            });
          }
        }
      }
    } catch (twseError) {
      console.warn("[Index Weights] TWSE fetch failed:", twseError.message);
    }

    // 方法2: Fallback到静态数据（基于2026年1月数据）
    console.log("[Index Weights] Using fallback static data");

    const fallbackWeights = {
      2330: 31.5,
      2454: 3.2,
      2303: 1.8,
      3711: 1.5,
      3034: 2.3,
      2408: 0.3,
      6549: 0.4,
      2317: 5.2,
      2382: 2.1,
      2376: 0.6,
      2356: 0.8,
      2344: 0.9,
      2395: 0.3,
      2436: 0.2,
      2301: 0.5,
      2882: 3.4,
      2891: 1.2,
      2880: 1.5,
      2603: 2.8,
      2618: 1.3,
      2615: 1.2,
      2412: 1.9,
      2409: 0.9,
      1590: 1.6,
      1101: 0.7,
      2201: 0.4,
      1216: 1.1,
      2498: 0.2,
      1609: 0.3,
      2545: 0.1,
    };

    res.json({
      weights: fallbackWeights,
      source: "fallback",
      lastUpdate: new Date().toISOString(),
      note: "Using static weights - TWSE data unavailable",
    });
  } catch (err) {
    console.error("[Index Weights] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
