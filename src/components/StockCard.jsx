import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAISuggestion } from "../services/aiAnalysis";
import { useLanguage } from "../context/LanguageContext";
import TechnicalIndicatorsCard from "./TechnicalIndicatorsCard";
import MiniKLineChart from "./MiniKLineChart";

const StockCard = ({ stock, onClick }) => {
  const { t, lang } = useLanguage();
  const isUp = stock.change >= 0;

  // Use state for AI suggestion since it's now async
  const [ai, setAi] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAI = async () => {
      try {
        const suggestion = await getAISuggestion(stock, lang);
        if (isMounted) {
          setAi(suggestion);
        }
      } catch (err) {
        console.error("AI suggestion error:", err);
        // Fallback to basic suggestion with all required fields
        if (isMounted) {
          setAi({
            action: t("actions.neutral"),
            confidence: 50,
            reason: "Analysis unavailable",
            strategies: {
              aggressive: {
                targetPrice: (stock.price * 1.05).toFixed(2),
                stopLoss: (stock.price * 0.95).toFixed(2),
              },
            },
          });
        }
      }
    };

    fetchAI();

    return () => {
      isMounted = false;
    };
  }, [stock.id, stock.price, stock.change, lang, t]);

  const isBuy = ai ? ai.action === t("actions.strongBuy") : false;

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
      className={`relative p-5 md:p-7 rounded-2xl md:rounded-3xl border ${isBuy ? "border-premium-success/60" : "border-slate-700/60"} bg-premium-card hover:border-premium-accent/60 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col h-full`}
    >
      <div
        className={`absolute -right-14 top-3 md:top-5 rotate-45 px-16 py-1.5 text-[9px] md:text-[10px] font-bold tracking-widest text-black opacity-95 ${isBuy ? "bg-premium-success" : "bg-slate-600"}`}
      >
        {ai ? ai.action : t("actions.neutral")}
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

      <div className="flex justify-between items-start mb-6 md:mb-8 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-lg font-bold text-white group-hover:text-premium-accent transition-colors truncate leading-tight">
            {stockName}
          </h3>
          <p className="text-slate-500 text-[10px] md:text-xs font-mono mt-2">
            {stock.symbol}
          </p>
        </div>
        <span className="px-3 md:px-4 py-1.5 bg-slate-700/40 rounded-lg text-[8px] md:text-[9px] text-slate-400 whitespace-nowrap flex-shrink-0 font-medium">
          {industry}
        </span>
      </div>

      <div className="flex justify-between items-end mb-7 md:mb-9 gap-3">
        <div>
          <p className="text-[8px] md:text-[9px] text-slate-500 mb-2 uppercase tracking-wider font-semibold">
            {t("currentPrice")}
          </p>
          <motion.p
            key={stock.price}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className={`font-mono font-bold text-white leading-tight overflow-hidden text-ellipsis ${
              stock.price > 9999
                ? "text-xl md:text-2xl"
                : stock.price > 999
                  ? "text-2xl md:text-3xl"
                  : "text-2xl md:text-3xl"
            }`}
          >
            NT${stock.price}
          </motion.p>
        </div>
        <div
          className={`text-right ${isUp ? "text-premium-success" : "text-premium-loss"}`}
        >
          <p className="text-lg md:text-2xl font-bold flex items-center justify-end gap-1.5 leading-tight">
            {isUp ? "▲" : "▼"} {Math.abs(stock.change)}%
          </p>
        </div>
      </div>

      {/* K-Line Chart */}
      <div className="mb-6 md:mb-8 rounded-xl md:rounded-2xl border border-slate-700/40 overflow-hidden bg-slate-900/40 h-24 md:h-32">
        <MiniKLineChart stock={stock} isUp={isUp} />
      </div>

      <div className="mt-auto pt-6 md:pt-8 border-t border-slate-700/40 space-y-5 md:space-y-6">
        {/* Technical Indicators Card */}
        <TechnicalIndicatorsCard stock={stock} />

        {/* Statistics */}
        {ai ? (
          <div className="text-[10px] md:text-[11px] space-y-4 md:space-y-5">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-medium">{t("winRate")}</span>
              <span className="text-premium-accent font-bold text-sm md:text-base">
                {ai.confidence}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-800/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ai.confidence}%` }}
                className={`h-full ${isBuy ? "bg-premium-success" : "bg-premium-accent"}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-5 mt-5 md:mt-6">
              <div className="p-3 md:p-4 bg-slate-900/60 rounded-xl md:rounded-2xl border border-white/8">
                <p className="text-slate-500 text-[8px] md:text-[9px] mb-2 uppercase font-bold tracking-wider">
                  {t("targetPrice")}
                </p>
                <p className="text-premium-success font-black text-xs md:text-sm leading-tight">
                  NT${ai.strategies.aggressive.targetPrice}
                </p>
              </div>
              <div className="p-3 md:p-4 bg-slate-900/60 rounded-xl md:rounded-2xl border border-white/8">
                <p className="text-slate-500 text-[8px] md:text-[9px] mb-2 uppercase font-bold tracking-wider">
                  {t("stopLoss")}
                </p>
                <p className="text-premium-loss font-black text-xs md:text-sm leading-tight">
                  NT${ai.strategies.aggressive.stopLoss}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[10px] md:text-[11px] space-y-4 md:space-y-5">
            <div className="flex justify-center items-center text-slate-500 py-8">
              <div className="animate-pulse">分析中...</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(StockCard);
