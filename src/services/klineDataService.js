/**
 * K-Line Data Service - Fetch OHLC data for candlestick charts
 */

/**
 * Fetch historical OHLC data
 */
export const fetchHistoricalOHLC = async (
  stockId,
  period = "1mo",
  interval = "1d",
) => {
  try {
    // For now, generate realistic OHLC data
    // In production, this would fetch from Yahoo Finance or other source
    return generateRealisticOHLC({ id: stockId }, 30);
  } catch (err) {
    console.warn(`Failed to fetch OHLC for ${stockId}: ${err.message}`);
    return null;
  }
};

/**
 * Generate realistic OHLC candlestick data
 */
export const generateRealisticOHLC = (stock, days = 30) => {
  // Comprehensive base prices for all supported Taiwan stocks
  const baseData = {
    2330: 890,
    2454: 1585,
    2303: 68,
    3711: 62,
    2408: 55,
    6549: 42,
    2317: 165,
    2412: 95,
    2891: 28,
    2376: 108,
    2382: 85,
    2356: 42,
    2344: 48,
    2603: 25,
    2618: 18,
    1101: 72,
    2498: 15,
    2395: 68,
    2880: 26,
    2882: 35,
    2201: 38,
    1216: 95,
    2301: 15,
    2409: 18,
    2436: 58,
    1590: 165,
    3034: 285,
    2545: 68,
    2615: 32,
  };

  const stockId = stock?.id || stock;
  let basePrice =
    parseFloat(stock?.price) || parseFloat(baseData[stockId]) || 100;

  const data = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000);

    // Generate OHLC with realistic variance
    const volatility = 0.03 + Math.random() * 0.02; // 3-5% daily volatility
    const open = basePrice * (1 - volatility / 2 + Math.random() * volatility);
    const close = basePrice * (1 - volatility + Math.random() * volatility * 2);
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    // Update basePrice for next iteration for realistic progression
    basePrice = close;
  }

  return data;
};
