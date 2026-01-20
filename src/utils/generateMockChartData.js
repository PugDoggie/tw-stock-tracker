/**
 * Generate mock chart data for visualization
 */
export const generateMockChartData = (stock) => {
  if (!stock || !stock.id) return [];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const data = [];

  // Generate 7 days of data
  for (let i = 6; i >= 0; i--) {
    const time = Math.floor((now - i * dayMs) / 1000);
    const basePrice = stock.price || 100;
    const variance = Math.sin(i) * (basePrice * 0.05); // 5% variance

    data.push({
      time,
      value: basePrice + variance,
    });
  }

  return data;
};
