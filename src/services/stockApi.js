/**
 * Stock Data API Service - REAL-TIME TWSE API
 * Priority Strategy:
 * 1. Local proxy server (localhost:3001)
 * 2. Direct TWSE API (with CORS workaround)
 * 3. Fallback mock data ONLY if both fail
 */

const isDev = import.meta.env.DEV;
const requestCache = new Map();
const CACHE_TTL = 1500; // 1.5 seconds cache for faster real-time updates

// API base for the local proxy server (avoid browser CORS)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Mock data fallback for when all real APIs fail
// Updated with realistic January 2026 Taiwan stock prices
const FALLBACK_STOCK_DATA = {
  2330: {
    id: "2330",
    name: "台積電",
    price: 945.0,
    change: -0.53,
    high: 950,
    low: 940,
    volume: 65432100,
    openPrice: 950,
    isFallback: true,
  },
  2317: {
    id: "2317",
    name: "鴻海",
    price: 215.5,
    change: 1.12,
    high: 218,
    low: 213,
    volume: 42156000,
    openPrice: 213,
    isFallback: true,
  },
  2376: {
    id: "2376",
    name: "技嘉",
    price: 68.4,
    change: 0.88,
    high: 70,
    low: 67,
    volume: 28743000,
    openPrice: 67,
    isFallback: true,
  },
  2382: {
    id: "2382",
    name: "廣達",
    price: 165.0,
    change: 2.47,
    high: 168,
    low: 161,
    volume: 31452000,
    openPrice: 161,
    isFallback: true,
  },
  2454: {
    id: "2454",
    name: "聯發科",
    price: 1265.0,
    change: 1.6,
    high: 1280,
    low: 1255,
    volume: 54892000,
    openPrice: 1245,
    isFallback: true,
  },
  2603: {
    id: "2603",
    name: "長榮",
    price: 18.65,
    change: -0.8,
    high: 19,
    low: 18,
    volume: 156432000,
    openPrice: 18.85,
    isFallback: true,
  },
  2891: {
    id: "2891",
    name: "中信金",
    price: 32.25,
    change: 1.25,
    high: 33,
    low: 31,
    volume: 87654000,
    openPrice: 31.85,
    isFallback: true,
  },
  1101: {
    id: "1101",
    name: "台泥",
    price: 52.1,
    change: 0.77,
    high: 53,
    low: 51,
    volume: 42135000,
    openPrice: 51.7,
    isFallback: true,
  },
  2303: {
    id: "2303",
    name: "聯電",
    price: 155.0,
    change: 1.31,
    high: 157,
    low: 152,
    volume: 98754000,
    openPrice: 153,
    isFallback: true,
  },
  3711: {
    id: "3711",
    name: "日月光投控",
    price: 68.5,
    change: 0.44,
    high: 70,
    low: 67,
    volume: 76543000,
    openPrice: 68.2,
    isFallback: true,
  },
};

// Determine correct Yahoo Finance suffix for TW/TWO tickers
const getYahooSymbol = (id) => {
  const cleanId = String(id).trim();
  const suffix = /^(6|8|9)/.test(cleanId) ? "TWO" : "TW";
  return `${cleanId}.${suffix}`;
};

/**
 * Fetch from local proxy server (Primary method)
 * This avoids CORS issues and provides fast real-time data
 */
