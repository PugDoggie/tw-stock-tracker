# 🌐 多語言UI/UX優化 - 快速參考

## 🎯 完成項目

### ✅ 技術指標多語言支持

- **中文 (zh)** 和 **英文 (en)** 完整支持
- 32+ 翻譯鍵用於所有技術指標
- 實時語言切換 (點擊語言切換按鈕)

### ✅ 更新的組件

#### 1️⃣ TechnicalIndicatorsCard (股票卡片)

- 📍 位置: `src/components/TechnicalIndicatorsCard.jsx`
- 🔤 語言: 支援中文/英文
- 🎯 指標: RSI, MACD, MA Trend, Bollinger Bands, Stochastic, ATR
- 🎨 色碼: 綠色=看漲, 紅色=看跌

**顯示內容:**

```
💰 價格 NT$2,330.00 ▲ +0.50%
RSI (14期)           72.5 📈
MACD 指標            看漲信號
MA 趨勢              ↑ 上升趨勢
布林帶位置            高於上軌
隨機指標             72.5 ⚠️
ATR波動率            15.25

► 超買 - 考慮獲利了結或減少持位
```

#### 2️⃣ TechnicalAnalysisDashboard (詳情模式)

- 📍 位置: `src/components/TechnicalAnalysisDashboard.jsx`
- 🔤 語言: 支援中文/英文
- 📊 6張指標卡片 (RSI, MACD, Stochastic, MA Trend, Bollinger Bands, ATR)
- 🎯 信號摘要面板

**新增功能:**

- ✅ 所有指標標籤本地化
- ✅ 狀態消息翻譯
- ✅ 技術信號摘要 (超買/超賣/看漲/看跌)

#### 3️⃣ StockDetailModal (股票詳情)

- 📍 位置: `src/components/StockDetailModal.jsx`
- 🎨 UI優化:
  - ❌ 移除非功能性的K線/區域圖按鈕
  - ✨ 簡化模式標題
  - 📐 改進間距和佈局
  - 🚀 更好的視覺層次結構

---

## 🗣️ 翻譯鍵參考

### 技術指標 - technicalIndicators.\*

| 鍵               | 中文       | 英文            |
| ---------------- | ---------- | --------------- |
| `rsi`            | RSI (14期) | RSI (14-Period) |
| `macd`           | MACD 指標  | MACD Indicator  |
| `stochastic`     | 隨機指標   | Stochastic      |
| `bollingerBands` | 布林帶     | Bollinger Bands |
| `atr`            | ATR 波動率 | ATR Volatility  |
| `maTrend`        | MA 趨勢    | MA Trend        |
| `sma20`          | SMA 20     | SMA 20          |
| `sma50`          | SMA 50     | SMA 50          |
| `ema12`          | EMA 12     | EMA 12          |

### 狀態指標

| 鍵              | 中文     | 英文           | 含義          |
| --------------- | -------- | -------------- | ------------- |
| `rsiOverbought` | 超買     | Overbought     | RSI > 70      |
| `rsiOversold`   | 超賣     | Oversold       | RSI < 30      |
| `rsiNeutral`    | 中立     | Neutral        | 30 ≤ RSI ≤ 70 |
| `macdBullish`   | 看漲信號 | Bullish Signal | MACD 上升     |
| `macdBearish`   | 看跌信號 | Bearish Signal | MACD 下降     |

### 信號消息

| 鍵                | 中文                          | 英文                                                      |
| ----------------- | ----------------------------- | --------------------------------------------------------- |
| `technicalSignal` | 技術信號                      | Technical Signal                                          |
| `overbought`      | 超買 - 考慮獲利了結或減少持位 | Overbought - Consider taking profits or reducing position |
| `oversold`        | 超賣 - 潛在買入機會           | Oversold - Potential buying opportunity                   |
| `bullishMomentum` | 看漲動量 - 買家掌控           | Bullish Momentum - Buyers in control                      |
| `bearishMomentum` | 看跌動量 - 賣家掌控           | Bearish Momentum - Sellers in control                     |

