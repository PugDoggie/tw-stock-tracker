/**
 * Technical Indicators Service - Fetch real technical indicators from Yahoo Finance
 * Includes RSI, MACD, Moving Averages, Bollinger Bands, etc.
 */

import { stocks, otcStocks } from "../data/stocks.js";

const stockMarketMap = new Map();
stocks.forEach((s) => stockMarketMap.set(s.id, "TW"));
otcStocks.forEach((s) => stockMarketMap.set(s.id, s.market || "TWO"));

const SPECIAL_SYMBOL_MAP = {
  "^TWII": "^TWII",
  "WTX&": "WTX&",
  "WMT&": "WMT&", // 小型台指
  "WTM&": "WTM&", // 微型台指期
};

const getYahooSymbol = (id) => {
  const cleanId = String(id).trim();
  if (SPECIAL_SYMBOL_MAP[cleanId]) return SPECIAL_SYMBOL_MAP[cleanId];
  const market = stockMarketMap.get(cleanId);
  const suffix = market === "TWO" ? "TWO" : "TW";
  return `${cleanId}.${suffix}`;
};

/**
 * Calculate technical indicators from OHLC data
 */
const calculateIndicators = (ohlcData) => {
  if (!ohlcData || ohlcData.length === 0) {
    return null;
  }

  const closes = ohlcData.map((d) => d.close);
  const highs = ohlcData.map((d) => d.high);
  const lows = ohlcData.map((d) => d.low);

  // RSI (14-period)
  const rsi = calculateRSI(closes, 14);

  // MACD
  const macd = calculateMACD(closes);

  // Moving Averages
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema12 = calculateEMA(closes, 12);

  // Bollinger Bands (20-period)
  const bollingerBands = calculateBollingerBands(closes, 20);

  // Stochastic
  const stochastic = calculateStochastic(closes, highs, lows, 14);

  // ATR (Average True Range)
  const atr = calculateATR(ohlcData, 14);

  const currentPrice = closes[closes.length - 1];
  const previousPrice = closes[Math.max(0, closes.length - 2)];
  const priceChange = currentPrice - previousPrice;

  return {
    price: currentPrice,
    change: priceChange,
    changePercent: ((priceChange / previousPrice) * 100).toFixed(2),
    rsi: rsi.toFixed(2),
    macd: {
      value: macd.macd.toFixed(4),
      signal: macd.signal.toFixed(4),
      histogram: macd.histogram.toFixed(4),
      trend: macd.histogram > 0 ? "Bullish" : "Bearish",
    },
    movingAverages: {
      sma20: sma20.toFixed(2),
      sma50: sma50.toFixed(2),
      ema12: ema12.toFixed(2),
      trend:
        currentPrice > sma20 && sma20 > sma50
          ? "Uptrend"
          : currentPrice < sma20 && sma20 < sma50
            ? "Downtrend"
            : "Neutral",
    },
    bollingerBands: {
      upper: bollingerBands.upper.toFixed(2),
      middle: bollingerBands.middle.toFixed(2),
      lower: bollingerBands.lower.toFixed(2),
      position:
        currentPrice > bollingerBands.upper
          ? "Above Upper"
          : currentPrice < bollingerBands.lower
            ? "Below Lower"
            : "Inside Bands",
    },
    stochastic: {
      k: stochastic.k.toFixed(2),
      d: stochastic.d.toFixed(2),
      status:
        stochastic.k > 80
          ? "Overbought"
          : stochastic.k < 20
            ? "Oversold"
            : "Neutral",
    },
    atr: atr.toFixed(2),
  };
};

// RSI calculation
const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) return 50;

  // Calculate initial gains and losses
  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses += Math.abs(diff);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  // Handle edge cases:
  // - If all prices went up (losses = 0), RSI = 100
  // - If all prices went down (gains = 0), RSI = 0
  if (avgLoss === 0) {
    return avgGain > 0 ? 100 : 50;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.max(0, Math.min(100, rsi)); // Ensure RSI is between 0-100
};

// MACD calculation
const calculateMACD = (
  closes,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
) => {
  const ema12 = calculateEMA(closes, fastPeriod);
  const ema26 = calculateEMA(closes, slowPeriod);
  const macdLine = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdValues = [];
  for (let i = slowPeriod - 1; i < closes.length; i++) {
    const fast = calculateEMA(closes.slice(0, i + 1), fastPeriod);
    const slow = calculateEMA(closes.slice(0, i + 1), slowPeriod);
    macdValues.push(fast - slow);
  }

  const signalLine = calculateEMA(macdValues, signalPeriod);
  const histogram = macdLine - signalLine;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram,
  };
};

