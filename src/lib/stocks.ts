export interface SupportedStock {
  ticker: string
  name: string
}

export const SUPPORTED_STOCKS: SupportedStock[] = [
  { ticker: 'AAPL', name: 'Apple Inc' },
  { ticker: 'NVDA', name: 'Nvidia' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN', name: 'Amazon' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'JPM', name: 'JPMorgan Chase' },
]
