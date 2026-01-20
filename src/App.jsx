import React from "react";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import LanguageToggle from "./components/LanguageToggle";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <div className="min-h-screen bg-premium-bg text-white selection:bg-premium-accent selection:text-white">
          {/* Navigation */}
          <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-premium-bg/80 border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
              <div className="text-lg md:text-xl font-bold tracking-tighter">
                TW<span className="text-premium-accent">STOCK</span>
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <LanguageToggle />
                <button className="text-xs md:text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 md:px-4 py-1 md:py-2">
                  Connect Wallet
                </button>
              </div>
            </div>
          </nav>

          <main>
            <Hero />
            <Dashboard />
          </main>

          <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5">
            <p>© 2026 TW Stock Pro. All rights reserved.</p>
          </footer>
        </div>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
