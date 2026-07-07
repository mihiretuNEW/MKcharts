/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DrawingType } from '../types';
import { 
  MousePointer, 
  TrendingUp, 
  Minus, 
  Percent, 
  Trash2, 
  Magnet, 
  Sparkles 
} from 'lucide-react';

interface LeftToolbarProps {
  activeTool: DrawingType;
  setActiveTool: (tool: DrawingType) => void;
  onClearDrawings: () => void;
  drawingsCount: number;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  setActiveTool,
  onClearDrawings,
  drawingsCount,
}) => {
  const tools = [
    { id: 'cursor' as DrawingType, label: 'Cursor (Drag/Edit)', icon: MousePointer, color: 'text-gray-400 hover:text-white' },
    { id: 'trend' as DrawingType, label: 'Trend Line', icon: TrendingUp, color: 'text-blue-400 hover:text-blue-300' },
    { id: 'horizontal' as DrawingType, label: 'Horizontal Line', icon: Minus, color: 'text-purple-400 hover:text-purple-300' },
    { id: 'risk_reward' as DrawingType, label: 'Risk/Reward Tool', icon: Percent, color: 'text-green-400 hover:text-green-300' },
  ];

  return (
    <div 
      id="left-toolbar" 
      className="w-14 bg-black border-r border-neutral-800 flex flex-col items-center py-4 justify-between select-none z-10"
    >
      {/* Upper tools collection */}
      <div className="flex flex-col items-center gap-4 w-full">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          const Icon = t.icon;

          return (
            <button
              id={`tool-${t.id}`}
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`p-2.5 rounded-lg transition-all relative group flex items-center justify-center ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg scale-105' 
                  : 'text-gray-400 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {/* Tooltip bubble */}
              <div className="absolute left-16 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {t.label}
              </div>
            </button>
          );
        })}

        {/* Separator line */}
        <div className="w-8 h-px bg-neutral-800 my-2" />

        {/* Info label about active mode */}
        <div className="text-[10px] text-gray-500 font-medium text-center uppercase tracking-wider leading-none">
          {activeTool === 'cursor' ? 'Select' : 'Draw'}
        </div>
      </div>

      {/* Clear/Trash drawings controls at the bottom */}
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          id="btn-clear-drawings"
          onClick={() => {
            if (drawingsCount === 0) return;
            onClearDrawings();
          }}
          disabled={drawingsCount === 0}
          title="Delete All Drawings"
          className={`p-2.5 rounded-lg transition-all relative group flex items-center justify-center ${
            drawingsCount > 0
              ? 'text-red-400 hover:bg-red-950/40 hover:text-red-200'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-5 h-5" />
          {/* Badge counter */}
          {drawingsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full border border-black min-w-4 text-center">
              {drawingsCount}
            </span>
          )}
          <div className="absolute left-16 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Clear all drawings
          </div>
        </button>

        {/* Decorative Magnet/Snapping active state indicator */}
        <div 
          title="Magnet snap helper is automatically active. Click near High, Low, Open, or Close values of candles to snap drawings."
          className="p-2 text-blue-400/80 hover:text-blue-300 transition-colors flex flex-col items-center justify-center cursor-help"
        >
          <Magnet className="w-4 h-4 animate-pulse" />
          <span className="text-[8px] text-gray-500 font-mono mt-0.5">AUTO</span>
        </div>
      </div>
    </div>
  );
};
