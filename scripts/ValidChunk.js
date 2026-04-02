// ─────────────────────────────────────────────────────────────
// isValidChunk(text, el)
//
// text — the collected text string
// el   — the DOM element it came from (for attribute inspection)
//
// Returns true  → worth scanning for company names
// Returns false → can be proven to never contain one
//
// Checks in order (fastest exit first):
//   1. Min length
//   2. Is a number — only by DOM attribute/tag evidence, never
//      by parsing the string itself
//   3. Has at least 2 alphabets in first 15 chars
//   4. Is a known stop word / phrase
// ─────────────────────────────────────────────────────────────

if (typeof isValidChunk === 'undefined') {

  function isValidChunk(text, el) {

    // ── 1. Minimum length ──────────────────────────────────────
    if (text.length < 2) return false;


    // ── 2. Number check — DOM evidence only ───────────────────
    // We do NOT inspect the string to decide if it's a number.
    // We only reject if the element itself declares it is numeric
    // via its tag, type attribute, data attribute, or class name.
    if (el && isMarkedAsNumber(el)) return false;


    // ── 3. At least 2 alphabets in first 15 characters ────────
    // Uppercase the sample, then scan charCodes for A-Z (65-90).
    // Exits as soon as 2 found — no full string traversal.
    const sample = text.length > 15 ? text.substring(0, 15) : text;
    const upper = sample.toUpperCase();
    let alphaCount = 0;
    for (let i = 0; i < upper.length; i++) {
      const c = upper.charCodeAt(i);
      if (c >= 65 && c <= 90) {
        if (++alphaCount === 2) break;
      }
    }
    if (alphaCount < 2) return false;


    // ── 4. Stop word / phrase check ───────────────────────────
    // Exact full-match only on the normalised chunk.
    // Never strips words from longer chunks — "Larsen and Toubro"
    // must not be affected by "and" or "toubro" being stop words.
    const normalised = text.trim().toLowerCase().replace(/\s+/g, ' ');
    const firstChar = normalised[0];
    const bucket = STOP_WORDS.get(firstChar);
    if (bucket && bucket.has(normalised)) return false;


    return true;
  }


  // ─────────────────────────────────────────────────────────────
  // isMarkedAsNumber(el)
  // Checks DOM attributes — NOT the text content — for evidence
  // that this element holds a numeric value only.
  // ─────────────────────────────────────────────────────────────

  function isMarkedAsNumber(el) {
    // data-type or type attribute explicitly says number/numeric
    const dataType = (el.getAttribute('data-type') || '').toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (dataType === 'number' || dataType === 'numeric') return true;
    if (type === 'number') return true;

    // data-format hints at numeric formatting
    const dataFormat = (el.getAttribute('data-format') || '').toLowerCase();
    if (['number', 'currency', 'percent', 'decimal', 'integer', 'float']
      .includes(dataFormat)) return true;

    // class or id contains unambiguous numeric indicator keywords
    const id = (el.id || '').toLowerCase();
    const cls = typeof el.className === 'string'
      ? el.className.toLowerCase()
      : '';
    const combined = id + ' ' + cls;

    // Pattern: must be an explicit numeric label, not just containing
    // "price" or "value" which appear in company names and section headers
    if (/\bnumeric\b/.test(combined)) return true;
    if (/\bnum-val\b/.test(combined)) return true;
    if (/\bnumber-cell\b/.test(combined)) return true;
    if (/\bdigit\b/.test(combined)) return true;
    if (/\brupee-val\b/.test(combined)) return true;
    if (/\bpercent-val\b/.test(combined)) return true;

    return false;
  }


  // ─────────────────────────────────────────────────────────────
  // STOP_WORDS
  // Map keyed by first character of the stop phrase.
  // Lookup: STOP_WORDS.get(normalised[0])?.has(normalised)
  // Add new entries to the correct character bucket.
  // ─────────────────────────────────────────────────────────────

  const STOP_WORDS = new Map([

    ['a', new Set([
      // General
      'all', 'add', 'about', 'account', 'apply now',
      'alerts', 'announcements', 'accumulate',
      // Time
      'annual', 'annually', 'august', 'april', 'as on', 'as at', 'as of',
      // Finance metrics
      'aum', 'amfi', 'amc',
      'asset turnover', 'average volume', 'avg volume',
      'all time high', 'all time low',
      'all indices', 'all sectors', 'all stocks',
      'audited',
    ])],

    ['b', new Set([
      // General
      'back', 'bookmark', 'buy',
      // UI
      'bundles', 'bse', 'bse:',
      'bse listed',
      // Finance
      'book value', 'book value (ttm)',
      'balance sheet',
      'bid', 'borrowings',
      'benchmark',
    ])],

    ['c', new Set([
      // General
      'cancel', 'clear', 'close', 'copy', 'create', 'collapse',
      'click here',
      // UI
      'charts', 'consolidated', 'contact', 'corp. action',
      'corporate action', 'corporate actions',
      'cookie policy',
      // Finance metrics
      'cash', 'cash flows', 'cash flow', 'capex',
      'current ratio', 'current assets', 'current liabilities',
      'circuit breaker', 'circuit limit',
      'capital wip', 'capital employed',
      'creditor days', 'cash cycle',
      'cfo latest yr', 'cff latest yr',
      'cogs latest yr',
      'contingent liabilities',
      // Time
      'count',
      // Legal
      'copyright',
    ])],

    ['d', new Set([
      // General
      'date', 'delete', 'description', 'details', 'discover',
      'download', 'daily',
      // Finance
      'debt', 'div. yield', 'dividend', 'dividend yield',
      'dividend payout %',
      'dividend/share', 'dividend/share - 3 yr',
      'dividend/share - 5 yr', 'dividend/share last yr',
      'div. payout% - 3yr', 'div. payout% - 5yr',
      'debtors', 'debtors turnover', 'debtor days',
      'depreciation', 'delivery',
      'derivatives', 'data source', 'data powered by',
      'disclaimer',
    ])],

    ['e', new Set([
      // General
      'edit', 'error', 'expand',
      // UI
      'elss',
      // Finance
      'eps', 'eps (ttm)', 'earnings per share',
      'eps last qtr', 'eps last yr', 'eps recent qtr',
      'eps - 3yr avg', 'eps - 5yr avg',
      'ebitda', 'ebitda margin', 'ebit',
      'ev/ebitda', 'ev/ebit', 'ev/net sales',
      'expense ratio', 'exit load',
      'equal weight', 'enterprise value',
      'earnings yield',
      'eq. capital recent qtr',
      // Time
      'exchange',
    ])],

    ['f', new Set([
      // General
      'failed', 'figure', 'filter', 'forward',
      // UI
      'financials',
      // Finance
      'face value', 'fair value',
      'fcff', 'fcfe', 'fcff per share',
      'fixed asset turnover',
      'fund manager', 'fund house',
      'f&o', 'futures',
      'footnote',
      // Time
      'feb', 'february', 'fy', 'fy24', 'fy25', 'fy26',
      // Legal
      'figures in crores',
    ])],

    ['g', new Set([
      'graph', 'get started',
      'gross profit',
    ])],

    ['h', new Set([
      // General
      'help', 'hide', 'hold', 'home', 'high',
      // Finance
      'half yearly', 'half-yearly',
    ])],

    ['i', new Set([
      // General
      'icon', 'image', 'info', 'intraday',
      // UI
      'ipo', 'indices', 'index', 'industry', 'isin',
      'in crores', 'in lakhs', 'in millions', 'in billions',
      'intrinsic value',
      'interest coverage', 'inventory',
      'inventory turnover', 'inventory days',
      'investments',
    ])],

    ['j', new Set([
      'jan', 'january', 'jun', 'jul', 'june', 'july',
    ])],

    ['k', new Set([
      'know more',
    ])],

    ['l', new Set([
      // General
      'left', 'less', 'live', 'load more', 'logo', 'low', 'lumpsum',
      // UI
      'login', 'logout', 'learn more',
      // Finance
      'large cap', 'large-cap',
      'large cap fund',
      'listing date', 'launch date',
      'ltp', 'last traded price', 'lower circuit',
    ])],

    ['m', new Set([
      // General
      'more', 'market', 'markets', 'monthly', 'mtd',
      // UI
      'mutual fund', 'mutual funds',
      // Finance
      'market cap', 'market cap to sales',
      'mid cap', 'mid-cap', 'mid cap fund',
      'mar', 'march', 'may',
      'net profit margin',
      // UI tab
      'most active',
    ])],

    ['n', new Set([
      // General
      'name', 'neutral', 'new', 'next', 'no', 'none', 'note', 'notes',
      'notifications',
      // UI
      'nse', 'nse:', 'nse listed', 'news',
      // Finance
      'nav', 'npm', 'net profit',
      'net profit last qtr', 'net profit last yr', 'net profit recent qtr',
      'net sales', 'net sales last yr',
      'net block', 'net cash flow',
      'npm recent qtr',
      'non_current liab',
      'nifty',
      'number',
      'note to accounts',
    ])],

    ['o', new Set([
      // General
      'ok', 'okay', 'old', 'open', 'other', 'others', 'overview',
      // Finance
      'opm', 'operating profit',
      'op. profit last yr', 'op. profit recent qtr',
      'op. profit (excl oi)',
      'opm (incl oi) %',
      'options', 'overvalued', 'overweight',
      'outperform',
      'other income', 'other income last yr', 'other income/net worth',
      'owners fund to total source',
      // Time
      'oct', 'october',
    ])],

    ['p', new Set([
      // General
      'paste', 'pending', 'prev', 'previous', 'print',
      // UI
      'portfolio', 'preferences', 'profile',
      // Finance
      'p/e', 'p/b', 'p/s',
      'p/e - 3yr avg', 'p/e - 5yr avg',
      'p/b - 3yr avg', 'p/b - 5yr avg',
      'pat', 'pbt', 'pbdt',
      'pat margin (%)', 'pat growth qoq',
      'pre tax margin %',
      'price to sales', 'price to book', 'price to earnings',
      'price range', 'price summary', 'prev close', 'previous close',
      'promoter', 'promoters', 'promoter holding',
      'profit and loss', 'profit growth', 'profit margin last yr',
      'particulars', 'pan',
      'powered by',
      // Legal
      'privacy policy',
      'past performance is not indicative of future results',
      'please read all scheme related documents carefully',
      // Time
      'period ended',
    ])],

    ['q', new Set([
      'q1', 'q2', 'q3', 'q4',
      'quarterly', 'quick ratio',
    ])],

    ['r', new Set([
      // General
      'read more', 'reference', 'references', 'remove', 'reset',
      // Finance
      'roe', 'roce', 'roa', 'roic',
      'roe %', 'roa %', 'roce%', 'roic %',
      'roe - 3yr avg', 'roe - 5yr avg',
      'roa - 3yr avg', 'roa - 5yr avg',
      'roce - 3yr avg', 'roce - 5yr avg',
      'ratios', 'results', 'revenue', 'revenue growth',
      'redemption', 'reduce',
      'reports', 'reference', 'references',
      'return on equity', 'return on assets',
      'return on capital employed',
      // Legal
      'read all scheme related documents carefully',
      // UI
      'rupees in crores', 'rs. in crores',
    ])],

    ['s', new Set([
      // General
      'save', 'saved', 'scroll', 'search', 'select', 'selected',
      'settings', 'share', 'show', 'show more', 'show less',
      'sign in', 'sign up', 'signup', 'sort', 'source', 'sources',
      'start now', 'submit', 'subscribe', 'success', 'swipe',
      'summary', 'see more', 'see all',
      // UI
      'screener', 'sector', 'sectors', 'shareholding', 'standalone',
      'sensex', 'sip', 'small cap', 'small-cap', 'small cap fund',
      'star rating',
      // Finance
      'sales growth', 'sales growth qoq', 'sales recent qtr',
      'sales to cf',
      'share capital',
      "shareholder's fund", 'shareholders fund',
      'sebi', 'spread', 'swing',
      'stop loss', 'strong buy', 'strong sell',
      // Time
      'sep', 'september',
      // Legal
      'source:',
    ])],

    ['t', new Set([
      // General
      'table', 'tap', 'tap here', 'time', 'title', 'today', 'tomorrow',
      'top', 'total', 'trade', 'trending', 'try now', 'ttm', 'type',
      'this week', 'this month', 'this year',
      // UI
      'target price',
      // Finance
      'tax', 'tax rate',
      'total assets', 'total liabilities', 'total debt',
      'total equity', 'total income', 'total revenue',
      'total expenditure', 'total capital employed',
      'total income last yr', 'total reserves',
      'trade payables',
      'top gainers', 'top losers',
      // Legal
      'terms and conditions', 'terms of use', 'terms of service',
      // Time
      'today', 'tomorrow', 'ttm', 'ytd',
      'this week', 'this month', 'this year',
    ])],

    ['u', new Set([
      // General
      'up', 'unfollow', 'unsubscribe', 'updated', 'upload',
      'underperform', 'undervalued', 'underweight',
      // Finance
      'upper circuit',
    ])],

    ['v', new Set([
      'value', 'values', 'volume', 'view', 'view all',
      'valuation',
    ])],

    ['w', new Set([
      'warning', 'watchlist',
      'weekly', 'working capital', 'working cap. changes',
      'year ended',       // kept here as fallback, also in 'y'
    ])],

    ['x', new Set([
      // rare, placeholder
    ])],

    ['y', new Set([
      'yearly', 'ytd',
      'year ended',
      'yesterday',
    ])],

    ['z', new Set([
      // rare, placeholder
    ])],

    // ── Non-alpha first characters ─────────────────────────────

    ['(', new Set([
      '(rs. in crores)', '(₹ in crores)', '(in crores)',
    ])],

    ['©', new Set([
      '© finology', '© moneycontrol',
    ])],

    ['₹', new Set([
      // specific rupee-prefixed labels that are not amounts
    ])],

  ]);

}