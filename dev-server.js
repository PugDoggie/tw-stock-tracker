import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting TW Stock Tracker (Development Mode)...\n");

// Start proxy server
console.log("📡 Starting Proxy Server (port 3001)...");
const proxyProcess = spawn("node", ["proxy-server.js"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
});

// Wait a bit for proxy to start, then start Vite
setTimeout(() => {
  console.log("\n🌐 Starting Vite Dev Server (port 5173)...");
  const viteProcess = spawn("npm", ["run", "dev"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  viteProcess.on("error", (err) => {
    console.error("❌ Vite process error:", err);
    process.exit(1);
  });
}, 1500);

proxyProcess.on("error", (err) => {
  console.error("❌ Proxy process error:", err);
  process.exit(1);
});

// Handle Ctrl+C to stop both processes
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Stopping all services...");
  proxyProcess.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⏹️  Stopping all services...");
  proxyProcess.kill();
  process.exit(0);
});
