export const stocks = [
  // 半導體產業
  {
    id: "2330",
    name_zh: "台積電",
    name_en: "TSMC",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 92,
    indexWeight: 31.5, // 加權指數權重 (%)
  },
  {
    id: "2454",
    name_zh: "聯發科",
    name_en: "MediaTek",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 88,
    indexWeight: 3.2,
  },
  {
    id: "2303",
    name_zh: "聯電",
    name_en: "UMC",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 81,
    indexWeight: 1.8,
  },
  {
    id: "3711",
    name_zh: "日月光投控",
    name_en: "ASE",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 75,
    indexWeight: 1.5,
  },
  {
    id: "2408",
    name_zh: "南茂",
    name_en: "PSMC",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 73,
    indexWeight: 0.3,
  },
  {
    id: "6549",
    name_zh: "力積電",
    name_en: "Powerchip",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 68,
    indexWeight: 0.4,
  },

  // 電子零件產業
  {
    id: "2317",
    name_zh: "鴻海",
    name_en: "Foxconn",
    industry_zh: "電子零件",
    industry_en: "Electronics Components",
    growthScore: 78,
    indexWeight: 5.2,
  },
  {
    id: "2412",
    name_zh: "中華電信",
    name_en: "Chunghwa Telecom",
    industry_zh: "電信",
    industry_en: "Telecommunications",
    growthScore: 62,
    indexWeight: 1.9,
  },
  {
    id: "2891",
    name_zh: "中信金",
    name_en: "CTBC Financial",
    industry_zh: "金融",
    industry_en: "Finance",
    growthScore: 65,
    indexWeight: 1.2,
  },

  // 資訊硬體與設備
  {
    id: "2376",
    name_zh: "技嘉",
    name_en: "Gigabyte",
    industry_zh: "資訊硬體",
    industry_en: "Computer Hardware",
    growthScore: 85,
    indexWeight: 0.6,
  },
  {
    id: "2382",
    name_zh: "廣達",
    name_en: "Quanta",
    industry_zh: "資訊設備",
    industry_en: "IT Equipment",
    growthScore: 72,
    indexWeight: 2.1,
  },
  {
    id: "2356",
    name_zh: "英業達",
    name_en: "Inventec",
    industry_zh: "資訊設備",
    industry_en: "IT Equipment",
    growthScore: 70,
    indexWeight: 0.8,
  },
  {
    id: "2344",
    name_zh: "華碩",
    name_en: "ASUS",
    industry_zh: "資訊硬體",
    industry_en: "Computer Hardware",
    growthScore: 74,
    indexWeight: 0.9,
  },

  // 航運與物流
  {
    id: "2603",
    name_zh: "長榮",
    name_en: "Evergreen",
    industry_zh: "航運",
    industry_en: "Shipping",
    growthScore: 68,
    indexWeight: 2.8,
  },
  {
    id: "2618",
    name_zh: "長榮海運",
    name_en: "Evergreen Marine",
    industry_zh: "航運",
    industry_en: "Shipping",
    growthScore: 69,
    indexWeight: 1.3,
  },

  // 電力與能源
  {
    id: "1101",
    name_zh: "台泥",
    name_en: "Taiwan Cement",
    industry_zh: "水泥建材",
    industry_en: "Cement & Materials",
    growthScore: 58,
    indexWeight: 0.7,
  },
  {
    id: "2412",
    name_zh: "中華電",
    name_en: "CHT",
    industry_zh: "電信",
    industry_en: "Telecom",
    growthScore: 62,
    indexWeight: 1.9,
  },

  // 消費電子
  {
    id: "2498",
    name_zh: "宏達電",
    name_en: "HTC",
    industry_zh: "消費電子",
    industry_en: "Consumer Electronics",
    growthScore: 66,
    indexWeight: 0.2,
  },
  {
    id: "2395",
    name_zh: "友通",
    name_en: "Unipac",
    industry_zh: "資訊設備",
    industry_en: "IT Equipment",
    growthScore: 64,
    indexWeight: 0.3,
  },

  // 銀行與金融
  {
    id: "2880",
    name_zh: "華南金",
    name_en: "Huanan Financial",
    industry_zh: "銀行",
    industry_en: "Banking",
    growthScore: 60,
    indexWeight: 1.5,
  },
  {
    id: "2882",
    name_zh: "國泰金",
    name_en: "Cathay Financial",
    industry_zh: "金融保險",
    industry_en: "Finance & Insurance",
    growthScore: 62,
    indexWeight: 3.4,
  },

  // 貿易與零售
  {
    id: "2201",
    name_zh: "裕隆",
    name_en: "Yulon",
    industry_zh: "汽車",
    industry_en: "Automotive",
    growthScore: 55,
    indexWeight: 0.4,
  },
  {
    id: "1216",
    name_zh: "統一超",
    name_en: "7-Eleven Taiwan",
    industry_zh: "便利商店",
    industry_en: "Convenience Store",
    growthScore: 61,
    indexWeight: 1.1,
  },

  // 製造業
  {
    id: "2301",
    name_zh: "光磊",
    name_en: "Lite-On",
    industry_zh: "電子",
    industry_en: "Electronics",
    growthScore: 64,
    indexWeight: 0.5,
  },
  {
    id: "2409",
    name_zh: "友達",
    name_en: "AU Optronics",
    industry_zh: "面板",
    industry_en: "Display Panel",
    growthScore: 67,
    indexWeight: 0.9,
  },
  {
    id: "2436",
    name_zh: "偉詮電",
    name_en: "Wyle Electronics",
    industry_zh: "電子零件",
    industry_en: "Electronics Components",
    growthScore: 63,
    indexWeight: 0.2,
  },

  // 其他重要個股
  {
    id: "1590",
    name_zh: "亞德客",
    name_en: "AIRTAC",
    industry_zh: "氣動",
    industry_en: "Pneumatics",
    growthScore: 71,
    indexWeight: 1.6,
  },
  {
    id: "1609",
    name_zh: "大亞",
    name_en: "Ta Ya",
    industry_zh: "傳動",
    industry_en: "Power Transmission",
    growthScore: 62,
    indexWeight: 0.3,
  },
  {
    id: "3034",
    name_zh: "聯詠",
    name_en: "Novatek",
    industry_zh: "半導體",
    industry_en: "Semiconductor",
    growthScore: 79,
    indexWeight: 2.3,
  },
  {
    id: "2545",
    name_zh: "皇田",
    name_en: "Hwang Ta",
    industry_zh: "模具",
    industry_en: "Mold & Die",
    growthScore: 59,
    indexWeight: 0.1,
  },
  {
    id: "2615",
    name_zh: "萬海",
    name_en: "Wan Hai",
    industry_zh: "航運",
    industry_en: "Shipping",
    growthScore: 70,
    indexWeight: 1.2,
  },
];

