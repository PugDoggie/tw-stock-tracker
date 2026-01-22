import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { fetchHistoricalOHLC } from "../services/klineDataService";

/**
 * Full K-Line Chart with candlestick display
 */
const KLineChart = ({ stock, height = 500 }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
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

  // Create and render chart
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      width: container.clientWidth || 820,
      height,
      timeScale: {
        borderColor: "#1f2937",
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      crosshair: { mode: 1 },
    });

    chartRef.current = chart;

    const resize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth || 820,
        });
      }
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !chartData.length) return;

    const series = chartRef.current.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
    });

    series.setData(chartData);
    chartRef.current.timeScale().fitContent();
  }, [chartData]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl bg-slate-950/90 relative overflow-hidden"
      style={{
        height: `${height}px`,
        minHeight: `${height}px`,
      }}
    />
  );
};

export default React.memo(KLineChart);
