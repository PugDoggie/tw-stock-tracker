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
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "#1e293b" },
          textColor: "#9ca3af",
        },
        width: chartContainerRef.current.clientWidth,
        height: height,
      });

      chartRef.current = chart;

      if (chartType === "candlestick") {
        const series = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        series.setData(data);
      } else {
        const series = chart.addAreaSeries({
          lineColor: "#38bdf8",
          topColor: "rgba(56, 189, 248, 0.4)",
          bottomColor: "rgba(56, 189, 248, 0)",
        });
        series.setData(data.map((d) => ({ time: d.time, value: d.close })));
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    } catch (err) {
      console.error("Chart rendering error:", err);
    }
  }, [data, height, chartType]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default React.memo(KLineChart);
