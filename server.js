import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Starting TW Stock Tracker (Combined Server)...");

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache for refdata
const refdataCache = {
  twse: null,
  tpex: null,
  timestamp: 0,
  ttl: 60 * 60 * 1000,
};

// CORS middleware
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

// API Routes (proxy endpoints)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Placeholder for proxy endpoints
app.get("/api/twse", async (req, res) => {
  try {
    const query = req.query.ex_ch || "tse_0050.tw";
    const url = `https://mis.twse.com.tw/stock/api/v1/Indices?query=${encodeURIComponent(
      query,
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/yahoo/quote", async (req, res) => {
  try {
    const symbols = req.query.symbols || "";
    const symbolArray = symbols.split(",").map((s) => s.trim());
    res.json({ symbols: symbolArray, source: "placeholder" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/yahoo/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    res.json({ query: q, results: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/refdata/search", async (req, res) => {
  res.json({ id: req.query.stockId, data: null });
});

app.get("/api/refdata/all", async (req, res) => {
  res.json([]);
});

// Serve static frontend files
const distPath = join(__dirname, "dist");
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res) => {
  const indexPath = join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Frontend build not found" });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`📡 API routes available at /api`);
  console.log(`🌐 Frontend available at /`);
});
