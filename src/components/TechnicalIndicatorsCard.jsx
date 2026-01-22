import React, { useEffect, useState } from "react";
import { fetchTechnicalIndicators } from "../services/technicalIndicatorsService";
import { useLanguage } from "../context/LanguageContext";

/**
 * Technical Indicators Card - Display key technical indicators for quick analysis
 */
const TechnicalIndicatorsCard = ({ stock }) => {
  const { t } = useLanguage();
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stock?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTechnicalIndicators(stock.id, "3mo", "1d");
        if (data?.indicators) {
          setIndicators(data.indicators);
        } else {
          setError("No data");
        }
      } catch (err) {
        console.error(`Error fetching indicators for ${stock.symbol}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stock?.id]);

  if (loading) {
    return (
      <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg text-center text-sm text-slate-400">
        📊 Loading...
      </div>
    );
  }

  if (error || !indicators) {
    return (
      <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg text-center text-sm text-slate-500">
        —
      </div>
    );
  }

  const getRSIColor = (rsi) => {
    if (rsi > 70) return "text-red-400";
    if (rsi < 30) return "text-green-400";
    return "text-slate-300";
  };

  const getMACD_TrendColor = (trend) => {
    return trend === "Bullish" ? "text-green-400" : "text-red-400";
  };

  const getTrendArrow = (trend) => {
    if (trend === "Uptrend") return "↑";
    if (trend === "Downtrend") return "↓";
    return "→";
  };

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg text-xs space-y-3 border border-slate-700">
      {/* Price & Change */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-700">
        <span className="text-slate-400">{t("technicalIndicators.price")}</span>
        <span
          className={`font-bold ${parseFloat(indicators.change) >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          ${indicators.price.toFixed(2)}
          {parseFloat(indicators.change) >= 0 ? "+" : ""}
          {indicators.change.toFixed(2)}
        </span>
      </div>

      {/* RSI */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">{t("technicalIndicators.rsi")}</span>
        <span
          className={`font-mono font-bold ${getRSIColor(parseFloat(indicators.rsi))}`}
        >
          {indicators.rsi}
          {parseFloat(indicators.rsi) > 70
            ? " 📈"
            : parseFloat(indicators.rsi) < 30
              ? " 📉"
              : " 🔄"}
        </span>
      </div>

      {/* MACD */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">{t("technicalIndicators.macd")}</span>
        <span
          className={`font-mono font-bold ${getMACD_TrendColor(indicators.macd.trend)}`}
        >
          {indicators.macd.trend === "Bullish"
            ? t("technicalIndicators.macdBullish")
            : t("technicalIndicators.macdBearish")}
        </span>
      </div>

      {/* Moving Averages Trend */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">
          {t("technicalIndicators.maTrend")}
        </span>
        <span
          className={`font-bold ${indicators.movingAverages.trend === "Uptrend" ? "text-green-400" : indicators.movingAverages.trend === "Downtrend" ? "text-red-400" : "text-slate-300"}`}
        >
          {getTrendArrow(indicators.movingAverages.trend)}{" "}
          {indicators.movingAverages.trend === "Uptrend"
            ? t("technicalIndicators.maTrendUp")
            : indicators.movingAverages.trend === "Downtrend"
              ? t("technicalIndicators.maTrendDown")
              : t("technicalIndicators.maTrendNeutral")}
        </span>
      </div>

      {/* Bollinger Bands Position */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">
          {t("technicalIndicators.bollingerBands")}
        </span>
        <span
          className={`font-mono text-xs ${
            indicators.bollingerBands.position === "Above Upper"
              ? "text-red-400"
              : indicators.bollingerBands.position === "Below Lower"
                ? "text-green-400"
                : "text-slate-300"
          }`}
        >
          {indicators.bollingerBands.position === "Above Upper"
            ? t("technicalIndicators.bbAboveUpper")
            : indicators.bollingerBands.position === "Below Lower"
              ? t("technicalIndicators.bbBelowLower")
              : t("technicalIndicators.bbInsideBands")}
        </span>
      </div>

      {/* Stochastic */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">
          {t("technicalIndicators.stochastic")}
        </span>
        <span
          className={`font-mono font-bold ${
            indicators.stochastic.status === "Overbought"
              ? "text-red-400"
              : indicators.stochastic.status === "Oversold"
                ? "text-green-400"
                : "text-slate-300"
          }`}
        >
          K:{indicators.stochastic.k}{" "}
          {indicators.stochastic.status === "Overbought"
            ? "⚠️"
            : indicators.stochastic.status === "Oversold"
              ? "✅"
              : ""}
        </span>
      </div>

      {/* ATR */}
      <div className="flex justify-between items-center">
        <span className="text-slate-400">{t("technicalIndicators.atr")}</span>
        <span className="font-mono text-slate-300">{indicators.atr}</span>
      </div>

      {/* Summary Signal */}
      <div className="mt-3 pt-3 border-t border-slate-700 text-center">
        <div
          className={`inline-block px-3 py-1 rounded text-xs font-bold ${
            indicators.rsi > 70 || indicators.macd.trend === "Bearish"
              ? "bg-red-900/40 text-red-300"
              : indicators.rsi < 30 || indicators.macd.trend === "Bullish"
                ? "bg-green-900/40 text-green-300"
                : "bg-slate-700/40 text-slate-300"
          }`}
        >
          {indicators.rsi > 70
            ? t("technicalIndicators.rsiOverbought")
            : indicators.rsi < 30
              ? t("technicalIndicators.rsiOversold")
              : indicators.macd.trend === "Bullish"
                ? t("technicalIndicators.macdBullish")
                : t("technicalIndicators.macdBearish")}
        </div>
      </div>
    </div>
  );
};

export default TechnicalIndicatorsCard;
