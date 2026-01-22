import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import proxy server
import proxyApp from "./proxy-server.js";

console.log("🚀 Starting TW Stock Tracker (Production Mode)...");

const mainApp = express();
const PORT = process.env.PORT || 3000;

// Mount proxy API routes at /api
mainApp.use("/api", proxyApp);

// Serve static frontend files from dist
const distPath = join(__dirname, "dist");
mainApp.use(express.static(distPath));

// SPA fallback - serve index.html for all routes not matched
mainApp.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res
      .status(404)
      .json({ error: "Frontend build not found. Run: npm run build" });
  }
});

// Error handler
mainApp.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});

// Start server
mainApp.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`📡 API routes available at /api`);
  console.log(`🌐 Frontend available at /`);
});
