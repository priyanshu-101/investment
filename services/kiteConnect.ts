import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { KITE_CONFIG, KITE_ENDPOINTS, TRADING_CONSTANTS } from './kiteConfig';

export interface KiteUser {
  user_id: string;
  user_name: string;
  user_shortname: string;
  email: string;
  user_type: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  avatar_url: string;
}

export interface KiteMargin {
  enabled: boolean;
  net: number;
  available: {
    adhoc_margin: number;
    cash: number;
    opening_balance: number;
    live_balance: number;
    collateral: number;
    intraday_payin: number;
  };
  utilised: {
    debits: number;
    exposure: number;
    m2m_realised: number;
    m2m_unrealised: number;
    option_premium: number;
    payout: number;
    span: number;
    holding_sales: number;
    tournament: number;
    liquid_collateral: number;
    stock_collateral: number;
  };
}

export interface KitePosition {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: number;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
  buy_quantity: number;
  buy_price: number;
  buy_value: number;
  sell_quantity: number;
  sell_price: number;
  sell_value: number;
  day_buy_quantity: number;
  day_buy_price: number;
  day_buy_value: number;
  day_sell_quantity: number;
  day_sell_price: number;
  day_sell_value: number;
}

export interface KiteHolding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  quantity: number;
  realised_quantity: number;
  t1_quantity: number;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface KiteOrder {
  order_id: string;
  exchange_order_id: string;
  parent_order_id: string;
  status: string;
  status_message: string;
  order_timestamp: string;
  exchange_update_timestamp: string;
  exchange_timestamp: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  order_type: string;
  transaction_type: string;
  validity: string;
  product: string;
  quantity: number;
  disclosed_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  market_protection: number;
  meta: any;
  tag: string;
}

export interface KiteQuote {
  instrument_token: number;
  timestamp: string;
  last_price: number;
  last_quantity: number;
  last_trade_time: string;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  net_change: number;
  lower_circuit_limit: number;
  upper_circuit_limit: number;
  oi: number;
  oi_day_high: number;
  oi_day_low: number;
  depth: {
    buy: { quantity: number; price: number; orders: number }[];
    sell: { quantity: number; price: number; orders: number }[];
  };
}

export interface PlaceOrderParams {
  variety: string;
  exchange: string;
  tradingsymbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  product: string;
  order_type: string;
  price?: number;
  trigger_price?: number;
  validity?: string;
  disclosed_quantity?: number;
  squareoff?: number;
  stoploss?: number;
  trailing_stoploss?: number;
  tag?: string;
}

