import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { fetchHistoricalOHLC } from "../services/klineDataService";

/**
 * Mini K-Line Chart Component for Stock Cards
 * Lightweight, compact chart showing price trend with real data only
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
        // Fetch real OHLC data only
        const realData = await fetchHistoricalOHLC(stock.id, "1mo", "1d");
        if (realData && realData.length > 0) {
          setChartData(realData);
          console.log(
            `✅ Mini Chart: Got ${realData.length} real candles for ${stock.id}`,
          );
        } else {
          throw new Error("No real k-line data available");
        }
      } catch (err) {
        console.warn(
          `[MiniKLineChart] Data fetch failed for ${stock?.id}: ${err.message}`,
        );
        setHasError(true);
        setChartData([]);
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
            fixLeftEdge: true,
            fixRightEdge: true,
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

        // Validate and set data - ensure all required fields are present
        const validData = chartData.filter((d) => {
          if (!d || !d.time) return false;
          const value = d.value || d.close;
          return typeof value === "number" && isFinite(value);
        });

        if (validData.length > 0) {
          const formattedData = validData.map((d) => ({
            time: d.time,
            value: typeof d.value === "number" ? d.value : d.close,
          }));
          series.setData(formattedData);
          chart.timeScale().fitContent();
        } else {
          console.warn("[MiniKLineChart] No valid data after filtering");
          setHasError(true);
          chart.remove();
          chartRef.current = null;
          return;
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

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err) {
        console.error("MiniKLineChart Error:", err);
        setHasError(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          console.warn("Error removing mini chart:", e);
        }
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
