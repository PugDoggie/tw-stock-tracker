# Taiwan Stock Tracker - Real-Time Stock Prices 📈

A modern React + Vite application for tracking Taiwan stock market prices with real-time data from Taiwan Stock Exchange (TWSE).

## 🌟 Key Features

✅ **Real-Time Stock Prices** - Live data from TWSE with 3-second updates
✅ **AI-Powered Analysis** - Smart investment recommendations
✅ **K-Line Charts** - Technical analysis with lightweight-charts
✅ **Responsive Design** - Works perfectly on desktop, tablet, mobile
✅ **Multi-Language** - English and Traditional Chinese support
✅ **Reliable Data** - Three-tier fallback strategy (Proxy → API → Cache)
✅ **Transparent** - Clear indicators showing data source

## 🚀 Quick Start

### Step 1: Start Proxy Server

```bash
npm run start:proxy
```

### Step 2: Start Development Server (NEW TERMINAL)

```bash
npm run dev
```

Open http://localhost:5173

### ✅ Verify Real-Time Data

- Dashboard shows `[實時 ✓]` indicator
- Stock cards show `✓ Live` badges
- No red `⚠️ Mock` warnings

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 2-step setup guide
- **[REAL_TIME_SETUP_CHECKLIST.md](REAL_TIME_SETUP_CHECKLIST.md)** - Verification checklist
- **[REAL_TIME_DATA_GUIDE.md](REAL_TIME_DATA_GUIDE.md)** - Comprehensive guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)** - Final verification

## 🏗️ Architecture

```
React Dashboard
    ↓ (every 3 seconds)
fetchLiveStockData()
    ↓
Check Cache (800ms TTL)
    ↓
Priority Strategy:
1. Proxy Server (localhost:3001) - Fastest
2. Direct TWSE API - Fallback
3. Mock Data - Last resort only
```

## 🔧 Technology Stack

- **React 19** - Modern UI framework
- **Vite 7** - Lightning-fast build tool
- **TailwindCSS** - Responsive styling
- **Lightweight Charts** - K-line visualization
- **Framer Motion** - Smooth animations
- **Express.js** - CORS proxy server

## 📊 Data Source

**Primary**: Taiwan Stock Exchange (TWSE)

- URL: https://mis.twse.com.tw/stock/api/getStockInfo.jsp
- Trading Hours: Monday-Friday 09:00-13:30 (Taiwan Time)
- Update Frequency: Every 3 seconds
- Latency: 0-1 minute from market

## 🎯 Data Quality Indicators

### Dashboard Timestamp

- `[實時 ✓]` = Real-time data (Green)
- `[模擬數據 ⚠️]` = Mock data (Red)

### Stock Cards

- `✓ Live` badge = Real-time (Green, top-left)
- `⚠️ Mock` badge = Mock data (Red, top-left)

### Warning Banner

- Red pulsing bar when mock data active
- Clear message about API unavailability

## 📱 Available Commands

```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run start:proxy     # Start proxy server
npm run start:all       # Start proxy + dev server (requires concurrently)
```

## ⚙️ Configuration

### Cache Settings

- TTL: 800ms (configurable in `src/services/stockApi.js`)
- Update Interval: 3000ms (configurable in `src/components/Dashboard.jsx`)

### Proxy Server

- Port: 3001 (configurable in `proxy-server.js`)
- Timeout: 3 seconds
- Routes CORS-blocked TWSE requests

### Supported Stocks

The app works with any 4-digit Taiwan stock ID:

- Major: 2330 (TSMC), 2317, 2382, 2454
- Small Cap: Enter any 4-digit code in search

## 🐛 Troubleshooting

### Mock Data Appearing?

1. Check proxy server is running: `npm run start:proxy`
2. Verify port 3001 is available
3. Restart both servers
4. Refresh browser (Ctrl+Shift+R)

### Prices Not Updating?

1. Check trading hours (M-F 09:00-13:30 Taiwan)
2. Check internet connection
3. Verify TWSE API is accessible
4. Check console for error logs (F12)

### Slow Updates?

1. Ensure proxy server is running
2. Check network latency
3. Verify proxy is responding (localhost:3001)

## 📈 Performance

- **Real-time Response**: 300-500ms (proxy) / 1-2s (direct API)
- **Cache Hit**: <50ms
- **Update Frequency**: 3 seconds
- **Memory Usage**: ~5-10MB
- **API Calls**: ~20 per minute

## 🔒 Data Privacy

- No personal data collection
- No tracking or analytics
- Uses official TWSE public API
- Proxy server runs locally

## 🌍 Trading Hours

✅ **Active Hours** (Real prices available)

- Monday-Friday, 09:00-13:30 Taiwan Time (UTC+8)

❌ **Inactive Hours** (Shows previous close)

- Saturday-Sunday
- After 13:30 on weekdays
- Before 09:00 on weekdays

## 🚀 Production Deployment

1. Build the application

```bash
npm run build
```

2. Deploy `dist` folder to your server

3. **IMPORTANT**: Also deploy proxy server

```bash
npm run start:proxy
```

4. Make sure proxy runs on port 3001

## 🤝 Contributing

Contributions welcome! Areas for enhancement:

- More stock data sources
- Advanced technical indicators
- Portfolio tracking
- Historical data analysis

## 📄 License

This project uses real-time data from Taiwan Stock Exchange with proper attribution.

## 📞 Support

For issues or questions:

1. Check documentation files
2. Review console logs (F12)
3. Verify setup with checklist
4. Check trading hours

---

**Ready to track stocks?** Start with `npm run start:proxy` 📊