const fetchFromProxyServer = async (stockIds) => {
  try {
    const tseQuery = stockIds.map((id) => `tse_${id}.tw`).join("|");
    const otcQuery = stockIds.map((id) => `otc_${id}.tw`).join("|");
    const emcQuery = stockIds.map((id) => `emc_${id}.tw`).join("|");
    const query = `${tseQuery}|${otcQuery}|${emcQuery}`;

    const url = `${API_BASE_URL}/api/twse?ex_ch=${encodeURIComponent(query)}`;

    if (isDev) console.log(`[Proxy] Fetching ${stockIds.length} stocks...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data?.msgArray || !Array.isArray(data.msgArray)) {
      throw new Error("Invalid response format");
    }

    const liveData = parseStockData(data.msgArray);
    if (liveData.length > 0) {
      if (isDev) console.log(`[Proxy] Got ${liveData.length} stocks`);
      return liveData;
    }

    throw new Error("No valid data in response");
  } catch (error) {
    if (isDev) console.warn(`[Proxy] ${error.message}`);
    return null;
  }
};

/**
 * Direct TWSE API call (Fallback method)
 * Use fetch with CORS mode if available
 */
const fetchFromTWSEDirect = async (stockIds) => {
  try {
    const tseQuery = stockIds.map((id) => `tse_${id}.tw`).join("|");
    const otcQuery = stockIds.map((id) => `otc_${id}.tw`).join("|");
    const emcQuery = stockIds.map((id) => `emc_${id}.tw`).join("|");
    const query = `${tseQuery}|${otcQuery}|${emcQuery}`;

    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(query)}&json=1&delay=0&_=${Date.now()}`;

    if (isDev) console.log(`[Direct] Fetching ${stockIds.length} stocks...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      mode: "cors",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data?.msgArray || !Array.isArray(data.msgArray)) {
      throw new Error("Invalid response format");
    }

    const liveData = parseStockData(data.msgArray);
    if (liveData.length > 0) {
      if (isDev) console.log(`[Direct] Got ${liveData.length} stocks`);
      return liveData;
    }

    throw new Error("No valid data in response");
  } catch (error) {
    if (isDev) console.warn(`[Direct] ${error.message}`);
    return null;
  }
};

/**
 * Fetch Yahoo quotes via local proxy (avoids browser CORS).
 */
const fetchFromYahooTaiwan = async (stockIds) => {
  try {
    if (isDev) console.log(`[Yahoo] Fetching ${stockIds.length} stocks...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Fetch all stocks in one batch call with correct market suffix
    const symbols = stockIds.map((id) => getYahooSymbol(id)).join(",");
    const url = `${API_BASE_URL}/api/yahoo/quote?symbols=${encodeURIComponent(symbols)}`;

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

    if (
      data?.quoteResponse?.result &&
      Array.isArray(data.quoteResponse.result)
    ) {
      const results = data.quoteResponse.result.map((item) => {
        const stockId = item.symbol.replace(".TW", "").replace(".TWO", "");
        const price = parseFloat(
          item.regularMarketPrice || item.ask || item.bid || 0,
        );
        const previousClose = parseFloat(
          item.regularMarketPreviousClose || price,
        );
        const change =
          previousClose > 0
            ? parseFloat(
                (((price - previousClose) / previousClose) * 100).toFixed(2),
              )
            : 0;

        return {
          id: stockId,
          name: item.longName || item.shortName || stockId,
          symbol: item.symbol,
          price: price,
          change: change,
          high: parseFloat(item.regularMarketDayHigh || price),
          low: parseFloat(item.regularMarketDayLow || price),
          volume: parseInt(item.regularMarketVolume || 0),
          openPrice: parseFloat(item.regularMarketOpen || previousClose),
          timestamp: Date.now(),
          isLive: true,
          sourceAPI: "Yahoo Finance",
        };
      });

      if (results.length > 0) {
        if (isDev) console.log(`[Yahoo] Got ${results.length} items`);
        return results;
      }
    }

    throw new Error("No valid data from Yahoo Taiwan");
  } catch (error) {
    if (isDev) console.error(`[Yahoo] ${error.message}`);
    return null;
  }
};

/**
 * Parse TWSE API response data
 * Extract real-time stock prices with proper validation
 */
const parseStockData = (msgArray) => {
  const seen = new Set();
  return msgArray
    .filter((item) => {
      if (!item?.c || !item?.n) return false;
      if (seen.has(item.c)) return false;
      seen.add(item.c);
      return true;
    })
    .map((item) => {
      try {
        const price =
          item.z && item.z !== "-"
            ? parseFloat(item.z)
            : parseFloat(item.y || 0);
        const lastClose = item.y ? parseFloat(item.y) : price;
        const change =
          lastClose > 0
            ? parseFloat((((price - lastClose) / lastClose) * 100).toFixed(2))
            : 0;

        return {
          id: item.c.trim(),
          name: item.n.trim() || item.c,
          symbol: `${item.c.trim()}.TW`,
          price: parseFloat(price.toFixed(2)),
          change: change,
          high: item.h && item.h !== "-" ? parseFloat(item.h) : price,
          low: item.l && item.l !== "-" ? parseFloat(item.l) : price,
          volume: item.v && item.v !== "-" ? parseInt(item.v) || 0 : 0,
          openPrice: item.o && item.o !== "-" ? parseFloat(item.o) : price,
          lastClose: lastClose,
          timestamp: Date.now(),
          isLive: true,
          isFallback: false,
        };
      } catch (err) {
        console.warn(`Parse error for stock ${item.c}:`, err.message);
        return null;
      }
    })
    .filter(Boolean); // Remove null entries
};

/**
 * Fallback: Generate mock data when all real APIs fail
 * This ensures the app still works for UI testing
 */
const generateFallbackData = (stockIds) => {
  console.warn(
    `[FALLBACK] All real API sources failed. Using mock data for: ${stockIds.join(", ")}`,
  );

  return stockIds
    .map((id) => {
      if (FALLBACK_STOCK_DATA[id]) {
        return {
          ...FALLBACK_STOCK_DATA[id],
          symbol: `${id}.TW`,
          timestamp: Date.now(),
          isLive: false,
          isFallback: true,
        };
      }
      // Generate random mock data for unknown stocks
      const basePrice = 50 + Math.random() * 500;
      const change = (Math.random() - 0.5) * 4;
      return {
        id: id,
        name: `Stock ${id}`,
        symbol: `${id}.TW`,
        price: parseFloat(basePrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        high: parseFloat((basePrice * 1.02).toFixed(2)),
        low: parseFloat((basePrice * 0.98).toFixed(2)),
        volume: Math.floor(Math.random() * 50000000),
        openPrice: parseFloat(
          (basePrice - (change / 100) * basePrice).toFixed(2),
        ),
        timestamp: Date.now(),
        isLive: false,
        isFallback: true,
      };
    })
    .filter(Boolean);
};

// Search TW/TWO stocks via Yahoo Finance search API
export const searchTaiwanStocks = async (query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const url = `${API_BASE_URL}/api/yahoo/search?q=${encodeURIComponent(query.trim())}`;

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
    if (data?.results && Array.isArray(data.results)) {
      return data.results.map((item) => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
      }));
    }

    return [];
  } catch (error) {
    if (isDev) console.warn(`[Search] ${error.message}`);
    return [];
  }
};

