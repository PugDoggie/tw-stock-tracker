# TW Stock Tracker - 部署指南

## 📋 部署前準備

此專案已設置完成可在以下平台進行公開部署：

### 要求

- Node.js 18+
- npm 或 yarn

## 🚀 部署到 Railway (推薦)

Railway 提供最簡單的部署方式，支援自動部署和 HTTPS。

### 步驟 1: Railway 帳戶設置

1. 訪問 [Railway.app](https://railway.app)
2. 使用 GitHub 帳戶登入 (PugDoggie)
3. 連結你的 GitHub 帳戶

### 步驟 2: 部署應用

1. 在 Railway 儀表板中，點擊「New Project」
2. 選擇「Deploy from GitHub repo」
3. 選擇 `PugDoggie/tw-stock-tracker` 倉庫
4. Railway 將自動偵測 `railway.json` 配置
5. 配置環境變數（如需要）
6. 點擊「Deploy」

### 步驟 3: 環境變數設置（可選）

如果需要自定義設置，在 Railway 儀表板中添加：

```
NODE_ENV=production
PORT=3000
PROXY_PORT=3001
```

### 步驟 4: 訪問應用

- Railway 將提供一個公開 URL (例如: `https://tw-stock-tracker-production.railway.app`)
- 前端將在主域名上運行
- Proxy 服務器在內部通信端口 3001

## 📊 應用架構

### 前端 (React + Vite)

- 位置: `src/`
- 端口: 3000 (生產環境)
- 構建: `npm run build` → `dist/` 目錄

### 後端 Proxy Server (Express.js)

- 位置: `proxy-server.js`
- 端口: 3001
- 功能: CORS 代理、實時股票數據、參考資料快取

## 🔗 API 端點

### 前端可訪問的端點

- `/api/twse` - TWSE 實時行情
- `/api/yahoo/quote` - Yahoo Finance 報價
- `/api/yahoo/historical` - 歷史數據
- `/api/yahoo/search` - 股票搜索
- `/api/refdata/search` - 參考資料查詢
- `/api/refdata/all` - 所有參考資料
- `/api/recommend/daily` - 每日推薦

## 📝 本地測試生產構建

在部署前，可在本地測試生產構建：

```bash
# 構建前端
npm run build

# 同時啟動 proxy 和前端
npm start

# 或分別啟動
npm run start:proxy          # 在另一個終端
npm run serve              # 在第三個終端
```

訪問 `http://localhost:3000` 進行測試。

## 🌐 自訂域名 (可選)

Railway 支援自訂域名：

1. 在 Railway 儀表板中進入你的部署
2. 進入「Settings」
3. 在「Domains」部分添加你的域名
4. 按照 DNS 配置說明進行 CNAME 設置

## 🔒 HTTPS

Railway 自動提供 HTTPS/SSL 證書。

## 📊 監控和日誌

在 Railway 儀表板中：

1. 進入「Deployments」查看部署歷史
2. 進入「Logs」查看即時日誌
3. 進入「Metrics」查看性能統計

## 🆘 故障排除

### 應用無法啟動

- 檢查日誌中的錯誤信息
- 確保所有依賴已正確安裝: `npm install`
- 檢查 Node.js 版本是否為 18+

### API 連接失敗

- Proxy 服務器通常需要 10-15 秒啟動
- 檢查 Railway 是否在同一個應用中同時運行 proxy 和前端
- 確保前端正確指向代理服務器 (內部 localhost:3001)

### 前端找不到 API

- 確認 `src/services/stockApi.js` 中的 `API_BASE_URL` 設置正確
- 如果在 Railway 部署，應使用相對路徑 `/api` 或完整內部 URL

## 📚 其他部署選項

### Heroku (已棄用免費層)

如果使用 Heroku，需要 Procfile（已提供）

### Vercel (前端只)

如只部署前端，可使用 Vercel。但需要為 API 單獨配置後端。

### 自訂服務器

對於完全控制，可部署到自訂服務器 (AWS, Azure, DigitalOcean 等)。

## 📞 支援

如有問題，請查看：

- [Railway 文檔](https://docs.railway.app)
- [專案 GitHub 倉庫](https://github.com/PugDoggie/tw-stock-tracker)
