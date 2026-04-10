
const IndexedDBService = (function () {
    'use strict';

    let _db = null;


    /**
     * Opens the database.
     * Creates object stores from DB_CONFIG on first run or version bump.
     * Returns the existing connection if already open.
     *
     * @returns {Promise<IDBDatabase>}
     */
    function open() {

        return new Promise(function (resolve, reject) {

            // returning existing connection if already open
            if (_db) {
                resolve(_db);
                return;
            }

            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);


            request.onerror = function (event) {
                console.error('[IndexedDBService] Failed to open DB:', event.target.error);
                reject(event.target.error);
            };


            // Runs on first open or version bump — create/update schema
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                const oldVer = event.oldVersion;

                console.log(
                    '[IndexedDBService] Schema upgrade: v' + oldVer
                    + ' → v' + DB_CONFIG.version
                );

                Object.values(DB_CONFIG.stores).forEach(function (storeDef) {
                    if (db.objectStoreNames.contains(storeDef.name)) return;

                    db.createObjectStore(storeDef.name, { keyPath: storeDef.keyPath });

                    console.log('[IndexedDBService] Created store:', storeDef.name);

                    // Index creation — empty array for now, add entries to DB_CONFIG when ready
                    storeDef.indexes.forEach(function (idx) {
                        // store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
                    });
                });
            };

            request.onsuccess = function (event) {
                _db = event.target.result;

                // If another tab triggers a version upgrade, close this connection cleanly
                _db.onversionchange = function () {
                    _db.close();
                    _db = null;
                    console.warn('[IndexedDBService] Version change detected — connection closed.');
                };

                console.log('[IndexedDBService] DB opened successfully:', DB_CONFIG.name);
                resolve(_db);
            };


            request.onblocked = function () {
                console.warn('[IndexedDBService] DB open blocked — close other tabs and retry.');
            };

        });
    }


    async function getALL(storeName) {

        const db = await open();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        

        return new Promise(function (resolve, reject) {
            const request = store.getAll();

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                console.error('[IndexedDBService] Fetch ALL error:', event.target.error);
                reject(event.target.error);
            };
        });
    }


    async function getById(storeName, id) {
        const db = await open();
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        return new Promise(function (resolve, reject) {
            const request = store.get(id);

            request.onsuccess = function (event) {
                resolve(event.target.result || null);   // return null if not found
            };

            request.onerror = function (event) {
                console.error('[IndexedDBService] Fetch by Id error:', event.target.error);
                reject(event.target.error);
            };
        });
    }


    async function upsert(storeName, value) {
        const db = await open();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.put(value);   // put() will add or update based on keyPath

        return new Promise(function (resolve, reject) {
            tx.oncomplete = function () {
                resolve(request.result);
            };

            tx.onerror = function () {
                console.error('[IndexedDBService] Upsert error:', tx.error);
                reject(tx.error);
            };

            tx.onabort = function () {
                console.error('[IndexedDBService] Upsert transaction aborted:', tx.error);
                reject(tx.error);
            };
        });
    }


    async function upsertBulk(storeName, values) {
        const db = await open();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        values.forEach(value => store.put(value));

        return new Promise(function (resolve, reject) {
            tx.oncomplete = function () {
                resolve();
            };

            tx.onerror = function () {
                console.error('[IndexedDBService] Upsert many error:', tx.error);
                reject(tx.error);
            };

            tx.onabort = function () {
                console.error('[IndexedDBService] Upsert many transaction aborted:', tx.error);
                reject(tx.error);
            };
        });
    }


    async function deleteById(storeName, id) {
        const db = await open();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.delete(id);

        return new Promise(async function (resolve, reject) {

            tx.oncomplete = function () {
                resolve();
            };

            tx.onerror = function () {
                console.error('[IndexedDBService] Delete error:', tx.error);
                reject(tx.error);
            }

            tx.onabort = function () {
                console.error('[IndexedDBService] Delete transaction aborted:', tx.error);
                reject(tx.error);
            }

        });
    }

    
    async function clearStore(storeName) {
        const db = await open();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        store.clear();

        return new Promise(function (resolve, reject) {
            tx.oncomplete = function () {
                resolve();
            };

            tx.onerror = function () {
                console.error('[IndexedDBService] Clear store error:', tx.error);
                reject(tx.error);
            }

            tx.onabort = function () {
                console.error('[IndexedDBService] Clear store transaction aborted:', tx.error);
                reject(tx.error);
            }

        });
    }


    return Object.freeze({
        open,
        getALL,
        getById,
        upsert,
        upsertBulk,
        deleteById,
        clearStore,
    });


}());