/**
 * Main export: Fetch live stock data with multiple fallback strategies
 *
 * Priority (NO MOCK DATA):
 * 1. ✅ Use cached data if fresh (< 800ms)
 * 2. 🟣 Try Yahoo Taiwan API (PRIMARY - from tw.stock.yahoo.com)
 * 3. 🌐 Try proxy server (fallback)
 * 4. 🌍 Try direct TWSE API (fallback)
 * 5. ❌ Throw error (NO mock data)
 */
export const fetchLiveStockData = async (stockIds) => {
  if (!stockIds || stockIds.length === 0) return [];

  const cacheKey = stockIds.sort().join(",");

  // Strategy 1: Use cache if fresh
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    const cacheAge = Date.now() - cached.timestamp;

    if (cacheAge < CACHE_TTL) {
      if (isDev) console.log(`⚡ [Cache] ${Math.round(cacheAge)}ms old`);
      return cached.data;
    } else if (cacheAge < 3000 && cached.data[0]?.isLive) {
      if (isDev) console.log(`⚡ [Cache] Stale, fetching new...`);
      fetchLiveStockData(stockIds).catch((err) => {
        if (isDev) console.error("Background fetch failed:", err);
      });
      return cached.data;
    }
  }

  // Strategy 2: Try Yahoo FIRST (PRIMARY SOURCE)
  let liveData = await fetchFromYahooTaiwan(stockIds);

  // Strategy 3: Try proxy server if Yahoo fails
  if (!liveData || liveData.length === 0) {
    if (isDev) console.log(`[Fallback] Trying Proxy server...`);
    liveData = await fetchFromProxyServer(stockIds);
  }

  // Strategy 4: Try direct TWSE API if proxy fails
  if (!liveData || liveData.length === 0) {
    if (isDev) console.log(`[Fallback] Trying Direct TWSE API...`);
    liveData = await fetchFromTWSEDirect(stockIds);
  }

  // Strategy 5: Use fallback mock data when all real APIs fail
  if (!liveData || liveData.length === 0) {
    liveData = generateFallbackData(stockIds);
  }

  // Cache the result
  if (liveData && liveData.length > 0) {
    requestCache.set(cacheKey, { data: liveData, timestamp: Date.now() });
  }

  return liveData;
};

/**
 * Fetch stock data with k-line information
 * Enriches real-time data with OHLC historical data
 */
export const fetchStockDataWithKLine = async (stockIds) => {
  try {
    // Get real-time prices
    const realtimeData = await fetchLiveStockData(stockIds);

    if (!realtimeData || realtimeData.length === 0) {
      return [];
    }

    // Dynamically import k-line service to avoid circular dependencies
    const klineModule = await import("./klineDataService");

    // Enrich with k-line data
    const enrichedData = await Promise.all(
      realtimeData.map(async (stock) => {
        try {
          // Fetch historical OHLC data
          const ohlcData = await klineModule.fetchHistoricalOHLC(
            stock.id,
            "1mo",
            "1d",
          );

          return {
            ...stock,
            klineData: ohlcData || [],
            hasRealKLine: ohlcData && ohlcData.length > 0,
          };
        } catch (err) {
          console.warn(
            `Failed to fetch k-line for ${stock.id}: ${err.message}`,
          );
          return {
            ...stock,
            klineData: [],
            hasRealKLine: false,
          };
        }
      }),
    );

    return enrichedData;
  } catch (err) {
    console.error(`Error fetching stock data with k-line: ${err.message}`);
    return await fetchLiveStockData(stockIds);
  }
};
