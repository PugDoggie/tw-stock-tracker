import React from "react";
import { motion } from "framer-motion";
import { usePortfolio } from "../context/PortfolioContext";
import { useLanguage } from "../context/LanguageContext";
import WalletPage from "./WalletPage";

const WalletButton = ({
  liveStocks = [],
  onOpenWallet,
  onCloseWallet,
  isWalletOpen,
}) => {
  const { lang } = useLanguage();
  const { positions } = usePortfolio();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenWallet}
        className="relative text-xs md:text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 md:px-4 py-2 md:py-2 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg md:rounded-xl"
      >
        <span className="flex items-center gap-2">
          📈 {lang === "zh" ? "我的庫存" : "My Wallet"}
          {positions.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-premium-accent text-slate-900 rounded-full">
              {positions.length}
            </span>
          )}
        </span>
      </motion.button>

      {isWalletOpen && (
        <WalletPage onClose={onCloseWallet} liveStocks={liveStocks} />
      )}
    </>
  );
};

export default WalletButton;
