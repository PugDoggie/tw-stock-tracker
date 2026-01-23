import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "../context/PortfolioContext";
import { useLanguage } from "../context/LanguageContext";

const AddPositionModal = ({ isOpen, onClose, stocks = [] }) => {
  const { t, lang } = useLanguage();
  const { addPosition, getPosition } = usePortfolio();
  const [searchInput, setSearchInput] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [costPrice, setCostPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  // 搜索股票
  const filteredStocks = stocks.filter((stock) => {
    const search = searchInput.toLowerCase();
    return (
      stock.id.toLowerCase().includes(search) ||
      (stock.name_zh && stock.name_zh.includes(searchInput)) ||
      (stock.name_en && stock.name_en.toLowerCase().includes(search))
    );
  });

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchInput("");
    setError("");
  };

  const handleAddPosition = () => {
    if (!selectedStock) {
      setError(lang === "zh" ? "請選擇股票" : "Please select a stock");
      return;
    }

    const cost = parseFloat(costPrice);
    const qty = parseInt(quantity);

    if (!cost || cost <= 0) {
      setError(
        lang === "zh" ? "成本價必須大於0" : "Cost price must be greater than 0",
      );
      return;
    }

    if (!qty || qty <= 0) {
      setError(
        lang === "zh" ? "數量必須大於0" : "Quantity must be greater than 0",
      );
      return;
    }

    addPosition({
      stockId: selectedStock.id,
      name: lang === "zh" ? selectedStock.name_zh : selectedStock.name_en,
      costPrice: cost,
      quantity: qty,
    });

    // Reset form
    setSelectedStock(null);
    setCostPrice("");
    setQuantity("");
    setError("");
    onClose();
  };

  const handleReset = () => {
    setSelectedStock(null);
    setSearchInput("");
    setCostPrice("");
    setQuantity("");
    setError("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="border-b border-slate-700 p-6">
              <h2 className="text-xl font-bold">
                {lang === "zh" ? "添加持股" : "Add Position"}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* 股票搜索 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {lang === "zh" ? "股票代碼/名稱" : "Stock Code/Name"}
                </label>

                {!selectedStock ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={lang === "zh" ? "搜尋股票..." : "Search..."}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-premium-accent"
                    />

                    {/* 搜索結果下拉 */}
                    {searchInput && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                        {filteredStocks.length === 0 ? (
                          <div className="p-3 text-slate-400 text-sm">
                            {lang === "zh" ? "未找到股票" : "No stocks found"}
                          </div>
                        ) : (
                          filteredStocks.map((stock) => (
                            <button
                              key={stock.id}
                              onClick={() => handleSelectStock(stock)}
                              className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                            >
                              <div className="font-medium">{stock.id}</div>
                              <div className="text-slate-400 text-xs">
                                {lang === "zh" ? stock.name_zh : stock.name_en}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-800 border border-slate-600 rounded-lg p-4">
                    <div>
                      <div className="font-medium">{selectedStock.id}</div>
                      <div className="text-slate-400 text-sm">
                        {lang === "zh"
                          ? selectedStock.name_zh
                          : selectedStock.name_en}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStock(null);
                        setSearchInput("");
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* 成本價 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {lang === "zh" ? "成本價 (NT$)" : "Cost Price (NT$)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={
                    lang === "zh" ? "輸入成本價格" : "Enter cost price"
                  }
                  value={costPrice}
                  onChange={(e) => {
                    setCostPrice(e.target.value);
                    setError("");
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-premium-accent"
                />
              </div>

              {/* 數量 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    setError("");
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-premium-accent"
                />
              </div>

              {/* 計算總成本 */}
              {costPrice && quantity && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <div className="text-slate-400 text-sm mb-1">
                    {lang === "zh" ? "總成本額" : "Total Cost"}
                  </div>
                  <div className="text-xl font-bold">
                    NT${(parseFloat(costPrice) * parseInt(quantity)).toFixed(0)}
                  </div>
                </div>
              )}

              {/* 錯誤訊息 */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 p-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleAddPosition}
                disabled={!selectedStock || !costPrice || !quantity}
                className="flex-1 px-4 py-2 bg-premium-accent hover:bg-premium-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {lang === "zh" ? "確認添加" : "Add Position"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddPositionModal;
