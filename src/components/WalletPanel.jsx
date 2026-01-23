import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "../context/PortfolioContext";
import { useLanguage } from "../context/LanguageContext";
import { getPortfolioAISuggestion } from "../services/aiAnalysis";
import { fetchTechnicalIndicators } from "../services/technicalIndicatorsService";

const WalletPanel = ({ isOpen, onClose, liveStocks = [] }) => {
  const { t, lang } = useLanguage();
  const { positions, getPortfolioStats, removePosition, updatePosition } =
    usePortfolio();
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  const stats = getPortfolioStats(liveStocks);

  // 获取库存的AI建议（含技術指標）
  useEffect(() => {
    if (stats.positions.length === 0) return;

    const fetchAISuggestions = async () => {
      setIsLoadingAI(true);
      const suggestions = {};

      for (const pos of stats.positions) {
        try {
          const stock = liveStocks.find((s) => s.id === pos.stockId);
          if (stock) {
            // 先取得技術指標
            const techData = await fetchTechnicalIndicators(
              pos.stockId,
              "3mo",
              "1d",
            );
            const indicators = techData?.indicators || null;

            const suggestion = await getPortfolioAISuggestion(
              stock,
              { costPrice: pos.costPrice, quantity: pos.quantity },
              lang,
              indicators,
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
    const interval = setInterval(fetchAISuggestions, 60000); // 每60秒更新一次
    return () => clearInterval(interval);
  }, [stats.positions, liveStocks, lang]);

  const getActionBadge = (action) => {
    const badges = {
      sell: {
        en: "Sell",
        zh: "賣出",
        color: "bg-red-500/20 text-red-300 border border-red-500/30",
        icon: "📉",
      },
      addMore: {
        en: "Add More",
        zh: "加碼",
        color: "bg-green-500/20 text-green-300 border border-green-500/30",
        icon: "📈",
      },
      stopLoss: {
        en: "Stop Loss",
        zh: "止損",
        color: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
        icon: "⛔",
      },
      takeProfits: {
        en: "Take Profits",
        zh: "獲利出場",
        color: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        icon: "💎",
      },
      hold: {
        en: "Hold",
        zh: "持有",
        color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        icon: "⏳",
      },
    };

    const badge = badges[action] || badges.hold;
    return badge;
  };

  const handleEditStart = (pos) => {
    setEditingId(pos.stockId);
    setEditCostPrice(pos.costPrice.toString());
    setEditQuantity(pos.quantity.toString());
  };

  const handleEditSave = () => {
    const cost = parseFloat(editCostPrice);
    const qty = parseInt(editQuantity);

    if (!cost || cost <= 0 || !qty || qty <= 0) {
      alert(lang === "zh" ? "請輸入有效的數值" : "Please enter valid values");
      return;
    }

    updatePosition(editingId, {
      costPrice: cost,
      quantity: qty,
    });

    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Wallet Panel */}
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed right-0 top-0 h-full w-full md:max-w-4xl lg:max-w-5xl bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                💼 {lang === "zh" ? "我的錢包" : "My Wallet"}
              </h2>
              <button
                onClick={onClose}
                className="text-2xl text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 组合统计 */}
            {positions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "zh" ? "總持股數" : "Total Holdings"}
                  </p>
                  <p className="text-lg font-bold">{positions.length}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "zh" ? "成本總額" : "Total Cost"}
                  </p>
                  <p className="text-lg font-bold">
                    NT${stats.totalCost.toFixed(0)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "zh" ? "目前市值" : "Market Value"}
                  </p>
                  <p className="text-lg font-bold">
                    NT${stats.totalValue.toFixed(0)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    {lang === "zh" ? "損益率" : "Return %"}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      stats.totalGainPercent >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stats.totalGainPercent >= 0 ? "+" : ""}
                    {stats.totalGainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 持股列表 */}
          <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
            {positions.length === 0 ? (
              <div className="text-center py-32 text-slate-400">
                <div className="text-6xl mb-6">💼</div>
                <p className="text-2xl font-bold mb-4">
                  {lang === "zh" ? "你的錢包是空的" : "Your wallet is empty"}
                </p>
                <p className="text-lg">
                  {lang === "zh"
                    ? "透過搜尋個股後按下「加入錢包」來開始投資"
                    : "Search for stocks and click 'Add to Wallet' to get started"}
                </p>
              </div>
            ) : (
              stats.positions.map((pos) => {
                const suggestion = aiSuggestions[pos.stockId];
                const badge = suggestion
                  ? getActionBadge(suggestion.portfolioAction)
                  : getActionBadge("hold");
                const isEditing = editingId === pos.stockId;

                return (
                  <motion.div
                    key={pos.stockId}
                    layout
                    className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/50 rounded-2xl p-6 md:p-8 hover:border-slate-600 transition-all shadow-xl hover:shadow-2xl"
                  >
                    {/* 個股標題 */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-2xl md:text-3xl font-black">
                            {pos.stockId}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              pos.stockChange >= 0
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {pos.stockChange >= 0 ? "▲" : "▼"}{" "}
                            {Math.abs(pos.stockChange).toFixed(2)}%
                          </span>
                        </div>
                        <p className="text-base md:text-lg text-slate-400">
                          {pos.name}
                        </p>
                      </div>
                      <button
                        onClick={() => removePosition(pos.stockId)}
                        className="text-red-400 hover:text-red-300 transition-colors text-base md:text-lg px-4 py-2 hover:bg-red-500/10 rounded-lg border border-red-500/30 hover:border-red-500/50"
                      >
                        🗑️ {lang === "zh" ? "刪除" : "Remove"}
                      </button>
                    </div>

                    {isEditing ? (
                      /* 編輯模式 */
                      <div className="space-y-4 mb-6 bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm md:text-base text-slate-400 block mb-2 font-medium">
                              {lang === "zh"
                                ? "成本價 (NT$)"
                                : "Cost Price (NT$)"}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editCostPrice}
                              onChange={(e) => setEditCostPrice(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-base md:text-lg font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-sm md:text-base text-slate-400 block mb-2 font-medium">
                              {lang === "zh"
                                ? "持有數量 (股)"
                                : "Quantity (shares)"}
                            </label>
                            <input
                              type="number"
                              step="1"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-base md:text-lg font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleEditSave}
                            className="flex-1 px-6 py-3 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-base font-bold"
                          >
                            ✓ {lang === "zh" ? "保存" : "Save"}
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="flex-1 px-6 py-3 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors text-base font-bold"
                          >
                            ✕ {lang === "zh" ? "取消" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 顯示模式 */
                      <>
                        {/* 價格信息 */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                            <p className="text-xs md:text-sm text-slate-400 mb-2 font-medium">
                              {lang === "zh" ? "成本價" : "Cost"}
                            </p>
                            <p className="text-lg md:text-xl font-mono font-bold">
                              NT$ {pos.costPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                            <p className="text-xs md:text-sm text-slate-400 mb-2 font-medium">
                              {lang === "zh" ? "市場價" : "Market"}
                            </p>
                            <p className="text-lg md:text-xl font-mono font-bold text-cyan-400">
                              NT$ {pos.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                            <p className="text-xs md:text-sm text-slate-400 mb-2 font-medium">
                              {lang === "zh" ? "持有數量" : "Quantity"}
                            </p>
                            <p className="text-lg md:text-xl font-mono font-bold">
                              {pos.quantity}
                              <span className="text-sm text-slate-400 ml-1">
                                {lang === "zh" ? "股" : "shares"}
                              </span>
                            </p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                            <p className="text-xs md:text-sm text-slate-400 mb-2 font-medium">
                              {lang === "zh" ? "市值" : "Value"}
                            </p>
                            <p className="text-lg md:text-xl font-mono font-bold">
                              NT${" "}
                              {(
                                pos.currentPrice * pos.quantity
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                            <p className="text-xs md:text-sm text-slate-400 mb-2 font-medium">
                              {lang === "zh" ? "損益" : "P&L"}
                            </p>
                            <p
                              className={`text-xl md:text-2xl font-mono font-black ${
                                pos.gainPercent >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {pos.gainPercent >= 0 ? "+" : ""}
                              {pos.gainPercent.toFixed(2)}%
                            </p>
                            <p
                              className={`text-xs md:text-sm font-mono mt-1 ${
                                pos.gain >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {pos.gain >= 0 ? "+" : ""}NT${" "}
                              {pos.gain.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* AI建議 */}
                        {suggestion ? (
                          <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600/30">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{badge.icon}</span>
                                <div>
                                  <p className="text-sm font-bold">
                                    {badge.en === "Sell"
                                      ? lang === "zh"
                                        ? "💡 建議減倉"
                                        : "💡 Consider Reducing"
                                      : badge.en === "Add More"
                                        ? lang === "zh"
                                          ? "💡 建議加碼"
                                          : "💡 Consider Adding"
                                        : badge.en === "Stop Loss"
                                          ? lang === "zh"
                                            ? "💡 建議止損"
                                            : "💡 Consider Stop Loss"
                                          : badge.en === "Take Profits"
                                            ? lang === "zh"
                                              ? "💡 建議獲利"
                                              : "💡 Consider Taking Profits"
                                            : lang === "zh"
                                              ? "💡 建議持有"
                                              : "💡 Recommendation"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    信心度: {suggestion.confidence}%
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`px-3 py-1 rounded text-xs font-medium border ${badge.color}`}
                              >
                                {badge.zh}
                              </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {suggestion.reasoning}
                            </p>
                            {suggestion.targetPrice && (
                              <div className="mt-2 text-xs text-slate-400 font-mono">
                                🎯 目標: ${suggestion.targetPrice} | ⛔ 止損: $
                                {suggestion.stopLoss}
                              </div>
                            )}
                          </div>
                        ) : isLoadingAI ? (
                          <div className="text-xs text-slate-400 py-2">
                            ⏳ AI分析中...
                          </div>
                        ) : null}

                        {/* 編輯按鈕 */}
                        <button
                          onClick={() => handleEditStart(pos)}
                          className="w-full px-3 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors text-sm font-medium"
                        >
                          ✏️ {lang === "zh" ? "編輯成本" : "Edit Cost"}
                        </button>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletPanel;
