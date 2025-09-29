# Market Data API Integration

This project includes a comprehensive market data integration that fetches live Indian stock market indices data from multiple API sources.

## Features

- ✅ **Live Market Data**: Real-time Indian market indices (NIFTY 50, SENSEX, etc.)
- ✅ **Multiple API Sources**: Yahoo Finance, Alpha Vantage, Twelve Data, Finnhub
- ✅ **Auto-refresh**: Configurable refresh intervals (15s, 30s, 60s)
- ✅ **Market Status**: Live market open/close status
- ✅ **Fallback System**: Graceful degradation with simulated data
- ✅ **Error Handling**: Comprehensive error handling and retry mechanisms
- ✅ **Offline Support**: Cached data and offline indicators
- ✅ **Indian Market Focus**: IST timezone and Indian market hours

## API Sources

### 1. Yahoo Finance (Free, No API Key Required) ⭐ Recommended
- **Pros**: Free, no registration required, reliable
- **Cons**: Rate limits, no official API
- **Status**: Primary data source

### 2. Alpha Vantage (Free Tier Available)
- **Free Tier**: 5 calls/minute, 500 calls/day
- **Get API Key**: [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- **Status**: Fallback source

### 3. Twelve Data (Free Tier Available)
- **Free Tier**: 800 calls/day
- **Get API Key**: [twelvedata.com](https://twelvedata.com/pricing)
- **Status**: Fallback source

### 4. Finnhub (Free Tier Available)
- **Free Tier**: 60 calls/minute
- **Get API Key**: [finnhub.io](https://finnhub.io/pricing)
- **Status**: Future integration

## Setup Instructions

### 1. Basic Setup (Using Free Yahoo Finance)
No configuration needed! The app works out of the box with Yahoo Finance data.

### 2. Enhanced Setup (With API Keys for Better Reliability)

1. **Get Free API Keys** (Optional but recommended):
   ```bash
   # Alpha Vantage (Free)
   Visit: https://www.alphavantage.co/support/#api-key
   
   # Twelve Data (Free)
   Visit: https://twelvedata.com/pricing
   ```

2. **Configure API Keys**:
   Edit `config/marketApi.config.ts`:
   ```typescript
   export const MARKET_API_CONFIG = {
     ALPHA_VANTAGE_API_KEY: 'your-alpha-vantage-key-here',
     TWELVE_DATA_API_KEY: 'your-twelve-data-key-here',
     // ... other config
   };
   ```

3. **Restart the app** to apply changes.

## Usage

### Basic Usage (IndicesSlider Component)
```tsx
import { IndicesSlider } from '@/components/indices-slider';

export function YourScreen() {
  return (
    <View>
      <IndicesSlider />
    </View>
  );
}
```

### Advanced Usage (useMarketData Hook)
```tsx
import { useMarketData } from '@/hooks/useMarketData';

export function CustomMarketComponent() {
  const {
    data,
    loading,
    error,
    isMarketOpen,
    refreshData,
  } = useMarketData({
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    symbols: ['NIFTY 50', 'SENSEX'], // Optional: specific indices
  });

  return (
    <View>
      {data.map(index => (
        <Text key={index.name}>
          {index.name}: {index.value} ({index.percent})
        </Text>
      ))}
    </View>
  );
}
```

## Configuration Options

### Refresh Intervals
```typescript
REFRESH_INTERVALS: {
  FAST: 15000,    // 15 seconds - for active trading
  NORMAL: 30000,  // 30 seconds - default
  SLOW: 60000,    // 1 minute - for background updates
}
```

### Market Hours (IST)
```typescript
MARKET_HOURS: {
  OPEN: { hour: 9, minute: 15 },   // 9:15 AM IST
  CLOSE: { hour: 15, minute: 30 }, // 3:30 PM IST
  TIMEZONE: 'Asia/Kolkata',
}
```

### Features Toggle
```typescript
FEATURES: {
  AUTO_REFRESH: true,
  BACKGROUND_UPDATES: true,
  ERROR_RETRY: true,
  MARKET_STATUS: true,
}
```

## Supported Indices

- **NIFTY 50** (^NSEI)
- **SENSEX** (^BSESN)
- **NIFTY BANK** (^NSEBANK)
- **NIFTY IT** (^CNXIT)
- **NIFTY AUTO** (^CNXAUTO)
- **NIFTY PHARMA** (^CNXPHARMA)
- **NIFTY FMCG** (^CNXFMCG)
- **NIFTY METAL** (^CNXMETAL)

## File Structure

```
services/
  ├── marketDataApi.ts          # Main API service
  └── kiteConnect.ts           # Kite Connect integration

hooks/
  ├── useMarketData.ts         # Market data React hook
  └── useKiteConnect.ts        # Kite Connect hook

config/
  └── marketApi.config.ts      # API configuration

components/
  ├── indices-slider.tsx       # Main indices display component
  ├── market-data-status.tsx   # API status indicator
  └── kite-connect-login.tsx   # Kite Connect auth component
```

## Troubleshooting

### Common Issues

1. **"Using Demo Data" Status**
   - This is normal when no API keys are configured
   - The app uses simulated data that updates every refresh
   - Add API keys for live data

2. **API Rate Limits**
   - Free tiers have rate limits
   - The app automatically handles this with fallback APIs
   - Consider upgrading API plans for heavy usage

3. **Network Errors**
   - The app gracefully handles network issues
   - Data is cached for offline viewing
   - Pull to refresh when connection is restored

4. **Market Hours**
   - Live data availability depends on market hours
   - Outside market hours, shows last available data
   - Market status indicator shows current state

### Debug Mode

Enable debug logging by setting:
```typescript
// In marketDataApi.ts
console.log('Market data fetch result:', data);
```

## Performance Optimizations

1. **Background Updates**: Pauses when app is in background
2. **Caching**: Reduces redundant API calls
3. **Smart Refresh**: Only refreshes when necessary
4. **Error Recovery**: Automatic retry with exponential backoff

## Future Enhancements

- [ ] Push notifications for market alerts
- [ ] Watchlist functionality
- [ ] Historical data charts
- [ ] Portfolio tracking integration
- [ ] More international markets
- [ ] WebSocket real-time updates
- [ ] Technical indicators

## Support

For issues or questions:
1. Check the API status indicator in the app
2. Verify your API keys in the config file
3. Check network connectivity
4. Review console logs for error details

---

**Note**: This integration prioritizes reliability over speed, using multiple fallback APIs to ensure users always have access to market data, even if some APIs are down or rate-limited.