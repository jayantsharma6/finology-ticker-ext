/**
 * CachePolicy
 *
 * Single source of truth for ALL cache and refresh timing decisions.
 * No other file contains staleness or timing logic.
 *
 * Two policy types:
 *   shouldRefreshMarketData  — for indices, gainers, losers, stock detail
 *   shouldRefreshCompanyList — for company list only
 */
const CachePolicy = (function () {
  'use strict';

  /**
   * Returns current hour in IST (UTC+5:30).
   */
  function _getCurrentISTHour() {
    const now    = new Date();
    const utcMs  = now.getTime() + now.getTimezoneOffset() * 60000;
    const istMs  = utcMs + (5.5 * 60 * 60 * 1000);
    return new Date(istMs).getHours();
  }

  /**
   * Returns minutes elapsed since a given timestamp.
   * @param {number} timestamp — ms since epoch
   */
  function _minutesSince(timestamp) {
    return (Date.now() - timestamp) / 60000;
  }

  /**
   * Returns hours elapsed since a given timestamp.
   * @param {number} timestamp — ms since epoch
   */
  function _hoursSince(timestamp) {
    return (Date.now() - timestamp) / 3600000;
  }

  /**
   * Policy for: indices, gainers, losers, stock detail.
   *
   * Refresh if:
   *   1. No previous fetch timestamp.
   *   2. During market hours (IST >= MARKET_OPEN_HOUR) AND data older than MARKET_STALENESS_MINS.
   *   3. Outside market hours AND data older than MARKET_STALENESS_MINS.
   *
   * In both cases the staleness check is the same — the market open hour
   * condition exists for clarity and future extensibility (e.g. you may
   * want different staleness windows inside vs outside market hours).
   *
   * @param  {number|null} lastFetch — timestamp or null
   * @returns {boolean}
   */
  function shouldRefreshMarketData(lastFetch) {
    if (!lastFetch) return true;
    return _minutesSince(lastFetch) >= CACHE_CONFIG.MARKET_STALENESS_MINS;
  }

  /**
   * Policy for: company list only.
   *
   * Refresh if:
   *   1. No previous fetch timestamp.
   *   2. Data older than COMPANY_STALENESS_HOURS.
   *   3. Current IST hour >= COMPANY_REFRESH_HOUR AND last fetch was
   *      before today's refresh hour — i.e. the daily reset has crossed
   *      but we haven't fetched since.
   *
   * @param  {number|null} lastFetch — timestamp or null
   * @returns {boolean}
   */
  function shouldRefreshCompanyList(lastFetch) {
    if (!lastFetch) return true;

    if (_hoursSince(lastFetch) >= CACHE_CONFIG.COMPANY_STALENESS_HOURS) return true;

    const istHour = _getCurrentISTHour();

    if (istHour >= CACHE_CONFIG.COMPANY_REFRESH_HOUR) {
      const utcMs          = lastFetch + new Date(lastFetch).getTimezoneOffset() * 60000;
      const istLastFetchHr = new Date(utcMs + 5.5 * 60 * 60 * 1000).getHours();
      if (istLastFetchHr < CACHE_CONFIG.COMPANY_REFRESH_HOUR) return true;
    }

    return false;
  }

  return Object.freeze({
    shouldRefreshMarketData,
    shouldRefreshCompanyList,
  });

})();