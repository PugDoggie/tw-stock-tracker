import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAISuggestion } from "../services/aiAnalysis";
import { useLanguage } from "../context/LanguageContext";
import { usePortfolio } from "../context/PortfolioContext";
import { fetchTechnicalIndicators } from "../services/technicalIndicatorsService";
import TechnicalAnalysisDashboard from "./TechnicalAnalysisDashboard";
import AIInvestmentAssessment from "./AIInvestmentAssessment";
import KLineChart from "./KLineChart";

const StockDetailModal = ({ stock, onClose, marketContext = {} }) => {
  const { t, lang } = useLanguage();
  const { addPosition, getPosition } = usePortfolio();
  const [technicalData, setTechnicalData] = useState(null);
  const [ai, setAi] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [addError, setAddError] = useState("");
  const [isInWallet, setIsInWallet] = useState(false);

  // Auto-refresh technical indicators and AI suggestion
  useEffect(() => {
    if (!stock?.id) return undefined;

    let isMounted = true;

    // 检查是否已在钱包中
    const position = getPosition(stock.id);
    if (isMounted) {
      setIsInWallet(!!position);
    }

    const refresh = async () => {
      try {
        const data = await fetchTechnicalIndicators(stock.id, "3mo", "1d");
        const indicators = data?.indicators || null;
        if (isMounted) {
          setTechnicalData(indicators);
        }

        const suggestion = await getAISuggestion(
          stock,
          lang,
          indicators,
          marketContext,
        );
        if (isMounted) {
          setAi(suggestion);
        }
      } catch (err) {
        console.error("Error refreshing AI suggestion:", err);
        if (isMounted) {
          setAi({
            action: t("actions.neutral"),
            confidence: 50,
            reason: "Analysis unavailable",
            detailedReason: "AI analysis failed. Please try again.",
            concise: {
              decision: t("actions.neutral"),
              rationale: "AI analysis failed. Please try again.",
              referenceData: [],
            },
            horizonRecommendations: [],
            indicators: {},
            institutional: {
              investors: "N/A",
              margin: "N/A",
              dayTrade: "N/A",
            },
            strategies: {
              aggressive: {
                type: "N/A",
                desc: "N/A",
                targetPrice: (stock.price * 1.05).toFixed(2),
                stopLoss: (stock.price * 0.95).toFixed(2),
              },
              conservative: {
                type: "N/A",
                desc: "N/A",
                targetPrice: (stock.price * 1.03).toFixed(2),
                stopLoss: (stock.price * 0.97).toFixed(2),
              },
            },
          });
        }
      }
    };

    // Initial load
    refresh();
    const interval = setInterval(refresh, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stock, lang, marketContext, t]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (stock) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [stock]);

  // Allow ESC to close the modal
  useEffect(() => {
    if (!stock) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stock, onClose]);

  // 处理添加到钱包
  const handleAddToWallet = () => {
    const cost = parseFloat(costPrice);
    const qty = parseInt(quantity);

    if (!cost || cost <= 0) {
      setAddError(
        lang === "zh" ? "成本價必須大於0" : "Cost price must be greater than 0",
      );
      return;
    }

    if (!qty || qty <= 0) {
      setAddError(
        lang === "zh" ? "數量必須大於0" : "Quantity must be greater than 0",
      );
      return;
    }

    addPosition({
      stockId: stock.id,
      name: lang === "zh" ? stock.name_zh : stock.name_en,
      costPrice: cost,
      quantity: qty,
    });

    setIsInWallet(true);
    setShowAddForm(false);
    setCostPrice("");
    setQuantity("");
    setAddError("");
  };

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
                  <span
                    className={`font-mono font-black text-white leading-none tracking-tighter overflow-hidden text-ellipsis ${
                      stock.price > 9999
                        ? "text-2xl md:text-4xl lg:text-5xl"
                        : stock.price > 999
                          ? "text-3xl md:text-5xl lg:text-6xl"
                          : "text-3xl md:text-5xl lg:text-7xl"
                    }`}
                  >
                    NT$
                    {typeof stock.price === "number"
                      ? stock.price.toFixed(2)
                      : stock.price}
                  </span>
                  <span
                    className={`text-lg md:text-2xl lg:text-3xl font-black flex items-center gap-1 md:gap-2 ${isUp ? "text-premium-success" : "text-premium-loss"} bg-white/5 px-2 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl border border-white/5`}
                  >
                    {isUp ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Add to Wallet Section */}
          <div className="border-b border-white/5 bg-gradient-to-r from-slate-800/50 to-transparent p-6 md:p-8">
            {!isInWallet && !showAddForm ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(true)}
                className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-premium-accent to-cyan-400 hover:from-premium-accent/90 hover:to-cyan-400/90 text-slate-900 font-black rounded-xl md:rounded-2xl transition-all shadow-lg shadow-premium-accent/30 text-sm md:text-base"
              >
                📈 {lang === "zh" ? "加入我的庫存" : "Add to My Wallet"}
              </motion.button>
            ) : isInWallet ? (
              <div className="flex items-center gap-3 text-green-400">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-bold">
                    {lang === "zh"
                      ? "已在你的庫存中"
                      : "Already in your wallet"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {lang === "zh"
                      ? "在庫存中查看詳細資訊"
                      : "View details in your wallet"}
                  </p>
                </div>
              </div>
            ) : null}

            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-slate-700/50 space-y-4"
              >
                <h4 className="font-bold text-white">
                  {lang === "zh"
                    ? "輸入持股資訊"
                    : "Enter Your Position Details"}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      {lang === "zh" ? "成本價 (NT$)" : "Cost Price (NT$)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={
                        lang === "zh" ? "輸入購入價格" : "Enter cost price"
                      }
                      value={costPrice}
                      onChange={(e) => {
                        setCostPrice(e.target.value);
                        setAddError("");
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-premium-accent text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-2">
                      {lang === "zh" ? "持有數量" : "Quantity"}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder={
                        lang === "zh" ? "輸入持有數量" : "Enter quantity"
                      }
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setAddError("");
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-premium-accent text-sm"
                    />
                  </div>
                </div>

                {costPrice && quantity && (
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">
                      {lang === "zh" ? "總成本額" : "Total Cost"}
                    </p>
                    <p className="text-lg font-bold">
                      NT$
                      {(parseFloat(costPrice) * parseInt(quantity)).toFixed(0)}
                    </p>
                  </div>
                )}

                {addError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-xs">
                    {addError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToWallet}
                    disabled={!costPrice || !quantity}
                    className="flex-1 px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    ✓ {lang === "zh" ? "確認加入" : "Add to Wallet"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setAddError("");
                    }}
                    className="flex-1 px-4 py-2 bg-slate-600 text-slate-200 border border-slate-500 rounded-lg hover:bg-slate-500 transition-colors text-sm font-medium"
                  >
                    ✕ {lang === "zh" ? "取消" : "Cancel"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-7 md:p-12 lg:p-16 custom-scrollbar space-y-12 md:space-y-20">
            {!ai ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-premium-accent mx-auto"></div>
                  <p className="text-slate-400 text-lg">AI分析中...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 md:gap-16 lg:gap-20">
                {/* Left (Chart & Analysis) */}
                <div className="xl:col-span-8 space-y-10 md:space-y-16">
                  {/* K-Line Chart */}
                  <div className="space-y-7 md:space-y-10">
                    <div className="flex items-center gap-4">
                      <h4 className="text-white text-[11px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase flex items-center gap-3 md:gap-4">
                        <span className="relative flex h-2.5 md:h-3 w-2.5 md:w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-premium-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 md:h-3 w-2.5 md:w-3 bg-premium-accent"></span>
                        </span>
                        {t("kline") || "K-Line Chart"}
                      </h4>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-white/8 shadow-inner w-full overflow-hidden">
                      <KLineChart stock={stock} height={400} />
                    </div>
                  </div>

                  {/* Technical Analysis */}
                  <div className="space-y-7 md:space-y-10">
                    <div className="flex items-center gap-4">
                      <h4 className="text-white text-[11px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase flex items-center gap-3 md:gap-4">
                        <span className="relative flex h-2.5 md:h-3 w-2.5 md:w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-premium-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 md:h-3 w-2.5 md:w-3 bg-premium-accent"></span>
                        </span>
                        {t("technical") || "Technical Analysis"}
                      </h4>
                    </div>
                    <div className="bg-slate-900/60 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-white/8 shadow-inner w-full overflow-hidden">
                      <TechnicalAnalysisDashboard stock={stock} height={600} />
                    </div>
                  </div>

                  {/* Institutional Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-10 lg:gap-12">
                    <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white/8 to-transparent rounded-2xl md:rounded-3xl border border-white/10 group hover:border-premium-accent/50 transition-all shadow-2xl">
                      <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-5 md:mb-7 flex items-center gap-3">
                        🏢 {t("investors")}
                      </p>
                      <p
                        className={`text-2xl md:text-3xl lg:text-4xl font-mono font-black leading-tight ${ai.institutional.investors.startsWith("+") ? "text-premium-success" : "text-premium-loss"}`}
                      >
                        {ai.institutional.investors}
                      </p>
                    </div>
                    <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white/8 to-transparent rounded-2xl md:rounded-3xl border border-white/10 group hover:border-premium-accent/50 transition-all shadow-2xl">
                      <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-5 md:mb-7 flex items-center gap-3">
                        📊 {t("margin")}
                      </p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-mono font-black text-premium-accent leading-tight">
                        {ai.institutional.margin}
                      </p>
                    </div>
                    <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white/8 to-transparent rounded-2xl md:rounded-3xl border border-white/10 group hover:border-premium-accent/50 transition-all shadow-2xl">
                      <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mb-5 md:mb-7 flex items-center gap-3">
                        ⚡ {t("dayTrade")}
                      </p>
                      <p className="text-2xl md:text-3xl lg:text-4xl font-mono font-black text-premium-warning leading-tight">
                        {ai.institutional.dayTrade}
                      </p>
                    </div>
                  </div>

                  <AIInvestmentAssessment ai={ai} />
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
                          <p className="text-premium-success text-base md:text-lg font-black font-mono">
                            NT${ai.strategies.aggressive.targetPrice}
                          </p>
                        </div>
                        <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                          <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                            {t("stopLoss")}
                          </p>
                          <p className="text-premium-loss text-base md:text-lg font-black font-mono">
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
                          <p className="text-premium-success text-base md:text-lg font-black font-mono">
                            NT${ai.strategies.conservative.targetPrice}
                          </p>
                        </div>
                        <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg md:rounded-2xl border border-white/5">
                          <p className="text-slate-500 text-[9px] md:text-xs mb-1 md:mb-2">
                            {t("stopLoss")}
                          </p>
                          <p className="text-premium-loss text-base md:text-lg font-black font-mono">
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
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default React.memo(StockDetailModal);
