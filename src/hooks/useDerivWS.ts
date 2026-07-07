/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Candle, SymbolInfo, TimeframeId } from '../types';

const SOCKET_URLS = [
  'wss://ws.derivws.com/websockets/v3?app_id=1089',
  'wss://ws.binaryws.com/websockets/v3?app_id=1089',
  'wss://ws.derivws.com/websockets/v3?app_id=36544',
  'wss://ws.binaryws.com/websockets/v3?app_id=36544',
  'wss://ws.derivws.com/websockets/v3?app_id=37075',
  'wss://ws.binaryws.com/websockets/v3?app_id=37075',
  'wss://ws.derivws.com/websockets/v3?app_id=31063',
  'wss://ws.binaryws.com/websockets/v3?app_id=31063',
  'wss://ws.derivws.com/websockets/v3?app_id=16303',
  'wss://ws.binaryws.com/websockets/v3?app_id=16303'
];

// Memory cache for instant candle loading
const globalCandleCache: Record<string, Candle[]> = {};

export const TIMEFRAMES = [
  { id: '1M', label: '1m', seconds: 60 },
  { id: '2M', label: '2m', seconds: 120 },
  { id: '5M', label: '5m', seconds: 300 },
  { id: '15M', label: '15m', seconds: 900 },
  { id: '30M', label: '30m', seconds: 1800 },
  { id: '1H', label: '1h', seconds: 3600 },
  { id: '4H', label: '4h', seconds: 14400 },
] as const;

