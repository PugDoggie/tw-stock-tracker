/**
 * 台灣股市交易時間判斷
 * 交易時間：週一至週五 09:00-13:30
 */

export const getMarketStatus = () => {
  const now = new Date();

  // Avoid locale string reparse issues by using Intl parts directly
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );

  const hours = Number(parts.hour || 0);
  const minutes = Number(parts.minute || 0);
  const weekday = (parts.weekday || "").toLowerCase();
  const dayMap = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const day = dayMap[weekday.slice(0, 3)] ?? new Date().getUTCDay();

  // 週末休市
  if (day === 0 || day === 6) {
    return {
      status: "closed",
      label: "休市",
      labelEn: "Closed",
      color: "slate",
      icon: "🌙",
    };
  }

  const currentTime = hours * 60 + minutes;
  const marketOpen = 9 * 60; // 09:00
  const marketClose = 13 * 60 + 30; // 13:30

  // 開盤前
  if (currentTime < marketOpen) {
    return {
      status: "pre-market",
      label: "盤前",
      labelEn: "Pre-Market",
      color: "blue",
      icon: "🌅",
    };
  }

  // 盤中
  if (currentTime >= marketOpen && currentTime < marketClose) {
    return {
      status: "open",
      label: "盤中",
      labelEn: "Trading",
      color: "green",
      icon: "📈",
    };
  }

  // 收盤
  return {
    status: "after-market",
    label: "盤後",
    labelEn: "After-Hours",
    color: "orange",
    icon: "🌆",
  };
};

export const getMarketStatusColor = (status) => {
  const colors = {
    "pre-market":
      "bg-blue-500/30 text-blue-300 border-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.3)]",
    open: "bg-green-500/30 text-green-300 border-green-400/50 shadow-[0_0_25px_rgba(34,197,94,0.4)] animate-pulse-subtle",
    "after-market":
      "bg-orange-500/30 text-orange-300 border-orange-400/50 shadow-[0_0_25px_rgba(249,115,22,0.3)]",
    closed:
      "bg-slate-500/30 text-slate-300 border-slate-400/50 shadow-[0_0_20px_rgba(148,163,184,0.2)]",
  };
  return colors[status] || colors.closed;
};
