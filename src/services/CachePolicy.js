/**
 * CachePolicy
 *
 * For all cache and refresh timing decisions.
 *
 * Two policy types:
 *   shouldRefreshMarketData  — for indices, gainers, losers, stock detail
 *   shouldRefreshCompanyList — for company list only
 */

const CachePolicy = (function () {
  'use strict';



  function _getISTDate() {
    const now   = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + MARKET_CONFIG.TIMEZONE_OFFSET_HRS * 60 * 60 * 1000);
  }



  function _minutesSince(timestamp) {
    return (Date.now() - timestamp) / 60000;
  }


  function _hoursSince(timestamp) {
    return (Date.now() - timestamp) / 3600000;
  }



  /**
   * Returns true if market is currently open.
   * NSE hours: 9:15 AM — 3:30 PM IST, Mon–Fri.
   */
  function isMarketOpen() {
    const ist     = _getISTDate();
    const day     = ist.getDay();   // 0 = Sun, 6 = Sat
    const hour    = ist.getHours();
    const minute  = ist.getMinutes();
    const inMins  = hour * 60 + minute;

    const openMins  = MARKET_CONFIG.OPEN_HOUR  * 60 + MARKET_CONFIG.OPEN_MIN;
    const closeMins = MARKET_CONFIG.CLOSE_HOUR * 60 + MARKET_CONFIG.CLOSE_MIN;

    if (day === 0 || day === 6) return false;              // weekend
    return inMins >= openMins && inMins < closeMins;
  }


  function _getTodayMarketCloseTimestamp() {
    const ist = _getISTDate();
    ist.setHours(MARKET_CONFIG.CLOSE_HOUR, MARKET_CONFIG.CLOSE_MIN, 0, 0);

    // IST to UTC ms
    return ist.getTime() - MARKET_CONFIG.TIMEZONE_OFFSET_HRS * 60 * 60 * 1000;
  }




  /**
   * Policy for: stock detail, indices, gainers, losers.
   *
   * Market open:
   *   - data > 15 mins old → refresh
   *   - data < 15 mins old → use cache
   *
   * Market closed:
   *   - last fetch was after today's close → use cache (data is final for the day)
   *   - last fetch was before today's close → refresh (stale pre-close data)
   *
   * 
   * @param  {number|null} lastFetch — timestamp or null
   * @returns {boolean}
   */
  function shouldRefreshMarketData(lastFetch) {
    if (!lastFetch) return true;

    if (isMarketOpen()) {
      return _minutesSince(lastFetch) >= CACHE_CONFIG.MARKET_STALENESS_MINS;
    }

    // Market closed — check if data is from after today's close
    const todayClose = _getTodayMarketCloseTimestamp();
    if (lastFetch >= todayClose) return false;   // data is post-close, final for day

    return true;   // data is pre-close or from a previous day
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

    const ist     = _getISTDate();
    const istHour = ist.getHours();

    if (istHour >= CACHE_CONFIG.COMPANY_REFRESH_HOUR) {
      const utcMs          = lastFetch + new Date(lastFetch).getTimezoneOffset() * 60000;
      const istLastFetchHr = new Date(utcMs + MARKET_CONFIG.TIMEZONE_OFFSET_HRS * 60 * 60 * 1000).getHours();
      if (istLastFetchHr < CACHE_CONFIG.COMPANY_REFRESH_HOUR) return true;
    }

    return false;
  }

  
  return Object.freeze({
    isMarketOpen,
    shouldRefreshMarketData,
    shouldRefreshCompanyList,
  });

})();