export const STATIC_SYMBOLS: SymbolInfo[] = [
  // Volatility Indices
  { symbol: 'R_10', display_name: 'Volatility 10 Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: 'R_25', display_name: 'Volatility 25 Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: 'R_50', display_name: 'Volatility 50 Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: 'R_75', display_name: 'Volatility 75 Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: 'R_100', display_name: 'Volatility 100 Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ10V', display_name: 'Volatility 10 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ25V', display_name: 'Volatility 25 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ50V', display_name: 'Volatility 50 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ75V', display_name: 'Volatility 75 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ100V', display_name: 'Volatility 100 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ150V', display_name: 'Volatility 150 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ200V', display_name: 'Volatility 200 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ250V', display_name: 'Volatility 250 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },
  { symbol: '1HZ300V', display_name: 'Volatility 300 (1s) Index', market: 'synthetic_index', market_display_name: 'Derived Indices' },

  // Jump Indices
  { symbol: 'JD10', display_name: 'Jump 10 Index', market: 'synthetic_index', market_display_name: 'Derived Indices', submarket_display_name: 'Jump Indices' },
  { symbol: 'JD25', display_name: 'Jump 25 Index', market: 'synthetic_index', market_display_name: 'Derived Indices', submarket_display_name: 'Jump Indices' },
  { symbol: 'JD50', display_name: 'Jump 50 Index', market: 'synthetic_index', market_display_name: 'Derived Indices', submarket_display_name: 'Jump Indices' },
  { symbol: 'JD75', display_name: 'Jump 75 Index', market: 'synthetic_index', market_display_name: 'Derived Indices', submarket_display_name: 'Jump Indices' },
  { symbol: 'JD100', display_name: 'Jump 100 Index', market: 'synthetic_index', market_display_name: 'Derived Indices', submarket_display_name: 'Jump Indices' },

  // Crypto Pairs
  { symbol: 'BTCUSD', display_name: 'BTC/USD (Bitcoin)', market: 'cryptocurrency', market_display_name: 'Cryptocurrency' },
  { symbol: 'ETHUSD', display_name: 'ETH/USD (Ethereum)', market: 'cryptocurrency', market_display_name: 'Cryptocurrency' },
  { symbol: 'LTCUSD', display_name: 'LTC/USD (Litecoin)', market: 'cryptocurrency', market_display_name: 'Cryptocurrency' },
  { symbol: 'XRPUSD', display_name: 'XRP/USD (Ripple)', market: 'cryptocurrency', market_display_name: 'Cryptocurrency' },
  { symbol: 'BCHUSD', display_name: 'BCH/USD (Bitcoin Cash)', market: 'cryptocurrency', market_display_name: 'Cryptocurrency' },

  // Metals / Gold
  { symbol: 'frxXAUUSD', display_name: 'XAU/USD (Gold vs US Dollar)', market: 'forex', market_display_name: 'Commodities' },

  // Forex Pairs
  { symbol: 'frxEURUSD', display_name: 'EUR/USD (Euro vs US Dollar)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxGBPUSD', display_name: 'GBP/USD (Pound vs US Dollar)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxUSDJPY', display_name: 'USD/JPY (US Dollar vs Japanese Yen)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxAUDUSD', display_name: 'AUD/USD (Australian Dollar vs US Dollar)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxUSDCHF', display_name: 'USD/CHF (US Dollar vs Swiss Franc)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxUSDCAD', display_name: 'USD/CAD (US Dollar vs Canadian Dollar)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxEURJPY', display_name: 'EUR/JPY (Euro vs Japanese Yen)', market: 'forex', market_display_name: 'Forex' },
  { symbol: 'frxGBPJPY', display_name: 'GBP/JPY (Pound vs Japanese Yen)', market: 'forex', market_display_name: 'Forex' }
];

export function useDerivWS(
  selectedSymbol: string, 
  selectedTimeframe: TimeframeId,
  connectionSettings?: { customServer: string; customAppId: string }
) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>(STATIC_SYMBOLS);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const selectedSymbolRef = useRef(selectedSymbol);
  const selectedTimeframeRef = useRef(selectedTimeframe);
  const urlIndexRef = useRef(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const symbolsRef = useRef<SymbolInfo[]>(STATIC_SYMBOLS);

  const isConnectedRef = useRef(false);

  // Sync isConnected status to ref
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Compute active URLs based on current custom connection settings
  const getActiveUrls = useCallback(() => {
    const urls = [...SOCKET_URLS];
    if (connectionSettings?.customServer && connectionSettings?.customAppId) {
      const server = connectionSettings.customServer.trim().replace(/^wss?:\/\//, '');
      const appId = connectionSettings.customAppId.trim();
      if (server && appId) {
        // Prepend custom socket URL to the top so it is attempted first!
        urls.unshift(`wss://${server}/websockets/v3?app_id=${appId}`);
      }
    }
    return urls;
  }, [connectionSettings]);

  // Sync symbols state to ref to keep callback memoizations stable
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Update refs to prevent closure issues in async callbacks
  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
    selectedTimeframeRef.current = selectedTimeframe;
  }, [selectedSymbol, selectedTimeframe]);

  const subscribe = useCallback((symbol: string, timeframe: TimeframeId) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Determine subscribable symbol mapping (handles BTCUSD -> cryBTCUSD, XAUUSD -> frxXAUUSD)
    const getSubscribableSymbol = (rawSymbol: string) => {
      const symbolUpper = rawSymbol.toUpperCase();
      
      const exactMatch = symbolsRef.current.find(s => s.symbol.toUpperCase() === symbolUpper);
      if (exactMatch) return exactMatch.symbol;

      if (symbolUpper === 'BTCUSD' || symbolUpper === 'ETHUSD' || symbolUpper === 'LTCUSD') {
        const cryptoMatch = symbolsRef.current.find(s => s.symbol.toUpperCase() === `CRY${symbolUpper}`);
        if (cryptoMatch) return cryptoMatch.symbol;
      }

      if (symbolUpper === 'XAUUSD') {
        const goldMatch = symbolsRef.current.find(s => s.symbol.toUpperCase() === `FRXXAUUSD`);
        if (goldMatch) return goldMatch.symbol;
      }

      // Fallback for 6-letter currency pairs (e.g. EURUSD -> frxEURUSD)
      if (symbolUpper.length === 6 && !symbolUpper.startsWith('FRX')) {
        const forexMatch = symbolsRef.current.find(s => s.symbol.toUpperCase() === `FRX${symbolUpper}`);
        if (forexMatch) return forexMatch.symbol;
      }

      return rawSymbol;
    };

    const apiSymbol = getSubscribableSymbol(symbol);

    // Forget all existing subscriptions first
    ws.send(JSON.stringify({
      forget_all: ['candles', 'ohlc']
    }));

    const granularity = TIMEFRAMES.find(t => t.id === timeframe)?.seconds || 60;

    // Send history request & subscribe
    ws.send(JSON.stringify({
      ticks_history: apiSymbol,
      adjust_start_time: 1,
      count: 1000,
      end: 'latest',
      start: 1,
      style: 'candles',
      granularity: granularity,
      subscribe: 1
    }));
  }, []);

  const connect = useCallback(() => {
    // Clear any pending timers
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    const activeUrls = getActiveUrls();
    if (urlIndexRef.current >= activeUrls.length) {
      urlIndexRef.current = 0;
    }
    const currentUrl = activeUrls[urlIndexRef.current];
    console.log(`WebSocket: Connecting to ${currentUrl} (Index ${urlIndexRef.current}/${activeUrls.length})`);

    const ws = new WebSocket(currentUrl);
    socketRef.current = ws;

    // Set connection timeout (fallback to next URL if not connected in 3 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn(`WebSocket: Connection to ${currentUrl} timed out after 3s.`);
        setConnectionError(`Timeout connecting to ${currentUrl.split('/')[2].split('?')[0]}. Trying alternative server...`);
        // Move to next and retry
        urlIndexRef.current = (urlIndexRef.current + 1) % activeUrls.length;
        try {
          ws.close();
        } catch (e) {}
      }
    }, 3000);

    ws.onopen = () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      setIsConnected(true);
      setConnectionError(null);
      console.log(`WebSocket: Connected successfully to ${currentUrl}`);

      // 1. Fetch active symbols dynamically
      ws.send(JSON.stringify({
        active_symbols: 'brief',
        product_type: 'basic'
      }));

      // 2. Subscribe to current symbol & timeframe
      subscribe(selectedSymbolRef.current, selectedTimeframeRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle error payloads from the server
        if (data.error) {
          console.warn('Deriv API Error response:', data.error);
          setIsLoading(false); // Stop loader so the UI doesn't freeze in loader screen
          
          if (data.error.code === 'InvalidAppId' || data.error.code === 'EndpointError') {
            // Force immediate fallback if app_id is invalid or endpoint has issues
            urlIndexRef.current = (urlIndexRef.current + 1) % activeUrls.length;
            try {
              ws.close();
            } catch (e) {}
          } else {
            setConnectionError(`Asset Status: ${data.error.message || 'Selected asset is not active in this market'}`);
          }
          return;
        }

        // Handle Active Symbols
        if (data.msg_type === 'active_symbols' && data.active_symbols) {
          const fetched: SymbolInfo[] = data.active_symbols.map((sym: any) => ({
            symbol: sym.symbol,
            display_name: sym.display_name,
            market: sym.market,
            market_display_name: sym.market_display_name,
            submarket_display_name: sym.submarket_display_name,
            pip: sym.pip
          }));

          // Filter only relevant sections requested: Volatility Indices, Jump Indices, Crypto Pairs, Gold & Forex Pairs
          const filtered = fetched.filter((sym) => {
            const symName = sym.symbol.toUpperCase();
            const isVolatility = sym.market === 'synthetic_index' && (symName.includes('HZ') || symName.startsWith('R_'));
            const isJump = sym.market === 'synthetic_index' && symName.startsWith('JD');
            const isCrypto = sym.market === 'cryptocurrency';
            const isGold = symName === 'FRXXAUUSD' || symName === 'XAUUSD';
            const isForex = sym.market === 'forex' && symName.startsWith('FRX');
            return isVolatility || isJump || isCrypto || isGold || isForex;
          });

          // Merge with static symbols (ensuring uniqueness by symbol ID) to make it bulletproof
          if (filtered.length > 0) {
            const merged = [...filtered];
            STATIC_SYMBOLS.forEach((s) => {
              if (!merged.some((m) => m.symbol === s.symbol)) {
                merged.push(s);
              }
            });
            setSymbols(merged);
          }
        }

        // Handle Historical Candle Data
        if (data.msg_type === 'candles' && data.candles) {
          const historicalCandles: Candle[] = data.candles.map((c: any) => ({
            time: c.epoch,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close)
          }));
          setCandles(historicalCandles);
          setIsLoading(false);
          setConnectionError(null);

          // Save to local fast cache
          const cacheKey = `${selectedSymbolRef.current}_${selectedTimeframeRef.current}`;
          globalCandleCache[cacheKey] = historicalCandles;
        }

        // Handle Real-Time Candle Updates
        if (data.msg_type === 'ohlc' && data.ohlc) {
          const ohlc = data.ohlc;
          // Support matches for symbol, and translated crypto/gold/forex equivalents
          const selectedUpper = selectedSymbolRef.current.toUpperCase();
          const incomingUpper = ohlc.symbol.toUpperCase();
          const matchesSymbol = ohlc.symbol === selectedSymbolRef.current || 
                                incomingUpper === `CRY${selectedUpper}` ||
                                (selectedUpper === 'XAUUSD' && incomingUpper === 'FRXXAUUSD') ||
                                (selectedUpper === 'EURUSD' && incomingUpper === 'FRXEURUSD') ||
                                (incomingUpper === `FRX${selectedUpper}`) ||
                                (selectedUpper === `FRX${incomingUpper}`);
          
          const timeframeSeconds = TIMEFRAMES.find(t => t.id === selectedTimeframeRef.current)?.seconds || 60;
          if (matchesSymbol && Number(ohlc.granularity) === timeframeSeconds) {
            const newCandle: Candle = {
              time: Number(ohlc.open_time),
              open: parseFloat(ohlc.open),
              high: parseFloat(ohlc.high),
              low: parseFloat(ohlc.low),
              close: parseFloat(ohlc.close)
            };

            setCandles((prev) => {
              if (prev.length === 0) return [newCandle];
              const lastCandle = prev[prev.length - 1];

              let updated = prev;
              if (lastCandle.time === newCandle.time) {
                // Update latest candle
                updated = [...prev];
                updated[updated.length - 1] = newCandle;
              } else if (newCandle.time > lastCandle.time) {
                // Append new candle and cap size at 2000 to keep canvas rendering extremely performant
                updated = [...prev, newCandle];
                if (updated.length > 2000) {
                  updated = updated.slice(updated.length - 2000);
                }
              }

              // Update cache with the live stream candles
              const cacheKey = `${selectedSymbolRef.current}_${selectedTimeframeRef.current}`;
              globalCandleCache[cacheKey] = updated;

              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      console.error(`WebSocket Error on ${currentUrl}:`, err);
      setConnectionError(`Failed to connect to ${currentUrl.split('/')[2].split('?')[0]}. Trying fallback...`);
      setIsConnected(false);
      // Immediately increment the index so the next reconnect uses the next endpoint
      urlIndexRef.current = (urlIndexRef.current + 1) % activeUrls.length;
    };

    ws.onclose = () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      const wasConnected = isConnectedRef.current;
      setIsConnected(false);
      
      // Attempt reconnect after 500ms if falling back, or 3000ms if previously active
      const delay = wasConnected ? 3000 : 500;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [subscribe, getActiveUrls]);

  // Reconnect instantly when connection settings are changed
  useEffect(() => {
    urlIndexRef.current = 0;
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {}
    } else {
      connect();
    }
  }, [connectionSettings?.customServer, connectionSettings?.customAppId, connect]);

  // Sync on symbol or timeframe changes with instant memory caching
  useEffect(() => {
    const cacheKey = `${selectedSymbol}_${selectedTimeframe}`;
    const cached = globalCandleCache[cacheKey];
    if (cached && cached.length > 0) {
      setCandles(cached);
      setIsLoading(false); // Instant load - no loading screen!
    } else {
      setCandles([]);
      setIsLoading(true);
    }

    if (isConnected) {
      subscribe(selectedSymbol, selectedTimeframe);
    }
  }, [selectedSymbol, selectedTimeframe, isConnected, subscribe]);

  // Initial connect and teardown
  useEffect(() => {
    connect();
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
      }
    };
  }, [connect]);

  return {
    candles,
    symbols,
    isConnected,
    isLoading,
    connectionError
  };
}
