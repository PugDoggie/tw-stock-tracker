/**
 * Stock Data API Service - REAL-TIME TWSE API
 * Priority Strategy:
 * 1. Local proxy server (localhost:3001)
 * 2. Direct TWSE API (with CORS workaround)
 * 3. Yahoo Finance proxy
 * (No mock fallback; errors bubble so UI shows failure)
 */

import {
  stocks,
  isGrowthStock,
  otcStocks,
  searchableStocks,
} from "../data/stocks";

// Predefined symbols that should NOT append TW/TWO suffix (index only)
const SPECIAL_SYMBOL_MAP = {
  "^TWII": "^TWII", // TAIEX 台灣加權指數
};

const isDev = import.meta.env.DEV;
const requestCache = new Map();
const CACHE_TTL = 1500; // 1.5 seconds cache for faster real-time updates
const round2 = (n) => (Number.isFinite(n) ? Number(n.toFixed(2)) : 0);
const refdataCache = new Map();
const refdataAll = { data: null, timestamp: 0, ttl: 60 * 60 * 1000 };

// API base for the local proxy server (avoid browser CORS)
// In production: use relative path /api (same domain)
// In dev: use http://localhost:3001
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? ""
    : "http://localhost:3001");

// Build market type map from stock data
const stockMarketMap = new Map();
stocks.forEach((s) => stockMarketMap.set(s.id, "TW"));
otcStocks.forEach((s) => stockMarketMap.set(s.id, s.market || "TWO"));

const OTC_ID_SET = new Set([...(otcStocks || []).map((s) => s.id)]);

// Determine correct Yahoo Finance suffix for TW/TWO tickers
const getYahooSymbol = (id) => {
  const cleanId = String(id).trim();

  // Return raw symbol for special assets (index only)
  if (SPECIAL_SYMBOL_MAP[cleanId]) return SPECIAL_SYMBOL_MAP[cleanId];

  // Check market map first (most accurate), fall back to OTC_ID_SET for backwards compatibility
  const market = stockMarketMap.get(cleanId);
  const suffix =
    market === "TWO" || (market === undefined && OTC_ID_SET.has(cleanId))
      ? "TWO"
      : "TW";
  return `${cleanId}.${suffix}`;
};

const getSymbolCandidates = (id) => {
  const cleanId = String(id).trim();

  // Check if this is a special symbol (index only) - return as-is
  if (SPECIAL_SYMBOL_MAP[cleanId]) {
    return [SPECIAL_SYMBOL_MAP[cleanId]];
  }

  // For known stocks, return single symbol
  const market = stockMarketMap.get(cleanId);
  if (market !== undefined) {
    return [getYahooSymbol(id)];
  }

  // For unknown stocks, try both .TW and .TWO (system will auto-determine which works)
  return [`${cleanId}.TW`, `${cleanId}.TWO`];
};

