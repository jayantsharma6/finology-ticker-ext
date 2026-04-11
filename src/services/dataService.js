const DataService = (function () {
  'use strict';

  // ── Session-level memory cache ────────────────────────────────────────────
  // Prevents redundant storage reads within the same popup session.
  // Cleared automatically when popup closes.
  const _mem = {
    companyList:  null,
    companyMaps:  null,
    companyDetail:  {},    // keyed by id: { 1: {...}, 2: {...} }
    indices:      null,
    gainers:      null,
    losers:       null,
  };


  // ── Private: Load with cache logic ───────────────────────────────────────
  // One _load* function per data unit.
  // Pattern: check memory → check storage → fetch fresh.

  async function _loadCompanyList() {
    // if (_mem.companyList) return _mem.companyList;

    const lastFetch = await StorageService.get(STORAGE_KEYS.COMPANY_LAST_FETCH);
    const needsRefresh = CachePolicy.shouldRefreshCompanyList(lastFetch);

    if (!needsRefresh) {
      const stored = await IndexedDBService.getAll(DB_CONFIG.stores.COMPANY_LIST.name);
      if (stored && stored.length > 0) {
        // _mem.companyList = stored;
        _mem.companyMaps = _buildCompanyMaps(stored);
        return stored;
      }
    }

    const data = await ApiService.fetchCompanyList();
    // _mem.companyList = data;
    _mem.companyMaps = _buildCompanyMaps(data);
    await IndexedDBService.clearStore(DB_CONFIG.stores.COMPANY_LIST.name);
    await IndexedDBService.upsertBulk(DB_CONFIG.stores.COMPANY_LIST.name, data);
    // await StorageService.set(STORAGE_KEYS.COMPANY_LIST, data);
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

    if (_mem.companyDetail[id]) {
      const fetchMap  = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL_FETCH) || {};
      const lastFetch = fetchMap[id] || null;
      if (!CachePolicy.shouldRefreshMarketData(lastFetch)) {
        return _mem.companyDetail[id];
      }
    }

    const storedMap  = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL) || {};
    const fetchMap   = await StorageService.get(STORAGE_KEYS.STOCK_DETAIL_FETCH) || {};
    const lastFetch  = fetchMap[id] || null;

    if (!CachePolicy.shouldRefreshMarketData(lastFetch) && storedMap[id]) {
      _mem.companyDetail[id] = storedMap[id];
      return storedMap[id];
    }

    const data = await ApiService.fetchCompanyDetail(id);
    if (!data) return null;

    _mem.companyDetail[id]  = data;
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

    const data = await ApiService.fetchIndices();
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

    const data = await ApiService.fetchGainers();
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

    const data = await ApiService.fetchLosers();
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