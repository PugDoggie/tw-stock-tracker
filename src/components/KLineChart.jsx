import React, { useEffect, useRef, useState } from "react";
import { fetchHistoricalOHLC } from "../services/klineDataService";

const formatAxisLabel = (timestamp, interval) => {
  // Convert UTC timestamp to Taiwan time (UTC+8)
  const date = new Date(timestamp * 1000);

  if (interval === "5m" || interval === "60m") {
    // Manual formatting for intraday to ensure correct timezone
    const hours = date.getUTCHours() + 8; // Convert UTC to UTC+8
    const minutes = date.getUTCMinutes();
    const adjustedHours = hours >= 24 ? hours - 24 : hours;
    return `${String(adjustedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (interval === "1wk") {
    return `W${date.getMonth() + 1}/${date.getDate()}`;
  }

  if (interval === "1mo") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * K-Line chart on canvas with wheel zoom and 24-hour time labels.
 */
const KLineChart = ({ stock, height = 500 }) => {
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [interval, setInterval] = useState("1d");
  const [selectedCandle, setSelectedCandle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewWindow, setViewWindow] = useState({ start: 0, end: 0 });

  const intervalOptions = [
    {
      group: "分鐘",
      options: [
        { label: "5分", value: "5m" },
        { label: "60分", value: "60m" },
      ],
    },
    { group: "日線", options: [{ label: "日線", value: "1d" }] },
    {
      group: "長期",
      options: [
        { label: "周線", value: "1wk" },
        { label: "月線", value: "1mo" },
      ],
    },
  ];

  // Fetch data when interval changes
  useEffect(() => {
    if (!stock?.id) return;

    setLoading(true);
    setSelectedCandle(null);

    const fetchData = async () => {
      try {
        const data = await fetchHistoricalOHLC(stock.id, "5y", interval);
        if (data && data.length > 0) {
          // Debug: Log first few timestamps for intraday
          if (interval === "5m" || interval === "60m") {
            console.log(
              `[K-Line Debug] ${interval} 前3筆時間戳:`,
              data.slice(0, 3).map((d) => ({
                timestamp: d.time,
                utc: new Date(d.time * 1000).toISOString(),
                formatted: formatAxisLabel(d.time, interval),
              })),
            );
          }
          setChartData(data);
          setViewWindow({
            start: Math.max(0, data.length - 200),
            end: data.length,
          });
        } else {
          setChartData([]);
          setViewWindow({ start: 0, end: 0 });
        }
      } catch (err) {
        console.error(
          `Chart data fetch failed for ${stock.symbol}:`,
          err.message,
        );
        setChartData([]);
        setViewWindow({ start: 0, end: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stock?.id, interval]);

  const getVisibleRange = () => {
    if (!chartData.length) return { start: 0, end: 0 };
    const start = Math.max(0, Math.min(viewWindow.start, chartData.length - 1));
    const end = Math.max(start + 1, Math.min(viewWindow.end, chartData.length));
    return { start, end };
  };

  // Wheel zoom for visible window
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData.length) return;

    const handleWheel = (e) => {
      if (!chartData.length) return;
      e.preventDefault();

      const factor = e.deltaY > 0 ? 1.15 : 0.85; // down=out, up=in
      const { start, end } = getVisibleRange();
      const windowSize = end - start;
      const minSize = 30;
      const maxSize = chartData.length;
      const targetSize = Math.min(
        maxSize,
        Math.max(minSize, Math.round(windowSize * factor)),
      );

      const mid = start + windowSize / 2;
      let newStart = Math.round(mid - targetSize / 2);
      let newEnd = Math.round(mid + targetSize / 2);

      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd > maxSize) {
        newStart -= newEnd - maxSize;
        newEnd = maxSize;
        if (newStart < 0) newStart = 0;
      }

      setViewWindow({ start: newStart, end: newEnd });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [chartData.length, viewWindow.start, viewWindow.end]);

  const handleCanvasClick = (event) => {
    if (!canvasRef.current || !chartData.length || loading) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const container = canvas.parentElement;
    const width = container?.clientWidth || 820;
    const dpr = window.devicePixelRatio || 1;

    const scaledX = x * dpr;
    const scaledY = y * dpr;
    const scaledWidth = width * dpr;

    const topMargin = 20 * dpr;
    const bottomMargin = 40 * dpr;
    const leftMargin = 60 * dpr;
    const rightMargin = 20 * dpr;
    const chartWidth = scaledWidth - leftMargin - rightMargin;

    const { start, end } = getVisibleRange();
    const visibleData = chartData.slice(start, end);
    if (!visibleData.length) {
      setSelectedCandle(null);
      return;
    }

    if (
      scaledX < leftMargin ||
      scaledX > scaledWidth - rightMargin ||
      scaledY < topMargin ||
      scaledY > height * dpr - bottomMargin
    ) {
      setSelectedCandle(null);
      return;
    }

    const spacing = chartWidth / (visibleData.length + 1);
    const relativeX = scaledX - leftMargin;
    const candleIndex = Math.floor(relativeX / spacing - 0.5);

    if (candleIndex >= 0 && candleIndex < visibleData.length) {
      setSelectedCandle(start + candleIndex);
    } else {
      setSelectedCandle(null);
    }
  };

  // Draw chart
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const { start, end } = getVisibleRange();
    const visibleData = chartData.slice(start, end);
    if (!visibleData.length) {
      setSelectedCandle(null);
      return;
    }

    const highs = visibleData.map((d) => d.high);
    const lows = visibleData.map((d) => d.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;

    const topMargin = 20;
    const bottomMargin = 40;
    const leftMargin = 60;
    const rightMargin = 20;

    const chartWidth = width - leftMargin - rightMargin;
    const chartHeight = height - topMargin - bottomMargin;
    const spacing = chartWidth / (visibleData.length + 1);
    const candleWidth = Math.max(2, spacing * 0.6);

    const priceToY = (price) => {
      const normalized = (maxPrice - price) / priceRange;
      return topMargin + normalized * chartHeight;
    };

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (priceRange / 4) * i;
      const y = priceToY(price);
      ctx.fillText(price.toFixed(0), leftMargin - 10, y + 4);
    }

    visibleData.forEach((candle, index) => {
      const x = leftMargin + spacing * (index + 1) - candleWidth / 2;

      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      const isGreen = candle.close >= candle.open;
      const bodyColor = isGreen ? "#22c55e" : "#ef4444";
      const wickColor = isGreen ? "#22c55e" : "#ef4444";

      if (start + index === selectedCandle) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
        ctx.fillRect(x - 5, topMargin, candleWidth + 10, chartHeight);
      }

      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1;

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;

      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
    });

    const labelInterval = Math.max(1, Math.floor(visibleData.length / 10));
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

    visibleData.forEach((candle, index) => {
      if (index % labelInterval === 0) {
        const x = leftMargin + spacing * (index + 1);
        const label = formatAxisLabel(candle.time, interval);
        ctx.fillText(label, x, height - 10);
      }
    });
  }, [chartData, height, selectedCandle, interval, viewWindow]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-slate-400 text-xs font-semibold mb-2 uppercase">
            K線類型
          </p>
          <div className="flex gap-3 flex-wrap">
            {intervalOptions.map((group) => (
              <div key={group.group} className="flex gap-2 items-center">
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setInterval(opt.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      interval === opt.value
                        ? "bg-premium-accent text-black"
                        : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-slate-950/90">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full block cursor-crosshair"
          style={{
            height: `${height}px`,
            minHeight: `${height}px`,
          }}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-white font-semibold">加載中...</div>
          </div>
        )}

        {chartData.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-slate-400 font-semibold">無可用數據</div>
          </div>
        )}
      </div>

      {selectedCandle !== null && chartData[selectedCandle] && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
          <div className="text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">開盤</p>
            <p className="text-white font-mono font-bold">
              {chartData[selectedCandle].open.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">收盤</p>
            <p className="text-white font-mono font-bold">
              {chartData[selectedCandle].close.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">最高</p>
            <p className="text-premium-success font-mono font-bold">
              {chartData[selectedCandle].high.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">最低</p>
            <p className="text-premium-loss font-mono font-bold">
              {chartData[selectedCandle].low.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs font-semibold mb-1">漲跌</p>
            <p
              className={`font-mono font-bold ${
                chartData[selectedCandle].close >=
                chartData[selectedCandle].open
                  ? "text-premium-success"
                  : "text-premium-loss"
              }`}
            >
              {(
                ((chartData[selectedCandle].close -
                  chartData[selectedCandle].open) /
                  chartData[selectedCandle].open) *
                100
              ).toFixed(2)}
              %
            </p>
          </div>
          <div className="col-span-2 md:col-span-5 text-center pt-2 border-t border-slate-600/40">
            <p className="text-slate-500 text-xs mb-1">
              {(() => {
                const d = new Date(chartData[selectedCandle].time * 1000);
                const hours = d.getUTCHours() + 8;
                const adjustedHours = hours >= 24 ? hours - 24 : hours;
                const dateStr = d.toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                const timeStr = `${String(adjustedHours).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
                return `${dateStr} ${timeStr}`;
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(KLineChart);
