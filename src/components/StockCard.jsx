import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAISuggestion } from "../services/aiAnalysis";
import { useLanguage } from "../context/LanguageContext";
import MiniKLineChart from "./MiniKLineChart";
import { fetchHistoricalOHLC } from "../services/klineDataService";

const StockCard = ({ stock, onClick }) => {
  const { t, lang } = useLanguage();
  const isUp = stock.change >= 0;
  const [chartData, setChartData] = useState([]);

  // Fetch real K-line data for mini chart
  useEffect(() => {
    if (!stock || !stock.id) return;

    const fetchChartData = async () => {
      try {
        // Fetch 1 week of daily data for mini chart
        const realData = await fetchHistoricalOHLC(stock.id, "1w", "1d");
        if (realData && realData.length > 0) {
          setChartData(realData);
        } else {
          setChartData([]);
        }
      } catch (err) {
        console.warn(
          `[StockCard] Chart data fetch failed for ${stock.id}: ${err.message}`,
        );
        setChartData([]);
      }
    };

    fetchChartData();
  }, [stock?.id]);

  // Memoize AI suggestion calculation
  const ai = useMemo(
    () => getAISuggestion(stock, lang),
    [stock.id, stock.price, stock.change, lang],
  );
  const isBuy = ai.action === t("actions.strongBuy");

  // Dynamic names based on language
  const stockName = lang === "zh" ? stock.name_zh : stock.name_en;
  const industry = lang === "zh" ? stock.industry_zh : stock.industry_en;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 40px -10px rgba(56, 189, 248, 0.4)",
      }}
      onClick={() => onClick(stock)}
      className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border ${isBuy ? "border-premium-success/50" : "border-slate-800"} bg-premium-card hover:border-premium-accent/50 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col h-full`}
    >
      <div
        className={`absolute -right-12 top-4 md:top-6 rotate-45 px-12 py-1 text-[9px] md:text-[10px] font-bold tracking-widest text-black ${isBuy ? "bg-premium-success" : "bg-slate-700"}`}
      >
        {ai.action}
      </div>

      {/* Data Source Indicator */}
      {stock.isFallback && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-[7px] md:text-[8px] font-bold text-yellow-300 uppercase tracking-wider">
          ⚠️ Demo
        </div>
      )}
      {stock.isMockWarning && !stock.isFallback && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-[7px] md:text-[8px] font-bold text-red-300 uppercase tracking-wider">
          ⚠️ Mock
        </div>
      )}
      {stock.isLive && !stock.isMockWarning && !stock.isFallback && (
        <div className="absolute top-2 md:top-3 left-2 md:left-3 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-[7px] md:text-[8px] font-bold text-green-300 uppercase tracking-wider">
          ✓ Live
        </div>
      )}

      <div className="flex justify-between items-start mb-4 md:mb-6 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-xl font-bold text-white group-hover:text-premium-accent transition-colors truncate">
            {stockName}
          </h3>
          <p className="text-slate-400 text-[10px] md:text-xs font-mono mt-1">
            {stock.symbol}
          </p>
        </div>
        <span className="px-2 md:px-3 py-1 bg-slate-700/50 rounded text-[8px] md:text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
          {industry}
        </span>
      </div>

      <div className="flex justify-between items-end mb-4 md:mb-6 gap-2">
        <div>
          <p className="text-[9px] md:text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
            {t("currentPrice")}
          </p>
          <motion.p
            key={stock.price}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl md:text-3xl font-mono font-bold text-white"
          >
            NT${stock.price}
          </motion.p>
        </div>
        <div
          className={`text-right ${isUp ? "text-premium-success" : "text-premium-loss"}`}
        >
          <p className="text-lg md:text-2xl font-bold flex items-center justify-end gap-1">
            {isUp ? "▲" : "▼"} {Math.abs(stock.change)}%
          </p>
        </div>
      </div>

      <div className="mt-auto pt-3 md:pt-4 border-t border-slate-800/50 space-y-3 md:space-y-4">
        {/* Mini K-Line Chart */}
        <div className="h-16 md:h-20 -mx-4 md:-mx-6 px-2 bg-slate-900/30 rounded-lg border border-slate-700/30">
          <MiniKLineChart stock={stock} data={chartData} isUp={isUp} />
        </div>

        {/* Statistics */}
        <div className="text-[10px] md:text-[11px] space-y-3 md:space-y-4">
          <div className="flex justify-between items-center text-slate-400">
            <span>{t("winRate")}</span>
            <span className="text-premium-accent font-bold text-sm md:text-base">
              {ai.confidence}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ai.confidence}%` }}
              className={`h-full ${isBuy ? "bg-premium-success" : "bg-premium-accent"}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4">
            <div className="p-2 md:p-3 bg-slate-900/50 rounded-lg md:rounded-xl border border-white/5">
              <p className="text-slate-500 text-[8px] md:text-[9px] mb-1 uppercase font-bold tracking-wider">
                {t("targetPrice")}
              </p>
              <p className="text-premium-success font-black text-sm md:text-base">
                NT${ai.strategies.aggressive.targetPrice}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-slate-900/50 rounded-lg md:rounded-xl border border-white/5">
              <p className="text-slate-500 text-[8px] md:text-[9px] mb-1 uppercase font-bold tracking-wider">
                {t("stopLoss")}
              </p>
              <p className="text-premium-loss font-black text-sm md:text-base">
                NT${ai.strategies.aggressive.stopLoss}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(StockCard);
