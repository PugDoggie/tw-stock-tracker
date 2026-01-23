import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePortfolio } from "../context/PortfolioContext";
import { useLanguage } from "../context/LanguageContext";
import { getPortfolioAISuggestion } from "../services/aiAnalysis";
import { fetchTechnicalIndicators } from "../services/technicalIndicatorsService";

const WalletPage = ({ onClose, liveStocks = [] }) => {
  const { t, lang } = useLanguage();
  const { positions, getPortfolioStats, removePosition, updatePosition } =
    usePortfolio();
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  const stats = getPortfolioStats(liveStocks);

  // Debug: 检查数据
  console.log("WalletPage - positions:", positions);
  console.log("WalletPage - liveStocks:", liveStocks);
  console.log("WalletPage - stats:", stats);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Full Screen Wallet Page */}
      <div className="h-screen overflow-y-auto">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-20 backdrop-blur-md bg-slate-900/95 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
            <div className="text-lg md:text-xl font-bold tracking-tighter">
              TW<span className="text-premium-accent">STOCK</span>
              <span className="ml-3 text-sm text-slate-400 font-normal">
                / 💼 {lang === "zh" ? "我的錢包" : "My Wallet"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all px-4 py-2 hover:bg-white/10 rounded-lg border border-slate-700 hover:border-slate-500"
            >
              <span>← {lang === "zh" ? "返回主頁" : "Back to Home"}</span>
            </button>
          </div>
        </div>

        {/* Header with Stats */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 border-b border-slate-700">
          <div className="max-w-7xl mx-auto p-6 md:p-10">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                💼 {lang === "zh" ? "投資組合總覽" : "Portfolio Overview"}
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                {lang === "zh"
                  ? "即時監控你的投資組合 • 單位：股 • 貨幣：NT$"
                  : "Real-time monitoring of your portfolio • Unit: shares • Currency: NT$"}
              </p>
            </div>

            {/* 組合統計 */}
            {positions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-premium-accent/50 transition-all">
                  <p className="text-sm md:text-base text-slate-400 mb-3 font-medium">
                    {lang === "zh" ? "總持股數" : "Total Holdings"}
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-premium-accent">
                    {positions.length}
                    <span className="text-lg md:text-xl text-slate-400 ml-2">
                      {lang === "zh" ? "檔" : "stocks"}
                    </span>
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all">
                  <p className="text-sm md:text-base text-slate-400 mb-3 font-medium">
                    {lang === "zh" ? "成本總額" : "Total Cost"}
                  </p>
                  <p className="text-2xl md:text-3xl font-black font-mono text-blue-400">
                    NT$ {(stats?.totalCost || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all">
                  <p className="text-sm md:text-base text-slate-400 mb-3 font-medium">
                    {lang === "zh" ? "目前市值" : "Market Value"}
                  </p>
                  <p className="text-2xl md:text-3xl font-black font-mono text-purple-400">
                    NT$ {(stats?.totalValue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all">
                  <p className="text-sm md:text-base text-slate-400 mb-3 font-medium">
                    {lang === "zh" ? "損益" : "P&L"}
                  </p>
                  <p
                    className={`text-3xl md:text-4xl font-black ${
                      (stats?.totalGainPercent || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {(stats?.totalGainPercent || 0) >= 0 ? "+" : ""}
                    {(stats?.totalGainPercent || 0).toFixed(2)}%
                  </p>
                  <p
                    className={`text-sm md:text-base font-mono mt-2 ${
                      (stats?.totalGain || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {(stats?.totalGain || 0) >= 0 ? "+" : ""}NT${" "}
                    {(stats?.totalGain || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* 持股列表 */}
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6 pb-20">
          {positions.length === 0 ? (
            <div className="text-center py-32 text-slate-400">
              <div className="text-6xl mb-6">💼</div>
              <p className="text-2xl font-bold mb-4">
                {lang === "zh" ? "你的錢包是空的" : "Your wallet is empty"}
              </p>
              <p className="text-lg mb-8">
                {lang === "zh"
                  ? "透過搜尋個股後按下「加入錢包」來開始投資"
                  : "Search for stocks and click 'Add to Wallet' to get started"}
              </p>
              <button
                onClick={onClose}
                className="px-8 py-4 bg-premium-accent text-slate-900 font-bold rounded-xl hover:bg-premium-accent/90 transition-all"
              >
                {lang === "zh" ? "返回主頁開始投資" : "Back to Home"}
              </button>
            </div>
          ) : (
            <>
              {(stats?.positions || []).map((pos) => {
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
                              (pos.stockChange || 0) >= 0
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {(pos.stockChange || 0) >= 0 ? "▲" : "▼"}{" "}
                            {Math.abs(pos.stockChange || 0).toFixed(2)}%
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
                          <div className="mb-6 p-6 bg-gradient-to-r from-slate-700/50 to-slate-700/30 rounded-xl border border-slate-600/50">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <span className="text-4xl">{badge.icon}</span>
                                <div>
                                  <p className="text-lg md:text-xl font-bold">
                                    {badge.en === "Sell"
                                      ? lang === "zh"
                                        ? "💡 AI建議減倉"
                                        : "💡 Consider Reducing"
                                      : badge.en === "Add More"
                                        ? lang === "zh"
                                          ? "💡 AI建議加碼"
                                          : "💡 Consider Adding"
                                        : badge.en === "Stop Loss"
                                          ? lang === "zh"
                                            ? "💡 AI建議止損"
                                            : "💡 Consider Stop Loss"
                                          : badge.en === "Take Profits"
                                            ? lang === "zh"
                                              ? "💡 AI建議獲利"
                                              : "💡 Consider Taking Profits"
                                            : lang === "zh"
                                              ? "💡 AI建議持有"
                                              : "💡 Recommendation"}
                                  </p>
                                  <p className="text-sm md:text-base text-slate-400">
                                    信心度: {suggestion.confidence}%
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`px-4 py-2 rounded-xl text-base font-bold border ${badge.color}`}
                              >
                                {lang === "zh" ? badge.zh : badge.en}
                              </div>
                            </div>
                            <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-4">
                              {suggestion.reasoning}
                            </p>
                            {suggestion.targetPrice && (
                              <div className="flex gap-4 text-sm md:text-base text-slate-400 font-mono">
                                <div className="flex items-center gap-2">
                                  <span>🎯 目標:</span>
                                  <span className="text-green-400 font-bold">
                                    NT$ {suggestion.targetPrice}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>⛔ 止損:</span>
                                  <span className="text-red-400 font-bold">
                                    NT$ {suggestion.stopLoss}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : isLoadingAI ? (
                          <div className="text-sm md:text-base text-slate-400 py-4 text-center">
                            ⏳ AI分析中...
                          </div>
                        ) : null}

                        {/* 編輯按鈕 */}
                        <button
                          onClick={() => handleEditStart(pos)}
                          className="w-full px-6 py-3 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-colors text-base font-bold"
                        >
                          ✏️{" "}
                          {lang === "zh"
                            ? "編輯成本與數量"
                            : "Edit Cost & Quantity"}
                        </button>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
