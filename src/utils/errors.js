function ApiError(message, status, url) {
    this.message = message;
    this.status = status || null;
    this.url = url || null;
    this.isApiError = true;
    this.name = 'ApiError';
}