import React, { useState, useEffect, useCallback, useMemo } from "react";
import StockCard from "./StockCard";
import StockDetailModal from "./StockDetailModal";
import { stocks, isGrowthStock, otcStocks } from "../data/stocks";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLiveStockData, searchTaiwanStocks } from "../services/stockApi";
import { useLanguage } from "../context/LanguageContext";
import { getNetworkMonitor } from "../utils/networkUtils";
import { getMarketStatus, getMarketStatusColor } from "../utils/marketStatus";

const isDev = import.meta.env.DEV;

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Dashboard = () => {
  const { t, lang } = useLanguage();
  const [filterGrowth, setFilterGrowth] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveStocks, setLiveStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [error, setError] = useState(null);
  const [networkStatus, setNetworkStatus] = useState("online");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  // Update market status every minute
  useEffect(() => {
    const updateStatus = () => setMarketStatus(getMarketStatus());
    const interval = setInterval(updateStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Benchmarks: market index (Yahoo symbols)
  const benchmarkAssets = useMemo(
    () => [
      {
        id: "^TWII",
        symbol: "^TWII",
        name_zh: "加權指數",
        name_en: "TAIEX",
        industry_zh: "市場指數",
        industry_en: "Market Index",
        growthScore: 0,
        market: "INDEX",
      },
    ],
    [],
  );

  const initialStockIds = useMemo(
    () => [...benchmarkAssets.map((s) => s.id), ...stocks.map((s) => s.id)],
    [benchmarkAssets],
  );
  const stockMeta = useMemo(
    () => [...benchmarkAssets, ...stocks, ...otcStocks],
    [benchmarkAssets],
  );

  // Seed placeholders so benchmarks show even before first fetch succeeds
  useEffect(() => {
    setLiveStocks((prev) => {
      if (prev.length > 0) return prev;
      return benchmarkAssets;
    });
  }, [benchmarkAssets]);

  const refreshData = useCallback(
    async (ids = null) => {
      setIsLoading(true);
      setError(null);

      try {
        // Refresh all currently tracked stocks + initial list
        const currentIdsInState = liveStocks.map((s) => s.id);
        const idsToRefresh =
          ids ||
          Array.from(new Set([...initialStockIds, ...currentIdsInState]));

        const data = await fetchLiveStockData(idsToRefresh);

        if (data.length > 0) {
          setLiveStocks((prev) => {
            const existingMap = new Map(prev.map((s) => [s.id, s]));
            data.forEach((s) => {
              const meta = stockMeta.find((m) => m.id === s.id);
              const apiName = s.name || s.id;
              existingMap.set(s.id, {
                ...s,
                name_zh: meta?.name_zh || apiName,
                name_en: meta?.name_en || apiName,
                industry_zh:
                  meta?.industry_zh ||
                  (meta?.market === "TWO" ? "興櫃" : "上市櫃"),
                industry_en:
                  meta?.industry_en ||
                  (meta?.market === "TWO" ? "TWO" : "TW Listed"),
                growthScore:
                  meta?.growthScore || (Math.abs(s.change) > 2.5 ? 96 : 65),
              });
            });
            return Array.from(existingMap.values());
          });

          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const dd = String(now.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}/${mm}/${dd}`;

          const timeStr = now.toLocaleTimeString(
            navigator.language || "zh-TW",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            },
          );

          const offsetMinutes = -now.getTimezoneOffset();
          const absOffset = Math.abs(offsetMinutes);
          const oH = String(Math.floor(absOffset / 60)).padStart(2, "0");
          const oM = String(absOffset % 60).padStart(2, "0");
          const offsetStr = `GMT${offsetMinutes >= 0 ? "+" : "-"}${oH}:${oM}`;

          setLastUpdated(`${dateStr} ${timeStr} (${offsetStr}) [✓ Real Data]`);
          setError(null);
        }
      } catch (err) {
        if (isDev) console.error("[Dashboard] Error:", err);
        setError(`API Error: ${err.message}`);
        setLiveStocks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [initialStockIds, lang, stockMeta],
  );

  useEffect(() => {
    refreshData(initialStockIds);

    // Only refresh when the tab is visible to avoid wasted requests
    const tick = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };

    const interval = setInterval(tick, 1500);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshData();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Monitor network status
    const networkMonitor = getNetworkMonitor();
    const unsubscribe = networkMonitor.subscribe((status) => {
      setNetworkStatus(status);
      if (status === "online") {
        console.log("[Dashboard] Network recovered, refreshing data...");
        refreshData(initialStockIds);
      }
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [initialStockIds, refreshData]);

  useEffect(() => {
    // Detect valid 4-digit TW stock ID (using debounced value)
    if (
      debouncedSearchQuery.length === 4 &&
      /^\d+$/.test(debouncedSearchQuery)
    ) {
      const exists = liveStocks.some((s) => s.id === debouncedSearchQuery);
      if (!exists) refreshData([debouncedSearchQuery]);
    }
  }, [debouncedSearchQuery, liveStocks, refreshData]);

  // Fetch search suggestions for any TW/TWO ticker
  useEffect(() => {
    const q = debouncedSearchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);

    searchTaiwanStocks(q)
      .then((res) => {
        if (!active) return;
        setSearchResults(res || []);
      })
      .catch((err) => {
        if (isDev) console.error("[Search]", err);
        if (active) setSearchResults([]);
      })
      .finally(() => {
        if (active) setSearchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearchQuery]);

  // Monitor URL parameters for stock symbol
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const symbolParam = params.get("symbol");

    if (symbolParam && symbolParam.length > 0) {
      const cleanSymbol = String(symbolParam).trim().toUpperCase();
      // Only set if valid 4-digit stock ID
      if (/^\d{4}$/.test(cleanSymbol)) {
        const stock = liveStocks.find((s) => s.id === cleanSymbol);
        if (stock) {
          setSelectedStock(stock);
          if (isDev) console.log(`[URL] Auto-open stock: ${cleanSymbol}`);
        } else if (liveStocks.length > 0) {
          // Try to fetch this stock if not in list
          refreshData([cleanSymbol]).then(() => {
            setTimeout(() => {
              const found = liveStocks.find((s) => s.id === cleanSymbol);
              if (found) setSelectedStock(found);
            }, 500);
          });
        }
      }
    }
  }, []);

  const displayedStocks = useMemo(() => {
    return liveStocks
      .filter((stock) => {
        const nameMatch =
          lang === "zh"
            ? stock.name_zh
                ?.toLowerCase()
                .includes(debouncedSearchQuery.toLowerCase())
            : stock.name_en
                ?.toLowerCase()
                .includes(debouncedSearchQuery.toLowerCase());
        const idMatch = stock.id.includes(debouncedSearchQuery);
        const categoryMatch = filterGrowth ? isGrowthStock(stock) : true;
        return (nameMatch || idMatch) && categoryMatch;
      })
      .sort((a, b) => {
        if (b.growthScore !== a.growthScore)
          return b.growthScore - a.growthScore;
        return a.id.localeCompare(b.id);
      });
  }, [liveStocks, debouncedSearchQuery, filterGrowth, lang]);

  const handleStockClick = useCallback((stock) => {
    setSelectedStock(stock);
    // Update URL parameter for shareability
    window.history.pushState({}, "", `?symbol=${stock.id}`);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStock(null);
    // Clear URL parameter when closing
    window.history.pushState({}, "", window.location.pathname);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSelectSearchResult = useCallback(
    (item) => {
      setSearchQuery(item.id);
      setSearchResults([]);
      refreshData([item.id]);
    },
    [refreshData],
  );

  const handleFilterAll = useCallback(() => {
    setFilterGrowth(false);
  }, []);

  const handleFilterGrowth = useCallback(() => {
    setFilterGrowth(true);
  }, []);

  // Extract market context (index only) for AI analysis
  const marketContext = useMemo(() => {
    const byId = new Map(liveStocks.map((s) => [s.id, s]));
    const index = byId.get("^TWII") || null;

    return {
      index,
      benchmarks: [index].filter(Boolean),
    };
  }, [liveStocks]);

  return (
    <>
      <section
        id="dashboard"
        className="py-16 md:py-24 px-4 md:px-6 lg:px-12 max-w-[1440px] mx-auto scroll-mt-20"
      >
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 md:mb-16 gap-6 md:gap-10 text-center sm:text-left">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-center lg:justify-start gap-3 md:gap-5 mb-4 flex-wrap">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                {t("marketOverview")}
              </h2>

              {/* Market Status Light Indicator */}
              <div
                className="relative group cursor-pointer"
                title={
                  lang === "zh" ? marketStatus.label : marketStatus.labelEn
                }
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full ${
                    marketStatus.status === "open"
                      ? "bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8)]"
                      : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                  }`}
                >
                  {marketStatus.status === "open" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-green-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.div>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-slate-900/95 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-xs font-semibold text-white backdrop-blur-xl z-10">
                  {lang === "zh" ? marketStatus.label : marketStatus.labelEn}
                </div>
              </div>

              {isLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="text-premium-accent"
                >
                  <svg
                    className="w-6 md:w-8 h-6 md:h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              )}
            </div>
            <p className="text-slate-400 text-xs md:text-sm font-bold tracking-widest uppercase">
              {t("lastUpdated")}:{" "}
              <span className="text-premium-accent font-mono bg-premium-accent/10 ml-2 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-2xl border border-premium-accent/20 shadow-[0_0_20px_rgba(56,189,248,0.1)] text-[11px] md:text-sm">
                {lastUpdated || t("refreshing")}
              </span>
            </p>

            {error && (
              <p className="text-red-400 text-[10px] md:text-xs mt-2 bg-red-500/10 px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-red-500/20">
                ⚠️ {error}
              </p>
            )}
            {networkStatus === "offline" && (
              <p className="text-yellow-400 text-[10px] md:text-xs mt-2 bg-yellow-500/10 px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-yellow-500/20">
                📡 {t("offlineMode") || "Offline Mode - Using Cached Data"}
              </p>
            )}
          </div>

          <div className="flex flex-col w-full lg:w-auto gap-4">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-slate-800/20 border border-white/5 rounded-xl md:rounded-[2rem] px-4 md:px-6 py-3 md:py-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-premium-accent/50 focus:border-premium-accent transition-all pl-10 md:pl-14 backdrop-blur-3xl shadow-2xl text-sm md:text-lg font-medium"
              />
              <span className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-lg md:text-xl group-focus-within:scale-110 transition-transform">
                🔍
              </span>

              {debouncedSearchQuery.trim().length >= 2 && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl max-h-64 overflow-y-auto backdrop-blur-xl">
                  {searchLoading && (
                    <div className="px-4 py-3 text-sm text-slate-300">
                      {t("searching") || "搜尋中..."}
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      {t("noResults") || "沒有結果"}
                    </div>
                  )}

                  {!searchLoading &&
                    searchResults.map((item) => (
                      <button
                        key={item.symbol}
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            {item.id}
                          </span>
                          <span className="text-xs text-slate-300">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase text-slate-400">
                          {item.exchange}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <div className="p-2 bg-white/5 backdrop-blur-3xl rounded-xl md:rounded-[2rem] flex gap-2 flex-1 border border-white/5 shadow-inner">
                <button
                  onClick={handleFilterAll}
                  className={`flex-1 px-4 md:px-8 py-2 md:py-3.5 rounded-lg md:rounded-3xl text-[10px] md:text-[11px] font-black tracking-[0.15em] md:tracking-[0.2em] uppercase transition-all whitespace-nowrap ${!filterGrowth ? "bg-premium-accent text-premium-bg shadow-2xl shadow-premium-accent/30 scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  {t("allAssets")}
                </button>
                <button
                  onClick={handleFilterGrowth}
                  className={`flex-1 px-4 md:px-8 py-2 md:py-3.5 rounded-lg md:rounded-3xl text-[10px] md:text-[11px] font-black tracking-[0.15em] md:tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap ${filterGrowth ? "bg-premium-success text-black shadow-2xl shadow-green-500/30 scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  {t("growthFilter")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmarks: Market Index */}
        {marketContext.index ? (
          <div className="mb-10 pb-8 border-b border-white/10">
            <div
              className={`p-5 md:p-8 rounded-3xl border-2 shadow-xl flex items-center justify-between transition-all ${
                (marketContext.index.change || 0) >= 0
                  ? "border-premium-success/30 bg-gradient-to-br from-premium-success/10 to-transparent"
                  : "border-premium-loss/30 bg-gradient-to-br from-premium-loss/10 to-transparent"
              }`}
            >
              <div className="space-y-2">
                <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-slate-400 font-black">
                  市場指數
                </p>
                <p className="text-2xl md:text-4xl font-black text-white leading-tight">
                  {marketContext.index.name_zh || marketContext.index.name_en}
                </p>
                <p className="text-slate-400 text-xs md:text-sm font-mono">
                  {marketContext.index.symbol}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-4xl md:text-5xl font-black text-white leading-none">
                  {marketContext.index.price ?? "--"}
                </p>
                <p
                  className={`mt-3 inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-base md:text-lg font-black border-2 ${
                    (marketContext.index.change || 0) >= 0
                      ? "text-premium-success border-premium-success/50 bg-premium-success/10"
                      : "text-premium-loss border-premium-loss/50 bg-premium-loss/10"
                  }`}
                >
                  {(marketContext.index.change || 0) >= 0 ? "▲" : "▼"}
                  {Math.abs(marketContext.index.change || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="mb-10 pb-8 border-b border-white/10">
            <div className="p-5 md:p-8 rounded-3xl border border-white/10 bg-slate-900/50 shadow-lg animate-pulse flex items-center justify-between">
              <div className="space-y-2 w-full">
                <div className="h-3 w-32 bg-white/10 rounded"></div>
                <div className="h-6 w-48 bg-white/10 rounded"></div>
                <div className="h-3 w-32 bg-white/10 rounded"></div>
              </div>
              <div className="text-right">
                <div className="h-10 w-24 bg-white/10 rounded ml-auto"></div>
                <div className="h-6 w-20 bg-white/10 rounded mt-3 ml-auto"></div>
              </div>
            </div>
          </div>
        ) : null}

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 lg:gap-12 min-h-[400px]"
        >
          <AnimatePresence mode="popLayout">
            {displayedStocks.length === 0 && isLoading
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`skel-${idx}`}
                    className="w-full h-full flex justify-center"
                  >
                    <div className="w-full h-[220px] rounded-2xl border border-white/10 bg-slate-900/50 animate-pulse"></div>
                  </div>
                ))
              : displayedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="w-full h-full flex justify-center"
                  >
                    <StockCard stock={stock} onClick={handleStockClick} />
                  </div>
                ))}
          </AnimatePresence>
        </motion.div>

        {displayedStocks.length === 0 && !isLoading && (
          <div className="text-center py-32 md:py-48 px-6 md:px-10 border-2 border-dashed border-white/5 rounded-2xl md:rounded-[4rem] bg-gradient-to-b from-white/[0.03] to-transparent shadow-2xl">
            <p className="text-slate-500 text-lg md:text-xl font-black tracking-widest uppercase opacity-40 italic">
              {t("noStocks")}
            </p>
          </div>
        )}
      </section>

      <StockDetailModal
        stock={selectedStock}
        onClose={handleCloseModal}
        marketContext={marketContext}
      />
    </>
  );
};

export default React.memo(Dashboard);
