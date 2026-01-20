import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const Hero = () => {
  const { t } = useLanguage();

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.1,
        },
      },
    }),
    [],
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" },
      },
    }),
    [],
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 md:px-6 lg:px-12 pt-20 md:pt-32 lg:pt-40 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-premium-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-premium-accent/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto text-center space-y-8 md:space-y-12"
      >
        <motion.div variants={itemVariants} className="space-y-4 md:space-y-6">
          <p className="text-premium-accent font-black text-xs md:text-sm tracking-[0.3em] md:tracking-[0.4em] uppercase">
            {t("marketOverview")}
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-tight">
            {t("heroTitle")}
            <span className="block bg-gradient-to-r from-premium-accent via-premium-accent to-premium-success bg-clip-text text-transparent drop-shadow-2xl">
              {t("heroHighlight")}
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            {t("heroDesc")}
          </p>
        </motion.div>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-premium-accent to-premium-success text-premium-bg font-black rounded-xl md:rounded-3xl shadow-2xl shadow-premium-accent/30 hover:shadow-primary/50 transition-all text-sm md:text-lg tracking-wider uppercase"
          onClick={() => {
            document
              .getElementById("dashboard")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {t("startBtn")}
        </motion.button>

        <motion.div
          variants={itemVariants}
          className="pt-8 md:pt-12 flex justify-center gap-4 md:gap-8 flex-wrap"
        >
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-white">8+</p>
            <p className="text-slate-500 text-xs md:text-sm font-bold">
              Major Stocks
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-white">3s</p>
            <p className="text-slate-500 text-xs md:text-sm font-bold">
              Update Freq
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-black text-white">100%</p>
            <p className="text-slate-500 text-xs md:text-sm font-bold">
              Real Data
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <svg
          className="w-6 h-6 text-premium-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>
    </section>
  );
};

export default React.memo(Hero);
