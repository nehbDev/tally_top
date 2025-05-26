// apiConfig.js
const BASE_URL = 'http://192.168.1.21:8000/api';

// Function to generate full API URL by appending the endpoint
export const getApiUrl = (endpoint) => `${BASE_URL}/${endpoint}`;