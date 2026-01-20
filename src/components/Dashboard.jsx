import React, { useState, useEffect, useCallback, useMemo } from "react";
import StockCard from "./StockCard";
import StockDetailModal from "./StockDetailModal";
import { stocks, isGrowthStock } from "../data/stocks";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLiveStockData } from "../services/stockApi";
import { useLanguage } from "../context/LanguageContext";
import { getNetworkMonitor } from "../utils/networkUtils";

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
  const [hasRealData, setHasRealData] = useState(true); // Track if using real-time data

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const initialStockIds = useMemo(() => stocks.map((s) => s.id), []);

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
              const mockInfo = stocks.find((m) => m.id === s.id);
              const apiName = s.name || s.id;
              existingMap.set(s.id, {
                ...s,
                name_zh: mockInfo?.name_zh || apiName,
                name_en: mockInfo?.name_en || apiName, // Fixed: proper fallback for English
                industry_zh:
                  mockInfo?.industry_zh ||
                  (s.id.startsWith("6") ? "興櫃" : "上市櫃"),
                industry_en:
                  mockInfo?.industry_en ||
                  (s.id.startsWith("6") ? "EMC" : "TW Listed"),
                growthScore:
                  mockInfo?.growthScore || (Math.abs(s.change) > 2.5 ? 96 : 65),
                isFallback: s.isFallback || false, // Track if using fallback data
                isLive: s.isLive || false, // Track if real-time data
                isMockWarning: s.isMockWarning || false, // Track if mock data warning
              });
            });
            return Array.from(existingMap.values());
          });

          // PRECISION USER-LOCAL TIME & DATE SYNC (YYYY/MM/DD)
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

          // Calculate GMT Offset manually for absolute clarity
          const offsetMinutes = -now.getTimezoneOffset();
          const absOffset = Math.abs(offsetMinutes);
          const oH = String(Math.floor(absOffset / 60)).padStart(2, "0");
          const oM = String(absOffset % 60).padStart(2, "0");
          const offsetStr = `GMT${offsetMinutes >= 0 ? "+" : "-"}${oH}:${oM}`;

          // Check if using real-time vs mock data
          const hasMockWarning = data.some((d) => d.isMockWarning);
          const hasRealDataItems = data.some((d) => d.isLive);

          setHasRealData(hasRealDataItems && !hasMockWarning);

          if (hasMockWarning) {
            setLastUpdated(
              `${dateStr} ${timeStr} (${offsetStr}) [模擬數據 ⚠️]`,
            );
            console.warn("⚠️ Dashboard: Using mock data - API unavailable");
          } else if (hasRealDataItems) {
            setLastUpdated(`${dateStr} ${timeStr} (${offsetStr}) [實時 ✓]`);
          } else {
            setLastUpdated(`${dateStr} ${timeStr} (${offsetStr})`);
          }
        }
      } catch (err) {
        console.error("Error refreshing stock data:", err);
        // More descriptive error messages
        let errorMsg = "Failed to fetch stock data";
        if (err.message.includes("socket")) {
          errorMsg = "Network connection error - using cached data";
        } else if (err.message.includes("timeout")) {
          errorMsg = "Request timeout - retrying...";
        }
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [initialStockIds, liveStocks, lang],
  );

  useEffect(() => {
    refreshData(initialStockIds);
    const interval = setInterval(() => refreshData(), 3000); // Real-time: 3 seconds - OPTIMIZED from 5s

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
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStock(null);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleFilterAll = useCallback(() => {
    setFilterGrowth(false);
  }, []);

  const handleFilterGrowth = useCallback(() => {
    setFilterGrowth(true);
  }, []);

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
            {!hasRealData && liveStocks.length > 0 && (
              <p className="text-red-400 text-[10px] md:text-xs mt-2 bg-red-500/20 px-3 md:px-4 py-2 rounded-lg md:rounded-xl border border-red-500/40 font-semibold animate-pulse">
                ⚠️{" "}
                {t("mockDataWarning") ||
                  "Warning: Using Mock/Cached Data - API Unavailable"}
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

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 lg:gap-12 min-h-[400px]"
        >
          <AnimatePresence mode="popLayout">
            {displayedStocks.map((stock) => (
              <div key={stock.id} className="w-full h-full flex justify-center">
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

      <StockDetailModal stock={selectedStock} onClose={handleCloseModal} />
    </>
  );
};

export default React.memo(Dashboard);
