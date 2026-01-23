import { translations } from "../data/translations";
import { getStockWeight } from "./indexWeightService";

/**
 * AI Technical & Institutional Analysis Engine (Professional Grade)
 * @param {object} stock - Stock data object
 * @param {string} lang - Language code ('en' or 'zh')
 * @param {object} indicators - Technical indicators data (optional)
 */
export const getAISuggestion = async (
  stock,
  lang = "zh",
  indicators = null,
  marketContext = {},
) => {
  const t = translations[lang] || translations["zh"];

  // 硬性要求真實技術指標；無指標就回傳觀望並標記資料不足
  if (!indicators) {
    const reason =
      lang === "zh"
        ? "缺少技術指標資料，暫無法給出建議"
        : "Insufficient technical indicators; unable to provide advice.";
    return {
      action: t.actions.neutral,
      confidence: 40,
      reason,
      detailedReason: reason,
      concise: {
        decision: t.actions.neutral,
        rationale: reason,
        referenceData: [],
      },
      indicators: {
        note: "missing",
      },
      strategies: {
        aggressive: {
          targetPrice: null,
          stopLoss: null,
        },
      },
      horizonRecommendations: [],
    };
  }

  const currentPrice = parseFloat(stock.price) || 0;
  const change = parseFloat(stock.change) || 0;
  const isUp = change > 0;

  const marketIndex = marketContext?.index || null;
  const marketFutures = marketContext?.futures || null;

  // 動態獲取股票權重（優先使用動態資料，fallback到靜態資料）
  let stockWeight = stock.indexWeight || 0;
  try {
    const dynamicWeight = await getStockWeight(stock.id);
    if (dynamicWeight > 0) {
      stockWeight = dynamicWeight;
    }
  } catch (err) {
    // 使用靜態權重作為fallback
    console.warn(
      `[AI Analysis] Using static weight for ${stock.id}:`,
      err.message,
    );
  }

  // 僅使用傳入的真實技術指標，不再隨機模擬
  const rsi = parseFloat(indicators?.rsi);
  const macdTrend = indicators?.macd?.trend;
  const maTrend = indicators?.movingAverages?.trend;
  const bbPosition = indicators?.bollingerBands?.position;
  const stochasticStatus = indicators?.stochastic?.status;

  // 若部分欄位缺失，回傳觀望並說明缺欄位
  const missingFields = [];
  if (!Number.isFinite(rsi)) missingFields.push("RSI");
  if (!macdTrend) missingFields.push("MACD");
  if (!maTrend) missingFields.push("MA");
  if (!bbPosition) missingFields.push("Bollinger");
  if (!stochasticStatus) missingFields.push("Stochastic");
  if (missingFields.length > 0) {
    const msg =
      lang === "zh"
        ? `技術指標缺少: ${missingFields.join(", ")}`
        : `Missing indicators: ${missingFields.join(", ")}`;
    return {
      action: t.actions.neutral,
      confidence: 40,
      reason: msg,
      detailedReason: msg,
      concise: {
        decision: t.actions.neutral,
        rationale: msg,
        referenceData: [],
      },
      indicators,
      strategies: {
        aggressive: {
          targetPrice: null,
          stopLoss: null,
        },
      },
      horizonRecommendations: [],
    };
  }

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

  // Market context influence (index & futures) with stock weight consideration
  const calcMarketBias = (weight) => {
    let bias = 0;
    let weightFactor = 1.0;

    // High-weight stocks (>5%) have stronger correlation with index
    // Low-weight stocks (<1%) are more independent
    if (weight > 10) {
      weightFactor = 1.8; // 台積電等權重股，與大盤高度連動
    } else if (weight > 5) {
      weightFactor = 1.5; // 中大型權值股
    } else if (weight > 1) {
      weightFactor = 1.2; // 一般權值股
    } else {
      weightFactor = 0.8; // 小型股，較獨立於大盤
    }

    const applyAsset = (asset) => {
      if (!asset) return;
      const c = parseFloat(asset.change) || 0;

      // 根據個股權重調整大盤影響力
      if (c > 0.6) bias += 1 * weightFactor;
      else if (c < -0.6) bias -= 1 * weightFactor;

      // 個股與大盤同向放大信號，反向則減弱
      if (weight > 1) {
        const stockChange = parseFloat(stock.change) || 0;
        if ((c > 0 && stockChange > 0) || (c < 0 && stockChange < 0)) {
          // 同向：權值股帶動大盤或跟隨大盤
          bias += 0.5;
        } else if ((c > 0 && stockChange < -1) || (c < 0 && stockChange > 1)) {
          // 反向且幅度大：可能是特殊因素，減弱大盤影響
          bias -= 0.3;
        }
      }
    };

    applyAsset(marketIndex);
    applyAsset(marketFutures);

    return Math.max(-3, Math.min(3, bias));
  };

  const marketBias = calcMarketBias(stockWeight);
  const adjustedWinRate = Math.max(40, Math.min(95, winRate + marketBias * 5));

  // 籌碼／當沖數據：若外部未提供，使用安全缺省值
  const instFlow = Number.isFinite(stock.institutionalNet)
    ? stock.institutionalNet
    : 0;
  const marginBalance = Number.isFinite(stock.marginBalance)
    ? stock.marginBalance
    : 0;
  const dayTradeRate = Number.isFinite(stock.dayTradeRate)
    ? stock.dayTradeRate
    : 0;

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

  // Get stock weight and index correlation
  const indexChange = marketIndex ? parseFloat(marketIndex.change) || 0 : 0;
  const stockChange = parseFloat(stock.change) || 0;

  // Calculate index correlation bonus for high-weight stocks
  let indexCorrelationBonus = 0;
  if (stockWeight > 10 && Math.abs(indexChange) > 0.5) {
    // 大盤強勢上漲且個股是權值股
    if (indexChange > 1.0 && stockChange > 0) {
      indexCorrelationBonus = 1; // 順勢而為
    } else if (indexChange < -1.0 && stockChange < 0) {
      indexCorrelationBonus = -1; // 大盤跌勢，謹慎
    }
  }

  // Determine action based on technical indicators alignment
  const bullishSignals =
    [
      rsi < 30, // Oversold
      rsi > 50 && rsi < 70, // Bullish but not overbought
      macdTrend === "Bullish" && maTrend !== "Downtrend",
      maTrend === "Uptrend",
      stochasticStatus === "Oversold",
    ].filter((s) => s).length +
    (marketBias > 0 ? 1 : 0) +
    (indexCorrelationBonus > 0 ? 1 : 0);

  const bearishSignals =
    [
      rsi > 70, // Overbought
      rsi < 50 && rsi > 30, // Bearish but not oversold
      macdTrend === "Bearish" && maTrend !== "Uptrend",
      maTrend === "Downtrend",
      stochasticStatus === "Overbought",
    ].filter((s) => s).length +
    (marketBias < 0 ? 1 : 0) +
    (indexCorrelationBonus < 0 ? 1 : 0);

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
    const stockWeight = stock.indexWeight || 0;

    if (marketIndex) {
      const c = parseFloat(marketIndex.change) || 0;
      const weightInfo =
        stockWeight > 5
          ? lang === "zh"
            ? `本股權重 ${stockWeight.toFixed(1)}%，對大盤影響顯著`
            : `Stock weight ${stockWeight.toFixed(1)}%, significant index impact`
          : stockWeight > 1
            ? lang === "zh"
              ? `本股權重 ${stockWeight.toFixed(1)}%`
              : `Stock weight ${stockWeight.toFixed(1)}%`
            : "";

      parts.push(
        lang === "zh"
          ? `加權指數 ${c.toFixed(2)}%${weightInfo ? `，${weightInfo}` : ""}`
          : `TAIEX ${c.toFixed(2)}%${weightInfo ? `, ${weightInfo}` : ""}`,
      );

      // 分析個股與大盤的關聯性
      if (stockWeight > 10) {
        const stockChange = parseFloat(stock.change) || 0;
        if (Math.abs(c) > 1 && Math.abs(stockChange) > 1) {
          if ((c > 0 && stockChange > 0) || (c < 0 && stockChange < 0)) {
            parts.push(
              lang === "zh"
                ? "個股與大盤同步，權值股帶動效應明顯"
                : "Stock moves with index, weight-stock leadership effect",
            );
          } else {
            parts.push(
              lang === "zh"
                ? "個股走勢背離大盤，可能有特殊題材"
                : "Stock diverges from index, possible specific catalyst",
            );
          }
        }
      }
    }
    if (marketFutures) {
      const c = parseFloat(marketFutures.change) || 0;
      parts.push(
        lang === "zh"
          ? `台指期 ${c.toFixed(2)}%`
          : `TX futures ${c.toFixed(2)}%`,
      );
    }
    if (!parts.length) return "";
    return lang === "zh"
      ? `市場分析：${parts.join("；")}。`
      : `Market analysis: ${parts.join("; ")}.`;
  };

  const marketNote = formatMarketNote();

  const formatVolumeValue = (value) => {
    if (!value && value !== 0) return lang === "zh" ? "N/A" : "N/A";
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 10_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const volumeValue = Number.isFinite(stock.volume) ? stock.volume : 0;
  const investorsText = `${instFlow > 0 ? "+" : ""}${instFlow.toFixed(0)}M`;
  const marginText = `${marginBalance.toFixed(0)}M`;

  const translateTrend = (trend) => {
    if (lang === "zh") {
      if (trend === "Uptrend") return "均線多頭";
      if (trend === "Downtrend") return "均線空頭";
      return "均線中性";
    }
    if (trend === "Uptrend") return "MA uptrend";
    if (trend === "Downtrend") return "MA downtrend";
    return "MA neutral";
  };

  const translateStochastic = (status) => {
    if (lang === "zh") {
      if (status === "Oversold") return "KD超賣";
      if (status === "Overbought") return "KD超買";
      return "KD中性";
    }
    if (status === "Oversold") return "Stoch oversold";
    if (status === "Overbought") return "Stoch overbought";
    return "Stoch neutral";
  };

  const translateBB = (pos) => {
    if (lang === "zh") {
      if (pos === "Above Upper") return "布林上軌";
      if (pos === "Below Lower") return "布林下軌";
      return "布林中軌";
    }
    if (pos === "Above Upper") return "BB upper";
    if (pos === "Below Lower") return "BB lower";
    return "BB mid";
  };

  const mainReason = (baseReason || "").split(/[。.!?]/)[0]?.trim() || "";

  const technicalLine =
    lang === "zh"
      ? `技術：RSI ${rsi.toFixed(1)}，${macdTrend === "Bullish" ? "MACD看多" : "MACD看空"}，${translateTrend(maTrend)}，${translateStochastic(stochasticStatus)}，${translateBB(bbPosition)}`
      : `Tech: RSI ${rsi.toFixed(1)}, MACD ${macdTrend === "Bullish" ? "bullish" : "bearish"}, ${translateTrend(maTrend)}, ${translateStochastic(stochasticStatus)}, ${translateBB(bbPosition)}`;

  const volumeLine =
    lang === "zh"
      ? `量價：成交量 ${formatVolumeValue(volumeValue)}，當沖 ${dayTradeRate.toFixed(1)}%`
      : `Volume: ${formatVolumeValue(volumeValue)}, day-trade ${dayTradeRate.toFixed(1)}%`;

  const flowLine =
    lang === "zh"
      ? `籌碼：法人 ${investorsText}，融資融券 ${marginText}`
      : `Flows: Inst ${investorsText}, margin/short ${marginText}`;

  const marketLine =
    marketNote ||
    (lang === "zh" ? "市場：暫無顯著影響" : "Market: no notable bias");

  const conciseRationale =
    `${mainReason ? `${mainReason} | ` : ""}${technicalLine}；${volumeLine}；${flowLine}；${marketLine}`.trim();

  const referenceData = [
    {
      label: lang === "zh" ? "技術指標" : "Technical indicators",
      value: `RSI ${rsi.toFixed(1)}, MACD ${macdTrend}, ${translateTrend(maTrend)}, ${translateStochastic(stochasticStatus)}, ${translateBB(bbPosition)}`,
    },
    {
      label: lang === "zh" ? "量能/當沖" : "Volume & intraday",
      value: `${lang === "zh" ? "成交量" : "Volume"} ${formatVolumeValue(volumeValue)}, ${lang === "zh" ? "當沖" : "Day trade"} ${dayTradeRate.toFixed(1)}%`,
    },
    {
      label: lang === "zh" ? "法人/融資券" : "Institutional & margin",
      value: `${lang === "zh" ? "法人" : "Inst"} ${investorsText}; ${lang === "zh" ? "融資融券" : "Margin/short"} ${marginText}`,
    },
    {
      label: lang === "zh" ? "市場脈絡" : "Market context",
      value: marketLine,
    },
  ];

  const reason = conciseRationale;

  // 为 StockDetailModal 提供详细原因
  const detailedReason = conciseRationale;

  const buildHorizonRecommendation = () => {
    // 短線評分（3-5天）：著重當沖比例、RSI、K值、成交量
    const shortScore = [
      rsi < 30 || rsi > 70 ? 2 : 1, // 極值能帶來波段
      stochasticStatus === "Oversold" || stochasticStatus === "Overbought"
        ? 2
        : 1, // K值極值
      dayTradeRate > 25 ? 1 : 2, // 當沖低於25%流動性好
      volumeValue > (stock.volume ? stock.volume * 1.1 : 50000) ? 2 : 1, // 量能放大
    ].reduce((a, b) => a + b, 0);

    // 中線評分（約30天）：著重均線趨勢、MACD、布林帶、機構買賣
    const midScore = [
      maTrend === "Uptrend" ? 3 : maTrend === "Downtrend" ? 0 : 1,
      macdTrend === "Bullish" ? 2 : 0,
      bbPosition === "Below Lower" ? 2 : bbPosition === "Above Upper" ? 0 : 1,
      instFlow > 100 ? 2 : instFlow < -100 ? 0 : 1, // 法人買賣
    ].reduce((a, b) => a + b, 0);

    // 長線評分（1年以上）：著重趨勢穩定度、大盤偏差、權值穩定性
    const longScore = [
      maTrend !== "Downtrend" ? 2 : 0,
      marketBias >= 0 ? 2 : marketBias < -1 ? 0 : 1,
      stockWeight > 1 ? 2 : 1, // 權值股較穩定
      marginBalance > 5000 ? 1 : 2, // 融資低風險較小
    ].reduce((a, b) => a + b, 0);

    const horizonRecommendations = [
      {
        horizon: lang === "zh" ? "短 (3-5 天)" : "Short (3-5d)",
        action:
          shortScore >= 7
            ? lang === "zh"
              ? "積極操作"
              : "Active trade"
            : shortScore >= 5
              ? lang === "zh"
                ? "波段操作"
                : "Swing trade"
              : shortScore >= 3
                ? lang === "zh"
                  ? "試單觀望"
                  : "Trial entry"
                : lang === "zh"
                  ? "觀望/空手"
                  : "Stay out",
        rationale:
          shortScore >= 7
            ? lang === "zh"
              ? `絕佳短波段：RSI ${rsi.toFixed(1)} 處於極值，K值 ${stochasticStatus.toLowerCase()}，當沖 ${dayTradeRate.toFixed(1)}% 流動性充足，可 3-5 天內操作波段。`
              : `Ideal short swing: RSI ${rsi.toFixed(1)} at extremes, K ${stochasticStatus}, day-trade ${dayTradeRate.toFixed(1)}% provides liquidity. Good for 3-5d swing.`
            : shortScore >= 5
              ? lang === "zh"
                ? `波段條件良好：${stochasticStatus === "Oversold" ? "超賣反彈機會" : "超買回調可能"}，當沖 ${dayTradeRate.toFixed(1)}%，適合輕倉試單。`
                : `Decent swing setup: ${stochasticStatus === "Oversold" ? "Oversold bounce" : "Overbought pullback"} likely, day-trade ${dayTradeRate.toFixed(1)}%; light position trial recommended.`
              : shortScore >= 3
                ? lang === "zh"
                  ? `短線條件一般：先以試單探路，RSI ${rsi.toFixed(1)} 待極值出現，關鍵支撐 / 壓力位置為進出點。`
                  : `Weak short setup: trial entry only. Watch RSI ${rsi.toFixed(1)} for extremes; use key levels for entries/exits.`
                : lang === "zh"
                  ? "短線無方向：K值與價格不同步，當沖雜訊高，建議觀望。"
                  : "No short-term direction: K-price divergence, high day-trade noise; recommend waiting.",
      },
      {
        horizon: lang === "zh" ? "中 (約 30 天)" : "Mid (≈30d)",
        action:
          midScore >= 7
            ? lang === "zh"
              ? "積極佈局"
              : "Aggressive position"
            : midScore >= 5
              ? lang === "zh"
                ? "布局持有"
                : "Build position"
              : midScore >= 3
                ? lang === "zh"
                  ? "續抱觀望"
                  : "Hold & watch"
                : lang === "zh"
                  ? "減碼/空手"
                  : "Reduce/exit",
        rationale:
          midScore >= 7
            ? lang === "zh"
              ? `中線機會明確：${maTrend} + MACD ${macdTrend.toLowerCase()} + 布林${bbPosition.toLowerCase()}，法人 ${instFlow.toFixed(0)}M 支撐，適合 30 日持有。`
              : `Clear mid setup: ${maTrend} + MACD ${macdTrend} + BB ${bbPosition}, institutional ${instFlow.toFixed(0)}M net buying; ~30d hold ideal.`
            : midScore >= 5
              ? lang === "zh"
                ? `中線趨勢成形中：${maTrend}，${macdTrend === "Bullish" ? "MACD 走揚" : "MACD 未轉"}，可分批建立中線部位。`
                : `Mid trend forming: ${maTrend}, ${macdTrend === "Bullish" ? "MACD rising" : "MACD flat"}; accumulate in tranches.`
              : midScore >= 3
                ? lang === "zh"
                  ? `中線保守：均線 ${maTrend.toLowerCase()} 但 MACD 未確認，若已持有可續抱，新進場宜觀望。`
                  : `Cautious mid: MAs ${maTrend} but MACD unclear. Hold if owning; new entries wait for confirmation.`
                : lang === "zh"
                  ? `中線看壞：${maTrend}，法人 ${instFlow.toFixed(0)}M ${instFlow < 0 ? "賣超" : "買超不足"}，建議減碼保護。`
                  : `Bearish mid: ${maTrend}, institutional ${instFlow < 0 ? "net selling" : "weak buying"} ${instFlow.toFixed(0)}M; reduce position.`,
      },
      {
        horizon: lang === "zh" ? "長 (一年以上)" : "Long (1y+)",
        action:
          longScore >= 7
            ? lang === "zh"
              ? "核心佈局"
              : "Core position"
            : longScore >= 5
              ? lang === "zh"
                ? "分批進場"
                : "Accumulate"
              : longScore >= 3
                ? lang === "zh"
                  ? "等待機會"
                  : "Wait for dip"
                : lang === "zh"
                  ? "規避/保留現金"
                  : "Avoid/hold cash",
        rationale:
          longScore >= 7
            ? lang === "zh"
              ? `長線布局基礎紮實：${maTrend}、市場偏差 ${marketBias.toFixed(1)}、權重 ${stockWeight.toFixed(1)}%、融資 ${marginBalance.toFixed(0)}M 健康。適合長期持有。`
              : `Strong long-term foundation: ${maTrend}, market bias ${marketBias.toFixed(1)}, weight ${stockWeight.toFixed(1)}%, margin ${marginBalance.toFixed(0)}M stable. Suitable for long hold.`
            : longScore >= 5
              ? lang === "zh"
                ? `長線可布局：${maTrend} 且市場支持度 ${marketBias.toFixed(1)}，建議分批進場降成本，3-6 月觀察。`
                : `OK for long: ${maTrend} with market bias ${marketBias.toFixed(1)}. Accumulate in tranches; review in 3-6mo.`
              : longScore >= 3
                ? lang === "zh"
                  ? `長線待觀：趨勢${maTrend === "Downtrend" ? "下跌中" : "未明"}，宜等待更好進場點或放量突破訊號。`
                  : `Long-term wait: trend ${maTrend === "Downtrend" ? "declining" : "unclear"}; wait for better entry or volume breakout.`
                : lang === "zh"
                  ? `長線規避：${maTrend} 且融資 ${marginBalance.toFixed(0)}M 偏高風險，保留現金等待更安全標的。`
                  : `Long-term avoid: ${maTrend} with elevated margin ${marginBalance.toFixed(0)}M; hold cash for safer picks.`,
      },
    ];

    return horizonRecommendations;
  };

  const horizonRecommendations = buildHorizonRecommendation();

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
    detailedReason,
    indicators: {
      rsi: rsi.toFixed(1),
      macd: macdTrend,
      maTrend: maTrend,
      bbPosition: bbPosition,
      stochastic: stochasticStatus,
      volume: volumeValue,
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
    horizonRecommendations,
    concise: {
      decision: action,
      rationale: conciseRationale,
      referenceData,
    },
  };
};

