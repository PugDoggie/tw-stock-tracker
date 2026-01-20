export const stocks = [
  {
    id: "2330",
    name_zh: "台積電",
    name_en: "TSMC",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 92,
  },
  {
    id: "2317",
    name_zh: "鴻海",
    name_en: "Foxconn",
    industry_zh: "電子零件",
    industry_en: "Electronics",
    growthScore: 78,
  },
  {
    id: "2376",
    name_zh: "技嘉",
    name_en: "Gigabyte",
    industry_zh: "資訊硬體",
    industry_en: "Computer Hardware",
    growthScore: 85,
  },
  {
    id: "2382",
    name_zh: "廣達",
    name_en: "Quanta",
    industry_zh: "資訊設備",
    industry_en: "IT Equipment",
    growthScore: 72,
  },
  {
    id: "2454",
    name_zh: "聯發科",
    name_en: "MediaTek",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 88,
  },
  {
    id: "2603",
    name_zh: "長榮",
    name_en: "Evergreen",
    industry_zh: "航運",
    industry_en: "Shipping",
    growthScore: 68,
  },
  {
    id: "3711",
    name_zh: "日月光投控",
    name_en: "ASE",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 75,
  },
  {
    id: "2303",
    name_zh: "聯電",
    name_en: "UMC",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 81,
  },
];

export const isGrowthStock = (stock) => {
  const score = stock.growthScore || 0;
  const change = Math.abs(stock.change || 0);
  return score > 80 || change > 2.5;
};
