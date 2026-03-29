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
  stock:  '',
  market: '',
});

const SCAN_CONFIG = Object.freeze({
  minChunkLength: 2,   // ignore chunks shorter than this
  maxResults:     10,  // max tickers to show after scan
});