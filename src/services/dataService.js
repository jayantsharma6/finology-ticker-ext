/**
 * DataService
 *
 * Single source for all data in the extension.
 * Every tab and component calls this — nothing else touches raw data.
 *
 * Five independent data units, each with its own fetch, cache, and storage:
 *   - Company List
 *   - Stock Detail  (per ticker)
 *   - Indices
 *   - Gainers
 *   - Losers
 *
 * To connect a real API later:
 *   Replace the body of the corresponding _fetch* function only.
 *   Cache logic, storage, and public API remain untouched.
 */
const DataService = (function () {
  'use strict';

  // ── Session-level memory cache ────────────────────────────────────────────
  // Prevents redundant storage reads within the same popup session.
  // Cleared automatically when popup closes.
  const _mem = {
    companyList:  null,
    companyMaps:  null,
    stockDetail:  {},    // keyed by id: { 1: {...}, 2: {...} }
    indices:      null,
    gainers:      null,
    losers:       null,
  };

  // ── Dummy Data ────────────────────────────────────────────────────────────
  // Each block maps to exactly one future API endpoint.

  const _DUMMY_COMPANY_LIST = [
    { id: 1,  name: 'Reliance Industries Ltd',        ticker: 'RELIANCE'   },
    { id: 2,  name: 'Tata Consultancy Services Ltd',  ticker: 'TCS'        },
    { id: 3,  name: 'HDFC Bank Ltd',                  ticker: 'HDFCBANK'   },
    { id: 4,  name: 'Infosys Ltd',                    ticker: 'INFY'       },
    { id: 5,  name: 'ICICI Bank Ltd',                 ticker: 'ICICIBANK'  },
    { id: 6,  name: 'Hindustan Unilever Ltd',         ticker: 'HINDUNILVR' },
    { id: 7,  name: 'State Bank of India',            ticker: 'SBIN'       },
    { id: 8,  name: 'Bajaj Finance Ltd',              ticker: 'BAJFINANCE' },
    { id: 9,  name: 'Tata Motors Ltd',                ticker: 'TATAMOTORS' },
    { id: 10, name: 'ITC Ltd',                        ticker: 'ITC'        },
    { id: 11, name: 'Axis Bank Ltd',                  ticker: 'AXISBANK'   },
    { id: 12, name: 'Kotak Mahindra Bank Ltd',        ticker: 'KOTAKBANK'  },
    { id: 13, name: 'Wipro Ltd',                      ticker: 'WIPRO'      },
    { id: 14, name: 'HCL Technologies Ltd',           ticker: 'HCLTECH'    },
    { id: 15, name: 'Maruti Suzuki India Ltd',        ticker: 'MARUTI'     },
    { id: 16, name: 'Sun Pharmaceutical Ltd',         ticker: 'SUNPHARMA'  },
    { id: 17, name: 'Oil and Natural Gas Corp Ltd',   ticker: 'ONGC'       },
    { id: 18, name: 'NTPC Ltd',                       ticker: 'NTPC'       },
    { id: 19, name: 'Power Grid Corp of India Ltd',   ticker: 'POWERGRID'  },
    { id: 20, name: 'UltraTech Cement Ltd',           ticker: 'ULTRACEMCO' },
  ];


  // Simulates per-ticker detail API response.
  // In production: GET /api/stock/:ticker
  const _DUMMY_STOCK_DETAIL = {
    1:          { id: 1,  ticker: 'RELIANCE',   name: 'Reliance Industries Ltd',       price: 2985.40, changePercent: 1.45,   changeAbsolute: 42.60,   sector: 'Energy',     exchange: 'NSE' },
    2:          { id: 2,  ticker: 'TCS',        name: 'Tata Consultancy Services Ltd',  price: 4120.15, changePercent: -0.82, changeAbsolute: -34.20,  sector: 'IT',         exchange: 'NSE' },
    3:          { id: 3,  ticker: 'HDFCBANK',   name: 'HDFC Bank Ltd',                 price: 1445.20, changePercent: 0.35,   changeAbsolute: 5.05,    sector: 'Banking',    exchange: 'NSE' },
    4:          { id: 4,  ticker: 'INFY',       name: 'Infosys Ltd',                   price: 1612.45, changePercent: 2.10,   changeAbsolute: 33.15,   sector: 'IT',         exchange: 'NSE' },
    5:          { id: 5,  ticker: 'ICICIBANK',  name: 'ICICI Bank Ltd',                price: 1089.30, changePercent: -1.20,  changeAbsolute: -13.25,  sector: 'Banking',    exchange: 'NSE' },
    6:          { id: 6,  ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd',        price: 2345.60, changePercent: 0.75,   changeAbsolute: 17.40,   sector: 'FMCG',       exchange: 'NSE' },
    7:          { id: 7,  ticker: 'SBIN',       name: 'State Bank of India',           price: 772.15,  changePercent: 0.95,   changeAbsolute: 7.30,    sector: 'Banking',    exchange: 'NSE' },
    8:          { id: 8,  ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd',             price: 6842.50, changePercent: -0.60,  changeAbsolute: -41.35,  sector: 'Finance',    exchange: 'NSE' },
    9:          { id: 9,  ticker: 'TATAMOTORS', name: 'Tata Motors Ltd',               price: 965.80,  changePercent: 3.45,   changeAbsolute: 32.25,   sector: 'Automobile', exchange: 'NSE' },
    10:         { id: 10, ticker: 'ITC',        name: 'ITC Ltd',                       price: 428.90,  changePercent: 0.0,    changeAbsolute: 0.0,     sector: 'FMCG',       exchange: 'NSE' },
    11:         { id: 11, ticker: 'AXISBANK',   name: 'Axis Bank Ltd',                 price: 1145.60, changePercent: -0.45,  changeAbsolute: -5.20,   sector: 'Banking',    exchange: 'NSE' },
    12:         { id: 12, ticker: 'KOTAKBANK',  name: 'Kotak Mahindra Bank Ltd',       price: 1789.30, changePercent: 1.10,   changeAbsolute: 19.50,   sector: 'Banking',    exchange: 'NSE' },
    13:         { id: 13, ticker: 'WIPRO',      name: 'Wipro Ltd',                     price: 456.75,  changePercent: -0.30,  changeAbsolute: -1.40,   sector: 'IT',         exchange: 'NSE' },
    14:         { id: 14, ticker: 'HCLTECH',    name: 'HCL Technologies Ltd',          price: 1523.40, changePercent: 1.85,   changeAbsolute: 27.65,   sector: 'IT',         exchange: 'NSE' },
    15:         { id: 15, ticker: 'MARUTI',     name: 'Maruti Suzuki India Ltd',       price: 11245.00, changePercent: 0.55,  changeAbsolute: 61.50,   sector: 'Automobile', exchange: 'NSE' },
    16:         { id: 16, ticker: 'SUNPHARMA',  name: 'Sun Pharmaceutical Ltd',        price: 1456.20, changePercent: -0.90,  changeAbsolute: -13.20,  sector: 'Pharma',     exchange: 'NSE' },
    17:         { id: 17, ticker: 'ONGC',       name: 'Oil and Natural Gas Corp Ltd',    price: 267.45,  changePercent: 2.30,   changeAbsolute: 6.00,    sector: 'Energy',     exchange: 'NSE' },
    18:         { id: 18, ticker: 'NTPC',       name: 'NTPC Ltd',                      price: 345.60,  changePercent: 0.65,   changeAbsolute: 2.25,    sector: 'Power',      exchange: 'NSE' },
    19:         { id: 19, ticker: 'POWERGRID',  name: 'Power Grid Corp of India Ltd',  price: 289.75,  changePercent: -0.20,  changeAbsolute: -0.60,   sector: 'Power',      exchange: 'NSE' },
    20:         { id: 20, ticker: 'ULTRACEMCO', name: 'UltraTech Cement Ltd',          price: 9876.50, changePercent: 1.20,   changeAbsolute: 117.00,  sector: 'Cement',     exchange: 'NSE' },
  };

  const _DUMMY_INDICES = [
    { name: 'NIFTY 50',   value: 22096.75, changePercent: 0.32,  changeAbsolute: 70.50  },
    { name: 'SENSEX',     value: 72831.40, changePercent: 0.26,  changeAbsolute: 187.60 },
    { name: 'BANK NIFTY', value: 46594.20, changePercent: -0.15, changeAbsolute: -70.20 },
  ];

  // API returns pre-sorted lists — dummy reflects same contract.
  const _DUMMY_GAINERS = [
    { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd',          price: 965.80,   changePercent: 3.45,  changeAbsolute: 32.25,  sector: 'Automobile', exchange: 'NSE' },
    { ticker: 'INFY',       name: 'Infosys Ltd',              price: 1612.45,  changePercent: 2.10,  changeAbsolute: 33.15,  sector: 'IT',         exchange: 'NSE' },
    { ticker: 'ONGC',       name: 'Oil and Natural Gas Corp Ltd',price: 267.45,  changePercent: 2.30,  changeAbsolute: 6.00,   sector: 'Energy',     exchange: 'NSE' },
    { ticker: 'HCLTECH',    name: 'HCL Technologies Ltd',     price: 1523.40,  changePercent: 1.85,  changeAbsolute: 27.65,  sector: 'IT',         exchange: 'NSE' },
    { ticker: 'RELIANCE',   name: 'Reliance Industries Ltd',  price: 2985.40,  changePercent: 1.45,  changeAbsolute: 42.60,  sector: 'Energy',     exchange: 'NSE' },
  ];

  const _DUMMY_LOSERS = [
    { ticker: 'ICICIBANK',  name: 'ICICI Bank Ltd',           price: 1089.30,  changePercent: -1.20, changeAbsolute: -13.25, sector: 'Banking',    exchange: 'NSE' },
    { ticker: 'SUNPHARMA',  name: 'Sun Pharmaceutical Ltd',   price: 1456.20,  changePercent: -0.90, changeAbsolute: -13.20, sector: 'Pharma',     exchange: 'NSE' },
    { ticker: 'TCS',        name: 'Tata Consultancy Services Ltd',price: 4120.15,  changePercent: -0.82, changeAbsolute: -34.20, sector: 'IT',         exchange: 'NSE' },
    { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd',        price: 6842.50,  changePercent: -0.60, changeAbsolute: -41.35, sector: 'Finance',    exchange: 'NSE' },
    { ticker: 'AXISBANK',   name: 'Axis Bank Ltd',            price: 1145.60,  changePercent: -0.45, changeAbsolute: -5.20,  sector: 'Banking',    exchange: 'NSE' },
  ];

  // ── Private: Raw fetch functions ──────────────────────────────────────────
  // These are the ONLY functions to update when real APIs are ready.
  // Each maps 1:1 to one API endpoint.

  async function _fetchCompanyList() {
    // FUTURE: const res = await fetch(API_ENDPOINTS.companyList);
    // FUTURE: return await res.json();
    return _DUMMY_COMPANY_LIST;
  }

  async function _fetchStockDetail(id) {
    // FUTURE: const res = await fetch(API_ENDPOINTS.stockDetail + '/' + id);
    // FUTURE: return await res.json();
    return _DUMMY_STOCK_DETAIL[id] || null;
  }

  async function _fetchIndices() {
    // FUTURE: const res = await fetch(API_ENDPOINTS.indices);
    // FUTURE: return await res.json();
    return _DUMMY_INDICES;
  }

  async function _fetchGainers() {
    // FUTURE: const res = await fetch(API_ENDPOINTS.gainers);
    // FUTURE: return await res.json();
    return _DUMMY_GAINERS;
  }

  async function _fetchLosers() {
    // FUTURE: const res = await fetch(API_ENDPOINTS.losers);
    // FUTURE: return await res.json();
    return _DUMMY_LOSERS;
  }

  // ── Private: Load with cache logic ───────────────────────────────────────
  // One _load* function per data unit.
  // Pattern: check memory → check storage → fetch fresh.

  async function _loadCompanyList() {
    if (_mem.companyList) return _mem.companyList;

    const lastFetch = await StorageService.get(STORAGE_KEYS.COMPANY_LAST_FETCH);

    if (!CachePolicy.shouldRefreshCompanyList(lastFetch)) {
      const stored = await StorageService.get(STORAGE_KEYS.COMPANY_LIST);
      if (stored) {
        _mem.companyList = stored;
        _mem.companyMaps = _buildCompanyMaps(stored);
        return stored;
      }
    }

    const data = await _fetchCompanyList();
    _mem.companyList = data;
    _mem.companyMaps = _buildCompanyMaps(data);
    await StorageService.set(STORAGE_KEYS.COMPANY_LIST, data);
    await StorageService.set(STORAGE_KEYS.COMPANY_LAST_FETCH, Date.now());
    return data;
  }


  
  /**
   * Registers one matchable term into map1 and map2.
   * @param {Map}    charFirstWord
   * @param {Map}    firstWordMap
   * @param {string} matchText — lowercased term e.g. 'tata consultancy services'
   * @param {number} id        — company id
   */
  function _registerTerm(charFirstWord, firstWordMap, matchText, id) {
    if (!matchText || matchText.length === 0) return;
  
    const words     = matchText.split(' ');
    const firstWord = words[0];
    const firstChar = firstWord[0];
  
    if (!firstChar) return;
  
    if (!charFirstWord.has(firstChar)) charFirstWord.set(firstChar, new Set());
    charFirstWord.get(firstChar).add(firstWord);
  
    if (!firstWordMap.has(firstWord)) firstWordMap.set(firstWord, new Set());
    firstWordMap.get(firstWord).add([matchText, id]);   // ← just [matchText, id]
  }


  /**
 * Builds Map1 and Map2 from company list.
 * To add a new matchable field — add one _registerTerm call below.
 */
  function _buildCompanyMaps(companyList) {
    const charFirstWord = new Map();
    const firstWordMap = new Map();
  
    companyList.forEach(function (company) {
      // Name
      _registerTerm(charFirstWord, firstWordMap, company.name.toLowerCase(), company.id);
  
      // Ticker
      _registerTerm(charFirstWord, firstWordMap, company.ticker.toLowerCase(), company.id);
  
      // Future fields:
      // if (company.alias) _registerTerm(charFirstWord, firstWordMap, company.alias.toLowerCase(), company.id);
      // if (company.shortName) _registerTerm(charFirstWord, firstWordMap, company.shortName.toLowerCase(), company.id);
    });
  
    return { charFirstWord, firstWordMap };
  }


  async function _loadStockDetail(id) {

    if (_mem.stockDetail[id]) {
      const fetchMap  = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL_FETCH) || {};
      const lastFetch = fetchMap[id] || null;
      if (!CachePolicy.shouldRefreshMarketData(lastFetch)) {
        return _mem.stockDetail[id];
      }
    }

    const storedMap  = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL) || {};
    const fetchMap   = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL_FETCH) || {};
    const lastFetch  = fetchMap[id] || null;

    if (!CachePolicy.shouldRefreshMarketData(lastFetch) && storedMap[id]) {
      _mem.stockDetail[id] = storedMap[id];
      return storedMap[id];
    }

    const data = await _fetchStockDetail(id);
    if (!data) return null;

    _mem.stockDetail[id]  = data;
    storedMap[id]         = data;
    fetchMap[id]          = Date.now();

    await StorageService.set(STORAGE_KEYS.STOCK_DETAIL, storedMap);
    await StorageService.set(STORAGE_KEYS.STOCK_DETAIL_FETCH, fetchMap);
    return data;
  }

  async function _loadIndices() {
    if (_mem.indices) return _mem.indices;

    const lastFetch = await StorageService.get(STORAGE_KEYS.INDICES_LAST_FETCH);

    if (!CachePolicy.shouldRefreshMarketData(lastFetch)) {
      const stored = await StorageService.get(STORAGE_KEYS.INDICES);
      if (stored) {
        _mem.indices = stored;
        return stored;
      }
    }

    const data = await _fetchIndices();
    _mem.indices = data;
    await StorageService.set(STORAGE_KEYS.INDICES, data);
    await StorageService.set(STORAGE_KEYS.INDICES_LAST_FETCH, Date.now());
    return data;
  }

  async function _loadGainers() {
    if (_mem.gainers) return _mem.gainers;

    const lastFetch = await StorageService.get(STORAGE_KEYS.GAINERS_LAST_FETCH);

    if (!CachePolicy.shouldRefreshMarketData(lastFetch)) {
      const stored = await StorageService.get(STORAGE_KEYS.GAINERS);
      if (stored) {
        _mem.gainers = stored;
        return stored;
      }
    }

    const data = await _fetchGainers();
    _mem.gainers = data;
    await StorageService.set(STORAGE_KEYS.GAINERS, data);
    await StorageService.set(STORAGE_KEYS.GAINERS_LAST_FETCH, Date.now());
    return data;
  }

  async function _loadLosers() {
    if (_mem.losers) return _mem.losers;

    const lastFetch = await StorageService.get(STORAGE_KEYS.LOSERS_LAST_FETCH);

    if (!CachePolicy.shouldRefreshMarketData(lastFetch)) {
      const stored = await StorageService.get(STORAGE_KEYS.LOSERS);
      if (stored) {
        _mem.losers = stored;
        return stored;
      }
    }

    const data = await _fetchLosers();
    _mem.losers = data;
    await StorageService.set(STORAGE_KEYS.LOSERS, data);
    await StorageService.set(STORAGE_KEYS.LOSERS_LAST_FETCH, Date.now());
    return data;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Call once on popup open.
   * Pre-loads company list and market data in parallel so tabs feel instant.
   * Stock detail is NOT pre-loaded — fetched on demand per ticker.
   */
  async function init() {
    await Promise.all([
      _loadCompanyList(),
      _loadIndices(),
      _loadGainers(),
      _loadLosers(),
    ]);
  }

  /**
   * Returns full company list for search.
   * @returns {Array<{ticker, name}>}
   */
  async function getCompanyList() {
    return _loadCompanyList();
  }

  async function getCompanyMaps() {
    if (_mem.companyMaps) return _mem.companyMaps;
    await _loadCompanyList();   // ensures maps are built
    return _mem.companyMaps;
  }

  /**
   * Filters company list by query string.
   * Matches against ticker and company name.
   * @param   {string} query
   * @returns {Array<{ticker, name}>}
   */
  async function searchCompanies(query) {
    const list = await _loadCompanyList();
    const q    = query.trim().toLowerCase();
    if (!q) return [];
    return list.filter(function (c) {
      return c.ticker.toLowerCase().includes(q) ||
             c.name.toLowerCase().includes(q);
    });
  }

  /**
   * Returns full detail for one stock.
   * Cached per ticker, same staleness policy as other market data.
   * @param   {number} id
   * @returns {Object|null}
   */
  async function getStockDetail(id) {
    return _loadStockDetail(id);
  }

  /**
   * Returns market indices array.
   * @returns {Array<{name, value, changePercent, changeAbsolute}>}
   */
  async function getIndices() {
    return _loadIndices();
  }

  /**
   * Returns pre-sorted top gainers array.
   * @returns {Array<{ticker, name, price, changePercent, changeAbsolute, sector, exchange}>}
   */
  async function getGainers() {
    return _loadGainers();
  }

  /**
   * Returns pre-sorted top losers array.
   * @returns {Array<{ticker, name, price, changePercent, changeAbsolute, sector, exchange}>}
   */
  async function getLosers() {
    return _loadLosers();
  }

  return Object.freeze({
    init,
    getCompanyList,
    searchCompanies,
    getStockDetail,
    getIndices,
    getGainers,
    getLosers,
    getCompanyMaps,
  });

})();