import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import proxyApp from "./proxy-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Starting TW Stock Tracker (Combined Server)...");

const app = express();
const PORT = process.env.PORT || 3000;

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

// API health check remains here; real API routes come from proxyApp below
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount proxy routes without adding extra prefix (avoid /api/api)
app.use(proxyApp);

// Serve static frontend files
const distPath = join(__dirname, "dist");
app.use(express.static(distPath));

// SPA fallback - serve index.html for all unmatched routes
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
