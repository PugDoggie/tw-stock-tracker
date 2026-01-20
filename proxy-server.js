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

// Yahoo quote proxy (prevents browser CORS blocks)
app.get("/api/yahoo/quote", async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: "Missing symbols param" });

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Node Proxy)",
        Referer: "https://tw.stock.yahoo.com/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Yahoo upstream HTTP ${response.status}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
