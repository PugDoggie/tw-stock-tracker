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

// Determine correct Yahoo Finance suffix for TW/TWO tickers (with fallback)
const getSymbolCandidates = (id) => {
  const cleanId = String(id).trim();

  // Index symbols (starting with ^) don't need suffix
  if (cleanId.startsWith("^")) {
    return [cleanId];
  }

  // Known market from our refdata
  const market = stockMarketMap.get(cleanId);
  if (market) {
    return [`${cleanId}.${market === "TWO" ? "TWO" : "TW"}`];
  }

  // Unknown symbols: try both TW (listed) and TWO (OTC) so new IPOs still work
  return [`${cleanId}.TW`, `${cleanId}.TWO`];
};

/**
 * Fetch historical OHLC data from Yahoo Finance
 * Strategy: Fetch complete historical data with intelligent period selection based on interval
 * Yahoo Finance data scope:
 * - 5m interval: only current day (1d) - for intraday trading
 * - 60m interval: 5-7 days (5d) - for recent intraday trends
 * - 1d, 1wk, 1mo intervals: 5 years (5y) - for long-term analysis
 */
export const fetchHistoricalOHLC = async (
  stockId,
  period = "1mo",
  interval = "1d",
  retryCount = 0,
  candidateIndex = 0,
) => {
  const candidates = getSymbolCandidates(stockId);
  const symbol = candidates[Math.min(candidateIndex, candidates.length - 1)];
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  // Determine appropriate period based on interval
  let effectivePeriod = period;
  if (interval === "5m") {
    effectivePeriod = "1d"; // 5-min K-line: only current day
  } else if (interval === "60m") {
    effectivePeriod = "5d"; // 1-hour K-line: recent week
  } else {
    effectivePeriod = "5y"; // Daily/Weekly/Monthly: 5-year history
  }

  // Try different period ranges for better data coverage
  const periods = [effectivePeriod, effectivePeriod === "1d" ? "5d" : "3mo"];
  const currentPeriod = periods[retryCount] || effectivePeriod;

  try {
    console.log(
      `[K-Line] Fetching ${symbol} (period: ${currentPeriod}, attempt: ${retryCount + 1}, candidate ${candidateIndex + 1}/${candidates.length})`,
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
        .map((item) => {
          const rawTs =
            typeof item.timestamp === "number"
              ? item.timestamp
              : typeof item.date === "number"
                ? item.date
                : Math.floor(new Date(item.date).getTime() / 1000);

          return {
            time: rawTs,
            open: parseFloat(Number(item.open).toFixed(2)),
            high: parseFloat(Number(item.high).toFixed(2)),
            low: parseFloat(Number(item.low).toFixed(2)),
            close: parseFloat(Number(item.close).toFixed(2)),
          };
        })
        .sort((a, b) => a.time - b.time); // Ensure chronological order

      if (ohlcData.length === 0) {
        throw new Error("No valid OHLC data after filtering");
      }

      // Return all available data for complete historical analysis
      console.log(`✅ [K-Line] ${symbol}: Got ${ohlcData.length} candles`);

      return ohlcData;
    }

    throw new Error("Invalid response format - no quotes found");
  } catch (err) {
    console.error(
      `❌ [K-Line] ${symbol} failed (attempt ${retryCount + 1}): ${err.message}`,
    );

    // Retry with different period if first attempt fails (same symbol)
    if (retryCount < 2) {
      console.log(`🔄 [K-Line] Retrying ${symbol} with different period...`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      return fetchHistoricalOHLC(
        stockId,
        period,
        interval,
        retryCount + 1,
        candidateIndex,
      );
    }

    // Switch to next symbol candidate (e.g., .TW -> .TWO) if available
    if (candidateIndex < candidates.length - 1) {
      console.log(
        `🔄 [K-Line] ${symbol} failed; trying alternate symbol ${candidates[candidateIndex + 1]}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchHistoricalOHLC(
        stockId,
        period,
        interval,
        0,
        candidateIndex + 1,
      );
    }

    throw err;
  }
};

/**
 * Removed: No mock/generated data - only real data
 * Use fetchHistoricalOHLC for actual data only
 */
