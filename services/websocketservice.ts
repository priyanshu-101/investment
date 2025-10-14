import { kiteConnect } from './kiteConnect';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(): Promise<void> {
    try {
      const isAuth = await kiteConnect.isAuthenticated();
      if (!isAuth) {
        console.log('Not authenticated with Zerodha, skipping WebSocket connection');
        return;
      }

      const wsUrl = await kiteConnect.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected for real-time data');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.handleReconnect();
    }
  }

  private onOpen(): void {
    // Subscribe to all registered instruments
    const allInstruments = Array.from(this.subscribers.keys());
    if (allInstruments.length > 0) {
      this.subscribeToInstruments(allInstruments);
    }
  }

  private handleMessage(data: any): void {
    if (data.instrument_token) {
      const callbacks = this.subscribers.get(data.instrument_token.toString());
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(instrument: string, callback: (data: any) => void): void {
    if (!this.subscribers.has(instrument)) {
      this.subscribers.set(instrument, new Set());
    }
    this.subscribers.get(instrument)!.add(callback);

    // If connected, subscribe immediately
    if (this.isConnected) {
      this.subscribeToInstruments([instrument]);
    }
  }

  unsubscribe(instrument: string, callback: (data: any) => void): void {
    const callbacks = this.subscribers.get(instrument);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(instrument);
        
        // Unsubscribe from WebSocket
        if (this.isConnected && this.ws) {
          this.ws.send(JSON.stringify({
            a: 'unsubscribe',
            v: [instrument]
          }));
        }
      }
    }
  }

  private subscribeToInstruments(instruments: string[]): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        a: 'subscribe',
        v: instruments
      }));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscribers.clear();
  }

  isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();