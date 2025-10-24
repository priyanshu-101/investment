export interface OptionChainStrike {
  strikePrice: number;
  callOI: number;
  callVolume: number;
  callIV: number;
  callLTP: number;
  putLTP: number;
  putIV: number;
  putVolume: number;
  putOI: number;
  bidAsk: string;
}

export interface OptionChainData {
  underlyingSymbol: string;
  underlyingPrice: number;
  expiryDate: string;
  timestamp: string;
  strikes: OptionChainStrike[];
}

class OptionChainService {
  private readonly strikeMultipliers = {
    'NIFTY 50': 100,
    'BANK NIFTY': 100,
    'FINNIFTY': 100,
    'SENSEX': 100,
  };

  private generateStrike(
    basePrice: number,
    strikeOffset: number,
    volatility: number
  ): OptionChainStrike {
    const strikePrice = Math.round((basePrice + strikeOffset) / 50) * 50;
    
    const baseCallLTP = Math.max(basePrice - strikePrice, 0) + Math.random() * 50;
    const basePutLTP = Math.max(strikePrice - basePrice, 0) + Math.random() * 50;
    
    const callVolatility = 15 + volatility + (Math.random() - 0.5) * 5;
    const putVolatility = 15 + volatility + (Math.random() - 0.5) * 5;

    return {
      strikePrice,
      callOI: Math.floor(100000 + Math.random() * 500000),
      callVolume: Math.floor(5000 + Math.random() * 50000),
      callIV: callVolatility,
      callLTP: Math.max(0, baseCallLTP),
      putLTP: Math.max(0, basePutLTP),
      putIV: putVolatility,
      putVolume: Math.floor(5000 + Math.random() * 50000),
      putOI: Math.floor(100000 + Math.random() * 500000),
      bidAsk: `${(baseCallLTP - 1).toFixed(2)}/${(baseCallLTP + 1).toFixed(2)}`,
    };
  }

  private getNextExpiryDate(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    if (daysUntilThursday === 0) {
      daysUntilThursday = 7;
    }

    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + daysUntilThursday);

    return expiryDate.toISOString().split('T')[0];
  }

  async getOptionChain(
    indexName: string,
    underlyingPrice: number
  ): Promise<OptionChainData> {
    const volatility = 18 + Math.random() * 8;
    const strikes: OptionChainStrike[] = [];

    const strikesRange = 10;
    for (let i = -strikesRange; i <= strikesRange; i++) {
      const strikeOffset = i * 100;
      strikes.push(this.generateStrike(underlyingPrice, strikeOffset, volatility));
    }

    strikes.sort((a, b) => a.strikePrice - b.strikePrice);

    return {
      underlyingSymbol: indexName,
      underlyingPrice,
      expiryDate: this.getNextExpiryDate(),
      timestamp: new Date().toISOString(),
      strikes,
    };
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 100000) {
      return (value / 100000).toFixed(2) + 'L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  formatPrice(value: number): string {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

export const optionChainService = new OptionChainService();
