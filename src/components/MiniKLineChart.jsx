import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { fetchHistoricalOHLC } from "../services/klineDataService";

/**
 * Mini K-Line Chart - Simple price trend visualization
 */
const MiniKLineChart = ({ stock, isUp = true }) => {
  const containerRef = useRef();
  const chartRef = useRef(null);
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

  // Render chart
  useEffect(() => {
    if (!containerRef.current || !chartData.length) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = 80;

    const chart = createChart(container, {
      layout: {
        background: { color: "transparent" },
        textColor: "transparent",
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      width,
      height,
      timeScale: { visible: false },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    });

    const lineColor = isUp ? "#22C55E" : "#EF4444";
    const series = chart.addAreaSeries({
      lineColor,
      topColor: isUp ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
      bottomColor: "rgba(0, 0, 0, 0)",
      lineWidth: 2,
      priceLineVisible: false,
    });

    series.setData(chartData.map((d) => ({ time: d.time, value: d.close })));
    chart.timeScale().fitContent();

    chartRef.current = chart;

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isUp]);

  return (
    <div
      ref={containerRef}
      className="w-full h-20"
      style={{ position: "relative" }}
    />
  );
};

export default React.memo(MiniKLineChart);
