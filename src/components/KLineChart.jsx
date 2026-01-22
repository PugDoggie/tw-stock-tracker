import React, { useEffect, useRef, useState } from "react";
import { fetchHistoricalOHLC } from "../services/klineDataService";

/**
 * Full K-Line Chart with candlestick display using Canvas
 */
const KLineChart = ({ stock, height = 500 }) => {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  // Fetch data
  useEffect(() => {
    if (!stock?.id) return;

    const fetchData = async () => {
      try {
        const data = await fetchHistoricalOHLC(stock.id, "3mo", "1d");
        if (data && data.length > 0) {
          setChartData(data);
        }
      } catch (err) {
        console.error(`Chart data fetch failed for ${stock.symbol}:`, err);
      }
    };

    fetchData();
  }, [stock?.id]);

  // Draw chart on canvas
  useEffect(() => {
    if (!canvasRef.current || !chartData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    const width = container?.clientWidth || 820;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas with dark background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Get price range
    const highs = chartData.map((d) => d.high);
    const lows = chartData.map((d) => d.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;

    // Margins
    const topMargin = 20;
    const bottomMargin = 40;
    const leftMargin = 60;
    const rightMargin = 20;

    const chartWidth = width - leftMargin - rightMargin;
    const chartHeight = height - topMargin - bottomMargin;
    const candleWidth = Math.max(2, chartWidth / (chartData.length * 1.5));

    // Helper to convert price to canvas Y position
    const priceToY = (price) => {
      const normalized = (maxPrice - price) / priceRange;
      return topMargin + normalized * chartHeight;
    };

    // Draw price axis labels
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (priceRange / 4) * i;
      const y = priceToY(price);
      ctx.fillText(price.toFixed(0), leftMargin - 10, y + 4);
    }

    // Draw candlesticks
    chartData.forEach((candle, index) => {
      const x =
        leftMargin +
        ((index + 1) / (chartData.length + 1)) * chartWidth -
        candleWidth / 2;

      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      const isGreen = candle.close >= candle.open;
      const bodyColor = isGreen ? "#22c55e" : "#ef4444";
      const wickColor = isGreen ? "#22c55e" : "#ef4444";

      // Draw wick (high-low line)
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Draw body (open-close rectangle)
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;

      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
    });

    // Draw time axis labels (show every nth label to avoid crowding)
    const labelInterval = Math.max(1, Math.floor(chartData.length / 10));
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

    chartData.forEach((candle, index) => {
      if (index % labelInterval === 0) {
        const x =
          leftMargin + ((index + 1) / (chartData.length + 1)) * chartWidth;
        const date = new Date(candle.time * 1000);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, height - 10);
      }
    });
  }, [chartData, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl bg-slate-950/90 relative overflow-hidden block"
      style={{
        height: `${height}px`,
        minHeight: `${height}px`,
      }}
    />
  );
};

export default React.memo(KLineChart);
