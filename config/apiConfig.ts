// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: {
    development: 'http://localhost:3000/api', // Your local dev server
    staging: 'https://staging-api.yourdomain.com', // Your staging server
    production: 'https://api.yourdomain.com', // Your production server
  },

  // Current environment
  ENVIRONMENT: 'development', // Change this based on your environment

  // API Endpoints  
  ENDPOINTS: {
    STRATEGIES: '/strategies',
    STRATEGY_PERFORMANCE: '/strategies/{id}/performance',
    STRATEGY_SUBSCRIBE: '/strategies/{id}/subscribe',
    USER_STRATEGIES: '/user/strategies',
    // Kite Connect endpoints
    KITE_POSITIONS: '/kite/positions',
    KITE_HOLDINGS: '/kite/holdings',
    KITE_ORDERS: '/kite/orders',
  },

  // API Keys (if needed)
  API_KEYS: {
    // Add your API keys here
    // TRADING_API_KEY: 'your-trading-api-key',
    // MARKET_DATA_KEY: 'your-market-data-key',
  },

  // Request timeout
  TIMEOUT: 30000, // 30 seconds

  // Enable/disable features
  FEATURES: {
    USE_MOCK_DATA: false, // Now using real API
    AUTO_REFRESH: true,
    REAL_TIME_UPDATES: false,
  }
};

// Helper to get current API base URL
export const getCurrentApiUrl = (): string => {
  return API_CONFIG.BASE_URL[API_CONFIG.ENVIRONMENT as keyof typeof API_CONFIG.BASE_URL];
};

// Helper to build endpoint URLs
export const buildEndpointUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = getCurrentApiUrl() + endpoint;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
};