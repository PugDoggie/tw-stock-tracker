# Taiwan Futures Data API Research Report

## Research Date

January 21, 2026

## Executive Summary

Taiwan futures data access is limited through official public APIs. The primary approach is web scraping from WantGoo (玩股網) which is a financial information website. TAIFEX (Taiwan Futures Exchange) does not expose a public REST API for real-time futures data.

---

## 1. WantGoo API (玩股網) - Current Implementation

### Website

- **URL:** https://www.wantgoo.com
- **Description:** Popular Taiwan stock and futures information portal
- **Data Source:** Real-time market data aggregator

### Futures Symbols & Mapping

| Symbol   | Code  | Name                                                    | WantGoo URL                           |
| -------- | ----- | ------------------------------------------------------- | ------------------------------------- |
| **WTX&** | wtxm& | 台指期近月 (Taiwan Stock Index Futures - Current Month) | https://www.wantgoo.com/futures/wtxm& |
| **WMT&** | wmtm& | 小型台指期 (Mini Taiwan Stock Index Futures)            | https://www.wantgoo.com/futures/wmtm& |
| **WTM&** | wtmm& | 微型台指期 (Micro Taiwan Stock Index Futures)           | https://www.wantgoo.com/futures/wtmm& |

### Current Implementation Details

**Endpoint Type:** Web Scraping (HTML Parsing)
**Method:** HTTP GET request to WantGoo futures page
**Headers Required:**

```
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept-Language: zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7
```

**Proxy Server Endpoint:**

```
GET http://localhost:3001/api/wantgoo/futures?symbols=WTX%26,WMT%26,WTM%26
```

**Response Format:**

```json
{
  "quoteResponse": {
    "result": [
      {
        "symbol": "WTX&",
        "regularMarketPrice": 31245.0,
        "regularMarketChange": -423.0,
        "regularMarketChangePercent": -1.34,
        "regularMarketDayHigh": 31700.0,
        "regularMarketDayLow": 31200.0,
        "regularMarketVolume": 123456000,
        "regularMarketOpen": 31600.0,
        "regularMarketPreviousClose": 31668.0
      }
    ],
    "error": null
  }
}
```

### Data Extraction Patterns

The HTML parser uses multiple regex patterns to extract:

1. **Price & Change:** `(\d{5}(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+([\d.]+)%`
   - Example: `31245.00 -423.00 -1.34%`
2. **Open Price:** `/開盤\s*(\d+\.?\d*)/`
3. **High:** `/最高\s*(\d+\.?\d*)/`
4. **Low:** `/最低\s*(\d+\.?\d*)/`
5. **Volume (contracts):** `/成交量\(口\)\s*(\d+(?:,\d+)*)/`
6. **Previous Close:** `/昨收\s*(\d+\.?\d*)/`

---

## 2. Official Data Sources

### TAIFEX (Taiwan Futures Exchange - 台灣期貨交易所)

- **Website:** https://www.taifex.com.tw/
- **Status:** No public REST API available
- **Data Access:**
  - Main site has static data
  - Market data available through web interface only
  - May require institutional access for real-time feeds
- **Contact:** Would need to contact TAIFEX directly for API access

### TWSE (Taiwan Stock Exchange - 台灣證券交易所)

- **Website:** https://www.twse.com.tw/
- **Data Platform:** https://data.twse.com.tw/
- **Features:**
  - Provides stock data via public APIs
  - Has datasets for futures but mainly historical/aggregated
  - Accessible through data.twse.com.tw portal
- **Futures Data Access:**
  - Limited real-time support
  - Focus on stock data rather than futures

### TWSE Stock API (Available)

- **Base URL:** `https://mis.twse.com.tw/stock/api/getStockInfo.jsp`
- **Parameters:**
  - `ex_ch`: Exchange channel (e.g., `tse_2330.tw` for TSMC)
  - `json`: Output format (1 for JSON)
  - `delay`: Delay setting (0 for real-time)
  - `_`: Timestamp (for cache busting)
- **Example:**
  ```
  https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_2330.tw&json=1&delay=0&_=1705833600000
  ```
- **Note:** This works for stocks but futures support is limited

---

## 3. Alternative Data Sources

### Yahoo Finance

- **API:** https://query1.finance.yahoo.com
- **Status:** Works for international markets but limited Taiwan futures support
- **Limitation:** Primarily supports stock data; Taiwan futures contracts may have limited coverage

### Financial Data Aggregators

- Most free sources use web scraping or limited APIs
- Institutional data providers (Bloomberg, Reuters) require paid subscriptions
- No free public API specifically for Taiwan futures

---

## 4. Taiwan Futures Contracts Reference

