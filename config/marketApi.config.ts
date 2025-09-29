// Market Data API Configuration
// Add your API keys here for live data

export const MARKET_API_CONFIG = {
  // Alpha Vantage (Free tier: 5 calls per minute, 500 calls per day)
  // Get your free API key from: https://www.alphavantage.co/support/#api-key
  ALPHA_VANTAGE_API_KEY: 'demo', // Replace with your API key
  
  // Twelve Data (Free tier: 800 calls per day)
  // Get your free API key from: https://twelvedata.com/pricing
  TWELVE_DATA_API_KEY: 'demo', // Replace with your API key
  
  // Finnhub (Free tier: 60 calls per minute)
  // Get your free API key from: https://finnhub.io/pricing
  FINNHUB_API_KEY: 'demo', // Replace with your API key
  
  // Refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    FAST: 3000,     // 3 seconds - for very active trading
    NORMAL: 5000,   // 5 seconds - default (faster)
    SLOW: 10000,    // 10 seconds - for background updates
  },
  
  // Market timing (IST - Indian Standard Time)
  MARKET_HOURS: {
    OPEN: { hour: 9, minute: 15 },   // 9:15 AM IST
    CLOSE: { hour: 15, minute: 30 }, // 3:30 PM IST
    TIMEZONE: 'Asia/Kolkata',
  },
  
  // Enable/disable features
  FEATURES: {
    AUTO_REFRESH: true,
    BACKGROUND_UPDATES: true,
    ERROR_RETRY: true,
    MARKET_STATUS: true,
    NOTIFICATIONS: false, // For future implementation
  },
  
  // API endpoints priority order (first successful response wins)
  API_PRIORITY: [
    'yahoo',      // Free, no API key required
    'twelvedata', // Free tier available
    'alphavantage', // Free tier available
    'finnhub',    // Free tier available
  ],
  
  // Fallback options
  FALLBACK: {
    USE_SIMULATED_DATA: true, // Use simulated data when all APIs fail
    CACHE_DURATION: 300000,   // 5 minutes - how long to cache data
  },
};

// Helper function to check if API keys are configured
export const checkApiConfiguration = () => {
  const status = {
    alphavantage: MARKET_API_CONFIG.ALPHA_VANTAGE_API_KEY !== 'demo',
    twelvedata: MARKET_API_CONFIG.TWELVE_DATA_API_KEY !== 'demo',
    finnhub: MARKET_API_CONFIG.FINNHUB_API_KEY !== 'demo',
  };
  
  const configuredApis = Object.values(status).filter(Boolean).length;
  const totalApis = Object.keys(status).length;
  
  return {
    ...status,
    isFullyConfigured: configuredApis === totalApis,
    configuredCount: configuredApis,
    totalCount: totalApis,
    recommendation: configuredApis === 0 
      ? 'Configure at least one API key for live data'
      : configuredApis < totalApis 
        ? 'Consider adding more API keys for better reliability'
        : 'All API keys configured!',
  };
};

export default MARKET_API_CONFIG;