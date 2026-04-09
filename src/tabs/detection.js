const DetectionTab = (function () {
  'use strict';

  let _scanBtn = null;
  let _resultsEl = null;
  let _isScanning = false;

  function _setScanning(state) {
    _isScanning = state;
    _scanBtn.disabled = state;

    if (state) {
      _scanBtn.innerHTML = '<span class="scan-btn_spinner"></span> Scanning...';
    } else {
      _scanBtn.innerHTML = '<i data-lucide="maximize"></i> START SCAN';
      try { lucide.createIcons(); } catch (e) {}
    }

  }

  function _showStatus(message, isError) {
    _resultsEl.innerHTML =
      '<p class="scan-status' + (isError ? ' scan-status-error' : '') + '">'
      + message + '</p>';
  }

  /**
   * Renders matched companies as simple result cards.
   * Full StockCard component wired in next sprint.
   */
  function _renderResults(companies) {
    if (!companies || companies.length === 0) {
      _showStatus('No companies found on this page.', false);
      return;
    }

    const cards = companies.map(function (c) {
      return StockCard(c, {
        locate: false,
        matchedText: c.matchedText || '',
      });
    }).join('');


    _resultsEl.innerHTML =
      '<p class="scan-status">Found ' + companies.length + ' companies</p>'
      + cards;

    try { lucide.createIcons(); } catch (e) {}

    // // Bind locate buttons — StockCard only renders HTML, events owned here
    // _resultsEl.querySelectorAll('[data-action="locate"]').forEach(function (btn) {
    //   btn.addEventListener('click', function (e) {
    //     e.stopPropagation();   // prevent any future card-level click handler
    //     _goToWord(this.dataset.matched);
    //   });
    // });
  }


  async function _runScan() {
    if (_isScanning) return;
    _setScanning(true);
    _resultsEl.innerHTML = '';

    let activeTab;

    try {
      // activeTab permission grants access to current tab on user gesture
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tabs[0];
    } catch (err) {
      _showStatus('Could not access the current tab.', true);
      _setScanning(false);
      return;
    }


    if (!activeTab) {
      _showStatus('Cannot scan this page. Navigate to a regular webpage first.', true);
      _setScanning(false);
      return;
    }

    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: [
          'scripts/ValidChunk.js',
          'scripts/ExtractChunk.js'
        ],
      });
    } catch (err) {
      console.error('[Detection] Injection failed:', err);
      _showStatus('Scan failed. The page may have blocked script injection.', true);
      _setScanning(false);
      return;
    }

    const chunks = results?.[0]?.result;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      _showStatus('No content found on this page.', false);
      _setScanning(false);
      return;
    }

    console.log('[Detection] Chunks:', chunks);

    // ── Step 3: match chunks against company list ───────────────────────────
    const companyMaps = await DataService.getCompanyMaps();
    const matched = MatchService.matchChunks(chunks, companyMaps);


    if (matched.length === 0) {
      _showStatus('No companies found on this page.', false);
      _setScanning(false);
      return;
    }

    // ── Step 4: fetch stock details for each match ──────────────────────────
    const detailPromises = matched
      // .slice(0, SCAN_CONFIG.maxResults)  //when we want to limit results shown.
      .map(function (id) { return DataService.getStockDetail(id); });

    const details = await Promise.all(detailPromises);

    const validDetails = details.filter(Boolean);



    await StorageService.set('lastScan', {
      url: activeTab.url,
      chunks: chunks,
      companies: validDetails,
      scannedAt: Date.now(),
    });

    _renderResults(validDetails.length > 0 ? validDetails : matched);
    _setScanning(false);
  }


  /**
   * Restores last scan results from storage on popup open.
   * Only restores if the scan was for the currently active tab's URL.
   */
  async function _restoreLastScan() {
    const last = await StorageService.get('lastScan');
    if (!last || !last.companies || last.companies.length === 0) return;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab || activeTab.url !== last.url) return;

    _renderResults(last.companies);
  }

  async function init() {
    _scanBtn = document.getElementById('scan-btn');
    _resultsEl = document.getElementById('scan-results');
    _scanBtn.addEventListener('click', _runScan);
    await _restoreLastScan();
  }

  return Object.freeze({ init });

})();