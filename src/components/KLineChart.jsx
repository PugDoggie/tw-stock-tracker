import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

const KLineChart = ({
  stock,
  data,
  height = 500,
  chartType = "candlestick",
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    try {
      // Ensure container has proper dimensions
      const container = chartContainerRef.current;
      const containerWidth = container.clientWidth || 800;
      const containerHeight = height || 500;

      const chart = createChart(container, {
        layout: {
          background: { color: "#1e293b" },
          textColor: "#9ca3af",
        },
        width: containerWidth,
        height: containerHeight,
        timeScale: {
          fixLeftEdge: true,
          fixRightEdge: true,
        },
      });

      chartRef.current = chart;

      // Filter and validate data
      const validData = data.filter((d) => {
        if (!d || d.time == null) return false;
        const values = [d.open, d.high, d.low, d.close];
        return values.every((v) => typeof v === "number" && Number.isFinite(v));
      });

      if (validData.length === 0) {
        console.warn("[KLineChart] No valid data to display");
        chart.remove();
        return;
      }

      if (chartType === "candlestick") {
        const series = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
        });
        series.setData(validData);
      } else {
        const series = chart.addAreaSeries({
          lineColor: "#38bdf8",
          topColor: "rgba(56, 189, 248, 0.4)",
          bottomColor: "rgba(56, 189, 248, 0)",
          lineWidth: 2,
        });
        series.setData(
          validData.map((d) => ({ time: d.time, value: d.close })),
        );
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          const newWidth = chartContainerRef.current.clientWidth || 800;
          chartRef.current.applyOptions({
            width: newWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            console.warn("Error removing chart:", e);
          }
        }
      };
    } catch (err) {
      console.error("Chart rendering error:", err);
    }
  }, [data, height, chartType]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full"
      style={{ minHeight: `${height}px` }}
    />
  );
};

export default React.memo(KLineChart);
