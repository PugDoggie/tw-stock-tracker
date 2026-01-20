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
  // Use stock price or fallback to base prices
  const baseData = {
    2330: 890,
    2317: 165,
    2376: 108,
    2382: 85,
    2454: 1585,
    2603: 25,
    3711: 62,
    2303: 68,
  };

  const stockId = stock?.id;
  let basePrice = parseFloat(stock?.price) || baseData[stockId] || 100;

  const data = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000);

    // Generate OHLC with some realistic variance
    const open = basePrice * (0.98 + Math.random() * 0.04);
    const close =
      basePrice * (0.97 + Math.random() * 0.06) +
      (Math.random() > 0.5 ? 0.5 : -0.5);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    // Update basePrice for next iteration for more realistic progression
    basePrice = close;
  }

  return data;
};
