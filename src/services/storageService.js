/**
 * StorageService
 *
 * Single abstraction over chrome.storage.local.
 * Nothing outside this file calls chrome.storage directly.
 *
 * All methods return Promises so callers can use async/await cleanly.
 * If chrome.storage is unavailable (e.g. unit test env), methods fail
 * gracefully with null rather than throwing.
 */
const StorageService = (function () {
  'use strict';

  /**
   * Retrieve a value by key.
   * Returns the value, or null if not found.
   */
  async function get(key) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get([key], function (result) {
          if (chrome.runtime.lastError) {
            console.warn('[StorageService] get error:', chrome.runtime.lastError.message);
            resolve(null);
            return;
          }
          resolve(result[key] !== undefined ? result[key] : null);
        });
      } catch (err) {
        console.warn('[StorageService] get failed:', err);
        resolve(null);
      }
    });
  }

  /**
   * Store a value by key.
   * Returns true on success, false on failure.
   */
  async function set(key, value) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.set({ [key]: value }, function () {
          if (chrome.runtime.lastError) {
            console.warn('[StorageService] set error:', chrome.runtime.lastError.message);
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (err) {
        console.warn('[StorageService] set failed:', err);
        resolve(false);
      }
    });
  }

  /**
   * Remove a value by key.
   * Returns true on success, false on failure.
   */
  async function remove(key) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.remove([key], function () {
          if (chrome.runtime.lastError) {
            console.warn('[StorageService] remove error:', chrome.runtime.lastError.message);
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (err) {
        console.warn('[StorageService] remove failed:', err);
        resolve(false);
      }
    });
  }

  /**
   * Clear all extension storage.
   * Use with caution — wipes everything.
   */
  async function clearAll() {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.clear(function () {
          if (chrome.runtime.lastError) {
            console.warn('[StorageService] clearAll error:', chrome.runtime.lastError.message);
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (err) {
        console.warn('[StorageService] clearAll failed:', err);
        resolve(false);
      }
    });
  }

  return Object.freeze({
    get,
    set,
    remove,
    clearAll,
  });

})();