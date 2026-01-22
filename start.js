import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🚀 Starting TW Stock Tracker (Production Mode)...");

// Start proxy server
console.log("📡 Starting proxy server on port 3001...");
const proxy = spawn("node", ["proxy-server.js"], {
  cwd: __dirname,
  stdio: "inherit",
});

// Start frontend server
console.log("🌐 Starting frontend server on port 3000...");
const frontend = spawn("npx", ["serve", "-s", "dist", "-l", "3000"], {
  cwd: __dirname,
  stdio: "inherit",
});

// Handle exits
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  proxy.kill();
  frontend.kill();
  process.exit(0);
});

proxy.on("error", (err) => console.error("Proxy error:", err));
frontend.on("error", (err) => console.error("Frontend error:", err));
