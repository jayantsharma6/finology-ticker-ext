const TAB_IDS = Object.freeze({
  SEARCH:    'search',
  MARKETS:   'markets',
  DETECTION: 'detection',
  WIDGETS:   'widgets',
});

const APP_CONFIG = Object.freeze({
  name:     'Ticker',
  version:  '1.0.0',
  exchange: 'NSE',
  currency: '₹',
});

const API_ENDPOINTS = Object.freeze({
  base:   '',        // will be filled when real API is ready
  search: '',
  stockDetail:  '',
  market: '',
  indices: '',
  gainers: '',
  losers: '',
  companyList: '',
});

const SCAN_CONFIG = Object.freeze({
  minChunkLength: 2,   // ignore chunks shorter than this
  maxResults:     10,  // max tickers to show after scan
});


/**
 * Cache configuration.
 *
 * MARKET_STALENESS_MINS   — how old market data can be before re-fetching.
 * MARKET_OPEN_HOUR        — hour (24h, IST) after which force-fetch always runs.
 *                           9 = 9:00 AM, representing market open at 9:15 AM.
 *
 * COMPANY_STALENESS_HOURS — how old company list can be before re-fetching.
 * COMPANY_REFRESH_HOUR    — hour (24h, IST) after which force-fetch always runs.
 *                           7 = 7:00 AM, before company data refresh.
 */
const CACHE_CONFIG = Object.freeze({
  MARKET_STALENESS_MINS:   15,
  MARKET_OPEN_HOUR:        9,

  COMPANY_STALENESS_HOURS: 24,
  COMPANY_REFRESH_HOUR:    7,
});


const STORAGE_KEYS = Object.freeze({
  MARKET_DATA:        'marketData',
  MARKET_LAST_FETCH:  'marketLastFetch',  //could expand to indices, gainers, losers.

  INDICES:            'indices',
  INDICES_LAST_FETCH:  'indicesLastFetch',
  
  GAINERS:            'gainers',
  GAINERS_LAST_FETCH: 'gainersLastFetch',

  LOSERS:             'losers',
  LOSERS_LAST_FETCH:  'losersLastFetch',

  COMPANY_LIST:       'companyList',
  COMPANY_LAST_FETCH: 'companyLastFetch',

  STOCK_DETAIL:       'stockDetail',
  STOCK_DETAIL_FETCH: 'stockDetailFetch',
});