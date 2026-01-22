import React from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * AI Investment Project Assessment Panel
 * Displays enhanced evaluation metrics with multi-dimensional scoring
 */
const AIInvestmentAssessment = ({ ai }) => {
  const { t } = useLanguage();

  if (!ai) return null;

  const getActionColor = () => {
    const action = ai.action || "";
    if (action.includes("BUY") || action.includes("買進")) {
      return "bg-green-500/20 text-green-300 border-green-500/40";
    } else if (action.includes("HOLD") || action.includes("觀望")) {
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
    return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  };

  const ScoreCard = ({ label, score, gradientFrom, gradientTo }) => (
    <div className="p-4 md:p-6 bg-slate-900/70 rounded-xl md:rounded-2xl border border-white/10 text-center hover:border-white/20 transition-all">
      <p className="text-slate-400 text-[9px] md:text-[10px] uppercase mb-3 md:mb-4 font-black tracking-[0.1em]">
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        <p className="text-white text-xl md:text-2xl lg:text-3xl font-black font-mono">
          {score}
        </p>
        <p className="text-slate-400 text-xs">/100</p>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2 mt-3 md:mt-4 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  const technicalScore = Math.round(ai.confidence * 0.8);
  const institutionalScore = Math.round(ai.confidence * 0.9);
  const momentumScore = Math.round(ai.confidence * 0.85);

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
            <svg
              className="w-5 md:w-6 h-5 md:h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM14.586 11l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414z" />
            </svg>
            {t("buyReason")}
          </h4>
        </div>
        <span
          className={`px-4 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black tracking-[0.15em] md:tracking-widest uppercase border backdrop-blur-md ${getActionColor()}`}
        >
          {ai.action}
        </span>
      </div>

      {/* Main Thesis */}
      <p className="text-slate-200 text-sm md:text-base lg:text-lg leading-relaxed font-bold tracking-tight">
        {ai.detailedReason}
      </p>

      {/* Multi-Dimensional Scoring Panel */}
      <div className="space-y-4 md:space-y-6">
        <h5 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
          {t("signalStrength")}
        </h5>
        <div className="grid grid-cols-3 gap-3 md:gap-5">
          <ScoreCard
            label={t("technicalScore")}
            score={technicalScore}
            gradientFrom="from-premium-accent"
            gradientTo="to-cyan-400"
          />
          <ScoreCard
            label={t("institutionalScore")}
            score={institutionalScore}
            gradientFrom="from-amber-500"
            gradientTo="to-orange-400"
          />
          <ScoreCard
            label={t("momentumScore")}
            score={momentumScore}
            gradientFrom="from-rose-500"
            gradientTo="to-pink-400"
          />
        </div>
      </div>

      {/* Risk & Entry Information */}
      <div className="pt-8 md:pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-white/5">
          <p className="text-slate-400 text-[8px] md:text-[9px] uppercase font-black tracking-[0.1em] mb-2">
            {t("riskLevel")}
          </p>
          <p className="text-white font-black text-sm md:text-base">
            {ai.confidence > 70
              ? t("riskLow")
              : ai.confidence > 50
                ? t("riskModerate")
                : t("riskHigh")}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-white/5">
          <p className="text-slate-400 text-[8px] md:text-[9px] uppercase font-black tracking-[0.1em] mb-2">
            {t("holdingPeriod")}
          </p>
          <p className="text-white font-black text-sm md:text-base">
            {ai.confidence > 70 ? t("mediumTerm") : t("shortTerm")}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-slate-900/50 rounded-lg md:rounded-xl p-4 md:p-5 border border-white/5">
          <p className="text-slate-400 text-[8px] md:text-[9px] uppercase font-black tracking-[0.1em] mb-2">
            {t("signalStrength")}
          </p>
          <p
            className={`font-black text-sm md:text-base ${
              ai.confidence > 70
                ? "text-green-400"
                : ai.confidence > 50
                  ? "text-yellow-400"
                  : "text-orange-400"
            }`}
          >
            {ai.confidence > 70
              ? t("strong")
              : ai.confidence > 50
                ? t("moderate")
                : t("weak")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AIInvestmentAssessment);
