import React, { useEffect, useState } from "react";
import { fetchTechnicalIndicators } from "../services/technicalIndicatorsService";
import { useLanguage } from "../context/LanguageContext";

/**
 * Technical Analysis Dashboard - Comprehensive technical indicators with visualizations
 */
const TechnicalAnalysisDashboard = ({ stock, height = 600 }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchTechnicalIndicators(stock.id, "6mo", "1d");
        if (result) {
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching technical data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stock?.id]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-slate-400">📊 Loading Technical Analysis...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-slate-500">No data available</div>
      </div>
    );
  }

  const indicators = data.indicators;

  return (
    <div className="space-y-4 bg-slate-900 rounded-lg p-4 text-slate-100">
      {/* Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* RSI */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.rsi")}
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              parseFloat(indicators.rsi) > 70
                ? "text-red-400"
                : parseFloat(indicators.rsi) < 30
                  ? "text-green-400"
                  : "text-slate-300"
            }`}
          >
            {indicators.rsi}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {parseFloat(indicators.rsi) > 70
              ? t("technicalIndicators.rsiOverbought")
              : parseFloat(indicators.rsi) < 30
                ? t("technicalIndicators.rsiOversold")
                : t("technicalIndicators.rsiNeutral")}
          </div>
        </div>

        {/* MACD */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.macd")}
          </div>
          <div
            className={`text-2xl font-bold ${
              indicators.macd.trend === "Bullish"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {indicators.macd.trend === "Bullish"
              ? t("technicalIndicators.macdBullish")
              : t("technicalIndicators.macdBearish")}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {indicators.macd.histogram > 0 ? "+" : ""}
            {indicators.macd.histogram}
          </div>
        </div>

        {/* Stochastic */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.stochastic")}
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              indicators.stochastic.status === "Overbought"
                ? "text-red-400"
                : indicators.stochastic.status === "Oversold"
                  ? "text-green-400"
                  : "text-slate-300"
            }`}
          >
            {indicators.stochastic.k}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {indicators.stochastic.status === "Overbought"
              ? t("technicalIndicators.stochasticOverbought")
              : indicators.stochastic.status === "Oversold"
                ? t("technicalIndicators.stochasticOversold")
                : t("technicalIndicators.stochasticNeutral")}
          </div>
        </div>

        {/* Moving Averages */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.maTrend")}
          </div>
          <div
            className={`text-2xl font-bold ${
              indicators.movingAverages.trend === "Uptrend"
                ? "text-green-400"
                : indicators.movingAverages.trend === "Downtrend"
                  ? "text-red-400"
                  : "text-slate-300"
            }`}
          >
            {indicators.movingAverages.trend === "Uptrend"
              ? t("technicalIndicators.maTrendUp")
              : indicators.movingAverages.trend === "Downtrend"
                ? t("technicalIndicators.maTrendDown")
                : t("technicalIndicators.maTrendNeutral")}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            {t("technicalIndicators.sma20")}: {indicators.movingAverages.sma20}
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.bollingerBands")}
          </div>
          <div
            className={`text-lg font-bold font-mono ${
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
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t("technicalIndicators.price")}: ${indicators.price.toFixed(2)}
          </div>
        </div>

        {/* ATR */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-2">
            {t("technicalIndicators.atr")}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300">
            {indicators.atr}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t("technicalIndicators.volatility")}
          </div>
        </div>
      </div>

      {/* Signal Summary */}
      <div
        className={`p-4 rounded-lg border ${
          parseFloat(indicators.rsi) > 70 || indicators.macd.trend === "Bearish"
            ? "bg-red-900/20 border-red-700 text-red-300"
            : parseFloat(indicators.rsi) < 30 ||
                indicators.macd.trend === "Bullish"
              ? "bg-green-900/20 border-green-700 text-green-300"
              : "bg-slate-800 border-slate-700 text-slate-300"
        }`}
      >
        <div className="font-bold mb-1">
          📊 {t("technicalIndicators.technicalSignal")}
        </div>
        <div className="text-sm">
          {parseFloat(indicators.rsi) > 70
            ? `⚠️ ${t("technicalIndicators.overbought")}`
            : parseFloat(indicators.rsi) < 30
              ? `✅ ${t("technicalIndicators.oversold")}`
              : indicators.macd.trend === "Bullish"
                ? `📈 ${t("technicalIndicators.bullishMomentum")}`
                : `📉 ${t("technicalIndicators.bearishMomentum")}`}
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysisDashboard;