---

## 🚀 使用方法

### 1️⃣ 在組件中使用翻譯

```jsx
import { useLanguage } from "../context/LanguageContext";

const MyComponent = () => {
  const { t, lang } = useLanguage();

  return <p>{t("technicalIndicators.rsi")}</p>;
  // 輸出: "RSI (14期)" (zh) 或 "RSI (14-Period)" (en)
};
```

### 2️⃣ 切換語言

點擊應用程序右上角的 **語言切換按鈕**：

- ☀️ ENG → 切換為英文
- 🌙 中 → 切換為中文

所有組件會自動更新！

### 3️⃣ 測試指標卡片

1. 打開應用: http://localhost:5174
2. 查看股票卡片 - 所有指標標籤應該用選定的語言顯示
3. 點擊任何股票卡片打開詳情
4. 在詳情模式中查看 6 張指標卡片
5. 切換語言 - 所有文本應該即時更新

---

## 📋 完整文件清單

| 文件                                            | 改動                                     |
| ----------------------------------------------- | ---------------------------------------- |
| `src/data/translations.js`                      | ➕ 32+ 翻譯鍵 (technicalIndicators 部分) |
| `src/components/TechnicalIndicatorsCard.jsx`    | ✏️ 添加 useLanguage, 所有標籤本地化      |
| `src/components/TechnicalAnalysisDashboard.jsx` | ✏️ 添加 useLanguage, 所有指標本地化      |
| `src/components/StockDetailModal.jsx`           | ✏️ UI 優化, 移除非功能按鈕               |

---

## ✨ 新特性

### 🎯 指標顯示 (TechnicalIndicatorsCard)

- ✅ 實時價格和漲跌
- ✅ RSI 值 (色碼: 綠=低, 紅=高)
- ✅ MACD 趨勢信號
- ✅ 移動平均線趨勢
- ✅ 布林帶位置
- ✅ 隨機指標K值
- ✅ ATR 波動率
- ✅ 技術信號摘要

### 📊 詳細分析 (TechnicalAnalysisDashboard)

- ✅ 6 張指標卡片 (網格佈局)
- ✅ 每個指標的詳細數值
- ✅ 彩色狀態指示器
- ✅ 綜合信號摘要面板
- ✅ 本地化所有訊息

### 🎨 UI/UX 改進

- ✅ 移除混亂的按鈕控制
- ✅ 清潔簡約的設計
- ✅ 更好的視覺層次
- ✅ 改進的間距和排版
- ✅ 響應式設計 (行動/平板/桌面)

---

## 🔍 故障排除

### 問題: 某些標籤顯示為 undefined 或英文

**解決方案:**

1. 檢查 `translations.js` 中是否有該翻譯鍵
2. 確認 `useLanguage()` hook 正確導入
3. 確認 `t()` 函數的鍵拼寫正確
4. 清除瀏覽器緩存並重新加載

### 問題: 切換語言後沒有更新

**解決方案:**

1. 檢查是否調用了 `useLanguage()`
2. 確認組件使用 `t()` 而不是硬編碼的字符串
3. 確認 LanguageContext 正確提供
4. 檢查瀏覽器控制台是否有錯誤

### 問題: 指標數據不顯示

**解決方案:**

1. 確保代理服務器在端口 3001 上運行
2. 檢查網絡請求是否成功 (F12 > Network)
3. 檢查瀏覽器控制台是否有錯誤 (F12 > Console)
4. 確保股票代碼有效 (如 2330.TW)

---

## 📞 支援

有任何問題嗎?

1. 檢查 `MULTILINGUAL_UI_OPTIMIZATION.md` 了解更多細節
2. 查看組件源代碼中的註釋
3. 檢查瀏覽器開發者工具中的錯誤消息

祝您使用愉快! 🎉