// EMA calculation
const calculateEMA = (closes, period) => {
  if (closes.length < period) return closes[closes.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
};

// SMA calculation
const calculateSMA = (closes, period) => {
  if (closes.length < period) return closes[closes.length - 1];
  const sum = closes.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
};

// Bollinger Bands calculation
const calculateBollingerBands = (closes, period = 20, stdDevMultiplier = 2) => {
  const sma = calculateSMA(closes, period);
  const variance =
    closes
      .slice(-period)
      .reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: sma + stdDev * stdDevMultiplier,
    middle: sma,
    lower: sma - stdDev * stdDevMultiplier,
  };
};

// Stochastic calculation
const calculateStochastic = (closes, highs, lows, period = 14) => {
  if (closes.length < period) return { k: 50, d: 50 };

  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const highest = Math.max(...recentHighs);
  const lowest = Math.min(...recentLows);

  const kValue =
    ((closes[closes.length - 1] - lowest) / (highest - lowest)) * 100;

  // D = 3-period SMA of K
  const kValues = [];
  for (let i = period; i < closes.length; i++) {
    const h = Math.max(...highs.slice(i - period, i));
    const l = Math.min(...lows.slice(i - period, i));
    kValues.push(((closes[i] - l) / (h - l)) * 100);
  }

  const dValue =
    kValues.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, kValues.length);

  return {
    k: Math.min(100, Math.max(0, kValue)),
    d: Math.min(100, Math.max(0, dValue)),
  };
};

// ATR calculation
const calculateATR = (ohlcData, period = 14) => {
  if (ohlcData.length < period) {
    return (
      ohlcData[ohlcData.length - 1].high - ohlcData[ohlcData.length - 1].low
    );
  }

  let atr = 0;
  for (let i = 0; i < period; i++) {
    const data = ohlcData[ohlcData.length - period + i];
    const tr = Math.max(
      data.high - data.low,
      Math.abs(
        data.high -
          (ohlcData[ohlcData.length - period + i - 1]?.close || data.close),
      ),
      Math.abs(
        data.low -
          (ohlcData[ohlcData.length - period + i - 1]?.close || data.close),
      ),
    );
    atr += tr;
  }

  atr = atr / period;

  // Smooth the ATR
  for (let i = period; i < ohlcData.length; i++) {
    const data = ohlcData[i];
    const tr = Math.max(
      data.high - data.low,
      Math.abs(data.high - ohlcData[i - 1].close),
      Math.abs(data.low - ohlcData[i - 1].close),
    );
    atr = (atr * (period - 1) + tr) / period;
  }

  return atr;
};

/**
 * Fetch technical indicators from Yahoo Finance historical data
 */
export const fetchTechnicalIndicators = async (
  stockId,
  period = "3mo",
  interval = "1d",
) => {
  const symbol = getYahooSymbol(stockId);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  try {
    console.log(
      `📊 [Technical] Fetching indicators for ${symbol} (period: ${period})`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const url = `${apiBase}/api/yahoo/historical?symbol=${encodeURIComponent(symbol)}&period=${period}&interval=${interval}`;

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data?.quotes && Array.isArray(data.quotes)) {
      const ohlcData = data.quotes
        .filter(
          (item) => item && item.close && item.open && item.high && item.low,
        )
        .map((item) => ({
          time: Math.floor(new Date(item.date).getTime() / 1000),
          open: parseFloat(Number(item.open).toFixed(2)),
          high: parseFloat(Number(item.high).toFixed(2)),
          low: parseFloat(Number(item.low).toFixed(2)),
          close: parseFloat(Number(item.close).toFixed(2)),
        }))
        .sort((a, b) => a.time - b.time);

      if (ohlcData.length === 0) {
        throw new Error("No valid OHLC data after filtering");
      }

      // Calculate indicators using full historical data for accuracy
      const indicators = calculateIndicators(ohlcData);

      console.log(
        `✅ [Technical] ${symbol}: RSI=${indicators.rsi}, MACD=${indicators.macd.trend}, Data points: ${ohlcData.length}`,
      );

      return {
        symbol,
        timestamp: new Date().toISOString(),
        indicators,
        ohlcData: ohlcData.slice(-100), // Last 100 data points for charting
      };
    }

    throw new Error("Invalid response format - no quotes found");
  } catch (err) {
    console.error(`❌ [Technical] Error fetching ${stockId}:`, err.message);
    return null;
  }
};

export default {
  fetchTechnicalIndicators,
  calculateIndicators,
};
