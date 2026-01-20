import { translations } from '../data/translations';

/**
 * AI Technical & Institutional Analysis Engine (Professional Grade)
 * @param {object} stock - Stock data object
 * @param {string} lang - Language code ('en' or 'zh')
 */
export const getAISuggestion = (stock, lang = 'zh') => {
    const t = translations[lang] || translations['zh'];

    // Deterministic seed for simulation
    const seed = stock.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const winRate = 78 + (Math.abs(seed) % 15);

    const currentPrice = parseFloat(stock.price) || 0;
    const change = parseFloat(stock.change) || 0;
    const isUp = change > 0;

    // Professional Indicators Simulation
    const instFlow = (seed % 800) + (change * 150);
    const marginBalance = Math.abs((seed % 15000)) + (change * 100);
    const dayTradeRate = 25 + Math.abs((seed % 35)) + (Math.abs(change) * 3);

    // Expanded Narratives
    const getNarrative = (actionType) => {
        if (actionType === 'strongBuy') {
            return {
                en: `Technical indicators confirm a powerful breakout configuration sustained by heavy institutional accumulation (${instFlow.toFixed(0)}M net inflow). The upward slope of the short-term moving averages suggests a robust momentum tailwind. With day-trading intensity normalizing, the risk of a whip-saw is diminishing. Acquisition at current levels offers a superior risk-to-reward ratio for the projected 5-day cycle.`,
                zh: `技術指標確認當前處於強勁的突破形態，並獲得法人大戶顯著的買盤支撐（淨流入約 ${instFlow.toFixed(0)} 百萬）。短期均線呈現多頭昂揚排列，顯示上方動能極其強韌。隨著日內當沖熱度降溫，籌碼穩定度大幅提升。當前價位進場具備極佳的損益比期望值，適合佈局未來一個交易週的波段行情。`
            };
        } else if (actionType === 'hold') {
            return {
                en: `The asset is currently navigating a healthy consolidation phase following a recent rally. Institutional sentiment remains cautiously optimistic as liquidity pools stabilize. While the immediate breakout momentum has slowed, the underlying support structure remains intact. Historical volume nodes suggest strong floor pricing at current levels. Recommendation is to maintain existing core positions while monitoring for a secondary volume expansion.`,
                zh: `該標的在近期漲勢後進入良性的技術性修正與沈澱期。法人籌碼展現中性偏多的態度，市場情緒趨於理性穩定。雖然即時突破動能暫緩，但下方的支撐結構依然扎實且未見破位跡象。根據成交密集區判斷，當前報價已具備強勁的地板保護，建議持有核心部位，並靜待下次量能放大後的攻擊信號。`
            };
        } else {
            return {
                en: `Price action is characterized by low-conviction range-bound movement within a lack of significant institutional catalysts. Equilibrium between buy and sell orders is preventing a clear directional bias. Elevated day-trading volatility (${dayTradeRate.toFixed(1)}%) suggests localized noise rather than fundamental trend formation. Strategic patience is advised until a clear departure from the current high-volume node occurs with institutional backing.`,
                zh: `目前股價呈現低波動的區間震盪，市場缺乏顯著的法人催化劑帶領方向。多空雙方力量處於暫時平衡狀態，難以形成明確的趨勢判斷。當前較高的當沖比例（${dayTradeRate.toFixed(1)}%）顯示市場充斥短線雜訊而非基本面行情。在法人籌碼回歸前，建議保持策略性觀望，待價格脫離盤整區間並伴隨成交量顯著變化後再考慮進場。`
            };
        }
    };

    let action = t.actions.neutral;
    let actionKey = 'neutral';

    // Determine action based on change and indicators
    if (change > 2.5 || (change > 1.5 && instFlow > 500)) {
        action = t.actions.strongBuy;
        actionKey = 'strongBuy';
    } else if (change < -2.0 || (change < -1.0 && instFlow < -300)) {
        action = t.actions.hold;
        actionKey = 'hold';
    }

    const narrative = getNarrative(actionKey);
    const reason = narrative[lang] || narrative['zh'];

    // Enhanced strategy details with clear reasoning
    const getStrategyDetails = () => {
        const baseTarget = currentPrice * 1.08;
        const baseStop = currentPrice * 0.96;

        if (actionKey === 'strongBuy') {
            return {
                aggressive: {
                    type: t.aggressive,
                    desc: t.aggDesc,
                    targetPrice: (currentPrice * 1.12).toFixed(2),
                    stopLoss: (currentPrice * 0.97).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `積極策略適合短線交易者。目標價設定在 +12%，止損設在 -3%，風險報酬比 1:4。建議分批進場，第一批 50% 在當前價位，第二批 30% 在回測支撐時，保留 20% 資金應對突發狀況。當價格突破前高時加碼，跌破 5 日均線立即停損。`
                        : `Aggressive strategy for active traders. Target at +12%, stop-loss at -3%, risk-reward ratio 1:4. Recommended entry: 50% at current price, 30% on pullback to support, reserve 20% for contingencies. Add position on breakout above previous high, exit immediately if price breaks below 5-day MA.`
                },
                conservative: {
                    type: t.conservative,
                    desc: t.consDesc,
                    targetPrice: (currentPrice * 1.06).toFixed(2),
                    stopLoss: (currentPrice * 0.94).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `保守策略適合穩健投資者。目標價設定在 +6%，止損設在 -6%，風險報酬比 1:1。建議在支撐位附近分 3 批進場，每批間隔 1-2%。持有期間關注成交量變化，若量能持續萎縮則減碼，若放量突破則可持續持有至目標價。`
                        : `Conservative strategy for steady investors. Target at +6%, stop-loss at -6%, risk-reward ratio 1:1. Recommended to enter in 3 batches near support levels, 1-2% apart. Monitor volume during holding period - reduce position if volume continues to shrink, hold to target if breakout occurs with volume expansion.`
                }
            };
        } else if (actionKey === 'hold') {
            return {
                aggressive: {
                    type: t.aggressive,
                    desc: t.aggDesc,
                    targetPrice: (currentPrice * 1.04).toFixed(2),
                    stopLoss: (currentPrice * 0.96).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `當前處於整理期，積極策略建議小倉位試探。目標價 +4%，止損 -4%。僅投入 30% 資金，在關鍵支撐位掛單。若價格向上突破整理區間且伴隨放量，可加碼至 50%。若跌破支撐立即出場，不戀戰。`
                        : `Currently in consolidation phase, aggressive strategy suggests small position testing. Target +4%, stop-loss -4%. Allocate only 30% capital, place orders at key support. If price breaks above consolidation range with volume, increase to 50%. Exit immediately if support breaks, no hesitation.`
                },
                conservative: {
                    type: t.conservative,
                    desc: t.consDesc,
                    targetPrice: (currentPrice * 1.03).toFixed(2),
                    stopLoss: (currentPrice * 0.95).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `保守策略建議觀望為主。若已持有，可繼續持有但不加碼，目標價 +3%，止損 -5%。密切關注法人動向和成交量變化。若出現連續 3 日量縮且價格橫盤，建議先行減碼 50%，保留核心部位等待明確信號。`
                        : `Conservative strategy recommends observation. If already holding, maintain position without adding, target +3%, stop-loss -5%. Closely monitor institutional movements and volume changes. If volume shrinks for 3 consecutive days with sideways price action, reduce 50% of position, keep core holdings for clear signals.`
                }
            };
        } else {
            return {
                aggressive: {
                    type: t.aggressive,
                    desc: t.aggDesc,
                    targetPrice: (currentPrice * 1.02).toFixed(2),
                    stopLoss: (currentPrice * 0.98).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `趨勢不明，積極策略建議空手觀望。若堅持進場，僅用 20% 資金，目標 +2%，止損 -2%。嚴格執行紀律，達到任一條件立即出場。建議等待明確的突破信號或法人大量買進後再考慮進場。`
                        : `Unclear trend, aggressive strategy recommends staying out. If must enter, use only 20% capital, target +2%, stop-loss -2%. Strictly follow discipline, exit immediately when either condition is met. Recommend waiting for clear breakout signal or significant institutional buying before considering entry.`
                },
                conservative: {
                    type: t.conservative,
                    desc: t.consDesc,
                    targetPrice: (currentPrice * 1.01).toFixed(2),
                    stopLoss: (currentPrice * 0.97).toFixed(2),
                    reasoning: lang === 'zh'
                        ? `保守策略強烈建議空手觀望。當前市場缺乏明確方向，盲目進場風險大於機會。建議將資金配置到其他更有把握的標的，或持有現金等待更好的進場時機。若市場出現明確趨勢再行動不遲。`
                        : `Conservative strategy strongly recommends staying in cash. Current market lacks clear direction, blind entry carries more risk than opportunity. Suggest allocating capital to other stocks with better setups, or hold cash waiting for better entry timing. Not too late to act when market shows clear trend.`
                }
            };
        }
    };

    const strategies = getStrategyDetails();

    return {
        action,
        confidence: winRate,
        reason,
        indicators: {
            rsi: 45 + (seed % 40),
            macd: isUp ? 'Bullish' : 'Bearish',
            volume: stock.volume || (seed % 50000) + 10000
        },
        institutional: {
            investors: `${instFlow > 0 ? '+' : ''}${instFlow.toFixed(0)}M`,
            margin: `${marginBalance.toFixed(0)}M`,
            dayTrade: `${dayTradeRate.toFixed(1)}%`
        },
        strategies
    };
};
