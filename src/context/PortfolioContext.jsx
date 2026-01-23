import React, { createContext, useContext, useState, useEffect } from "react";

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within PortfolioProvider");
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tw-stock-portfolio");
    if (saved) {
      try {
        setPositions(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tw-stock-portfolio", JSON.stringify(positions));
  }, [positions]);

  /**
   * 添加或更新持仓
   * @param {object} position - { stockId, name, costPrice, quantity, addedAt }
   */
  const addPosition = (position) => {
    setPositions((prev) => {
      const existing = prev.find((p) => p.stockId === position.stockId);
      if (existing) {
        // 更新现有持仓
        return prev.map((p) =>
          p.stockId === position.stockId
            ? { ...p, ...position, updatedAt: new Date().toISOString() }
            : p,
        );
      } else {
        // 添加新持仓
        return [
          ...prev,
          {
            ...position,
            id: `pos_${Date.now()}`,
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });
  };

  /**
   * 删除持仓
   */
  const removePosition = (positionId) => {
    setPositions((prev) =>
      prev.filter((p) => p.id !== positionId && p.stockId !== positionId),
    );
  };

  /**
   * 更新持仓
   */
  const updatePosition = (stockId, updates) => {
    setPositions((prev) =>
      prev.map((p) => (p.stockId === stockId ? { ...p, ...updates } : p)),
    );
  };

  /**
   * 获取特定股票的持仓
   */
  const getPosition = (stockId) => {
    return positions.find((p) => p.stockId === stockId);
  };

  /**
   * 计算组合统计
   */
  const getPortfolioStats = (liveStocks = []) => {
    if (positions.length === 0) {
      return {
        totalCost: 0,
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        positions: [],
      };
    }

    const stats = positions.map((pos) => {
      const stock = liveStocks.find((s) => s.id === pos.stockId);
      const currentPrice = parseFloat(stock?.price) || 0;
      const totalCost = pos.costPrice * pos.quantity;
      const currentValue = currentPrice * pos.quantity;
      const gain = currentValue - totalCost;
      const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

      return {
        ...pos,
        currentPrice,
        totalCost,
        currentValue,
        gain,
        gainPercent,
        stockPrice: stock?.price || 0,
        stockChange: stock?.change || 0,
      };
    });

    const totalCost = stats.reduce((sum, p) => sum + p.totalCost, 0);
    const totalValue = stats.reduce((sum, p) => sum + p.currentValue, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    return {
      totalCost,
      totalValue,
      totalGain,
      totalGainPercent,
      positions: stats,
    };
  };

  const value = {
    positions,
    isLoading,
    setIsLoading,
    addPosition,
    removePosition,
    updatePosition,
    getPosition,
    getPortfolioStats,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
