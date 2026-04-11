const ApiService = (function () {
    'use strict';


    async function _get(path) {
        const url = API_ENDPOINTS.base + path;

        const response = await fetch(url);

        if (!response.ok) {
            throw new ApiError(
                'HTTP ' + response.status + ' for ' + url,
                response.status,
                url
            );
        }

        return response.json();
    }


    // fetches full company list
    async function fetchCompanyList() {
        try {
            const data = await _get(API_ENDPOINTS.companyList);
            return data;
        } catch (error) {
            console.error('[ApiService] Error fetching company list:', error);
            throw error;
        }
    }


    // fetches detail for a single company by company ID
    async function fetchCompanyDetail(id) {
        try {
            const data = await _get(API_ENDPOINTS.companyDetail + '/' + id);
            return data;
        } catch (error) {
            if(error.isApiError && error.status === 404) return null;  // return null if company not found
            console.error('[ApiService] Error fetching company detail:', id, error.message);
            throw error;
        }
    }


    // fetches market indices data
    async function fetchIndices() {
        try {
            const data = await _get(API_ENDPOINTS.indices);
            return data;
        } catch (error) {
            console.error('[ApiService] Error fetching indices:', error);
            throw error;
        }
    }


    // fetches top gainers
    async function fetchGainers() {
        try {
            const data = await _get(API_ENDPOINTS.gainers);
            return data;
        } catch (error) {
            console.error('[ApiService] Error fetching gainers:', error);
            throw error;
        }
    }


    // fetches top losers
    async function fetchLosers() {
        try {
            const data = await _get(API_ENDPOINTS.losers);
            return data;
        } catch (error) {
            console.error('[ApiService] Error fetching losers:', error);
            throw error;
        }
    }


    return Object.freeze({
        fetchCompanyList,
        fetchCompanyDetail,
        fetchIndices,
        fetchGainers,
        fetchLosers,
    });


})();  