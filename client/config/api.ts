// API Configuration
// Import API URL from environment variables
// @ts-ignore
import { API_URL } from 'react-native-dotenv';

// Get the API URL from .env file
const getApiUrl = () => {
  try {
    // Try to get the API_URL from the .env file
    if (API_URL) {
      return API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
    }
    // Fallback to the default URL if not found
    return 'https://expense-full-stack.vercel.app/api/';
  } catch (error) {
    console.error('Error loading API URL from .env:', error);
    return 'https://expense-full-stack.vercel.app/api/';
  }
};

// Set the base URL for the API
export const API_CONFIG = {
  // Base URL for the API
  BASE_URL: getApiUrl(),
  
  // Timeout in milliseconds
  TIMEOUT: 10000,
  
  // Headers to include in all requests
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;