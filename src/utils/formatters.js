const Formatters = (function () {
  'use strict';

  const CURRENCY = APP_CONFIG.currency;

  /**
   * Validates that a value is a finite number.
   * Returns null if invalid.
   */
  function toFiniteNumber(value) {
    const n = Number(value);
    return isFinite(n) ? n : null;
  }

  /**
   * Formats a number as Indian currency string.
   * 1612.45     → ₹1,612.45
   * 1234567.89  → ₹12,34,567.89  (Indian numbering system)
   */
  function formatPrice(price) {
    const n = toFiniteNumber(price);
    if (n === null) return '—';
    return CURRENCY + n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Formats a PERCENT change value with sign and % symbol.
   * Use this when the value is a percentage.
   * 2.10  → +2.10%
   * -0.82 → -0.82%
   * 0     → 0.00%
   */
  function formatPercentChange(change) {
    const n = toFiniteNumber(change);
    if (n === null) return '—';
    const sign = n > 0 ? '+' : '';
    return sign + n.toFixed(2) + '%';
  }

  /**
   * Formats an ABSOLUTE change value with sign and currency symbol.
   * Use this when the value is a price difference.
   * 4.50  → +₹4.50
   * -3.20 → -₹3.20
   * 0     → ₹0.00
   */
  function formatAbsoluteChange(change) {
    const n = toFiniteNumber(change);
    if (n === null) return '—';
    const sign = n > 0 ? '+' : '';
    return sign + CURRENCY + Math.abs(n).toFixed(2);
  }

  /**
   * Formats a large number in Indian short form.
   * 10000000  → ₹1.00 Cr
   * 500000    → ₹5.00 L
   * Used for market cap, volume etc.
   */
  function formatLargeNumber(value) {
    const n = toFiniteNumber(value);
    if (n === null) return '—';
    if (n >= 1e7) return CURRENCY + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return CURRENCY + (n / 1e5).toFixed(2) + ' L';
    return CURRENCY + n.toLocaleString('en-IN');
  }

  /**
   * Returns true only if change is strictly positive.
   * Zero is treated as neutral, not positive.
   */
  function isPositive(change) {
    const n = toFiniteNumber(change);
    return n !== null && n > 0;
  }

  /**
   * Returns true only if change is strictly negative.
   */
  function isNegative(change) {
    const n = toFiniteNumber(change);
    return n !== null && n < 0;
  }

  /**
   * Returns CSS utility class based on change direction.
   * positive → 'positive'  (green)
   * negative → 'negative'  (red)
   * zero     → 'neutral'   (muted)
   */
  function changeClass(change) {
    if (isPositive(change)) return 'positive';
    if (isNegative(change)) return 'negative';
    return 'neutral';
  }

  return Object.freeze({
    formatPrice,
    formatPercentChange,
    formatAbsoluteChange,
    formatLargeNumber,
    isPositive,
    isNegative,
    changeClass,
  });

})();