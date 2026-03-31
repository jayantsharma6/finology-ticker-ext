const DetectionTab = (function () {
    'use strict';
  
    let _scanBtn   = null;
    let _resultsEl = null;
    let _isScanning  = false;
  
    function _setScanning(state) {
      _isScanning        = state;
      _scanBtn.disabled  = state;
      _scanBtn.innerHTML = state
        ? '<span class="scan-btn__spinner"></span> Scanning...'
        : 'START SCAN';
    }
  
    function _showStatus(message, isError) {
      _resultsEl.innerHTML =
        '<p class="scan-status' + (isError ? ' scan-status-error' : '') + '">'
        + message + '</p>';
    }
  
    async function _runScan() {
      if (_isScanning) return;
      _setScanning(true);
      _resultsEl.innerHTML = '';
  
      let tabs;

      try {
        // Get currently active tab
        tabs = await chrome.tabs.query({ active: true, currentWindow: true });

      } catch (err) {
        console.error('[Detection] Failed to query active tab:', err);
        _showStatus('Could not access the current tab.', true);
        _setScanning(false);
        return;
      }

      const activeTab = tabs[0];

  
      if (!activeTab || !activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
        _showStatus('Cannot scan this page. Navigate to a regular webpage first.', true);
        _setScanning(false);
        return;
      }
  
      let results;
      try {
        results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files:  [
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
  
      await StorageService.set('lastScan', {
        url:       activeTab.url,
        chunks:    chunks,
        scannedAt: Date.now(),
      });
  
      _showStatus('Found ' + chunks.length + ' chunks. Ready for matching.', false);
      _setScanning(false);
    }
  
    function init() {
      _scanBtn   = document.getElementById('scan-btn');
      _resultsEl = document.getElementById('scan-results');
      _scanBtn.addEventListener('click', _runScan);
    }
  
    return Object.freeze({ init });
  
  })();