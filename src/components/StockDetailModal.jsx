import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAISuggestion } from "../services/aiAnalysis";
import { useLanguage } from "../context/LanguageContext";
import KLineChart from "./KLineChart";
import { fetchHistoricalOHLC } from "../services/klineDataService";

const StockDetailModal = ({ stock, onClose }) => {
  const { t, lang } = useLanguage();
  const [chartType, setChartType] = useState("candlestick");
  const [klineData, setKlineData] = useState(null);
  const [isLoadingKline, setIsLoadingKline] = useState(false);
  const [klineError, setKlineError] = useState(null);

  // Fetch real OHLC data for K-line chart
  useEffect(() => {
    if (!stock || !stock.id) return;

    const fetchKlineData = async () => {
      setIsLoadingKline(true);
      setKlineError(null);

      try {
        const realData = await fetchHistoricalOHLC(stock.id, "1mo", "1d");
        if (realData && realData.length > 0) {
          setKlineData(realData);
        } else {
          throw new Error("No k-line data available from real API");
        }
      } catch (err) {
        setKlineError(
          `Failed to load K-line data: ${err.message}. Please try again.`,
        );
        setKlineData(null);

        if (err.message.includes("fetch") || err.message.includes("timeout")) {
          setTimeout(() => fetchKlineData(), 3000);
        }
      } finally {
        setIsLoadingKline(false);
      }
    };

    fetchKlineData();
  }, [stock?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (stock) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [stock]);

  // Memoize AI suggestion
  const ai = useMemo(() => {
    if (!stock) return null;
    return getAISuggestion(stock, lang);
  }, [stock, lang]);

  if (!stock) return null;

  const isUp = stock.change >= 0;
  const stockName = lang === "zh" ? stock.name_zh : stock.name_en;
  const industry = lang === "zh" ? stock.industry_zh : stock.industry_en;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          className="relative w-full max-w-7xl bg-slate-900 border border-white/10 rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(56,189,248,0.2)] h-[95vh] md:h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 md:p-10 lg:p-14 bg-gradient-to-br from-slate-800/80 to-slate-900 border-b border-white/5 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-premium-accent to-transparent opacity-60"></div>
            <button
              onClick={onClose}
              className="absolute top-6 md:top-10 right-6 md:right-10 p-3 md:p-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all z-20 border border-white/10 group"
            >
              <svg
                className="w-5 md:w-6 h-5 md:h-6 group-hover:rotate-90 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l18 18"
                />
              </svg>
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                  <span className="px-3 md:px-4 py-1 md:py-1.5 bg-premium-accent/20 text-premium-accent rounded-lg md:rounded-xl text-[10px] md:text-xs font-black tracking-widest uppercase border border-premium-accent/30 shadow-lg shadow-premium-accent/10">
                    {industry}
                  </span>
                  <span className="text-slate-500 font-mono tracking-widest text-xs md:text-base font-bold select-all bg-white/5 px-2 md:px-3 py-1 rounded-lg border border-white/5">
                    {stock.symbol}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-6xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                  {stockName}
                </h2>
              </div>
              <div className="text-left md:text-right space-y-2 flex-shrink-0">
                <p className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80">
                  {t("quoteLabel")}
                </p>
                <div className="flex items-baseline gap-2 md:gap-5">
                  <span className="text-3xl md:text-5xl lg:text-7xl font-mono font-black text-white leading-none tracking-tighter">
                    NT${stock.price}
                  </span>
                  <span
                    className={`text-lg md:text-2xl lg:text-3xl font-black flex items-center gap-1 md:gap-2 ${isUp ? "text-premium-success" : "text-premium-loss"} bg-white/5 px-2 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl border border-white/5`}
                  >
                    {isUp ? "▲" : "▼"} {Math.abs(stock.change)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 custom-scrollbar space-y-10 md:space-y-16">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 md:gap-16">
              {/* Left (Chart & Analysis) */}
              <div className="xl:col-span-8 space-y-10 md:space-y-16">
                <div className="space-y-6 md:space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white text-[11px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase flex items-center gap-3 md:gap-4">
                      <span className="relative flex h-2 md:h-3 w-2 md:w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-premium-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 md:h-3 w-2 md:w-3 bg-premium-accent"></span>
                      </span>
                      {t("klineTitle")}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChartType("candlestick")}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          chartType === "candlestick"
                            ? "bg-premium-accent text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        K-Line
                      </button>
                      <button
                        onClick={() => setChartType("area")}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          chartType === "area"
                            ? "bg-premium-accent text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        Area
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-2xl md:rounded-[3rem] p-3 md:p-4 border border-white/5 shadow-inner h-[300px] md:h-[500px] lg:h-[600px]">
                    {isLoadingKline ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-premium-accent mx-auto mb-3"></div>
                          <p className="text-slate-400 text-sm">
                            {t("loading")}
                          </p>
                        </div>
                      </div>
                    ) : klineError ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <p className="text-red-400 text-sm mb-2">
                            ⚠️ K-Line Data Error
                          </p>
                          <p className="text-slate-500 text-xs">{klineError}</p>
                        </div>
                      </div>
                    ) : klineData && klineData.length > 0 ? (
                      <KLineChart
                        stock={stock}
                        data={klineData}
                        height={500}
                        chartType={chartType}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500 text-sm">
                          No k-line data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Institutional Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent rounded-2xl md:rounded-[2.5rem] border border-white/5 group hover:border-premium-accent/40 transition-all shadow-xl">
                    <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-3">
                      🏢 {t("investors")}
                    </p>
                    <p
                      className={`text-2xl md:text-3xl font-mono font-black ${ai.institutional.investors.startsWith("+") ? "text-premium-success" : "text-premium-loss"}`}
                    >
                      {ai.institutional.investors}
                    </p>
                  </div>
                  <div className="p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent rounded-2xl md:rounded-[2.5rem] border border-white/5 group hover:border-premium-accent/40 transition-all shadow-xl">
                    <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-3">
                      📊 {t("margin")}
                    </p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-premium-accent">
                      {ai.institutional.margin}
                    </p>
                  </div>
                  <div className="p-6 md:p-8 bg-gradient-to-br from-white/5 to-transparent rounded-2xl md:rounded-[2.5rem] border border-white/5 group hover:border-premium-accent/40 transition-all shadow-xl">
                    <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-3">
                      ⚡ {t("dayTrade")}
                    </p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-premium-warning">
                      {ai.institutional.dayTrade}
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-10 bg-gradient-to-br from-slate-800/60 to-slate-900/40 text-white rounded-2xl md:rounded-[3rem] border border-white/10 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-premium-accent group-hover:w-2 transition-all"></div>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                    <h4 className="text-premium-accent font-black text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center gap-3 md:gap-4">
                      <svg
                        className="w-5 md:w-6 h-5 md:h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.586 11l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414z" />
                      </svg>
                      {t("buyReason")}
                    </h4>
                    <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 text-white rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black tracking-[0.15em] md:tracking-widest uppercase border border-white/10 backdrop-blur-md">
                      {ai.action}
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm md:text-lg leading-relaxed font-bold tracking-tight">
                    {ai.detailedReason}
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-6 md:pt-8 border-t border-white/5">
                    {Object.entries(ai.indicators).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex-1 p-4 md:p-6 bg-slate-900/60 rounded-lg md:rounded-[2rem] border border-white/5 shadow-inner"
                      >
                        <p className="text-slate-500 text-[9px] md:text-[10px] uppercase mb-2 font-black tracking-[0.15em] md:tracking-[0.2em]">
                          {t(`indicators.${key}`)}
                        </p>
                        <p className="text-white text-xs md:text-sm font-black tracking-tight">
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right (Tactical Plan) */}
              <div className="xl:col-span-4 space-y-6 md:space-y-10">
                {/* Trading Plan */}
                <div className="space-y-6 md:space-y-8">
                  <h3 className="text-white text-lg md:text-xl font-black tracking-tight uppercase flex items-center gap-2 md:gap-4">
                    <span className="text-premium-accent text-lg md:text-2xl">
                      ⚡
                    </span>
                    {t("tradingPlan")}
                  </h3>

                  {/* Aggressive Strategy */}
                  <div className="p-6 md:p-8 bg-gradient-to-br from-red-500/10 to-transparent rounded-xl md:rounded-[2.5rem] border border-red-500/20">
                    <h4 className="text-red-400 text-xs md:text-sm font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                      🔥 {ai.strategies.aggressive.type}
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
                      {ai.strategies.aggressive.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
                      <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                          {t("targetPrice")}
                        </p>
                        <p className="text-premium-success text-lg md:text-2xl font-black font-mono">
                          NT${ai.strategies.aggressive.targetPrice}
                        </p>
                      </div>
                      <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                          {t("stopLoss")}
                        </p>
                        <p className="text-premium-loss text-lg md:text-2xl font-black font-mono">
                          NT${ai.strategies.aggressive.stopLoss}
                        </p>
                      </div>
                    </div>
                    {ai.strategies.aggressive.reasoning && (
                      <div className="p-3 md:p-4 bg-slate-900/30 rounded-lg md:rounded-xl border border-white/5">
                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                          {ai.strategies.aggressive.reasoning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Conservative Strategy */}
                  <div className="p-6 md:p-8 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl md:rounded-[2.5rem] border border-blue-500/20">
                    <h4 className="text-blue-400 text-xs md:text-sm font-black uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                      🛡️ {ai.strategies.conservative.type}
                    </h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
                      {ai.strategies.conservative.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
                      <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                          {t("targetPrice")}
                        </p>
                        <p className="text-premium-success text-lg md:text-2xl font-black font-mono">
                          NT${ai.strategies.conservative.targetPrice}
                        </p>
                      </div>
                      <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                          {t("stopLoss")}
                        </p>
                        <p className="text-premium-loss text-lg md:text-2xl font-black font-mono">
                          NT${ai.strategies.conservative.stopLoss}
                        </p>
                      </div>
                    </div>
                    {ai.strategies.conservative.reasoning && (
                      <div className="p-3 md:p-4 bg-slate-900/30 rounded-lg md:rounded-xl border border-white/5">
                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                          {ai.strategies.conservative.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 md:p-8 bg-slate-800/40 rounded-xl md:rounded-[2.5rem] border border-white/5 shadow-xl">
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-6 md:w-8 h-6 md:h-8 rounded-full border-2 border-slate-900 bg-premium-accent/30 flex items-center justify-center text-[8px] md:text-[10px] font-black text-premium-accent italic shadow-lg shadow-premium-accent/20"
                        >
                          AI
                        </div>
                      ))}
                    </div>
                    <p className="text-white text-[10px] md:text-xs font-black tracking-[0.15em] md:tracking-[0.2em]">
                      {t("confidenceLabel")} {ai.confidence}%
                    </p>
                  </div>
                  <p className="text-slate-500 text-[9px] md:text-[11px] leading-relaxed font-bold italic opacity-80">
                    {t("disclaimer")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(StockDetailModal);
