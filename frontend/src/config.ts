// Single source of truth for API base URL
// CRA uses REACT_APP_* env vars

const apiBaseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';

export { apiBaseUrl };


