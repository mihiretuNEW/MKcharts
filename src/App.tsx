/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useDerivWS } from './hooks/useDerivWS';
import { LeftToolbar } from './components/LeftToolbar';
import { TopToolbar } from './components/TopToolbar';
import { MihiretuViewChart } from './components/MihiretuViewChart';
import { SymbolSelectorModal } from './components/SymbolSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { Drawing, DrawingType, ChartSettings, TimeframeId } from './types';
import { ShieldAlert, TrendingUp, Compass, Activity } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';

const DEFAULT_SETTINGS: ChartSettings = {
  theme: 'dark',
  candle: {
    upColor: '#089981',      // Emerald Green
    downColor: '#f23645',    // Vivid Red
    wickUpColor: '#089981',
    wickDownColor: '#f23645',
    borderUpColor: '#089981',
    borderDownColor: '#f23645'
  },
  appearance: {
    backgroundColor: '#000000',
    gridColor: '#141414',
    gridStyle: 'dashed',
    gridType: 'both',
    crosshairColor: '#4f5966',
    crosshairStyle: 'dashed',
    priceLineColor: '#2962ff'
  },
  indicators: {
    showMA: false,
    maPeriod: 20,
    showGTA: true,
    gtaShortPeriod: 6,
    gtaMidPeriod: 13,
    gtaLongPeriod: 21,
    gtaArrowOffset: 0.10,
    showGTAEMAs: true,
    showTrendlinesWithBreaks: false,
    twbLength: 14,
    twbSlopeMultiplier: 1.6,
    twbSlopeMethod: 'atr',
    twbShowSignals: true,
    showSmartMoneyConcepts: false,
    smcSwingLookback: 10,
    smcShowBOS: true,
    smcShowCHoCH: true,
    smcShowOrderBlocks: true,
    smcObLimit: 5,
    showSignalsAndOverlays: false,
    soSensitivity: 12,
    soSignalMode: 'confirmation',
    soShowRibbon: true,
    soShowExitSignals: true,
    soShowStrongSignals: true,
    // Confluence FVG Finder Defaults
    showConfluenceFVG: false,
    fvgTf1: '1M',
    fvgTf2: '5M',
    fvgTf3: '15M',
    fvgUseNormalizedZones: true,
    fvgZoneHeightMethod: 'ATR Based',
    fvgZoneHeightAtrMult: 0.75,
    fvgZoneHeightPercent: 0.3,
    fvgShowBullish: true,
    fvgShowBearish: true,
    fvgMaxZones: 8,
    fvgMinConfluence: 2,
    fvgProximityAtrMult: 5.0,
    fvgEnableStrengthRating: true,
    fvgMinStrengthFilter: 3.0,
    fvgConfluenceBonus: 0.5,
    fvgBullishColor: '#089981',
    fvgBearishColor: '#f23645',
    fvgBullishBorderColor: '#089981',
    fvgBearishBorderColor: '#f23645',
    fvgBorderWidth: 2,
    fvgShowLabels: true,
    fvgShowInfo: false,
    fvgInfoTextSize: 'Large',
    fvgMitigationType: '50% Fill',
    fvgShowMitigated: false,
    fvgMitigatedColor: '#8b8b8b',
    fvgMinGapSize: 0.0,
    fvgUseATRFilter: true,
    fvgAtrMultiplier: 0.5,
    fvgAtrLength: 14,
    // ICT Concepts Defaults
    showIctConcepts: false,
    ictMode: 'Present',
    ictShowMarketStructure: true,
    ictMsLength: 8,
    ictShowMSS: true,
    ictShowBOS: true,
    ictMssColorBullish: '#00b0ff',
    ictMssColorBearish: '#ff3d00',
    ictBosColorBullish: '#00e676',
    ictBosColorBearish: '#ff1744',
    ictShowDisplacement: true,
    ictShowVolumeImbalance: true,
    ictViMaxBoxes: 100,
    ictViBullishColor: '#00e676',
    ictViBearishColor: '#ff1744',
    ictShowOrderBlocks: true,
    ictObLookback: 5,
    ictObMaxCount: 5,
    ictObBullishColor: '#2962ff',
    ictObBearishColor: '#ff1744',
    ictShowLiquidity: true,
    ictLiqSensitivity: 2.3,
    ictLiqMaxBoxes: 50,
    ictLiqBullishColor: '#00838f',
    ictLiqBearishColor: '#c62828',
    ictFvgOption: 'FVG',
    ictFvgShowBullish: true,
    ictFvgShowBearish: true,
    ictFvgMaxCount: 20,
    ictFvgBalancePriceRange: true,
    ictFvgBullishColor: '#089981',
    ictFvgBearishColor: '#f23645'
  },
  connection: {
    customServer: '',
    customAppId: ''
  }
};

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('R_100'); // Default: Volatility 100 Index
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeId>('1M'); // Default: 1 Minute
  const [activeTool, setActiveTool] = useState<DrawingType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  // Modals Visibility
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'candles' | 'appearance' | 'indicators' | 'connection'>('candles');

  const handleOpenSettings = (tab: 'candles' | 'appearance' | 'indicators' | 'connection' = 'candles') => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
  };

  // Settings state (Loaded from localStorage if exists)
  const [settings, setSettings] = useState<ChartSettings>(() => {
    try {
      const saved = localStorage.getItem('mihiretu_chart_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appearance && parsed.appearance.backgroundColor === '#131722') {
          parsed.appearance.backgroundColor = '#000000';
          parsed.appearance.gridColor = '#141414';
        }
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          candle: { ...DEFAULT_SETTINGS.candle, ...(parsed.candle || {}) },
          appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed.appearance || {}) },
          indicators: { ...DEFAULT_SETTINGS.indicators, ...(parsed.indicators || {}) },
          connection: { ...DEFAULT_SETTINGS.connection, ...(parsed.connection || {}) }
        };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Fetch Live Data & Active Symbols via Deriv WebSocket
  const { candles, symbols, isConnected, isLoading, connectionError } = useDerivWS(
    selectedSymbol,
    selectedTimeframe,
    settings.connection
  );

  // Persistence: Save Settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('mihiretu_chart_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  }, [settings]);

  // Sync drawings for the selected symbol asset
  useEffect(() => {
    try {
      const savedDrawings = localStorage.getItem(`drawings_${selectedSymbol}`);
      if (savedDrawings) {
        setDrawings(JSON.parse(savedDrawings));
      } else {
        setDrawings([]);
      }
    } catch (e) {
      console.error('Failed to load drawings for symbol:', e);
      setDrawings([]);
    }
  }, [selectedSymbol]);

  // Persist drawings changes to localStorage
  const handleUpdateDrawings = (updater: React.SetStateAction<Drawing[]>) => {
    setDrawings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`drawings_${selectedSymbol}`, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist drawings:', e);
      }
      return next;
    });
  };

  const handleClearAllDrawings = () => {
    handleUpdateDrawings([]);
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const nextBg = nextTheme === 'dark' ? '#000000' : '#ffffff';
    const nextGrid = nextTheme === 'dark' ? '#141414' : '#f0f3fa';
    const nextCrosshair = nextTheme === 'dark' ? '#4f5966' : '#a0a3b0';

    setSettings({
      ...settings,
      theme: nextTheme,
      appearance: {
        ...settings.appearance,
        backgroundColor: nextBg,
        gridColor: nextGrid,
        crosshairColor: nextCrosshair
      }
    });
  };

  const activeSymbolInfo = symbols.find(s => s.symbol === selectedSymbol);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] font-sans">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm text-neutral-400 font-medium tracking-wide">Validating Secure Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div 
      id="app-root-container"
      className={`h-screen w-screen flex flex-col font-sans transition-colors duration-150 overflow-hidden ${
        settings.theme === 'dark' ? 'bg-black text-white' : 'bg-[#ffffff] text-black'
      }`}
    >
      {/* 1. Header Toolbar */}
      <TopToolbar
        selectedSymbol={selectedSymbol}
        symbols={symbols}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        onOpenSymbolModal={() => setIsSymbolModalOpen(true)}
        onOpenSettingsModal={() => handleOpenSettings('candles')}
        onOpenIndicators={() => handleOpenSettings('indicators')}
        isConnected={isConnected}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Main Display Area */}
      <div id="main-display-layout" className="flex flex-grow w-full overflow-hidden relative">
        {/* Left Vertical Tools Sidebar */}
        <LeftToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onClearDrawings={handleClearAllDrawings}
          drawingsCount={drawings.length}
        />

        {/* Center Canvas panel with optional overlay loaders */}
        <div id="central-chart-stage" className="flex-grow h-full relative overflow-hidden flex flex-col">
          
          {/* Symbol Info Bar */}
          <div id="symbol-info-banner" className="h-10 border-b border-neutral-800 px-6 flex items-center justify-between text-xs font-semibold bg-black select-none">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-mono text-sm font-bold">{selectedSymbol}</span>
              <span className="text-gray-400 truncate max-w-[200px] sm:max-w-md">
                {activeSymbolInfo?.display_name || 'Volatility Index'}
              </span>
              <span className="text-gray-500 font-normal uppercase">
                {activeSymbolInfo?.market_display_name || 'Derived Indices'}
              </span>
            </div>
          </div>

          <div className="flex-grow w-full h-full min-h-0 relative">
            {/* Interactive Custom Canvas Chart */}
            <MihiretuViewChart
              candles={candles}
              symbolName={selectedSymbol}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              drawings={drawings}
              setDrawings={handleUpdateDrawings}
              settings={settings}
              timeframe={selectedTimeframe}
            />

            {/* Spinner Overlay when data is loading */}
            {isLoading && (
              <div 
                id="chart-loading-overlay"
                className="absolute inset-0 z-40 bg-[#131722]/80 dark:bg-[#131722]/95 flex flex-col items-center justify-center text-white"
              >
                <div className="relative flex flex-col items-center justify-center p-8 bg-[#1c2030] border border-[#2a2e39] rounded-xl shadow-2xl max-w-sm text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <h4 className="text-base font-bold text-gray-100 flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                    Fetching Feed History
                  </h4>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Connecting to Deriv.com Default WS server for live <strong>{selectedSymbol}</strong> {selectedTimeframe} candles.
                  </p>
                  
                  {connectionError && (
                    <div className="mt-4 p-2 bg-red-950/40 border border-red-900/50 rounded-lg text-[11px] text-red-300">
                      {connectionError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Symbol Selection Search Dialog */}
      <SymbolSelectorModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />

      {/* 4. Chart Settings Customization Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        initialTab={settingsTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
