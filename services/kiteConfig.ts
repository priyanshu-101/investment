// Kite Connect Configuration
export const KITE_CONFIG = {
  // API credentials from your Kite Connect app
  API_KEY: 'nwyt5khxhibugawu',
  API_SECRET: 'gl8ji45fa4fnxqg413gycli74whqzpvk',
  
  // URLs
  BASE_URL: 'https://api.kite.trade',
  LOGIN_URL: 'https://kite.zerodha.com/connect/login',
  
  // Redirect URL (should match the one in your Kite app settings)
  REDIRECT_URL: 'https://auth.expo.io/@prynsh10/investment',
  
  // Request token will be obtained after user login
  REQUEST_TOKEN: '', // This will be set dynamically after OAuth
  
  // Access token will be generated after successful authentication
  ACCESS_TOKEN: '', // This will be stored securely after login
};

// Kite Connect API endpoints
export const KITE_ENDPOINTS = {
  // Authentication
  TOKEN_EXCHANGE: '/session/token',
  LOGOUT: '/session/token',
  
  // User data
  PROFILE: '/user/profile',
  MARGINS: '/user/margins',
  
  // Portfolio
  POSITIONS: '/portfolio/positions',
  HOLDINGS: '/portfolio/holdings',
  
  // Orders
  ORDERS: '/orders',
  TRADES: '/trades',
  
  // Market data
  QUOTE: '/quote',
  LTP: '/quote/ltp',
  OHLC: '/quote/ohlc',
  
  // Historical data
  HISTORICAL: '/instruments/historical',
  
  // Instruments
  INSTRUMENTS: '/instruments',
  
  // Market depth
  MARKET_DEPTH: '/quote/ohlc',
};

// Trading constants
export const TRADING_CONSTANTS = {
  EXCHANGE: {
    NSE: 'NSE',
    BSE: 'BSE',
    NFO: 'NFO',
    CDS: 'CDS',
    BFO: 'BFO',
    MCX: 'MCX',
  },
  
  PRODUCT: {
    MIS: 'MIS', // Margin Intraday Squareoff
    CNC: 'CNC', // Cash and Carry
    NRML: 'NRML', // Normal
  },
  
  ORDER_TYPE: {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    SL: 'SL', // Stop Loss
    SL_M: 'SL-M', // Stop Loss Market
  },
  
  TRANSACTION_TYPE: {
    BUY: 'BUY',
    SELL: 'SELL',
  },
  
  VALIDITY: {
    DAY: 'DAY',
    IOC: 'IOC', // Immediate or Cancel
  },
  
  VARIETY: {
    REGULAR: 'regular',
    AMO: 'amo', // After Market Order
    CO: 'co', // Cover Order
    ICEBERG: 'iceberg',
  },
};