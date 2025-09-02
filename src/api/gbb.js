// Use relative path so Netlify redirect can proxy requests in production
// and avoid CORS issues when loading data
const BASE_URL = '/api';

export const fetchGasData = async (endpoint, params = {}) => {
  try {
    // Construct URL relative to current origin
    const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gas data:', error);
    throw error;
  }
};

export const endpoints = {
  current: '/current',
  forecast: '/forecast',
  storage: '/storage',
  production: '/production',
  demand: '/demand'
};