// Fetch reference data (name/market) for a stock ID via proxy; cached in-memory
const fetchRefdataEntry = async (stockId) => {
  const key = String(stockId).trim();
  if (refdataCache.has(key)) return refdataCache.get(key);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const url = `${API_BASE_URL}/api/refdata/search?stockId=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    refdataCache.set(key, data);
    return data;
  } catch (err) {
    if (isDev) console.warn(`[Refdata] ${stockId}: ${err.message}`);
    refdataCache.set(key, null);
    return null;
  }
};

const loadRefdataAll = async () => {
  if (refdataAll.data && Date.now() - refdataAll.timestamp < refdataAll.ttl) {
    return refdataAll.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const url = `${API_BASE_URL}/api/refdata/all`;

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      refdataAll.data = data;
      refdataAll.timestamp = Date.now();
      return data;
    }
  } catch (err) {
    if (isDev) console.warn(`[Refdata All] ${err.message}`);
  }

  return refdataAll.data || [];
};

const enrichLiveWithRefdata = async (items) => {
  return Promise.all(
    (items || []).map(async (item) => {
      if (!/^\d{3,4}$/.test(item?.id)) return item;
      const needsZh = !item?.name_zh;
      const needsEn = !item?.name_en;
      const needsIndustry = !item?.industry_zh && !item?.industry_en;
      if (!needsZh && !needsEn && !needsIndustry) return item;

      const ref = await fetchRefdataEntry(item.id);
      if (!ref) return item;

      return {
        ...item,
        name_zh: ref.name_zh || item.name_zh || item.name,
        name_en: ref.name_en || item.name_en || item.name,
        industry_zh: ref.industry_zh || item.industry_zh,
        industry_en: ref.industry_en || item.industry_en,
        market: ref.market || item.market,
      };
    }),
  );
};

// Exported helper for UI to enrich metadata when local lists lack Chinese names
export const fetchRefdataEntryPublic = fetchRefdataEntry;

/**
 * Fetch from local proxy server (Primary method)
 * This avoids CORS issues and provides fast real-time data
 */
const fetchFromProxyServer = async (stockIds) => {
  try {
    // Separate regular stocks from futures
    const regularStocks = [];
    const futures = [];

    stockIds.forEach((id) => {
      if (SPECIAL_SYMBOL_MAP[id]) {
        futures.push(id);
      } else {
        regularStocks.push(id);
      }
    });

    // Build query for regular stocks
    if (regularStocks.length === 0) {
      // Only futures requested; these are handled via Yahoo
      return [];
    }

    const tseQuery = regularStocks.map((id) => `tse_${id}.tw`).join("|");
    const otcQuery = regularStocks.map((id) => `otc_${id}.tw`).join("|");
    const emcQuery = regularStocks.map((id) => `emc_${id}.tw`).join("|");
    const query = `${tseQuery}|${otcQuery}|${emcQuery}`;

    const url = `${API_BASE_URL}/api/twse?ex_ch=${encodeURIComponent(query)}`;

    if (isDev)
      console.log(
        `[Proxy] Fetching ${stockIds.length} stocks (${regularStocks.length} regular + ${futures.length} futures)...`,
      );

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
 * Handles both regular stocks and futures (WTX&, WMT&, WTM&).
 */
const fetchFromYahooTaiwan = async (stockIds) => {
  try {
    // All symbols go through Yahoo now (includes futures)
    const allIds = stockIds;

    if (allIds.length === 0) {
      if (isDev) console.log(`[Yahoo] No symbols to fetch`);
      return null;
    }

    if (isDev)
      console.log(
        `[Yahoo] Fetching ${allIds.length} symbols (${allIds.join(", ")})...`,
      );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Build symbol list - no fallbacks anymore
    const symbolsList = [];
    const symbolToIds = new Map();

    allIds.forEach((id) => {
      const candidates = getSymbolCandidates(id);
      candidates.forEach((sym) => {
        if (!symbolsList.includes(sym)) {
          symbolsList.push(sym);
          symbolToIds.set(sym, []);
        }
        // Track which requested ID this symbol maps to
        symbolToIds.get(sym).push(id);
      });
    });

    const symbols = symbolsList.join(",");
    const url = `${API_BASE_URL}/api/yahoo/quote?symbols=${encodeURIComponent(symbols)}`;

    if (isDev)
      console.log(`[Yahoo] Requesting symbols: ${symbolsList.join(", ")}`);

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
      const results = [];
      const processedIds = new Set();

      data.quoteResponse.result.forEach((item) => {
        // Get list of requested IDs this symbol maps to
        const rawSymbol = item.symbol || "";
        const requestedIds = symbolToIds.get(rawSymbol) || [];

        if (!requestedIds || requestedIds.length === 0) {
          if (isDev) console.warn(`[Yahoo] Symbol ${rawSymbol} not in mapping`);
          return;
        }

        const rawPrice = item.regularMarketPrice || item.ask || item.bid || 0;
        const price = round2(rawPrice);
        const previousClose = round2(item.regularMarketPreviousClose || price);
        const change =
          previousClose > 0
            ? round2(((price - previousClose) / previousClose) * 100)
            : 0;

        const stockData = {
          name: item.longName || item.shortName || "",
          symbol: rawSymbol,
          price,
          change,
          high: round2(item.regularMarketDayHigh || price),
          low: round2(item.regularMarketDayLow || price),
          volume: parseInt(item.regularMarketVolume || 0),
          openPrice: round2(item.regularMarketOpen || previousClose),
          timestamp: Date.now(),
          isLive: true,
          sourceAPI: "Yahoo Finance",
        };

        // Create result entry for each requested ID using this symbol
        requestedIds.forEach((stockId) => {
          if (!processedIds.has(stockId)) {
            processedIds.add(stockId);
            results.push({
              id: stockId,
              ...stockData,
            });
            if (isDev)
              console.log(
                `[Yahoo] ${stockId} (${rawSymbol}): $${price} (${change > 0 ? "+" : ""}${change}%)`,
              );
          }
        });
      });

      if (results.length > 0) {
        if (isDev)
          console.log(
            `[Yahoo] Got ${results.length} items from ${data.quoteResponse.result.length} quotes`,
          );
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
 * Handles both regular stocks and futures contracts
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

// Search TW/TWO stocks via Yahoo Finance search API
export const searchTaiwanStocks = async (query) => {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const qLower = q.toLowerCase();
  const localMatches = (searchableStocks || [])
    .filter((s) => {
      return (
        s.id.includes(q) ||
        (s.name_zh && s.name_zh.includes(q)) ||
        (s.name_en && s.name_en.toLowerCase().includes(qLower))
      );
    })
    .map((s) => ({
      id: s.id,
      symbol: getYahooSymbol(s.id),
      name: `${s.name_zh} / ${s.name_en}`,
      exchange: s.market || "TSE",
    }));

  const merged = new Map();
  localMatches.forEach((item) => merged.set(item.id, item));

  // If user輸入數字代號（3-4碼），即便不在本地清單也先提供一筆候選，避免新股找不到
  if (/^\d{3,4}$/.test(q) && !merged.has(q)) {
    merged.set(q, {
      id: q,
      symbol: getYahooSymbol(q),
      name: q,
      exchange: "TSE",
    });
  }

  // Try proxy refdata to enrich name/market for numeric queries
  if (/^\d{3,4}$/.test(q)) {
    const ref = await fetchRefdataEntry(q);
    if (ref) {
      merged.set(q, {
        id: q,
        symbol: `${q}.${ref.market === "TWO" ? "TWO" : "TW"}`,
        name: `${ref.name_zh}${ref.name_en ? ` / ${ref.name_en}` : ""}`,
        exchange: ref.market || "TSE",
        industry_zh: ref.industry_zh,
        industry_en: ref.industry_en,
      });
    }
  }

  // Broad refdata search (TWSE/TPEX) to support zh/en name queries
  try {
    const refAll = await loadRefdataAll();
    if (Array.isArray(refAll) && refAll.length > 0) {
      refAll
        .filter((item) => {
          const idMatch = item.id && String(item.id).includes(q);
          const zhMatch = item.name_zh && item.name_zh.includes(q);
          const enMatch =
            item.name_en && item.name_en.toLowerCase().includes(qLower);
          return idMatch || zhMatch || enMatch;
        })
        .slice(0, 80)
        .forEach((item) => {
          if (merged.has(item.id)) return;
          merged.set(item.id, {
            id: item.id,
            symbol: `${item.id}.${item.market === "TWO" ? "TWO" : "TW"}`,
            name: `${item.name_zh}${item.name_en ? ` / ${item.name_en}` : ""}`,
            exchange: item.market || "TSE",
            industry_zh: item.industry_zh,
            industry_en: item.industry_en,
          });
        });
    }
  } catch (err) {
    if (isDev) console.warn(`[Search refdata] ${err.message}`);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const url = `${API_BASE_URL}/api/yahoo/search?q=${encodeURIComponent(q)}`;

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
      data.results.forEach((item) => {
        const id = item.id || item.symbol?.replace(/\.\w+$/, "");
        if (!id) return;
        if (merged.has(id)) return;
        merged.set(id, {
          id,
          symbol: item.symbol || getYahooSymbol(id),
          name: item.name,
          exchange: item.exchange || item.market || "TSE",
        });
      });
    }
  } catch (error) {
    if (isDev) console.warn(`[Search] ${error.message}`);
  }

  return Array.from(merged.values()).slice(0, 50);
};

/**
 * Main export: Fetch live stock data (real-time only)

 * Priority (live-only, no demo data):
 * 1. ??Use cached data if fresh (< 800ms)
 * 2. ?�� Try Yahoo Taiwan API (PRIMARY - from tw.stock.yahoo.com)
 * 3. ?? Try proxy server (fallback)
 * 4. ?? Try direct TWSE API (fallback)
 * 5. ??Throw error (no mock data)
 */
export const fetchLiveStockData = async (stockIds) => {
  if (!stockIds || stockIds.length === 0) return [];

  const cacheKey = stockIds.sort().join(",");

  // Strategy 1: Use cache if fresh
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    const cacheAge = Date.now() - cached.timestamp;

    if (cacheAge < CACHE_TTL) {
      if (isDev) console.log(`??[Cache] ${Math.round(cacheAge)}ms old`);
      return cached.data;
    } else if (cacheAge < 3000 && cached.data[0]?.isLive) {
      if (isDev)
        console.log(
          `??[Cache] Stale, returning cached while refreshing in background...`,
        );
      // Background refresh - do NOT recursively call fetchLiveStockData to avoid stack overflow
      // Instead, directly call the fetch strategies
      Promise.all([
        fetchFromYahooTaiwan(stockIds).catch(() => null),
        fetchFromProxyServer(stockIds).catch(() => null),
      ])
        .then((results) => {
          const freshData = results.find((r) => r && r.length > 0);
          if (freshData && freshData.length > 0) {
            requestCache.set(cacheKey, {
              data: freshData,
              timestamp: Date.now(),
            });
            if (isDev) console.log(`??[Cache] Updated with fresh data`);
          }
        })
        .catch((err) => {
          if (isDev) console.error("Background fetch failed:", err);
        });
      return cached.data;
    }
  }

  // Strategy 2: Try Yahoo Taiwan API (now handles all symbols including futures)
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

  // Strategy 5: If all live sources fail, throw so UI can surface the error
  if (!liveData || liveData.length === 0) {
    throw new Error(
      "No live data available (Yahoo / Proxy / TWSE all failed). Please retry.",
    );
  }

  // Enrich with refdata to fill Chinese/English names and industry
  liveData = await enrichLiveWithRefdata(liveData);

  // Cache the result
  requestCache.set(cacheKey, { data: liveData, timestamp: Date.now() });

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
