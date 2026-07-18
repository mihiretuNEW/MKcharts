/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimeframeId, SymbolInfo } from '../types';
import { TIMEFRAMES } from '../hooks/useDerivWS';
import { Sparkles, Settings, Globe, ArrowUpRight, TrendingUp, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TopToolbarProps {
  selectedSymbol: string;
  symbols: SymbolInfo[];
  selectedTimeframe: TimeframeId;
  onSelectTimeframe: (id: TimeframeId) => void;
  onOpenSymbolModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenIndicators?: () => void;
  isConnected: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  selectedSymbol,
  symbols,
  selectedTimeframe,
  onSelectTimeframe,
  onOpenSymbolModal,
  onOpenSettingsModal,
  onOpenIndicators,
  isConnected,
  theme,
  onToggleTheme,
}) => {
  const symbolInfo = symbols.find((s) => s.symbol === selectedSymbol);
  const { logout } = useAuth();

  const handleIndicatorClick = () => {
    if (onOpenIndicators) {
      onOpenIndicators();
    }
  };

  return (
    <div 
      id="top-toolbar" 
      className="h-14 bg-black border-b border-neutral-800 flex items-center justify-between px-4 select-none z-20"
    >
      {/* Brand Title and Symbol Selection dropdown */}
      <div className="flex items-center gap-4">
        {/* Replace TradingView logo with Mihiretu View */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black tracking-tighter shadow-lg shadow-blue-600/30">
            MV
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight text-white">
            Mihiretu <span className="text-blue-500 font-normal">View</span>
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-neutral-800" />

        {/* Dynamic symbol selector dropdown button */}
        <button
          id="btn-trigger-symbol-modal"
          onClick={onOpenSymbolModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg border border-neutral-800 text-xs font-bold font-mono transition-all duration-150 hover:scale-[1.02]"
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>{selectedSymbol}</span>
          <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px] hidden sm:inline">
            {symbolInfo ? `(${symbolInfo.display_name})` : ''}
          </span>
          <span className="text-[8px] bg-blue-900/50 text-blue-300 font-sans px-1 rounded uppercase">
            Select
          </span>
        </button>
      </div>

      {/* Center Timeframe selection buttons */}
      <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 max-w-full overflow-x-auto">
        {TIMEFRAMES.map((tf) => {
          const isActive = selectedTimeframe === tf.id;
          return (
            <button
              id={`tf-select-${tf.id}`}
              key={tf.id}
              onClick={() => onSelectTimeframe(tf.id)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {/* Right utilities & configuration controls */}
      <div className="flex items-center gap-3">
        {/* Indicators Trigger placeholder */}
        <button
          id="btn-indicators-placeholder"
          onClick={handleIndicatorClick}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 hover:bg-neutral-800 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Indicators</span>
        </button>

        {/* Quick theme toggler */}
        <button
          id="btn-quick-theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light theme" : "Switch to Dark theme"}
          className="p-2 hover:bg-neutral-800 text-gray-300 hover:text-white rounded-lg transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-blue-400" />
          )}
        </button>

        {/* Settings modal trigger */}
        <button
          id="btn-trigger-settings-modal"
          onClick={onOpenSettingsModal}
          title="Chart Settings"
          className="p-2 hover:bg-neutral-800 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* Logout trigger */}
        <button
          id="btn-trigger-logout"
          onClick={logout}
          title="Log Out"
          className="p-2 hover:bg-red-950/30 text-gray-400 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-neutral-800 hidden sm:block" />

        {/* Deriv WS connection indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full shadow ${
            isConnected 
              ? 'bg-green-500 shadow-green-500/50' 
              : 'bg-red-500 shadow-red-500/50 animate-pulse'
          }`} />
          <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase hidden lg:inline">
            {isConnected ? 'Deriv Live' : 'Connecting'}
          </span>
        </div>
      </div>
    </div>
  );
};