class KiteConnectService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: KITE_CONFIG.BASE_URL,
      headers: {
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Add request interceptor to include auth headers
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `token ${KITE_CONFIG.API_KEY}:${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Kite API Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAccessToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Generate login URL
  generateLoginURL(): string {
    return `${KITE_CONFIG.LOGIN_URL}?api_key=${KITE_CONFIG.API_KEY}&v=3`;
  }

  // Exchange request token for access token
  async generateSession(requestToken: string): Promise<{ access_token: string; public_token: string }> {
    try {
      const crypto = require('crypto');
      const checksum = crypto
        .createHash('sha256')
        .update(`${KITE_CONFIG.API_KEY}${requestToken}${KITE_CONFIG.API_SECRET}`)
        .digest('hex');

      const response: AxiosResponse = await axios.post(
        `${KITE_CONFIG.BASE_URL}${KITE_ENDPOINTS.TOKEN_EXCHANGE}`,
        new URLSearchParams({
          api_key: KITE_CONFIG.API_KEY,
          request_token: requestToken,
          checksum: checksum,
        }),
        {
          headers: {
            'X-Kite-Version': '3',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, public_token } = response.data.data;
      await this.setAccessToken(access_token);
      
      return { access_token, public_token };
    } catch (error) {
      console.error('Error generating session:', error);
      throw error;
    }
  }

  private async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
    await AsyncStorage.setItem('kite_access_token', token);
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }
    
    const token = await AsyncStorage.getItem('kite_access_token');
    this.accessToken = token;
    return token;
  }

  private async clearAccessToken(): Promise<void> {
    this.accessToken = null;
    await AsyncStorage.removeItem('kite_access_token');
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.delete(KITE_ENDPOINTS.LOGOUT);
      await this.clearAccessToken();
    } catch (error) {
      console.error('Error during logout:', error);
      await this.clearAccessToken();
    }
  }

  async getProfile(): Promise<KiteUser> {
    try {
      const response = await this.axiosInstance.get(KITE_ENDPOINTS.PROFILE);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async getMargins(segment?: string): Promise<KiteMargin | Record<string, KiteMargin>> {
    try {
      const url = segment ? `${KITE_ENDPOINTS.MARGINS}/${segment}` : KITE_ENDPOINTS.MARGINS;
      const response = await this.axiosInstance.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching margins:', error);
      throw error;
    }
  }

  async getPositions(): Promise<{ net: KitePosition[]; day: KitePosition[] }> {
    try {
      const response = await this.axiosInstance.get(KITE_ENDPOINTS.POSITIONS);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  async getHoldings(): Promise<KiteHolding[]> {
    try {
      const response = await this.axiosInstance.get(KITE_ENDPOINTS.HOLDINGS);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching holdings:', error);
      throw error;
    }
  }

  async getOrders(): Promise<KiteOrder[]> {
    try {
      const response = await this.axiosInstance.get(KITE_ENDPOINTS.ORDERS);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderHistory(orderId: string): Promise<KiteOrder[]> {
    try {
      const response = await this.axiosInstance.get(`${KITE_ENDPOINTS.ORDERS}/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  async placeOrder(params: PlaceOrderParams): Promise<{ order_id: string }> {
    try {
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await this.axiosInstance.post(
        `${KITE_ENDPOINTS.ORDERS}/${params.variety}`,
        formData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  async modifyOrder(orderId: string, params: Partial<PlaceOrderParams>): Promise<{ order_id: string }> {
    try {
      const formData = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const response = await this.axiosInstance.put(
        `${KITE_ENDPOINTS.ORDERS}/${params.variety}/${orderId}`,
        formData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error modifying order:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, variety: string): Promise<{ order_id: string }> {
    try {
      const response = await this.axiosInstance.delete(
        `${KITE_ENDPOINTS.ORDERS}/${variety}/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  // Get quote
  async getQuote(instruments: string[]): Promise<Record<string, KiteQuote>> {
    try {
      const params = new URLSearchParams();
      instruments.forEach(instrument => params.append('i', instrument));
      
      const response = await this.axiosInstance.get(`${KITE_ENDPOINTS.QUOTE}?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  }

  // Get LTP (Last Traded Price)
  async getLTP(instruments: string[]): Promise<Record<string, { last_price: number }>> {
    try {
      const params = new URLSearchParams();
      instruments.forEach(instrument => params.append('i', instrument));
      
      const response = await this.axiosInstance.get(`${KITE_ENDPOINTS.LTP}?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching LTP:', error);
      throw error;
    }
  }

  // Get OHLC
  async getOHLC(instruments: string[]): Promise<Record<string, any>> {
    try {
      const params = new URLSearchParams();
      instruments.forEach(instrument => params.append('i', instrument));
      
      const response = await this.axiosInstance.get(`${KITE_ENDPOINTS.OHLC}?${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching OHLC:', error);
      throw error;
    }
  }

  // Get historical data
  async getHistoricalData(
    instrumentToken: string,
    interval: string,
    fromDate: string,
    toDate: string,
    continuous?: boolean,
    oi?: boolean
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        interval,
        from: fromDate,
        to: toDate,
        ...(continuous && { continuous: '1' }),
        ...(oi && { oi: '1' }),
      });

      const response = await this.axiosInstance.get(
        `${KITE_ENDPOINTS.HISTORICAL}/${instrumentToken}/${interval}?${params}`
      );
      return response.data.data.candles;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Get instruments
  async getInstruments(exchange?: string): Promise<any[]> {
    try {
      const url = exchange ? `${KITE_ENDPOINTS.INSTRUMENTS}/${exchange}` : KITE_ENDPOINTS.INSTRUMENTS;
      const response = await this.axiosInstance.get(url);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching instruments:', error);
      throw error;
    }
  }
}

export const kiteConnect = new KiteConnectService();
export { TRADING_CONSTANTS };
export default KiteConnectService;