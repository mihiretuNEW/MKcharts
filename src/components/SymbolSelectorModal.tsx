/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SymbolInfo } from '../types';
import { Search, X, TrendingUp, Cpu, Coins, ShieldAlert } from 'lucide-react';

interface SymbolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: SymbolInfo[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

type MarketCategory = 'all' | 'synthetic_index' | 'cryptocurrency' | 'forex';

export const SymbolSelectorModal: React.FC<SymbolSelectorModalProps> = ({
  isOpen,
  onClose,
  symbols,
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<MarketCategory>('all');

  const filteredSymbols = useMemo(() => {
    return symbols.filter((sym) => {
      // Search matches
      const matchesSearch = 
        sym.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sym.display_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Category matches
      const matchesCategory = activeTab === 'all' || sym.market === activeTab;

      return matchesSearch && matchesCategory;
    });
  }, [symbols, searchTerm, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div 
        id="symbol-modal"
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-400" />
            Select Trading Asset
          </h3>
          <button 
            id="close-symbol-modal"
            onClick={onClose} 
            className="p-1 hover:bg-neutral-900 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input bar */}
        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              id="symbol-search-input"
              type="text"
              placeholder="Search symbol (e.g. Volatility, BTC, Jump, XAU)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs for Category Filters */}
        <div className="flex px-4 py-2 bg-neutral-950 gap-1 border-b border-neutral-800 overflow-x-auto scrollbar-none">
          {(['all', 'synthetic_index', 'cryptocurrency', 'forex'] as const).map((tab) => {
            const label = {
              all: 'All Assets',
              synthetic_index: 'Synthetic Indices',
              cryptocurrency: 'Cryptocurrency',
              forex: 'Forex & Gold',
            }[tab];

            const isActive = activeTab === tab;

            return (
              <button
                id={`tab-market-${tab}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Symbols List results area */}
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-1 max-h-[50vh]">
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((sym) => {
              const isSelected = sym.symbol === selectedSymbol;
              
              // Custom asset tag visual helper
              let marketTag = 'Volatility';
              let tagColor = 'bg-blue-950/40 text-blue-400 border-blue-900/35';
              
              if (sym.symbol.toUpperCase().startsWith('JD')) {
                marketTag = 'Jump Index';
                tagColor = 'bg-green-950/40 text-green-400 border-green-900/35';
              } else if (sym.market === 'cryptocurrency') {
                marketTag = 'Crypto';
                tagColor = 'bg-yellow-950/40 text-yellow-400 border-yellow-900/35';
              } else if (sym.symbol.toUpperCase().includes('XAU')) {
                marketTag = 'Metal / Gold';
                tagColor = 'bg-amber-950/40 text-amber-400 border-amber-900/35';
              } else if (sym.market === 'forex' || sym.symbol.toUpperCase().startsWith('FRX')) {
                marketTag = 'Forex';
                tagColor = 'bg-purple-950/40 text-purple-400 border-purple-900/35';
              }

              return (
                <button
                  id={`symbol-item-${sym.symbol}`}
                  key={sym.symbol}
                  onClick={() => {
                    onSelectSymbol(sym.symbol);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                    isSelected 
                      ? 'bg-blue-600/20 border border-blue-500/40' 
                      : 'hover:bg-neutral-900 border border-transparent'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-bold tracking-wide text-blue-400">
                      {sym.symbol}
                    </span>
                    <span className="text-xs text-neutral-300 mt-0.5">
                      {sym.display_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${tagColor}`}>
                      {marketTag}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow shadow-green-500" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <ShieldAlert className="w-8 h-8 text-neutral-800 mb-2" />
              <p className="text-sm">No assets match your search filters.</p>
              <button 
                onClick={() => { setSearchTerm(''); setActiveTab('all'); }} 
                className="mt-3 text-xs text-blue-400 hover:underline"
              >
                Clear searches
              </button>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-900 rounded-b-xl flex items-center justify-between text-xs text-neutral-500">
          <span>Total assets loaded: <strong>{symbols.length}</strong></span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Deriv default API live
          </span>
        </div>
      </div>
    </div>
  );
};
