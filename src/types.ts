/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TimeframeId = '1M' | '2M' | '5M' | '15M' | '30M' | '1H' | '4H';

export interface Timeframe {
  id: TimeframeId;
  label: string;
  seconds: number;
}

export interface SymbolInfo {
  symbol: string;
  display_name: string;
  market: string;
  market_display_name: string;
  submarket_display_name?: string;
  pip?: number;
}

export type DrawingType = 'cursor' | 'trend' | 'horizontal' | 'risk_reward';

export interface DrawingPoint {
  time: number;  // Anchored to the candle's epoch
  price: number; // Anchored to the price
}

export interface RiskRewardConfig {
  isLong: boolean;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  riskAmount: number; // Default risk or percentage
  lotSize: number;
}

export interface Drawing {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  riskReward?: RiskRewardConfig;
}

export interface ChartSettings {
  theme: 'dark' | 'light';
  candle: {
    upColor: string;
    downColor: string;
    wickUpColor: string;
    wickDownColor: string;
    borderUpColor: string;
    borderDownColor: string;
  };
  appearance: {
    backgroundColor: string;
    gridColor: string;
    gridStyle: 'solid' | 'dashed' | 'none';
    gridType: 'both' | 'horizontal' | 'vertical' | 'none';
    crosshairColor: string;
    crosshairStyle: 'dashed' | 'solid';
    priceLineColor: string;
  };
  indicators: {
    showMA: boolean;
    maPeriod: number;
    showGTA: boolean;
    gtaShortPeriod: number;
    gtaMidPeriod: number;
    gtaLongPeriod: number;
    gtaArrowOffset: number;
    showGTAEMAs: boolean; // Toggle EMA lines for GTA
    // Trendlines with Breaks Settings
    showTrendlinesWithBreaks: boolean;
    twbLength: number;
    twbSlopeMultiplier: number;
    twbSlopeMethod: 'atr' | 'manual';
    twbShowSignals: boolean; // Toggle breakout signals/arrows on/off
    // Smart Money Concepts (SMC) Settings
    showSmartMoneyConcepts: boolean;
    smcSwingLookback: number;
    smcShowBOS: boolean;
    smcShowCHoCH: boolean;
    smcShowOrderBlocks: boolean;
    smcObLimit: number;
    // LuxAlgo Signals & Overlays Settings
    showSignalsAndOverlays: boolean;
    soSensitivity: number;
    soSignalMode: 'confirmation' | 'contrarian';
    soShowRibbon: boolean;
    soShowExitSignals: boolean;
    soShowStrongSignals: boolean;
    // Confluence FVG Finder Settings
    showConfluenceFVG: boolean;
    fvgTf1: TimeframeId;
    fvgTf2: TimeframeId;
    fvgTf3: TimeframeId;
    fvgUseNormalizedZones: boolean;
    fvgZoneHeightMethod: 'ATR Based' | 'Fixed Percentage';
    fvgZoneHeightAtrMult: number;
    fvgZoneHeightPercent: number;
    fvgShowBullish: boolean;
    fvgShowBearish: boolean;
    fvgMaxZones: number;
    fvgMinConfluence: number;
    fvgProximityAtrMult: number;
    fvgEnableStrengthRating: boolean;
    fvgMinStrengthFilter: number;
    fvgConfluenceBonus: number;
    fvgBullishColor: string;
    fvgBearishColor: string;
    fvgBullishBorderColor: string;
    fvgBearishBorderColor: string;
    fvgBorderWidth: number;
    fvgShowLabels: boolean;
    fvgShowInfo: boolean;
    fvgInfoTextSize: 'Tiny' | 'Small' | 'Normal' | 'Large' | 'Huge';
    fvgMitigationType: 'Touch' | 'Full Fill' | '50% Fill';
    fvgShowMitigated: boolean;
    fvgMitigatedColor: string;
    fvgMinGapSize: number;
    fvgUseATRFilter: boolean;
    fvgAtrMultiplier: number;
    fvgAtrLength: number;
    // ICT Concepts (LuxAlgo) Settings
    showIctConcepts: boolean;
    ictMode: 'Present' | 'Historical';
    ictShowMarketStructure: boolean;
    ictMsLength: number;
    ictShowMSS: boolean;
    ictShowBOS: boolean;
    ictMssColorBullish: string;
    ictMssColorBearish: string;
    ictBosColorBullish: string;
    ictBosColorBearish: string;
    ictShowDisplacement: boolean;
    ictShowVolumeImbalance: boolean;
    ictViMaxBoxes: number;
    ictViBullishColor: string;
    ictViBearishColor: string;
    ictShowOrderBlocks: boolean;
    ictObLookback: number;
    ictObMaxCount: number;
    ictObBullishColor: string;
    ictObBearishColor: string;
    ictShowLiquidity: boolean;
    ictLiqSensitivity: number;
    ictLiqMaxBoxes: number;
    ictLiqBullishColor: string;
    ictLiqBearishColor: string;
    ictFvgOption: 'FVG' | 'IFVG' | 'NONE';
    ictFvgShowBullish: boolean;
    ictFvgShowBearish: boolean;
    ictFvgMaxCount: number;
    ictFvgBalancePriceRange: boolean;
    ictFvgBullishColor: string;
    ictFvgBearishColor: string;
  };
  connection?: {
    customServer: string;
    customAppId: string;
  };
}
