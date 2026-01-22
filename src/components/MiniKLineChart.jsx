import React, { useEffect, useRef, useState } from "react";
import { fetchHistoricalOHLC } from "../services/klineDataService";

/**
 * Mini K-Line Chart - Simple price trend visualization using Canvas
 */
const MiniKLineChart = ({ stock, isUp = true }) => {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  // Fetch data
  useEffect(() => {
    if (!stock?.id) return;

    const fetchData = async () => {
      try {
        const data = await fetchHistoricalOHLC(stock.id, "1mo", "1d");
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

    // Set canvas size
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 80;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get price range
    const closes = chartData.map((d) => d.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;

    // Draw line
    const lineColor = isUp ? "#22C55E" : "#EF4444";
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Calculate points
    const pointWidth = width / (chartData.length - 1 || 1);
    const padding = 5;

    ctx.beginPath();
    chartData.forEach((d, i) => {
      const x =
        padding + (i * (width - 2 * padding)) / (chartData.length - 1 || 1);
      const normalizedPrice = (d.close - minPrice) / priceRange;
      const y = height - padding - normalizedPrice * (height - 2 * padding);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw filled area under line
    const fillColor = isUp
      ? "rgba(34, 197, 94, 0.1)"
      : "rgba(239, 68, 68, 0.1)";
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }, [chartData, isUp]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
};

export default React.memo(MiniKLineChart);
