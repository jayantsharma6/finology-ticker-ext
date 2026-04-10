const ApiService = (function () {
    'use strict';


    async function _get(path) {
        const url = API_ENDPOINTS.base + path;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                '[ApiService] HTTP ' + response.status + ' for ' + url
            );
        }

        return response.json();
    }


    // fetches full company list
    async function fetchCompanyList() {
        return _get(API_ENDPOINTS.companyList);
    }


    // fetches detail for a single company by company ID
    async function fetchCompanyDetail(id) {
        return _get(API_ENDPOINTS.companyDetail + '/' + id);
    }


    // fetches market indices data
    async function fetchIndices() {
        return _get(API_ENDPOINTS.indices);
    }


    // fetches top gainers
    async function fetchGainers() {
        return _get(API_ENDPOINTS.gainers);
    }


    // fetches top losers
    async function fetchLosers() {
        return _get(API_ENDPOINTS.losers);
    }


    return Object.freeze({
        fetchCompanyList,
        fetchCompanyDetail,
        fetchIndices,
        fetchGainers,
        fetchLosers,
    });


})();  