/**
 * AI庫存分析 - 針對持有成本的加碼/賣出建議
 * @param {object} stock - 股票資料
 * @param {object} position - 持倉資料 { costPrice, quantity }
 * @param {object} indicators - 技術指標（可選）
 * @param {string} lang - 語言
 */
export const getPortfolioAISuggestion = async (
  stock,
  position,
  lang = "zh",
  indicators = null,
) => {
  const t = translations[lang] || translations["zh"];

  if (!position) {
    return {
      action: "unknown",
      reasoning: "No position data",
    };
  }

  const currentPrice = parseFloat(stock.price) || 0;
  const costPrice = parseFloat(position.costPrice) || 0;
  const gain = ((currentPrice - costPrice) / costPrice) * 100;
  const gainValue = (currentPrice - costPrice) * position.quantity;

  // 獲取基礎建議
  const baseAI = await getAISuggestion(stock, lang, indicators);

  // 庫存成本分析
  const priceToTarget = baseAI.strategies?.aggressive?.targetPrice
    ? ((parseFloat(baseAI.strategies.aggressive.targetPrice) - currentPrice) /
        currentPrice) *
      100
    : 0;
  const priceToStopLoss = baseAI.strategies?.aggressive?.stopLoss
    ? ((currentPrice - parseFloat(baseAI.strategies.aggressive.stopLoss)) /
        currentPrice) *
      100
    : 0;

  // 庫存特定邏輯
  let portfolioAction = "hold";
  let confidence = baseAI.confidence || 50;
  let reasoning = "";

  const rsi = parseFloat(baseAI.indicators?.rsi) || 50;
  const bbPosition = baseAI.indicators?.bbPosition || "Inside";

  // 規刱1：已獲利且在高位 -> 考慮減倉賣出
  if (gain > 15 && rsi > 70) {
    portfolioAction = "sell";
    confidence = Math.min(85, confidence + 15);
    reasoning =
      lang === "zh"
        ? `已獲利 ${gain.toFixed(2)}%，技術面超買（RSI ${rsi.toFixed(1)}）。建議減倉獲利，或全數出場。`
        : `Gained ${gain.toFixed(2)}%, overbought technicals (RSI ${rsi.toFixed(1)}). Consider taking profits or exiting.`;
  }
  // 規刱2：跌破成本價且超賣 -> 加碼或止損
  else if (gain < -5 && rsi < 30) {
    const priceToBreakeven = ((costPrice - currentPrice) / currentPrice) * 100;

    // 如果跌幅小於10%且基礎建議是買入，可加碼
    if (
      gain > -10 &&
      (baseAI.action === "strongBuy" || baseAI.action === "buy")
    ) {
      portfolioAction = "addMore";
      confidence = Math.min(90, baseAI.confidence + 20);
      reasoning =
        lang === "zh"
          ? `下跌 ${Math.abs(gain).toFixed(2)}%，超賣訊號。技術面 RSI ${rsi.toFixed(1)} 具反彈潛力。建議加码，成本均價下降至 ${(costPrice * position.quantity + currentPrice * position.quantity * 0.5) / (position.quantity * 1.5)}.toFixed(2)。`
          : `Down ${Math.abs(gain).toFixed(2)}%, oversold. RSI ${rsi.toFixed(1)} shows reversal potential. Consider adding. Average cost would be reduced.`;
    } else {
      // 跌幅大於10%或基礎建議是賣出 -> 止損
      portfolioAction = "stopLoss";
      confidence = Math.min(75, baseAI.confidence);
      reasoning =
        lang === "zh"
          ? `下跌 ${Math.abs(gain).toFixed(2)}%，已跌破成本價。建議止損停損，避免進一步虧損。`
          : `Down ${Math.abs(gain).toFixed(2)}%, below cost price. Consider stop loss to prevent further losses.`;
    }
  }
  // 規刱3：小幅獲利(5-15%)且趋勢向上 -> 持有或加碼
  else if (gain >= 5 && gain <= 15 && baseAI.action === "strongBuy") {
    portfolioAction = "addMore";
    confidence = Math.min(85, baseAI.confidence);
    reasoning =
      lang === "zh"
        ? `已獲利 ${gain.toFixed(2)}%，AI信號強烈看好。建議加码擴大獲利潛力，目標 ${baseAI.strategies?.aggressive?.targetPrice || "N/A"}。`
        : `Gained ${gain.toFixed(2)}%, strong buy signal. Consider adding for greater profit potential to ${baseAI.strategies?.aggressive?.targetPrice || "N/A"}.`;
  }
  // 規刱4：接近目標價 -> 賣出或減倉（僅在已有浮盈時才提示獲利）
  else if (
    gain >= 0 &&
    priceToTarget < 5 &&
    priceToTarget > 0 &&
    baseAI.action !== "strongBuy"
  ) {
    portfolioAction = "takeProfits";
    confidence = Math.min(80, baseAI.confidence);
    reasoning =
      lang === "zh"
        ? `接近目標價 ${baseAI.strategies?.aggressive?.targetPrice}（還有 ${priceToTarget.toFixed(2)}% 空間）。建議獲利出場。`
        : `Approaching target price ${baseAI.strategies?.aggressive?.targetPrice} (${priceToTarget.toFixed(2)}% left). Consider exiting at target.`;
  }
  // 規刱5：接近止損價 -> 立即止損
  else if (priceToStopLoss < 3 && baseAI.action !== "strongBuy") {
    portfolioAction = "stopLoss";
    confidence = 90;
    reasoning =
      lang === "zh"
        ? `接近止損點 ${baseAI.strategies?.aggressive?.stopLoss}，風險加劇。建議立即止損。`
        : `Approaching stop loss at ${baseAI.strategies?.aggressive?.stopLoss}. Risk elevated. Exit immediately.`;
  }
  // 規刱6：整體偏空且帳上處損 -> 建議停損出場
  else if (
    gain < 0 &&
    baseAI.action !== t.actions.strongBuy &&
    baseAI.action !== t.actions.buy
  ) {
    portfolioAction = "stopLoss";
    confidence = Math.min(85, (baseAI.confidence || 60) + 10);
    reasoning =
      lang === "zh"
        ? `目前虧損 ${Math.abs(gain).toFixed(2)}%，AI 判定不適合續抱。為避免持續下跌，建議嚴格停損出場，保留資金等待更佳機會。`
        : `Currently down ${Math.abs(gain).toFixed(2)}% and AI bias is not bullish. To avoid further drawdown, cut the position and preserve capital for better setups.`;
  }
  // 默認：持有或繼續觀望
  else {
    portfolioAction = baseAI.action === "strongBuy" ? "hold" : "hold";
    confidence = baseAI.confidence;
    reasoning =
      lang === "zh"
        ? `成本${costPrice.toFixed(2)}，目前${gain >= 0 ? "獲利" : "虧損"} ${Math.abs(gain).toFixed(2)}%。繼續持有，監控技術面變化。`
        : `Cost ${costPrice.toFixed(2)}, currently ${gain >= 0 ? "up" : "down"} ${Math.abs(gain).toFixed(2)}%. Hold and monitor.`;
  }

  return {
    baseAction: baseAI.action,
    portfolioAction, // sell, addMore, stopLoss, takeProfits, hold
    confidence: Math.round(confidence),
    reasoning,
    costPrice,
    currentPrice,
    gain: gain.toFixed(2),
    gainValue: gainValue.toFixed(2),
    targetPrice: baseAI.strategies?.aggressive?.targetPrice,
    stopLoss: baseAI.strategies?.aggressive?.stopLoss,
    indicators: baseAI.indicators,
  };
};
