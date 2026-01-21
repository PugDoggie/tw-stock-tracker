/**
 * K-Line Data Service - Fetch OHLC data for candlestick charts
 * Uses real data from Yahoo Finance via proxy server
 */

const isDev = import.meta.env.DEV;

// Determine correct Yahoo Finance suffix for TW/TWO tickers
const getYahooSymbol = (id) => {
  const cleanId = String(id).trim();
  const suffix = /^(6|8|9)/.test(cleanId) ? "TWO" : "TW";
  return `${cleanId}.${suffix}`;
};

/**
 * Fetch historical OHLC data from Yahoo Finance
 */
export const fetchHistoricalOHLC = async (
  stockId,
  period = "1mo",
  interval = "1d",
) => {
  try {
    const symbol = getYahooSymbol(stockId);
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    if (isDev) console.log(`[K-Line] Fetching ${symbol}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const url = `${apiBase}/api/yahoo/historical?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
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
        }));

      if (ohlcData.length === 0) {
        throw new Error("No valid OHLC data after filtering");
      }

      if (isDev)
        console.log(`[K-Line] Got ${ohlcData.length} candles for ${symbol}`);
      return ohlcData;
    }

    throw new Error("Invalid response format - no quotes found");
  } catch (err) {
    console.error(`[K-Line] ${stockId}: ${err.message}`);
    throw err;
  }
};

/**
 * Removed: No mock/generated data - only real data
 * Use fetchHistoricalOHLC for actual data only
 */
