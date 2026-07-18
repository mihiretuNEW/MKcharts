/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChartSettings } from '../types';
import { X, Palette, LayoutGrid, Eye, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChartSettings;
  onUpdateSettings: (settings: ChartSettings) => void;
  initialTab?: 'candles' | 'appearance' | 'indicators' | 'connection';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialTab = 'candles',
}) => {
  const [activeTab, setActiveTab] = useState<'candles' | 'appearance' | 'indicators' | 'connection'>('candles');

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleUpdateCandle = (key: keyof ChartSettings['candle'], value: string) => {
    onUpdateSettings({
      ...settings,
      candle: {
        ...settings.candle,
        [key]: value,
      },
    });
  };

  const handleUpdateAppearance = (key: keyof ChartSettings['appearance'], value: string) => {
    onUpdateSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [key]: value,
      },
    });
  };

  const handleUpdateIndicators = (key: keyof ChartSettings['indicators'], value: any) => {
    onUpdateSettings({
      ...settings,
      indicators: {
        ...settings.indicators,
        [key]: value,
      },
    });
  };

  const handleUpdateConnection = (key: keyof NonNullable<ChartSettings['connection']>, value: string) => {
    onUpdateSettings({
      ...settings,
      connection: {
        customServer: '',
        customAppId: '',
        ...settings.connection,
        [key]: value,
      },
    });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    
    // Auto adjust background and grid lines to match theme
    const nextBg = nextTheme === 'dark' ? '#000000' : '#ffffff';
    const nextGrid = nextTheme === 'dark' ? '#141414' : '#f0f3fa';
    const nextCrosshair = nextTheme === 'dark' ? '#4f5966' : '#a0a3b0';

    onUpdateSettings({
      ...settings,
      theme: nextTheme,
      appearance: {
        ...settings.appearance,
        backgroundColor: nextBg,
        gridColor: nextGrid,
        crosshairColor: nextCrosshair,
      },
    });
  };

  // Predefined color presets
  const colorPresets = [
    '#26a69a', // Emerald Green
    '#ef5350', // Bright Red
    '#2196f3', // Blue
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#ffffff', // White
    '#000000', // Dark Charcoal
    '#00e676', // Bright Green
    '#e91e63', // Pink
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div 
        id="settings-modal"
        className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl flex flex-col text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-400" />
            Chart Preferences
          </h3>
          <button 
            id="close-settings-modal"
            onClick={onClose} 
            className="p-1 hover:bg-neutral-900 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 py-1.5 gap-2 overflow-x-auto scrollbar-none">
          <button
            id="btn-settings-tab-candles"
            onClick={() => setActiveTab('candles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-all ${
              activeTab === 'candles' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            Candles (OHLC)
          </button>
          <button
            id="btn-settings-tab-appearance"
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-all ${
              activeTab === 'appearance' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            Canvas Styling
          </button>
          <button
            id="btn-settings-tab-indicators"
            onClick={() => setActiveTab('indicators')}
            className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-all ${
              activeTab === 'indicators' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            Future Indicators
          </button>
          <button
            id="btn-settings-tab-connection"
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-all ${
              activeTab === 'connection' ? 'bg-neutral-800 text-white' : 'text-gray-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            Server & Connection
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
          
          {/* TAB 1: CANDLES COLOR SELECTION */}
          {activeTab === 'candles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bullish Body Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.upColor}
                    onChange={(e) => handleUpdateCandle('upColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.upColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bearish Body Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.downColor}
                    onChange={(e) => handleUpdateCandle('downColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.downColor}</span>
                </div>
              </div>

              <div className="border-t border-neutral-900 my-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bullish Border Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.borderUpColor}
                    onChange={(e) => handleUpdateCandle('borderUpColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.borderUpColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bearish Border Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.borderDownColor}
                    onChange={(e) => handleUpdateCandle('borderDownColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.borderDownColor}</span>
                </div>
              </div>

              <div className="border-t border-neutral-900 my-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bullish Wick Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.wickUpColor}
                    onChange={(e) => handleUpdateCandle('wickUpColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.wickUpColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Bearish Wick Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.candle.wickDownColor}
                    onChange={(e) => handleUpdateCandle('wickDownColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.candle.wickDownColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE CUSTOMIZATION */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Theme quicktoggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">Color Palette Theme</span>
                  <span className="text-xs text-gray-500">Toggle between Light and Dark core visual setups</span>
                </div>
                <button
                  id="btn-settings-toggle-theme"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-blue-400 hover:text-white rounded-md text-xs font-semibold transition-colors border border-neutral-700"
                >
                  {settings.theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-blue-400" /> Dark Mode
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Grid Lines Type</span>
                <select
                  id="settings-select-grid-type"
                  value={settings.appearance.gridType}
                  onChange={(e) => handleUpdateAppearance('gridType', e.target.value)}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-850 rounded text-xs focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="both">Both Vertical & Horizontal</option>
                  <option value="horizontal">Horizontal Only</option>
                  <option value="vertical">Vertical Only</option>
                  <option value="none">No Grid Lines</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Grid Style</span>
                <select
                  id="settings-select-grid-style"
                  value={settings.appearance.gridStyle}
                  onChange={(e) => handleUpdateAppearance('gridStyle', e.target.value as any)}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-850 rounded text-xs focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="dashed">Dashed Lines</option>
                  <option value="solid">Solid Lines</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Crosshair Laser Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.appearance.crosshairColor}
                    onChange={(e) => handleUpdateAppearance('crosshairColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-gray-400 uppercase">{settings.appearance.crosshairColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FUTURE INDICATOR SETTINGS */}
          {activeTab === 'indicators' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-950/20 border border-blue-900/30 text-xs text-blue-300 rounded-lg leading-relaxed">
                <strong>Platform Indicators:</strong> You can overlay the standard <strong>Simple Moving Average (SMA)</strong> or the high-accuracy <strong>Grand Trend Alignment (GTA) Filter</strong>.
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200">Show Moving Average (SMA)</span>
                  <span className="text-xs text-gray-500">Calculates and renders an SMA line on chart candles</span>
                </div>
                <input
                  id="settings-toggle-ma"
                  type="checkbox"
                  checked={settings.indicators.showMA}
                  onChange={(e) => handleUpdateIndicators('showMA', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showMA && (
                <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                  <span className="text-sm font-medium text-gray-300">SMA Period (Length)</span>
                  <input
                    id="settings-input-ma-period"
                    type="number"
                    min={2}
                    max={500}
                    value={settings.indicators.maPeriod}
                    onChange={(e) => handleUpdateIndicators('maPeriod', parseInt(e.target.value) || 20)}
                    className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                  />
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">Grand Trend Alignment (GTA) Filter</span>
                  <span className="text-xs text-gray-500">Triple-smoothed EMA momentum overlay (Green/Red/Neutral States)</span>
                </div>
                <input
                  id="settings-toggle-gta"
                  type="checkbox"
                  checked={settings.indicators.showGTA}
                  onChange={(e) => handleUpdateIndicators('showGTA', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showGTA && (
                <div className="space-y-3.5 pl-3 border-l-2 border-neutral-800">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Short Period (Velocity)</span>
                    <input
                      id="settings-input-gta-short"
                      type="number"
                      min={1}
                      max={100}
                      value={settings.indicators.gtaShortPeriod}
                      onChange={(e) => handleUpdateIndicators('gtaShortPeriod', parseInt(e.target.value) || 6)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Medium Period (Baseline)</span>
                    <input
                      id="settings-input-gta-mid"
                      type="number"
                      min={1}
                      max={200}
                      value={settings.indicators.gtaMidPeriod}
                      onChange={(e) => handleUpdateIndicators('gtaMidPeriod', parseInt(e.target.value) || 13)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Long Period (Anchor)</span>
                    <input
                      id="settings-input-gta-long"
                      type="number"
                      min={1}
                      max={500}
                      value={settings.indicators.gtaLongPeriod}
                      onChange={(e) => handleUpdateIndicators('gtaLongPeriod', parseInt(e.target.value) || 21)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Arrow Placement Offset</span>
                      <span className="text-xs text-gray-500">Spacing height multiplier</span>
                    </div>
                    <input
                      id="settings-input-gta-offset"
                      type="number"
                      step={0.01}
                      min={0.01}
                      max={0.5}
                      value={settings.indicators.gtaArrowOffset}
                      onChange={(e) => handleUpdateIndicators('gtaArrowOffset', parseFloat(e.target.value) || 0.10)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Show GTA EMAs on Chart</span>
                      <span className="text-xs text-gray-500">Render the three underlying EMA lines</span>
                    </div>
                    <input
                      id="settings-toggle-gta-emas"
                      type="checkbox"
                      checked={settings.indicators.showGTAEMAs}
                      onChange={(e) => handleUpdateIndicators('showGTAEMAs', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              {/* LuxAlgo Trendlines with Breaks */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">LuxAlgo Trendlines with Breaks</span>
                  <span className="text-xs text-gray-500">Pivots and slope-calculated breakout signals</span>
                </div>
                <input
                  id="settings-toggle-twb"
                  type="checkbox"
                  checked={settings.indicators.showTrendlinesWithBreaks}
                  onChange={(e) => handleUpdateIndicators('showTrendlinesWithBreaks', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showTrendlinesWithBreaks && (
                <div className="space-y-3.5 pl-3 border-l-2 border-neutral-800">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Pivot Lookback Period (Length)</span>
                    <input
                      id="settings-input-twb-length"
                      type="number"
                      min={2}
                      max={100}
                      value={settings.indicators.twbLength}
                      onChange={(e) => handleUpdateIndicators('twbLength', parseInt(e.target.value) || 14)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Slope Multiplier</span>
                    <input
                      id="settings-input-twb-slope"
                      type="number"
                      step={0.1}
                      min={0.1}
                      max={10}
                      value={settings.indicators.twbSlopeMultiplier}
                      onChange={(e) => handleUpdateIndicators('twbSlopeMultiplier', parseFloat(e.target.value) || 1.6)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Slope Calculation Method</span>
                    <select
                      id="settings-select-twb-method"
                      value={settings.indicators.twbSlopeMethod}
                      onChange={(e) => handleUpdateIndicators('twbSlopeMethod', e.target.value)}
                      className="w-28 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    >
                      <option value="atr">ATR</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Show Breakout Signals</span>
                      <span className="text-xs text-gray-500">Draw "B" arrows on the chart upon breakout</span>
                    </div>
                    <input
                      id="settings-toggle-twb-signals"
                      type="checkbox"
                      checked={settings.indicators.twbShowSignals ?? true}
                      onChange={(e) => handleUpdateIndicators('twbShowSignals', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              {/* LuxAlgo Smart Money Concepts */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">Smart Money Concepts (SMC)</span>
                  <span className="text-xs text-gray-500">BOS, CHoCH structural breaks & institutional Order Blocks</span>
                </div>
                <input
                  id="settings-toggle-smc"
                  type="checkbox"
                  checked={settings.indicators.showSmartMoneyConcepts}
                  onChange={(e) => handleUpdateIndicators('showSmartMoneyConcepts', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showSmartMoneyConcepts && (
                <div className="space-y-3.5 pl-3 border-l-2 border-neutral-800">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Swing Lookback Period</span>
                    <input
                      id="settings-input-smc-lookback"
                      type="number"
                      min={2}
                      max={50}
                      value={settings.indicators.smcSwingLookback}
                      onChange={(e) => handleUpdateIndicators('smcSwingLookback', parseInt(e.target.value) || 10)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Break of Structure (BOS)</span>
                    <input
                      id="settings-toggle-smc-bos"
                      type="checkbox"
                      checked={settings.indicators.smcShowBOS}
                      onChange={(e) => handleUpdateIndicators('smcShowBOS', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Change of Character (CHoCH)</span>
                    <input
                      id="settings-toggle-smc-choch"
                      type="checkbox"
                      checked={settings.indicators.smcShowCHoCH}
                      onChange={(e) => handleUpdateIndicators('smcShowCHoCH', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Order Blocks (OB)</span>
                    <input
                      id="settings-toggle-smc-ob"
                      type="checkbox"
                      checked={settings.indicators.smcShowOrderBlocks}
                      onChange={(e) => handleUpdateIndicators('smcShowOrderBlocks', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Max Order Blocks Count</span>
                    <input
                      id="settings-input-smc-oblimit"
                      type="number"
                      min={1}
                      max={20}
                      value={settings.indicators.smcObLimit}
                      onChange={(e) => handleUpdateIndicators('smcObLimit', parseInt(e.target.value) || 5)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              {/* LuxAlgo® - Signals & Overlays™ */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">LuxAlgo® - Signals & Overlays™</span>
                  <span className="text-xs text-gray-500">Flagship trend tracker ribbon & buy/sell signals</span>
                </div>
                <input
                  id="settings-toggle-so"
                  type="checkbox"
                  checked={settings.indicators.showSignalsAndOverlays}
                  onChange={(e) => handleUpdateIndicators('showSignalsAndOverlays', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showSignalsAndOverlays && (
                <div className="space-y-3.5 pl-3 border-l-2 border-neutral-800">
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Signal Mode</span>
                    <select
                      id="settings-select-so-mode"
                      value={settings.indicators.soSignalMode}
                      onChange={(e) => handleUpdateIndicators('soSignalMode', e.target.value as any)}
                      className="w-32 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    >
                      <option value="confirmation">Confirmation</option>
                      <option value="contrarian">Contrarian</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Sensitivity</span>
                      <span className="text-xs text-gray-500">Lower = more signals, Higher = slower</span>
                    </div>
                    <input
                      id="settings-input-so-sensitivity"
                      type="number"
                      min={1}
                      max={50}
                      value={settings.indicators.soSensitivity}
                      onChange={(e) => handleUpdateIndicators('soSensitivity', parseInt(e.target.value) || 12)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Trend Ribbon</span>
                    <input
                      id="settings-toggle-so-ribbon"
                      type="checkbox"
                      checked={settings.indicators.soShowRibbon}
                      onChange={(e) => handleUpdateIndicators('soShowRibbon', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Exit Signals</span>
                    <input
                      id="settings-toggle-so-exits"
                      type="checkbox"
                      checked={settings.indicators.soShowExitSignals}
                      onChange={(e) => handleUpdateIndicators('soShowExitSignals', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Strong Signals</span>
                    <input
                      id="settings-toggle-so-strong"
                      type="checkbox"
                      checked={settings.indicators.soShowStrongSignals}
                      onChange={(e) => handleUpdateIndicators('soShowStrongSignals', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              {/* Confluence FVG Finder | ProjectSyndicate */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">Confluence FVG Finder | ProjectSyndicate</span>
                  <span className="text-xs text-gray-500">LuxAlgo style multi-timeframe confluence zones</span>
                </div>
                <input
                  id="settings-toggle-fvg"
                  type="checkbox"
                  checked={settings.indicators.showConfluenceFVG}
                  onChange={(e) => handleUpdateIndicators('showConfluenceFVG', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showConfluenceFVG && (
                <div className="space-y-3.5 pl-3 border-l-2 border-neutral-800">
                  {/* Multi-Timeframes Selectors */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">TF 1 (Anchor)</span>
                      <select
                        id="settings-select-fvg-tf1"
                        value={settings.indicators.fvgTf1}
                        onChange={(e) => handleUpdateIndicators('fvgTf1', e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="1M">1M</option>
                        <option value="2M">2M</option>
                        <option value="5M">5M</option>
                        <option value="15M">15M</option>
                        <option value="30M">30M</option>
                        <option value="1H">1H</option>
                        <option value="4H">4H</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">TF 2</span>
                      <select
                        id="settings-select-fvg-tf2"
                        value={settings.indicators.fvgTf2}
                        onChange={(e) => handleUpdateIndicators('fvgTf2', e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="1M">1M</option>
                        <option value="2M">2M</option>
                        <option value="5M">5M</option>
                        <option value="15M">15M</option>
                        <option value="30M">30M</option>
                        <option value="1H">1H</option>
                        <option value="4H">4H</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">TF 3</span>
                      <select
                        id="settings-select-fvg-tf3"
                        value={settings.indicators.fvgTf3}
                        onChange={(e) => handleUpdateIndicators('fvgTf3', e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:outline-none"
                      >
                        <option value="1M">1M</option>
                        <option value="2M">2M</option>
                        <option value="5M">5M</option>
                        <option value="15M">15M</option>
                        <option value="30M">30M</option>
                        <option value="1H">1H</option>
                        <option value="4H">4H</option>
                      </select>
                    </div>
                  </div>

                  {/* General Config */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Bullish Zones</span>
                    <input
                      id="settings-toggle-fvg-bullish"
                      type="checkbox"
                      checked={settings.indicators.fvgShowBullish}
                      onChange={(e) => handleUpdateIndicators('fvgShowBullish', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Bearish Zones</span>
                    <input
                      id="settings-toggle-fvg-bearish"
                      type="checkbox"
                      checked={settings.indicators.fvgShowBearish}
                      onChange={(e) => handleUpdateIndicators('fvgShowBearish', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {/* Limits and Filters */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Max Zones Per Direction</span>
                      <span className="text-xs text-gray-500">Cap maximum displayed boxes</span>
                    </div>
                    <input
                      id="settings-input-fvg-max"
                      type="number"
                      min={1}
                      max={50}
                      value={settings.indicators.fvgMaxZones}
                      onChange={(e) => handleUpdateIndicators('fvgMaxZones', parseInt(e.target.value) || 8)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Minimum Confluence Count</span>
                      <span className="text-xs text-gray-500">Require matching levels across TFs (1-3)</span>
                    </div>
                    <input
                      id="settings-input-fvg-confluence"
                      type="number"
                      min={1}
                      max={3}
                      value={settings.indicators.fvgMinConfluence}
                      onChange={(e) => handleUpdateIndicators('fvgMinConfluence', parseInt(e.target.value) || 2)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Proximity ATR Mult</span>
                      <span className="text-xs text-gray-500">Confluence grouping proximity multiplier</span>
                    </div>
                    <input
                      id="settings-input-fvg-proximity"
                      type="number"
                      step={0.1}
                      min={0.5}
                      max={15}
                      value={settings.indicators.fvgProximityAtrMult}
                      onChange={(e) => handleUpdateIndicators('fvgProximityAtrMult', parseFloat(e.target.value) || 5.0)}
                      className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Strength Rating Rating</span>
                      <span className="text-xs text-gray-500">Enable score filters on gaps</span>
                    </div>
                    <input
                      id="settings-toggle-fvg-rating"
                      type="checkbox"
                      checked={settings.indicators.fvgEnableStrengthRating}
                      onChange={(e) => handleUpdateIndicators('fvgEnableStrengthRating', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {settings.indicators.fvgEnableStrengthRating && (
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850 ml-3 border-l-2 border-neutral-800">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300">Min Strength Score Filter</span>
                        <span className="text-xs text-gray-500">Only show zones scored above threshold</span>
                      </div>
                      <input
                        id="settings-input-fvg-minstrength"
                        type="number"
                        step={0.1}
                        min={0.1}
                        max={10}
                        value={settings.indicators.fvgMinStrengthFilter}
                        onChange={(e) => handleUpdateIndicators('fvgMinStrengthFilter', parseFloat(e.target.value) || 3.0)}
                        className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 text-center font-mono"
                      />
                    </div>
                  )}

                  {/* Mitigation Settings */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Mitigation Type</span>
                    <select
                      id="settings-select-fvg-mitigation"
                      value={settings.indicators.fvgMitigationType}
                      onChange={(e) => handleUpdateIndicators('fvgMitigationType', e.target.value)}
                      className="w-28 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none"
                    >
                      <option value="Touch">Touch</option>
                      <option value="Full Fill">Full Fill</option>
                      <option value="50% Fill">50% Fill</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Mitigated FVG Zones</span>
                    <input
                      id="settings-toggle-fvg-mitigated"
                      type="checkbox"
                      checked={settings.indicators.fvgShowMitigated}
                      onChange={(e) => handleUpdateIndicators('fvgShowMitigated', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {/* Normalization Settings */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Normalize Zone Heights</span>
                      <span className="text-xs text-gray-500">Unifies zone block sizes symmetrically</span>
                    </div>
                    <input
                      id="settings-toggle-fvg-normalize"
                      type="checkbox"
                      checked={settings.indicators.fvgUseNormalizedZones}
                      onChange={(e) => handleUpdateIndicators('fvgUseNormalizedZones', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {settings.indicators.fvgUseNormalizedZones && (
                    <div className="space-y-3 pl-3 border-l-2 border-neutral-800 ml-3">
                      <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                        <span className="text-sm font-medium text-gray-300">Height Method</span>
                        <select
                          id="settings-select-fvg-hm"
                          value={settings.indicators.fvgZoneHeightMethod}
                          onChange={(e) => handleUpdateIndicators('fvgZoneHeightMethod', e.target.value)}
                          className="w-32 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none"
                        >
                          <option value="ATR Based">ATR Based</option>
                          <option value="Fixed Percentage">Fixed %</option>
                        </select>
                      </div>

                      {settings.indicators.fvgZoneHeightMethod === 'ATR Based' ? (
                        <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                          <span className="text-sm font-medium text-gray-300">Height ATR Mult</span>
                          <input
                            id="settings-input-fvg-height-atr"
                            type="number"
                            step={0.05}
                            min={0.1}
                            max={3.0}
                            value={settings.indicators.fvgZoneHeightAtrMult}
                            onChange={(e) => handleUpdateIndicators('fvgZoneHeightAtrMult', parseFloat(e.target.value) || 0.75)}
                            className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none text-center font-mono"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                          <span className="text-sm font-medium text-gray-300">Height % of Price</span>
                          <input
                            id="settings-input-fvg-height-pct"
                            type="number"
                            step={0.05}
                            min={0.05}
                            max={2.0}
                            value={settings.indicators.fvgZoneHeightPercent}
                            onChange={(e) => handleUpdateIndicators('fvgZoneHeightPercent', parseFloat(e.target.value) || 0.3)}
                            className="w-20 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none text-center font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Texts in Zone with ON/OFF (As requested) */}
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Show Texts in Zone</span>
                      <span className="text-xs text-gray-500">Render indicators info metrics inside FVG block</span>
                    </div>
                    <input
                      id="settings-toggle-fvg-info"
                      type="checkbox"
                      checked={settings.indicators.fvgShowInfo}
                      onChange={(e) => handleUpdateIndicators('fvgShowInfo', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {settings.indicators.fvgShowInfo && (
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850 ml-3 border-l-2 border-neutral-800">
                      <span className="text-sm font-medium text-gray-300">Info Text Size</span>
                      <select
                        id="settings-select-fvg-size"
                        value={settings.indicators.fvgInfoTextSize}
                        onChange={(e) => handleUpdateIndicators('fvgInfoTextSize', e.target.value)}
                        className="w-28 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none"
                      >
                        <option value="Tiny">Tiny</option>
                        <option value="Small">Small</option>
                        <option value="Normal">Normal</option>
                        <option value="Large">Large</option>
                        <option value="Huge">Huge</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                    <span className="text-sm font-medium text-gray-300">Show Bull/Bear Simple Labels</span>
                    <input
                      id="settings-toggle-fvg-labels"
                      type="checkbox"
                      checked={settings.indicators.fvgShowLabels}
                      onChange={(e) => handleUpdateIndicators('fvgShowLabels', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-900 my-2" />

              {/* ICT Concepts (LuxAlgo) | ProjectSyndicate */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-200">ICT Concepts (LuxAlgo) | ProjectSyndicate</span>
                  <span className="text-xs text-gray-500">Premium market structure, order blocks, liquidities, volume imbalances, & FVG</span>
                </div>
                <input
                  id="settings-toggle-ict-concepts"
                  type="checkbox"
                  checked={settings.indicators.showIctConcepts}
                  onChange={(e) => handleUpdateIndicators('showIctConcepts', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500 focus:ring-2"
                />
              </div>

              {settings.indicators.showIctConcepts && (
                <div className="space-y-4 pl-3 border-l-2 border-neutral-800">
                  
                  {/* Mode & Universal Settings */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Universal Settings</span>
                    
                    <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-850">
                      <span className="text-sm font-medium text-gray-300">Analysis Mode</span>
                      <select
                        id="settings-select-ict-mode"
                        value={settings.indicators.ictMode}
                        onChange={(e) => handleUpdateIndicators('ictMode', e.target.value)}
                        className="w-32 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-sm text-white focus:outline-none"
                      >
                        <option value="Present">Present (500 Bars)</option>
                        <option value="Historical">Historical (Full)</option>
                      </select>
                    </div>
                  </div>

                  {/* Market Structure (MSS & BOS) */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Market Structure (MSS & BOS)</span>
                      <input
                        id="settings-toggle-ict-ms"
                        type="checkbox"
                        checked={settings.indicators.ictShowMarketStructure}
                        onChange={(e) => handleUpdateIndicators('ictShowMarketStructure', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700 focus:ring-blue-500"
                      />
                    </div>

                    {settings.indicators.ictShowMarketStructure && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Swing Point Length</span>
                          <input
                            id="settings-input-ict-ms-length"
                            type="number"
                            min={2}
                            max={50}
                            value={settings.indicators.ictMsLength}
                            onChange={(e) => handleUpdateIndicators('ictMsLength', parseInt(e.target.value) || 8)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Show Market Structure Shift (MSS)</span>
                          <input
                            id="settings-toggle-ict-mss"
                            type="checkbox"
                            checked={settings.indicators.ictShowMSS}
                            onChange={(e) => handleUpdateIndicators('ictShowMSS', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Show Break of Structure (BOS)</span>
                          <input
                            id="settings-toggle-ict-bos"
                            type="checkbox"
                            checked={settings.indicators.ictShowBOS}
                            onChange={(e) => handleUpdateIndicators('ictShowBOS', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">MSS Bull/Bear Colors</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="settings-color-ict-mss-bull"
                              type="color"
                              value={settings.indicators.ictMssColorBullish}
                              onChange={(e) => handleUpdateIndicators('ictMssColorBullish', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input
                              id="settings-color-ict-mss-bear"
                              type="color"
                              value={settings.indicators.ictMssColorBearish}
                              onChange={(e) => handleUpdateIndicators('ictMssColorBearish', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">BOS Bull/Bear Colors</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="settings-color-ict-bos-bull"
                              type="color"
                              value={settings.indicators.ictBosColorBullish}
                              onChange={(e) => handleUpdateIndicators('ictBosColorBullish', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input
                              id="settings-color-ict-bos-bear"
                              type="color"
                              value={settings.indicators.ictBosColorBearish}
                              onChange={(e) => handleUpdateIndicators('ictBosColorBearish', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Blocks (OB) */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Order Blocks (OB)</span>
                      <input
                        id="settings-toggle-ict-ob"
                        type="checkbox"
                        checked={settings.indicators.ictShowOrderBlocks}
                        onChange={(e) => handleUpdateIndicators('ictShowOrderBlocks', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                      />
                    </div>

                    {settings.indicators.ictShowOrderBlocks && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Lookback Period</span>
                          <input
                            id="settings-input-ict-ob-lookback"
                            type="number"
                            min={1}
                            max={20}
                            value={settings.indicators.ictObLookback}
                            onChange={(e) => handleUpdateIndicators('ictObLookback', parseInt(e.target.value) || 5)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Max Rendered Blocks</span>
                          <input
                            id="settings-input-ict-ob-max"
                            type="number"
                            min={1}
                            max={20}
                            value={settings.indicators.ictObMaxCount}
                            onChange={(e) => handleUpdateIndicators('ictObMaxCount', parseInt(e.target.value) || 5)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Bull/Bear Colors</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="settings-color-ict-ob-bull"
                              type="color"
                              value={settings.indicators.ictObBullishColor}
                              onChange={(e) => handleUpdateIndicators('ictObBullishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input
                              id="settings-color-ict-ob-bear"
                              type="color"
                              value={settings.indicators.ictObBearishColor}
                              onChange={(e) => handleUpdateIndicators('ictObBearishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Liquidity (BSL & SSL) */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Buyside & Sellside Liquidity</span>
                      <input
                        id="settings-toggle-ict-liq"
                        type="checkbox"
                        checked={settings.indicators.ictShowLiquidity}
                        onChange={(e) => handleUpdateIndicators('ictShowLiquidity', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                      />
                    </div>

                    {settings.indicators.ictShowLiquidity && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Sensitivity Multiplier</span>
                          <input
                            id="settings-input-ict-liq-sens"
                            type="number"
                            step={0.1}
                            min={0.5}
                            max={10}
                            value={settings.indicators.ictLiqSensitivity}
                            onChange={(e) => handleUpdateIndicators('ictLiqSensitivity', parseFloat(e.target.value) || 2.3)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Max Visibility Cap</span>
                          <input
                            id="settings-input-ict-liq-max"
                            type="number"
                            min={5}
                            max={100}
                            value={settings.indicators.ictLiqMaxBoxes}
                            onChange={(e) => handleUpdateIndicators('ictLiqMaxBoxes', parseInt(e.target.value) || 50)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">SSL (Bullish) / BSL (Bearish) Colors</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="settings-color-ict-liq-bull"
                              type="color"
                              value={settings.indicators.ictLiqBullishColor}
                              onChange={(e) => handleUpdateIndicators('ictLiqBullishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input
                              id="settings-color-ict-liq-bear"
                              type="color"
                              value={settings.indicators.ictLiqBearishColor}
                              onChange={(e) => handleUpdateIndicators('ictLiqBearishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Volume Imbalances */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Volume Imbalances</span>
                      <input
                        id="settings-toggle-ict-vi"
                        type="checkbox"
                        checked={settings.indicators.ictShowVolumeImbalance}
                        onChange={(e) => handleUpdateIndicators('ictShowVolumeImbalance', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                      />
                    </div>

                    {settings.indicators.ictShowVolumeImbalance && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Max Boxes Limit</span>
                          <input
                            id="settings-input-ict-vi-max"
                            type="number"
                            min={5}
                            max={200}
                            value={settings.indicators.ictViMaxBoxes}
                            onChange={(e) => handleUpdateIndicators('ictViMaxBoxes', parseInt(e.target.value) || 100)}
                            className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                          <span className="text-xs text-neutral-400">Bull/Bear Colors</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="settings-color-ict-vi-bull"
                              type="color"
                              value={settings.indicators.ictViBullishColor}
                              onChange={(e) => handleUpdateIndicators('ictViBullishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <input
                              id="settings-color-ict-vi-bear"
                              type="color"
                              value={settings.indicators.ictViBearishColor}
                              onChange={(e) => handleUpdateIndicators('ictViBearishColor', e.target.value)}
                              className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FVG, IFVG, & BPR */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Imbalances (FVG, IFVG & BPR)</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-2.5">
                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Imbalance Option</span>
                        <select
                          id="settings-select-ict-fvg-opt"
                          value={settings.indicators.ictFvgOption}
                          onChange={(e) => handleUpdateIndicators('ictFvgOption', e.target.value)}
                          className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white"
                        >
                          <option value="FVG">Standard FVG</option>
                          <option value="IFVG">Inverted FVG (IFVG)</option>
                          <option value="NONE">None</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Max Boxes Count</span>
                        <input
                          id="settings-input-ict-fvg-max"
                          type="number"
                          min={5}
                          max={100}
                          value={settings.indicators.ictFvgMaxCount}
                          onChange={(e) => handleUpdateIndicators('ictFvgMaxCount', parseInt(e.target.value) || 20)}
                          className="w-16 px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white text-center font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Show Bullish FVG</span>
                        <input
                          id="settings-toggle-ict-fvg-bullish"
                          type="checkbox"
                          checked={settings.indicators.ictFvgShowBullish}
                          onChange={(e) => handleUpdateIndicators('ictFvgShowBullish', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Show Bearish FVG</span>
                        <input
                          id="settings-toggle-ict-fvg-bearish"
                          type="checkbox"
                          checked={settings.indicators.ictFvgShowBearish}
                          onChange={(e) => handleUpdateIndicators('ictFvgShowBearish', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Balanced Price Range (BPR)</span>
                        <input
                          id="settings-toggle-ict-fvg-bpr"
                          type="checkbox"
                          checked={settings.indicators.ictFvgBalancePriceRange}
                          onChange={(e) => handleUpdateIndicators('ictFvgBalancePriceRange', e.target.checked)}
                          className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-900">
                        <span className="text-xs text-neutral-400">Bull/Bear Colors</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            id="settings-color-ict-fvg-bull"
                            type="color"
                            value={settings.indicators.ictFvgBullishColor}
                            onChange={(e) => handleUpdateIndicators('ictFvgBullishColor', e.target.value)}
                            className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                          />
                          <input
                            id="settings-color-ict-fvg-bear"
                            type="color"
                            value={settings.indicators.ictFvgBearishColor}
                            onChange={(e) => handleUpdateIndicators('ictFvgBearishColor', e.target.value)}
                            className="w-6 h-5 bg-transparent border-0 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Displacement Highlight */}
                  <div className="space-y-2 border-t border-neutral-900 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Highlight Displacement</span>
                      <input
                        id="settings-toggle-ict-disp"
                        type="checkbox"
                        checked={settings.indicators.ictShowDisplacement}
                        onChange={(e) => handleUpdateIndicators('ictShowDisplacement', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 bg-neutral-800 rounded border-neutral-700"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 4: SERVER & CONNECTION OVERRIDES */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-lg leading-relaxed">
                <strong>Connection Overrides:</strong> If the chart is stuck on &quot;Connecting&quot; or if you face security blocks or WebSocket timeout errors, you can override the target gateway server or enter your own App ID. Leave them empty to automatically rotate through global public gateways.
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Custom Server Domain</span>
                <input
                  id="connection-server-input"
                  type="text"
                  placeholder="e.g. ws.derivws.com (or green.binaryws.com)"
                  value={settings.connection?.customServer || ''}
                  onChange={(e) => handleUpdateConnection('customServer', e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 placeholder-neutral-700 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registered App ID</span>
                <input
                  id="connection-appid-input"
                  type="text"
                  placeholder="e.g. 1089 (or your custom App ID)"
                  value={settings.connection?.customAppId || ''}
                  onChange={(e) => handleUpdateConnection('customAppId', e.target.value)}
                  className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-blue-500 placeholder-neutral-700 font-mono"
                />
              </div>

              <div className="pt-2 text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-900">
                <p>💡 <strong>Note:</strong> Custom App IDs must be registered in the <a href="https://api.deriv.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Deriv Developer Portal</a> for your current domain origins.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer OK closing button */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-900 rounded-b-xl flex items-center justify-end">
          <button
            id="btn-save-settings"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
