import React from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * AI Investment Project Assessment Panel
 * Displays enhanced evaluation metrics with multi-dimensional scoring
 */
const AIInvestmentAssessment = ({ ai }) => {
  const { t } = useLanguage();

  if (!ai) return null;

  const references = ai.concise?.referenceData || [];
  const rationale =
    ai.concise?.rationale || ai.detailedReason || ai.reason || "";
  const horizons = ai.horizonRecommendations || [];

  const getActionColor = () => {
    const action = ai.action || "";
    if (action.includes("BUY") || action.includes("買進")) {
      return "bg-green-500/20 text-green-300 border-green-500/40";
    } else if (action.includes("HOLD") || action.includes("觀望")) {
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
    return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  };

  return (
    <div className="p-7 md:p-12 bg-gradient-to-br from-slate-800/70 to-slate-900/50 text-white rounded-2xl md:rounded-3xl border border-white/12 space-y-8 md:space-y-10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-premium-accent group-hover:w-2 transition-all"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8">
        <div>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3">
            {t("aiEvaluation")}
          </p>
          <h4 className="text-premium-accent font-black text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center gap-3 md:gap-4 leading-tight">
            {t("tradeAdvice")}
          </h4>
          <p className="text-slate-500 text-[10px] md:text-xs mt-1 font-mono">
            {t("confidenceLabel")} {ai.confidence}%
          </p>
        </div>
        <span
          className={`px-4 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black tracking-[0.15em] md:tracking-widest uppercase border backdrop-blur-md ${getActionColor()}`}
        >
          {ai.concise?.decision || ai.action}
        </span>
      </div>

      {/* Buy/Sell Decision */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5 md:p-7 space-y-3">
        <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-[0.15em]">
          {t("tradeAdvice")}
        </p>
        <p className="text-white text-lg md:text-xl font-black leading-tight">
          {ai.concise?.decision || ai.action}
        </p>
      </div>

      {/* Rationale */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5 md:p-7 space-y-3">
        <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-[0.15em]">
          {t("reasonShort")}
        </p>
        <p className="text-slate-100 text-sm md:text-base leading-relaxed font-bold tracking-tight">
          {rationale}
        </p>
      </div>

      {/* Reference Data */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5 md:p-7 space-y-4">
        <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-[0.15em]">
          {t("referenceData")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {references.map((ref) => (
            <div
              key={`${ref.label}-${ref.value}`}
              className="p-4 md:p-5 rounded-xl border border-white/10 bg-slate-800/60"
            >
              <p className="text-slate-400 text-[10px] md:text-xs font-semibold mb-2">
                {ref.label}
              </p>
              <p className="text-white text-sm md:text-base font-mono leading-relaxed break-words">
                {ref.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Horizon Recommendations */}
      {horizons.length > 0 && (
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5 md:p-7 space-y-4">
          <p className="text-slate-400 text-[9px] md:text-[10px] uppercase font-black tracking-[0.15em]">
            {t("horizonRecommendations")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {horizons.map((h) => (
              <div
                key={h.horizon}
                className="p-4 md:p-5 rounded-xl border border-white/10 bg-slate-800/60 space-y-2"
              >
                <p className="text-slate-400 text-[10px] md:text-xs font-semibold">
                  {h.horizon}
                </p>
                <p className="text-white text-base md:text-lg font-black">
                  {h.action}
                </p>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  {h.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(AIInvestmentAssessment);
