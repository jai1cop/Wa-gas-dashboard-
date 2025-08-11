const BASE_URL = 'https://gbbwa.aemo.com.au/api/v1';

export const fetchGasData = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
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
