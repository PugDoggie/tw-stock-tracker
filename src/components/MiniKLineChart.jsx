import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import {
  fetchHistoricalOHLC,
  generateRealisticOHLC,
} from "../services/klineDataService";

/**
 * Mini K-Line Chart Component for Stock Cards
 * Lightweight, compact chart showing price trend with real data
 */
const MiniKLineChart = ({ stock, data, isUp = true }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const resizeTimerRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [chartData, setChartData] = useState(data || []);

  // Fetch real OHLC data if not provided
  useEffect(() => {
    if (data && data.length > 0) {
      setChartData(data);
      return;
    }

    if (!stock || !stock.id) {
      return;
    }

    const fetchData = async () => {
      try {
        // Try to fetch real OHLC data
        const realData = await fetchHistoricalOHLC(stock.id, "1w", "1d");
        if (realData && realData.length > 0) {
          setChartData(realData);
          console.log(
            `✅ Mini Chart: Got ${realData.length} real candles for ${stock.id}`,
          );
          return;
        }

        // Generate realistic data
        const generated = generateRealisticOHLC(stock, 7);
        if (generated && generated.length > 0) {
          setChartData(generated);
        }
      } catch (err) {
        console.warn(`Mini chart data fetch failed: ${err.message}`);
      }
    };

    fetchData();
  }, [stock?.id, data]);

  // Initialize and render chart
  useEffect(() => {
    if (!chartContainerRef.current || !chartData || chartData.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        const container = chartContainerRef.current;
        if (!container) return;

        const width = container.clientWidth || 300;

        let chart = createChart(container, {
          layout: {
            background: { color: "transparent" },
            textColor: "transparent",
            fontSize: 10,
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          width: width,
          height: 80,
          timeScale: {
            visible: false,
            borderVisible: false,
          },
          rightPriceScale: {
            visible: false,
            borderVisible: false,
          },
          leftPriceScale: {
            visible: false,
          },
          crosshair: {
            vertLine: { visible: false },
            horzLine: { visible: false },
          },
          handleScroll: false,
          handleScale: false,
        });

        chartRef.current = chart;

        // Use green for up, red for down
        const lineColor = isUp ? "#22C55E" : "#EF4444";
        const areaTopColor = isUp
          ? "rgba(34, 197, 94, 0.4)"
          : "rgba(239, 68, 68, 0.4)";
        const areaBottomColor = isUp
          ? "rgba(34, 197, 94, 0)"
          : "rgba(239, 68, 68, 0)";

        const series = chart.addAreaSeries({
          lineColor: lineColor,
          topColor: areaTopColor,
          bottomColor: areaBottomColor,
          lineWidth: 2,
          priceLineVisible: false,
        });

        // Validate and set data
        const validData = chartData.filter(
          (d) => d && d.time && (typeof d.value === "number" || d.close),
        );
        if (validData.length > 0) {
          series.setData(validData);
          chart.timeScale().fitContent();
        }

        const handleResize = () => {
          if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
          resizeTimerRef.current = setTimeout(() => {
            if (chartRef.current && chartContainerRef.current) {
              chartRef.current.applyOptions({
                width: chartContainerRef.current.clientWidth,
              });
            }
          }, 150);
        };

        window.addEventListener("resize", handleResize);
      } catch (err) {
        console.error("MiniKLineChart Error:", err);
        setHasError(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isUp]);

  if (hasError) {
    return (
      <div className="w-full h-20 flex items-center justify-center bg-slate-900/30 rounded-lg border border-red-500/20">
        <span className="text-red-400 text-xs">Chart Error</span>
      </div>
    );
  }

  return (
    <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-900/20 border border-white/5">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export default React.memo(MiniKLineChart);
