/**
 * StockCard
 *
 * Pure HTML string factory for a stock card.
 * No event binding, no DOM interaction, no side effects.
 * All event binding is handled by the calling tab.
 *
 * @param {Object} data
 *   @param {string} data.ticker
 *   @param {string} data.name
 *   @param {number} data.price
 *   @param {number} data.changePercent
 *   @param {string} data.sector
 *   @param {string} data.tickerUrl
 *
 * @param {Object} options
 *   @param {boolean} options.locate       — show locate icon button (Detection only)
 *   @param {string}  options.matchedText  — passed when locate is true
 *
 * @returns {string} HTML string
 */
function StockCard(data, options) {
  'use strict';

  const opts = options || {};

  const changeClass = Formatters.changeClass(data.changePercent);
  const price       = Formatters.formatPrice(data.price);
  const change      = Formatters.formatPercentChange(data.changePercent);
  const arrow       = Formatters.isPositive(data.changePercent) ? '▲' : (Formatters.isNegative(data.changePercent) ? '▼' : '');

  // ── Action strip ───────────────────────────────────────────────────────
  // Primary action anchors left. Icon buttons stack right.
  // Adding a future button = one more icon-btn on the right.

  const viewBtn = data.tickerUrl
  ? '<a class="stock-card_action-primary" href="' + data.tickerUrl + '" target="_blank" rel="noopener noreferrer">'
    + 'View in Ticker'
    + '<i data-lucide="external-link"></i>'
    + '</a>'
  : '';


  // ── Card HTML ──────────────────────────────────────────────────────────
  return [
    '<div class="stock-card">',

    '  <div class="stock-card_top">',

    '    <div class="stock-card_identity">',
    '      <div class="stock-card_identity-row">',
    '        <span class="stock-card_ticker">', data.ticker, '</span>',
    '        <span class="stock-card_sector">', data.sector || '', '</span>',
    '      </div>',
    '      <p class="stock-card_name">', data.name, '</p>',
    '    </div>',

    '    <div class="stock-card_pricing">',
    '      <span class="stock-card_price">', price, '</span>',
    '      <span class="stock-card_change ', changeClass, '">', arrow, ' ', change, '</span>',
    '    </div>',

    '  </div>',

    '  <div class="stock-card_divider"></div>',

    '  <div class="stock-card_actions">',
    '    ', viewBtn,
    // '    <div class="stock-card_actions-right">',
    // '      ', locateBtn,
    // '    </div>',
    '  </div>',

    '</div>',
  ].join('');
}