import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "../context/PortfolioContext";
import { useLanguage } from "../context/LanguageContext";
import { getPortfolioAISuggestion } from "../services/aiAnalysis";
import AddPositionModal from "./AddPositionModal";

const PortfolioPanel = ({ liveStocks = [] }) => {
  const { t, lang } = useLanguage();
  const { positions, getPortfolioStats, removePosition } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const stats = getPortfolioStats(liveStocks);

  // 獲取庫存的AI建議
  useEffect(() => {
    if (stats.positions.length === 0) return;

    const fetchAISuggestions = async () => {
      setIsLoadingAI(true);
      const suggestions = {};

      for (const pos of stats.positions) {
        try {
          const stock = liveStocks.find((s) => s.id === pos.stockId);
          if (stock) {
            const suggestion = await getPortfolioAISuggestion(
              stock,
              { costPrice: pos.costPrice, quantity: pos.quantity },
              lang,
            );
            suggestions[pos.stockId] = suggestion;
          }
        } catch (err) {
          console.error(`AI suggestion error for ${pos.stockId}:`, err);
        }
      }

      setAiSuggestions(suggestions);
      setIsLoadingAI(false);
    };

    fetchAISuggestions();
  }, [stats.positions, liveStocks, lang]);

  // 獲取行動標籤和顏色
  const getActionBadge = (action) => {
    const badges = {
      sell: {
        en: "Sell",
        zh: "賣出",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
      },
      addMore: {
        en: "Add More",
        zh: "加碼",
        color: "bg-green-500/20 text-green-300 border border-green-500/30",
      },
      stopLoss: {
        en: "Stop Loss",
        zh: "止損",
        color: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
      },
      takeProfits: {
        en: "Take Profits",
        zh: "獲利出場",
        color: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      },
      hold: {
        en: "Hold",
        zh: "持有",
        color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      },
    };

    const badge = badges[action] || badges.hold;
    return {
      label: lang === "zh" ? badge.zh : badge.en,
      color: badge.color,
    };
  };

  if (positions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6 text-center"
      >
        <p className="text-slate-400 mb-4">
          {lang === "zh"
            ? "暫無持股。點擊下方按鈕添加持股記錄。"
            : "No holdings yet. Click the button below to add positions."}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-premium-accent hover:bg-premium-accent/80 rounded-lg text-sm font-medium transition-colors"
        >
          {lang === "zh" ? "+ 新增持股" : "+ Add Position"}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-bold">
            {lang === "zh" ? "庫存組合" : "Portfolio"}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1 bg-premium-accent/20 hover:bg-premium-accent/30 border border-premium-accent/50 rounded-lg text-xs md:text-sm text-premium-accent transition-colors"
          >
            + {lang === "zh" ? "新增" : "Add"}
          </button>
        </div>

        {/* 組合統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">
              {lang === "zh" ? "成本總額" : "Total Cost"}
            </p>
            <p className="text-sm md:text-base font-bold">
              NT${stats.totalCost.toFixed(0)}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">
              {lang === "zh" ? "目前市值" : "Current Value"}
            </p>
            <p className="text-sm md:text-base font-bold">
              NT${stats.totalValue.toFixed(0)}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">
              {lang === "zh" ? "損益金額" : "P&L"}
            </p>
            <p
              className={`text-sm md:text-base font-bold ${
                stats.totalGain >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats.totalGain >= 0 ? "+" : ""}
              NT${stats.totalGain.toFixed(0)}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">
              {lang === "zh" ? "損益率" : "Return %"}
            </p>
            <p
              className={`text-sm md:text-base font-bold ${
                stats.totalGainPercent >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats.totalGainPercent >= 0 ? "+" : ""}
              {stats.totalGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* 持股列表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm">
          <thead>
            <tr className="border-b border-slate-700/30 bg-slate-800/30">
              <th className="text-left p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "代碼/名稱" : "Code/Name"}
              </th>
              <th className="text-right p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "成本價" : "Cost"}
              </th>
              <th className="text-right p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "現價" : "Current"}
              </th>
              <th className="text-right p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "數量" : "Qty"}
              </th>
              <th className="text-right p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "損益%" : "Return%"}
              </th>
              <th className="text-right p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "AI建議" : "AI Suggestion"}
              </th>
              <th className="text-center p-3 md:p-4 text-slate-400 font-medium">
                {lang === "zh" ? "操作" : "Action"}
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {stats.positions.map((pos) => {
                const suggestion = aiSuggestions[pos.stockId];
                const badge = suggestion
                  ? getActionBadge(suggestion.portfolioAction)
                  : getActionBadge("hold");

                return (
                  <motion.tr
                    key={pos.stockId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-3 md:p-4">
                      <div>
                        <div className="font-medium">{pos.stockId}</div>
                        <div className="text-slate-400">{pos.name}</div>
                      </div>
                    </td>
                    <td className="text-right p-3 md:p-4">
                      NT${pos.costPrice.toFixed(2)}
                    </td>
                    <td className="text-right p-3 md:p-4">
                      NT${pos.currentPrice.toFixed(2)}
                    </td>
                    <td className="text-right p-3 md:p-4">{pos.quantity}</td>
                    <td className="text-right p-3 md:p-4">
                      <span
                        className={`font-medium ${
                          pos.gainPercent >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {pos.gainPercent >= 0 ? "+" : ""}
                        {pos.gainPercent.toFixed(2)}%
                      </span>
                      <div className="text-slate-400 text-xs">
                        {pos.gainPercent >= 0 ? "+" : ""}NT$
                        {pos.gain.toFixed(0)}
                      </div>
                    </td>
                    <td className="text-center p-3 md:p-4">
                      {isLoadingAI ? (
                        <div className="text-slate-400 text-xs">loading...</div>
                      ) : suggestion ? (
                        <div>
                          <div
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${badge.color}`}
                          >
                            {badge.label}
                          </div>
                          <div className="text-slate-400 text-xs mt-1">
                            信心度: {suggestion.confidence}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs">-</div>
                      )}
                    </td>
                    <td className="text-center p-3 md:p-4">
                      <button
                        onClick={() => removePosition(pos.stockId)}
                        className="text-red-400 hover:text-red-300 text-xs md:text-sm transition-colors"
                      >
                        {lang === "zh" ? "刪除" : "Remove"}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* AI建議詳情 */}
      {Object.keys(aiSuggestions).length > 0 && (
        <div className="border-t border-slate-700/50 p-4 md:p-6 bg-slate-900/50">
          <p className="text-slate-400 text-xs md:text-sm mb-3 font-medium">
            {lang === "zh" ? "AI 建議詳情" : "AI Suggestions"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.positions.map((pos) => {
              const suggestion = aiSuggestions[pos.stockId];
              if (!suggestion) return null;

              return (
                <div
                  key={pos.stockId}
                  className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold">{pos.stockId}</div>
                      <div className="text-slate-400 text-xs">{pos.name}</div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(suggestion.portfolioAction).color}`}
                    >
                      {getActionBadge(suggestion.portfolioAction).label}
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {suggestion.reasoning}
                  </p>
                  {suggestion.targetPrice && (
                    <div className="mt-2 text-xs text-slate-400">
                      目標: ${suggestion.targetPrice} | 止損: $
                      {suggestion.stopLoss}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddPositionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        stocks={liveStocks}
      />
    </motion.div>
  );
};

export default PortfolioPanel;
