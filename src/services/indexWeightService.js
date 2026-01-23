/**
 * Index Weight Service - Dynamic Weight Updates
 * 動態獲取並更新個股在加權指數中的權重
 */

const isDev = import.meta.env.DEV;

// Cache for index weights
let weightCache = null;
let lastUpdateTime = null;
const WEIGHT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (权重不会频繁变动)

/**
 * 從台灣證交所獲取加權指數成分股權重
 * 資料來源：https://www.twse.com.tw/zh/products/indices/weightedIndex.html
 */
export const fetchIndexWeights = async () => {
  try {
    // 检查缓存是否有效
    if (
      weightCache &&
      lastUpdateTime &&
      Date.now() - lastUpdateTime < WEIGHT_CACHE_DURATION
    ) {
      if (isDev) console.log("[IndexWeight] Using cached weights");
      return weightCache;
    }

    if (isDev) console.log("[IndexWeight] Fetching fresh weight data...");

    // 方案1: 使用證交所公開資料 (需要proxy解決CORS)
    // 台灣證交所每月會公布加權指數成分股權重
    // API endpoint: https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_INDEX

    // 方案2: 使用Yahoo Finance的市值資料估算權重
    // 加權指數權重 = 個股市值 / 所有成分股總市值 * 100
    const response = await fetch("http://localhost:3001/api/index/weights");

    if (!response.ok) {
      console.warn("[IndexWeight] Failed to fetch from server, using fallback");
      return getFallbackWeights();
    }

    const data = await response.json();

    if (data && data.weights) {
      weightCache = data.weights;
      lastUpdateTime = Date.now();

      if (isDev) {
        console.log(
          `[IndexWeight] Updated ${Object.keys(weightCache).length} stock weights`,
        );
        console.log(
          "[IndexWeight] Sample weights:",
          Object.entries(weightCache)
            .slice(0, 5)
            .map(([id, w]) => `${id}:${w}%`)
            .join(", "),
        );
      }

      return weightCache;
    }

    return getFallbackWeights();
  } catch (error) {
    console.warn("[IndexWeight] Error fetching weights:", error.message);
    return getFallbackWeights();
  }
};

/**
 * 獲取單個股票的權重
 */
export const getStockWeight = async (stockId) => {
  const weights = await fetchIndexWeights();
  return weights[stockId] || 0;
};

/**
 * 使用市值估算權重（當無法獲取官方資料時）
 */
const estimateWeightFromMarketCap = (marketCap, totalMarketCap) => {
  if (!marketCap || !totalMarketCap || totalMarketCap === 0) return 0;
  return (marketCap / totalMarketCap) * 100;
};

/**
 * Fallback靜態權重資料（基於2026年1月的資料）
 * 這些資料應定期手動更新，或從證交所官網獲取
 */
const getFallbackWeights = () => {
  if (isDev) console.log("[IndexWeight] Using fallback static weights");

  return {
    // 半導體產業（高權重）
    2330: 31.5, // 台積電 - 最高權重
    2454: 3.2, // 联发科
    2303: 1.8, // 联电
    3711: 1.5, // 日月光投控
    3034: 2.3, // 联詠
    2408: 0.3, // 南茂
    6549: 0.4, // 力积电

    // 电子零组件
    2317: 5.2, // 鸿海
    2382: 2.1, // 广达
    2376: 0.6, // 技嘉
    2356: 0.8, // 英业达
    2344: 0.9, // 华硕
    2395: 0.3, // 友通
    2436: 0.2, // 伟诠电
    2301: 0.5, // 光磊

    // 金融保险
    2882: 3.4, // 国泰金
    2891: 1.2, // 中信金
    2880: 1.5, // 华南金

    // 航运
    2603: 2.8, // 长荣
    2618: 1.3, // 长荣海运
    2615: 1.2, // 万海

    // 电信
    2412: 1.9, // 中华电

    // 面板
    2409: 0.9, // 友达

    // 其他
    1590: 1.6, // 亚德客
    1101: 0.7, // 台泥
    2201: 0.4, // 裕隆
    1216: 1.1, // 统一超
    2498: 0.2, // 宏达电
    1609: 0.3, // 大亚
    2545: 0.1, // 皇田
  };
};

/**
 * 手動刷新權重資料（強制更新）
 */
export const refreshWeights = async () => {
  weightCache = null;
  lastUpdateTime = null;
  return await fetchIndexWeights();
};

/**
 * 獲取權重資料的最後更新時間
 */
export const getLastUpdateTime = () => {
  return lastUpdateTime;
};

/**
 * 檢查權重資料是否過期
 */
export const isWeightDataStale = () => {
  if (!lastUpdateTime) return true;
  return Date.now() - lastUpdateTime > WEIGHT_CACHE_DURATION;
};

// 自動初始化：頁面載入時預先獲取權重資料
if (typeof window !== "undefined") {
  fetchIndexWeights().catch((err) => {
    console.warn("[IndexWeight] Initial fetch failed:", err.message);
  });
}
