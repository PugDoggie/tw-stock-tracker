import React, { useState, useEffect } from "react";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import LanguageToggle from "./components/LanguageToggle";
import WalletButton from "./components/WalletButton";
import WalletPage from "./components/WalletPage";
import { LanguageProvider } from "./context/LanguageContext";
import { PortfolioProvider } from "./context/PortfolioContext";
import { fetchLiveStockData } from "./services/stockApi";
import { stocks, otcStocks } from "./data/stocks";

function App() {
  const [liveStocks, setLiveStocks] = useState([]);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // 获取实时股票数据供WalletButton/WalletPage使用
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 動態合併：預設清單 + 本地庫存持倉（支援任意代碼，如 2402）
        const baseIds = [...stocks, ...otcStocks].map((s) => s.id);
        let walletIds = [];
        try {
          const saved = localStorage.getItem("tw-stock-portfolio");
          if (saved) {
            walletIds = JSON.parse(saved)
              .map((p) => p.stockId)
              .filter(Boolean);
          }
        } catch (e) {
          console.warn("Failed to read wallet ids:", e);
        }

        const uniqueIds = Array.from(new Set([...baseIds, ...walletIds]));
        const data = await fetchLiveStockData(uniqueIds);
        setLiveStocks(data);
      } catch (err) {
        console.error("Failed to fetch live stocks:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <PortfolioProvider>
          <div className="min-h-screen bg-premium-bg text-white selection:bg-premium-accent selection:text-white">
            {/* Navigation - 当Wallet打开时隐藏 */}
            {!isWalletOpen && (
              <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-premium-bg/80 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
                  <div className="text-lg md:text-xl font-bold tracking-tighter">
                    TW<span className="text-premium-accent">STOCK</span>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <LanguageToggle />
                    <WalletButton
                      liveStocks={liveStocks}
                      onOpenWallet={() => setIsWalletOpen(true)}
                      onCloseWallet={() => setIsWalletOpen(false)}
                      isWalletOpen={isWalletOpen}
                    />
                  </div>
                </div>
              </nav>
            )}

            {/* 主页面内容 - 当Wallet打开时隐藏 */}
            {!isWalletOpen && (
              <main>
                <Hero />
                <Dashboard />
              </main>
            )}

            {/* 底部 - 当Wallet打开时隐藏 */}
            {!isWalletOpen && (
              <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5">
                <p>© 2026 TW Stock Pro. All rights reserved.</p>
              </footer>
            )}

            {isWalletOpen && (
              <WalletPage
                liveStocks={liveStocks}
                onClose={() => setIsWalletOpen(false)}
              />
            )}
          </div>
        </PortfolioProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