### Main Contracts Tracked

1. **WTX& (大台指期/TX)** - Large Taiwan Stock Index Futures
   - Most liquid contract
   - Contract size: NT$200 per point
   - Trading hours: 08:45 - 13:45, 15:00 - 23:59 (Taiwan time)

2. **WMT& (小台指期/MX)** - Mini Taiwan Stock Index Futures
   - Smaller position size
   - Contract size: NT$50 per point
   - Good for retail traders

3. **WTM& (微台指期)** - Micro Taiwan Stock Index Futures
   - Even smaller contract
   - Lower capital requirement
   - Newer contract for retail traders

---

## 5. Technical Integration Details

### Current Architecture (in this project)

```
Frontend (React)
     ↓
Node.js Proxy Server (localhost:3001)
     ↓
WantGoo HTML Scraping + Yahoo Finance
     ↓
Parsed JSON Response
```

### Proxy Endpoints

1. **TWSE API Proxy:** `GET /api/twse`
   - Parameters: `ex_ch` (comma-separated symbols)
   - Source: TWSE official API

2. **Yahoo Quote Proxy:** `GET /api/yahoo/quote`
   - Parameters: `symbols` (comma-separated)
   - Source: Yahoo Finance

3. **WantGoo Futures Proxy:** `GET /api/wantgoo/futures`
   - Parameters: `symbols` (comma-separated futures codes)
   - Source: WantGoo web scraping

---

## 6. Limitations & Challenges

### Public API Limitations

- ❌ **No Official Futures API:** Taiwan Futures Exchange doesn't expose public REST API
- ❌ **CORS Issues:** Direct browser requests blocked (hence proxy needed)
- ❌ **Rate Limiting:** WantGoo may rate-limit aggressive scraping
- ⚠️ **HTML Structure Changes:** Web scraping breaks if WantGoo updates their HTML

### Reliability Concerns

- Web scraping is fragile and depends on HTML structure
- No guaranteed SLA or availability guarantees
- WantGoo could block/ban excessive requests
- No official support or documentation

### Data Accuracy

- Real-time data depends on WantGoo's update frequency
- May lag behind official exchange data by a few seconds
- No certification of data accuracy

---

## 7. Recommendations

### For Production Use

1. **Institutional Access:** Contact TAIFEX directly for:
   - Market data feed subscription
   - Real-time API access
   - SLA guarantees

2. **Hybrid Approach:**
   - Use TWSE API for stock data (reliable, documented)
   - Use WantGoo scraping for futures (best available free option)
   - Cache results to minimize scraping frequency
   - Implement fallback strategies

3. **Error Handling:**
   - Implement retry logic with exponential backoff
   - Cache last known prices
   - Show "delayed data" warnings if scraping fails
   - Monitor proxy server health

### For Testing/Development

- Current WantGoo approach works for:
  - Development and testing
  - Proof-of-concept demonstrations
  - Small-scale personal projects
- ✅ Suitable for current project (TW Stock Tracker)

---

## 8. Code References in Project

### Files Using This Data

1. **proxy-server.js** (lines 238-395)
   - `/api/wantgoo/futures` endpoint implementation
   - HTML parsing logic for WantGoo futures data

2. **src/services/stockApi.js**
   - Imports proxy server endpoints
   - Handles futures data fetching

3. **src/data/stocks.js**
   - Futures symbol definitions
   - Mapping between contract codes

---

## 9. Monitoring Dashboard

Current implementation monitored at:

- **WantGoo URLs:**
  - https://www.wantgoo.com/futures/wtxm& (WTX&)
  - https://www.wantgoo.com/futures/wmtm& (WMT&)
  - https://www.wantgoo.com/futures/wtmm& (WTM&)

- **Proxy Health:** `http://localhost:3001/`

---

## 10. Future Improvement Opportunities

- [ ] Add caching layer to reduce WantGoo requests
- [ ] Implement health checks for data freshness
- [ ] Add data validation and anomaly detection
- [ ] Create fallback data sources
- [ ] Monitor HTML structure changes
- [ ] Implement circuit breaker pattern for resilience
- [ ] Consider paid data feed once project scales

---

## Conclusion

Taiwan futures data access remains challenging due to:

1. **No public official API** from TAIFEX
2. **Limited institutional access** to real-time feeds
3. **Dependence on web scraping** from financial portals

The current WantGoo-based approach is a pragmatic solution for small to medium-scale applications but should be supplemented with official data feeds for production use.

**Status:** ✅ Functional for current project needs
**Sustainability:** ⚠️ Depends on WantGoo HTML stability
**Scalability:** Limited without institutional data access