// 興櫃／櫃買重點標的（僅用於搜尋，不預設顯示在 Dashboard）
export const otcStocks = [
  {
    id: "6223",
    name_zh: "旺矽",
    name_en: "Winstek",
    industry_zh: "半導體測試",
    industry_en: "Semiconductor Testing",
    market: "TWO",
  },
  {
    id: "4743",
    name_zh: "合一",
    name_en: "Oneness Biotech",
    industry_zh: "生技醫療",
    industry_en: "Biotech",
    market: "TWO",
  },
  {
    id: "3491",
    name_zh: "昇達科",
    name_en: "Wiwynn",
    industry_zh: "通訊設備",
    industry_en: "Communication Equipment",
    market: "TWO",
  },
  {
    id: "4107",
    name_zh: "邦特",
    name_en: "Bon Neng",
    industry_zh: "生技醫療",
    industry_en: "Biotech",
    market: "TWO",
  },
  {
    id: "8044",
    name_zh: "網家",
    name_en: "PChome Online",
    industry_zh: "電商零售",
    industry_en: "E-Commerce",
    market: "TWO",
  },
  {
    id: "6411",
    name_zh: "晶焱",
    name_en: "Alchip",
    industry_zh: "IC 設計",
    industry_en: "IC Design",
    market: "TWO",
  },
];

// 供搜尋使用的完整清單（上市＋興櫃）
export const searchableStocks = [...stocks, ...otcStocks];

export const isGrowthStock = (stock) => {
  const score = stock.growthScore || 0;
  const change = Math.abs(stock.change || 0);
  const volumeLeader = Boolean(stock.isVolumeLeader);
  return volumeLeader || score > 80 || change > 2.5;
};
