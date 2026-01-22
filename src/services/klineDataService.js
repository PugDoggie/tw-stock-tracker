/**
 * K-Line Data Service - Fetch OHLC data for candlestick charts
 * Uses real data from Yahoo Finance via proxy server
 */

import { stocks, otcStocks } from "../data/stocks.js";

const isDev = import.meta.env.DEV;

// Build a map of ID -> market type for quick lookup
const stockMarketMap = new Map();
stocks.forEach((s) => stockMarketMap.set(s.id, "TW"));
otcStocks.forEach((s) => stockMarketMap.set(s.id, s.market || "TWO"));

// Determine correct Yahoo Finance suffix for TW/TWO tickers
const getYahooSymbol = (id) => {
  const cleanId = String(id).trim();
  // First, check if it's an OTC stock by looking it up in our data
  const market = stockMarketMap.get(cleanId);
  const suffix = market === "TWO" ? "TWO" : "TW";
  return `${cleanId}.${suffix}`;
};

/**
 * Fetch historical OHLC data from Yahoo Finance
 * Strategy: Fetch last 15 days (12 business days + buffer) to ensure enough data
 * Retry logic: 2 attempts with fallback to different period ranges
 */
export const fetchHistoricalOHLC = async (
  stockId,
  period = "1mo",
  interval = "1d",
  retryCount = 0,
) => {
  const symbol = getYahooSymbol(stockId);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  // Try different period ranges for better data coverage
  const periods = ["1mo", "3mo", "6mo"];
  const currentPeriod = periods[retryCount] || period;

  try {
    console.log(
      `[K-Line] Fetching ${symbol} (period: ${currentPeriod}, attempt: ${retryCount + 1})`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const url = `${apiBase}/api/yahoo/historical?symbol=${encodeURIComponent(symbol)}&period=${currentPeriod}&interval=${interval}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data?.quotes && Array.isArray(data.quotes)) {
      const ohlcData = data.quotes
        .filter(
          (item) => item && item.close && item.open && item.high && item.low,
        )
        .map((item) => ({
          time: Math.floor(new Date(item.date).getTime() / 1000),
          open: parseFloat(Number(item.open).toFixed(2)),
          high: parseFloat(Number(item.high).toFixed(2)),
          low: parseFloat(Number(item.low).toFixed(2)),
          close: parseFloat(Number(item.close).toFixed(2)),
        }))
        .sort((a, b) => a.time - b.time); // Ensure chronological order

      if (ohlcData.length === 0) {
        throw new Error("No valid OHLC data after filtering");
      }

      // Get last 100 days for comprehensive technical analysis
      // This ensures RSI has enough historical data (needs at least 14+1 points)
      const last100Days = ohlcData.slice(-100);

      console.log(
        `✅ [K-Line] ${symbol}: Got ${last100Days.length} candles (from ${ohlcData.length} total)`,
      );

      return last100Days;
    }

    throw new Error("Invalid response format - no quotes found");
  } catch (err) {
    console.error(
      `❌ [K-Line] ${symbol} failed (attempt ${retryCount + 1}): ${err.message}`,
    );

    // Retry with different period if first attempt fails
    if (retryCount < 2) {
      console.log(`🔄 [K-Line] Retrying ${symbol} with different period...`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      return fetchHistoricalOHLC(stockId, period, interval, retryCount + 1);
    }

    throw err;
  }
};

/**
 * Removed: No mock/generated data - only real data
 * Use fetchHistoricalOHLC for actual data only
 */
