import { translations } from "../data/translations";

/**
 * AI Technical & Institutional Analysis Engine (Professional Grade)
 * @param {object} stock - Stock data object
 * @param {string} lang - Language code ('en' or 'zh')
 * @param {object} indicators - Technical indicators data (optional)
 */
export const getAISuggestion = (
  stock,
  lang = "zh",
  indicators = null,
  marketContext = {},
) => {
  const t = translations[lang] || translations["zh"];

  // Deterministic seed for simulation
  const seed = stock.id.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const currentPrice = parseFloat(stock.price) || 0;
  const change = parseFloat(stock.change) || 0;
  const isUp = change > 0;

  const marketIndex = marketContext?.index || null;
  const marketFutures = marketContext?.futures || null;

  // Use actual technical indicators if provided, otherwise use mock data
  const rsi = indicators?.rsi
    ? parseFloat(indicators.rsi)
    : 45 + (Math.abs(seed) % 40);
  const macdTrend = indicators?.macd?.trend || (isUp ? "Bullish" : "Bearish");
  const maTrend = indicators?.movingAverages?.trend || "Neutral";
  const bbPosition = indicators?.bollingerBands?.position || "Inside Bands";
  const stochasticStatus = indicators?.stochastic?.status || "Neutral";

  // Calculate confidence based on indicator alignment
  const alignedSignals = [
    rsi > 70 || rsi < 30 ? 1 : 0, // Overbought/Oversold
    (macdTrend === "Bullish" && isUp) || (macdTrend === "Bearish" && !isUp)
      ? 1
      : 0, // MACD alignment
    (maTrend === "Uptrend" && isUp) || (maTrend === "Downtrend" && !isUp)
      ? 1
      : 0, // MA alignment
    (stochasticStatus === "Oversold" && isUp) ||
    (stochasticStatus === "Overbought" && !isUp)
      ? 1
      : 0, // Stochastic reversal signal
  ].reduce((a, b) => a + b, 0);

  const winRate = Math.min(95, 50 + alignedSignals * 15 + Math.abs(change) * 3);

  // Market context influence (index & futures)
  const calcMarketBias = () => {
    let bias = 0;

    const applyAsset = (asset) => {
      if (!asset) return;
      const c = parseFloat(asset.change) || 0;
      if (c > 0.6) bias += 1;
      else if (c < -0.6) bias -= 1;
    };

    applyAsset(marketIndex);
    applyAsset(marketFutures);

    return Math.max(-2, Math.min(2, bias));
  };

  const marketBias = calcMarketBias();
  const adjustedWinRate = Math.max(40, Math.min(95, winRate + marketBias * 5));

  // Professional Indicators Simulation with data-driven adjustments
  const instFlow =
    (seed % 800) + change * 150 + (rsi < 30 ? 200 : rsi > 70 ? -200 : 0);
  const marginBalance =
    Math.abs(seed % 15000) +
    change * 100 +
    (stochasticStatus === "Overbought" ? -1000 : 1000);
  const dayTradeRate = Math.max(
    10,
    Math.min(
      40,
      25 + Math.abs(seed % 35) + Math.abs(change) * 3 - alignedSignals * 2,
    ),
  );

  // Data-driven Narratives based on actual indicators
  const getNarrative = (actionType) => {
    // Get specific indicator insights
    const getRSIInsight = () => {
      if (rsi > 75)
        return { en: "extreme overbought conditions", zh: "極度超買狀態" };
      if (rsi > 70) return { en: "overbought territory", zh: "超買區域" };
      if (rsi < 25)
        return {
          en: "extreme oversold conditions offering strong reversal potential",
          zh: "極度超賣創造強勁反彈機會",
        };
      if (rsi < 30)
        return {
          en: "oversold levels with reversal potential",
          zh: "超賣區域具反彈機會",
        };
      if (rsi > 50) return { en: "bullish momentum", zh: "多頭動能" };
      return { en: "neutral momentum", zh: "中立動能" };
    };

    const getMAInsight = () => {
      if (maTrend === "Uptrend")
        return {
          en: "strong uptrend structure intact",
          zh: "上升結構完整扎實",
        };
      if (maTrend === "Downtrend")
        return {
          en: "active downtrend with price below key averages",
          zh: "價格位於均線下方處於下跌趨勢",
        };
      return {
        en: "consolidation phase without clear direction",
        zh: "盤整階段缺乏明確方向",
      };
    };

    const getBBInsight = () => {
      if (bbPosition === "Above Upper")
        return {
          en: "testing upper Bollinger Band resistance",
          zh: "觸及布林帶上軌",
        };
      if (bbPosition === "Below Lower")
        return {
          en: "touching lower Bollinger Band support",
          zh: "觸及布林帶下軌",
        };
      return {
        en: "trading within normal volatility bands",
        zh: "在正常波動帶內交易",
      };
    };

    if (actionType === "strongBuy") {
      return {
        en: `Technical indicators show strong buy signals: RSI at ${rsi.toFixed(1)} signals ${getRSIInsight().en}. ${getMAInsight().en} with ${macdTrend} MACD confirmation. Current price at ${getBBInsight().en}. Heavy institutional accumulation (${instFlow.toFixed(0)}M net inflow) supports breakout. Risk-reward ratio is favorable for a 5-7 day swing trade. Entry at current levels recommended.`,
        zh: `技術指標顯示買進信號：RSI在 ${rsi.toFixed(1)} 呈現 ${getRSIInsight().zh}。${getMAInsight().zh}，MACD確認${macdTrend === "Bullish" ? "看漲" : "看跌"}。股價${getBBInsight().zh}。法人大戶支撐買盤（淨流入約 ${instFlow.toFixed(0)} 百萬）推動突破。損益比優異，適合 5-7 日的波段操作，當前價位可考慮進場。`,
      };
    } else if (actionType === "hold") {
      return {
        en: `Current technicals suggest holding: RSI at ${rsi.toFixed(1)} indicates ${getRSIInsight().en}. ${getMAInsight().en} Price ${getBBInsight().en}. Institutional sentiment is cautiously optimistic. If you already hold, maintain position for next consolidation breakout. Day-trading intensity at ${dayTradeRate.toFixed(1)}% suggests some noise but core uptrend intact. Monitor for volume expansion to add.`,
        zh: `技術面建議持有：RSI在 ${rsi.toFixed(1)} 顯示 ${getRSIInsight().zh}。${getMAInsight().zh}。股價${getBBInsight().zh}。法人態度謹慎樂觀。若已持有，可繼續持有等待下次突破。當沖比例 ${dayTradeRate.toFixed(1)}% 雖有雜訊但上升結構未破。留意量能變化時可加碼。`,
      };
    } else {
      return {
        en: `Caution: Unclear technicals suggest observation mode. RSI at ${rsi.toFixed(1)} shows ${getRSIInsight().en}. ${getMAInsight().en} Price ${getBBInsight().en}. Day-trading at ${dayTradeRate.toFixed(1)}% suggests elevated noise over real trend. Recommend waiting for clearer signals: (1) RSI extremes with MACD alignment, or (2) clear MA breakout with volume. Stay in cash until setup improves.`,
        zh: `謹慎：技術面不明確建議觀望。RSI在 ${rsi.toFixed(1)} 呈 ${getRSIInsight().zh}。${getMAInsight().zh}。當沖 ${dayTradeRate.toFixed(1)}% 顯示雜訊大於趨勢。建議等待更明確信號：(1) RSI極值配合MACD轉折，或 (2) 均線突破伴隨量能放大。持現金等待更佳時機。`,
      };
    }
  };

  let action = t.actions.neutral;
  let actionKey = "neutral";

  // Determine action based on technical indicators alignment
  const bullishSignals =
    [
      rsi < 30, // Oversold
      rsi > 50 && rsi < 70, // Bullish but not overbought
      macdTrend === "Bullish" && maTrend !== "Downtrend",
      maTrend === "Uptrend",
      stochasticStatus === "Oversold",
    ].filter((s) => s).length + (marketBias > 0 ? 1 : 0);

  const bearishSignals =
    [
      rsi > 70, // Overbought
      rsi < 50 && rsi > 30, // Bearish but not oversold
      macdTrend === "Bearish" && maTrend !== "Uptrend",
      maTrend === "Downtrend",
      stochasticStatus === "Overbought",
    ].filter((s) => s).length + (marketBias < 0 ? 1 : 0);

  // Strong buy: Multiple bullish signals + positive price action
  if (
    (bullishSignals >= 3 && change > 0.5) ||
    (rsi < 25 && macdTrend === "Bullish" && change > 0)
  ) {
    action = t.actions.strongBuy;
    actionKey = "strongBuy";
  }
  // Hold: Mixed signals or consolidation
  else if (
    (bullishSignals >= 2 && bearishSignals >= 1) ||
    (maTrend === "Neutral" && rsi >= 30 && rsi <= 70)
  ) {
    action = t.actions.hold;
    actionKey = "hold";
  }

  const narrative = getNarrative(actionKey);
  const baseReason = narrative[lang] || narrative["zh"];

  const formatMarketNote = () => {
    const parts = [];
    if (marketIndex) {
      const c = parseFloat(marketIndex.change) || 0;
      parts.push(
        lang === "zh"
          ? `加權指數 ${c.toFixed(2)}% (${marketIndex.symbol || marketIndex.id})`
          : `TAIEX ${c.toFixed(2)}% (${marketIndex.symbol || marketIndex.id})`,
      );
    }
    if (marketFutures) {
      const c = parseFloat(marketFutures.change) || 0;
      parts.push(
        lang === "zh"
          ? `台指期 ${c.toFixed(2)}% (${marketFutures.symbol || marketFutures.id})`
          : `TX futures ${c.toFixed(2)}% (${marketFutures.symbol || marketFutures.id})`,
      );
    }
    if (!parts.length) return "";
    return lang === "zh"
      ? `市場風向：${parts.join("；")}。`
      : `Market context: ${parts.join("; ")}.`;
  };

  const reason = `${baseReason} ${formatMarketNote()}`.trim();

  // Enhanced strategy details with clear reasoning
  const getStrategyDetails = () => {
    const baseTarget = currentPrice * 1.08;
    const baseStop = currentPrice * 0.96;

    if (actionKey === "strongBuy") {
      return {
        aggressive: {
          type: t.aggressive,
          desc: t.aggDesc,
          targetPrice: (currentPrice * 1.12).toFixed(2),
          stopLoss: (currentPrice * 0.97).toFixed(2),
          reasoning:
            lang === "zh"
              ? `積極策略適合短線交易者。目標價設定在 +12%，止損設在 -3%，風險報酬比 1:4。建議分批進場，第一批 50% 在當前價位，第二批 30% 在回測支撐時，保留 20% 資金應對突發狀況。當價格突破前高時加碼，跌破 5 日均線立即停損。`
              : `Aggressive strategy for active traders. Target at +12%, stop-loss at -3%, risk-reward ratio 1:4. Recommended entry: 50% at current price, 30% on pullback to support, reserve 20% for contingencies. Add position on breakout above previous high, exit immediately if price breaks below 5-day MA.`,
        },
        conservative: {
          type: t.conservative,
          desc: t.consDesc,
          targetPrice: (currentPrice * 1.06).toFixed(2),
          stopLoss: (currentPrice * 0.94).toFixed(2),
          reasoning:
            lang === "zh"
              ? `保守策略適合穩健投資者。目標價設定在 +6%，止損設在 -6%，風險報酬比 1:1。建議在支撐位附近分 3 批進場，每批間隔 1-2%。持有期間關注成交量變化，若量能持續萎縮則減碼，若放量突破則可持續持有至目標價。`
              : `Conservative strategy for steady investors. Target at +6%, stop-loss at -6%, risk-reward ratio 1:1. Recommended to enter in 3 batches near support levels, 1-2% apart. Monitor volume during holding period - reduce position if volume continues to shrink, hold to target if breakout occurs with volume expansion.`,
        },
      };
    } else if (actionKey === "hold") {
      return {
        aggressive: {
          type: t.aggressive,
          desc: t.aggDesc,
          targetPrice: (currentPrice * 1.04).toFixed(2),
          stopLoss: (currentPrice * 0.96).toFixed(2),
          reasoning:
            lang === "zh"
              ? `當前處於整理期，積極策略建議小倉位試探。目標價 +4%，止損 -4%。僅投入 30% 資金，在關鍵支撐位掛單。若價格向上突破整理區間且伴隨放量，可加碼至 50%。若跌破支撐立即出場，不戀戰。`
              : `Currently in consolidation phase, aggressive strategy suggests small position testing. Target +4%, stop-loss -4%. Allocate only 30% capital, place orders at key support. If price breaks above consolidation range with volume, increase to 50%. Exit immediately if support breaks, no hesitation.`,
        },
        conservative: {
          type: t.conservative,
          desc: t.consDesc,
          targetPrice: (currentPrice * 1.03).toFixed(2),
          stopLoss: (currentPrice * 0.95).toFixed(2),
          reasoning:
            lang === "zh"
              ? `保守策略建議觀望為主。若已持有，可繼續持有但不加碼，目標價 +3%，止損 -5%。密切關注法人動向和成交量變化。若出現連續 3 日量縮且價格橫盤，建議先行減碼 50%，保留核心部位等待明確信號。`
              : `Conservative strategy recommends observation. If already holding, maintain position without adding, target +3%, stop-loss -5%. Closely monitor institutional movements and volume changes. If volume shrinks for 3 consecutive days with sideways price action, reduce 50% of position, keep core holdings for clear signals.`,
        },
      };
    } else {
      return {
        aggressive: {
          type: t.aggressive,
          desc: t.aggDesc,
          targetPrice: (currentPrice * 1.02).toFixed(2),
          stopLoss: (currentPrice * 0.98).toFixed(2),
          reasoning:
            lang === "zh"
              ? `趨勢不明，積極策略建議空手觀望。若堅持進場，僅用 20% 資金，目標 +2%，止損 -2%。嚴格執行紀律，達到任一條件立即出場。建議等待明確的突破信號或法人大量買進後再考慮進場。`
              : `Unclear trend, aggressive strategy recommends staying out. If must enter, use only 20% capital, target +2%, stop-loss -2%. Strictly follow discipline, exit immediately when either condition is met. Recommend waiting for clear breakout signal or significant institutional buying before considering entry.`,
        },
        conservative: {
          type: t.conservative,
          desc: t.consDesc,
          targetPrice: (currentPrice * 1.01).toFixed(2),
          stopLoss: (currentPrice * 0.97).toFixed(2),
          reasoning:
            lang === "zh"
              ? `保守策略強烈建議空手觀望。當前市場缺乏明確方向，盲目進場風險大於機會。建議將資金配置到其他更有把握的標的，或持有現金等待更好的進場時機。若市場出現明確趨勢再行動不遲。`
              : `Conservative strategy strongly recommends staying in cash. Current market lacks clear direction, blind entry carries more risk than opportunity. Suggest allocating capital to other stocks with better setups, or hold cash waiting for better entry timing. Not too late to act when market shows clear trend.`,
        },
      };
    }
  };

  const strategies = getStrategyDetails();

  return {
    action,
    confidence: adjustedWinRate,
    reason,
    indicators: {
      rsi: rsi.toFixed(1),
      macd: macdTrend,
      maTrend: maTrend,
      bbPosition: bbPosition,
      stochastic: stochasticStatus,
      volume: stock.volume || (seed % 50000) + 10000,
      signalAlignment: {
        bullish: bullishSignals,
        bearish: bearishSignals,
      },
    },
    institutional: {
      investors: `${instFlow > 0 ? "+" : ""}${instFlow.toFixed(0)}M`,
      margin: `${marginBalance.toFixed(0)}M`,
      dayTrade: `${dayTradeRate.toFixed(1)}%`,
    },
    marketBias,
    strategies,
  };
};
