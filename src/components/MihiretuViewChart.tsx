/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, Drawing, DrawingPoint, DrawingType, ChartSettings, RiskRewardConfig, TimeframeId } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TIMEFRAMES } from '../hooks/useDerivWS';
import { calculateGTATrend } from '../utils/gtaIndicator';
import { calculateTrendlinesWithBreaks, calculateSmartMoneyConcepts, calculateSignalsAndOverlays, calculateConfluenceFVG, FVGZone, calculateIctConcepts } from '../utils/premiumIndicators';

interface MihiretuViewChartProps {
  candles: Candle[];
  symbolName: string;
  activeTool: DrawingType;
  setActiveTool: (tool: DrawingType) => void;
  drawings: Drawing[];
  setDrawings: React.Dispatch<React.SetStateAction<Drawing[]>>;
  settings: ChartSettings;
  timeframe: TimeframeId;
}

export const MihiretuViewChart: React.FC<MihiretuViewChartProps> = ({
  candles,
  symbolName,
  activeTool,
  setActiveTool,
  drawings,
  setDrawings,
  settings,
  timeframe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Zoom & Pan State
  const [candleWidth, setCandleWidth] = useState(8); // Width of each candle in pixels
  const [scrollOffset, setScrollOffset] = useState(0); // Offset in pixels from the right-most edge

  // Interactivity State
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDrawingInProgress, setIsDrawingInProgress] = useState(false);
  const [newDrawingPoints, setNewDrawingPoints] = useState<DrawingPoint[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draggedDrawingId, setDraggedDrawingId] = useState<string | null>(null);
  const [draggedHandleIndex, setDraggedHandleIndex] = useState<number | null>(null); // -1 for dragging body, >=0 for handle
  const [dragOffset, setDragOffset] = useState<{ time: number; price: number } | null>(null);

  // Snapping state
  const [snappedPoint, setSnappedPoint] = useState<DrawingPoint | null>(null);

  // Touch gesture refs for mobile support
  const touchStartRef = useRef<{ startX: number; startY: number; startScrollOffset: number; isDraggingDrawing: boolean } | null>(null);
  const touchPinchRef = useRef<{ startDist: number; startCandleWidth: number; startScrollOffset: number; centerX: number; indexAtCenter: number } | null>(null);

  // Compute GTA Trend Filter results
  const gtaResults = useMemo(() => {
    if (!settings.indicators.showGTA || candles.length === 0) return [];
    return calculateGTATrend(
      candles,
      settings.indicators.gtaLongPeriod ?? 21,
      settings.indicators.gtaMidPeriod ?? 13,
      settings.indicators.gtaShortPeriod ?? 6,
      settings.indicators.gtaArrowOffset ?? 0.10
    );
  }, [
    candles,
    settings.indicators.showGTA,
    settings.indicators.gtaLongPeriod,
    settings.indicators.gtaMidPeriod,
    settings.indicators.gtaShortPeriod,
    settings.indicators.gtaArrowOffset,
  ]);

  // Compute Trendlines with Breaks (TWB)
  const twbResults = useMemo(() => {
    if (!settings.indicators.showTrendlinesWithBreaks || candles.length === 0) return null;
    return calculateTrendlinesWithBreaks(
      candles,
      settings.indicators.twbLength ?? 14,
      settings.indicators.twbSlopeMultiplier ?? 1.6,
      settings.indicators.twbSlopeMethod ?? 'atr'
    );
  }, [
    candles,
    settings.indicators.showTrendlinesWithBreaks,
    settings.indicators.twbLength,
    settings.indicators.twbSlopeMultiplier,
    settings.indicators.twbSlopeMethod,
  ]);

  // Compute Smart Money Concepts (SMC)
  const smcResults = useMemo(() => {
    if (!settings.indicators.showSmartMoneyConcepts || candles.length === 0) return null;
    return calculateSmartMoneyConcepts(
      candles,
      settings.indicators.smcSwingLookback ?? 10,
      settings.indicators.smcObLimit ?? 5
    );
  }, [
    candles,
    settings.indicators.showSmartMoneyConcepts,
    settings.indicators.smcSwingLookback,
    settings.indicators.smcObLimit,
  ]);

  // Compute Signals & Overlays (SO)
  const soResults = useMemo(() => {
    if (!settings.indicators.showSignalsAndOverlays || candles.length === 0) return null;
    return calculateSignalsAndOverlays(
      candles,
      settings.indicators.soSensitivity ?? 12,
      settings.indicators.soSignalMode ?? 'confirmation'
    );
  }, [
    candles,
    settings.indicators.showSignalsAndOverlays,
    settings.indicators.soSensitivity,
    settings.indicators.soSignalMode,
  ]);

  // Compute Confluence FVG Finder
  const fvgResults = useMemo(() => {
    if (!settings.indicators.showConfluenceFVG || candles.length === 0) return null;
    return calculateConfluenceFVG(candles, timeframe, settings.indicators);
  }, [candles, timeframe, settings.indicators]);

  // Compute ICT Concepts
  const ictResults = useMemo(() => {
    if (!settings.indicators.showIctConcepts || candles.length === 0) return null;
    return calculateIctConcepts(candles, settings.indicators);
  }, [candles, settings.indicators]);

  const RIGHT_SCALE_WIDTH = 75;
  const BOTTOM_SCALE_HEIGHT = 28;

  const chartWidth = dimensions.width - RIGHT_SCALE_WIDTH;
  const chartHeight = dimensions.height - BOTTOM_SCALE_HEIGHT;

  // Track size changes on the container
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 200),
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute indices range of visible candles
  const visibleRange = useMemo(() => {
    if (candles.length === 0) return { start: 0, end: 0, minPrice: 0, maxPrice: 100 };

    const paddingRight = 50; // px padding on right before the latest candle
    // We render from right to left
    // x = chartWidth - paddingRight - (candles.length - 1 - i) * candleWidth + scrollOffset
    // We want to find i such that x is between 0 and chartWidth

    // Let's compute min & max index that fits inside chartWidth
    // For i:
    // x(i) = chartWidth - paddingRight + scrollOffset - (candles.length - 1 - i) * candleWidth
    // To be on screen:
    // 0 <= x(i) <= chartWidth
    
    let startIdx = 0;
    let endIdx = candles.length - 1;

    // We can iterate or do direct math
    const rightmostX = chartWidth - paddingRight + scrollOffset;
    
    // Find the index of the candle at the rightmost edge of screen
    const rightmostCandleFloat = (candles.length - 1) - (chartWidth - paddingRight + scrollOffset - chartWidth) / candleWidth;
    const leftmostCandleFloat = (candles.length - 1) - rightmostX / candleWidth;

    startIdx = Math.max(0, Math.floor(leftmostCandleFloat) - 2);
    endIdx = Math.min(candles.length - 1, Math.ceil(rightmostCandleFloat) + 2);

    // Filter visible candles to find min/max price for auto-scaling
    const visibleCandles = candles.slice(startIdx, endIdx + 1);
    
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    if (visibleCandles.length > 0) {
      visibleCandles.forEach((c) => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });
    } else {
      minPrice = 0;
      maxPrice = 100;
    }

    // Add 10% breathing space padding to top/bottom
    const priceDiff = maxPrice - minPrice || 1.0;
    minPrice -= priceDiff * 0.08;
    maxPrice += priceDiff * 0.08;

    return {
      start: startIdx,
      end: endIdx,
      minPrice,
      maxPrice,
    };
  }, [candles, candleWidth, scrollOffset, chartWidth]);

  // Coordinates Mapping
  const getXFromIndex = (index: number) => {
    const paddingRight = 50;
    return chartWidth - paddingRight + scrollOffset - (candles.length - 1 - index) * candleWidth;
  };

  const getIndexFromX = (x: number) => {
    const paddingRight = 50;
    // x = chartWidth - paddingRight + scrollOffset - (candles.length - 1 - index) * candleWidth
    // (candles.length - 1 - index) * candleWidth = chartWidth - paddingRight + scrollOffset - x
    const candlesFromRight = (chartWidth - paddingRight + scrollOffset - x) / candleWidth;
    return Math.round(candles.length - 1 - candlesFromRight);
  };

  const getPriceFromY = (y: number) => {
    const { minPrice, maxPrice } = visibleRange;
    return maxPrice - (y / chartHeight) * (maxPrice - minPrice);
  };

  const getYFromPrice = (price: number) => {
    const { minPrice, maxPrice } = visibleRange;
    return ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;
  };

  // Convert (time, price) space to canvas pixel coordinates
  const getCanvasCoords = (point: DrawingPoint) => {
    // Find index of the closest candle with this timestamp
    let index = candles.findIndex((c) => c.time === point.time);
    if (index === -1) {
      // If candle timestamp is missing (e.g. gap or before/after range), interpolate index
      if (candles.length > 0) {
        if (point.time < candles[0].time) {
          // Extrapolate left
          const diffSec = candles[0].time - point.time;
          const avgCandleSec = candles.length > 1 ? (candles[1].time - candles[0].time) : 60;
          index = -Math.round(diffSec / avgCandleSec);
        } else {
          // Extrapolate right
          const diffSec = point.time - candles[candles.length - 1].time;
          const avgCandleSec = candles.length > 1 ? (candles[candles.length - 1].time - candles[candles.length - 2].time) : 60;
          index = candles.length - 1 + Math.round(diffSec / avgCandleSec);
        }
      } else {
        index = 0;
      }
    }
    return {
      x: getXFromIndex(index),
      y: getYFromPrice(point.price),
    };
  };

  // Convert canvas pixel coordinates to (time, price) space
  const getSpaceCoords = (x: number, y: number) => {
    const price = getPriceFromY(y);
    const index = getIndexFromX(x);
    let time = 0;

    if (candles.length > 0) {
      if (index >= 0 && index < candles.length) {
        time = candles[index].time;
      } else if (index < 0) {
        const diffIndex = -index;
        const avgCandleSec = candles.length > 1 ? (candles[1].time - candles[0].time) : 60;
        time = candles[0].time - diffIndex * avgCandleSec;
      } else {
        const diffIndex = index - (candles.length - 1);
        const avgCandleSec = candles.length > 1 ? (candles[candles.length - 1].time - candles[candles.length - 2].time) : 60;
        time = candles[candles.length - 1].time + diffIndex * avgCandleSec;
      }
    } else {
      time = Math.round(Date.now() / 1000);
    }

    return { time, price };
  };

  // Reset zoom and pan to fit latest data perfectly
  const resetZoomPan = () => {
    setCandleWidth(8);
    setScrollOffset(0);
  };

  // Trigger repaint on state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set sizes
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const isDark = settings.theme === 'dark';
    const bg = isDark ? '#131722' : '#ffffff';
    const borderCol = isDark ? '#2a2e39' : '#e0e3eb';
    const textCol = isDark ? '#d1d4dc' : '#131722';
    const gridColor = isDark ? '#1f222e' : '#f0f3fa';

    // Set canvas resolution for crisp lines
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Draw background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (candles.length === 0) {
      // Draw Loading or Empty State
      ctx.fillStyle = textCol;
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Connecting to Deriv WebSocket and fetching market data...', dimensions.width / 2, dimensions.height / 2);
      return;
    }

    // 1. Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;

    const { minPrice, maxPrice, start, end } = visibleRange;

    // Vertical grid lines (Time indices)
    const labelSpacing = Math.max(1, Math.floor(60 / candleWidth)); // Show labels dynamically based on zoom
    for (let i = start; i <= end; i++) {
      if (i % (labelSpacing * 5) === 0) {
        const x = getXFromIndex(i);
        if (x >= 0 && x <= chartWidth && settings.appearance.gridType !== 'horizontal' && settings.appearance.gridType !== 'none') {
          ctx.beginPath();
          if (settings.appearance.gridStyle === 'dashed') {
            ctx.setLineDash([4, 4]);
          } else {
            ctx.setLineDash([]);
          }
          ctx.moveTo(x, 0);
          ctx.lineTo(x, chartHeight);
          ctx.stroke();
        }
      }
    }

    // Horizontal grid lines (Price levels)
    const priceRange = maxPrice - minPrice;
    const priceStep = getNicePriceStep(priceRange);
    const startPrice = Math.ceil(minPrice / priceStep) * priceStep;

    ctx.setLineDash(settings.appearance.gridStyle === 'dashed' ? [4, 4] : []);
    for (let p = startPrice; p <= maxPrice; p += priceStep) {
      const y = getYFromPrice(p);
      if (y >= 0 && y <= chartHeight && settings.appearance.gridType !== 'vertical' && settings.appearance.gridType !== 'none') {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]); // Reset dash

    // 2. Draw Candlesticks
    const drawUpArrow = (ax: number, ay: number, size = 6) => {
      ctx.fillStyle = '#10b981'; // Vivid Green
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - size, ay + size);
      ctx.lineTo(ax - size / 2, ay + size);
      ctx.lineTo(ax - size / 2, ay + size * 2);
      ctx.lineTo(ax + size / 2, ay + size * 2);
      ctx.lineTo(ax + size / 2, ay + size);
      ctx.lineTo(ax + size, ay + size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const drawDownArrow = (ax: number, ay: number, size = 6) => {
      ctx.fillStyle = '#ef4444'; // Vivid Red
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - size, ay - size);
      ctx.lineTo(ax - size / 2, ay - size);
      ctx.lineTo(ax - size / 2, ay - size * 2);
      ctx.lineTo(ax + size / 2, ay - size * 2);
      ctx.lineTo(ax + size / 2, ay - size);
      ctx.lineTo(ax + size, ay - size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    candles.forEach((c, idx) => {
      if (idx < start - 2 || idx > end + 2) return; // Skip off-screen candles

      const x = getXFromIndex(idx);
      const openY = getYFromPrice(c.open);
      const closeY = getYFromPrice(c.close);
      const highY = getYFromPrice(c.high);
      const lowY = getYFromPrice(c.low);

      const isBullish = c.close >= c.open;
      let bodyColor = isBullish ? settings.candle.upColor : settings.candle.downColor;
      let borderColor = isBullish ? settings.candle.borderUpColor : settings.candle.borderDownColor;
      let wickColor = isBullish ? settings.candle.wickUpColor : settings.candle.wickDownColor;

      // GTA State Override
      if (settings.indicators.showGTA && gtaResults && gtaResults[idx]) {
        const gta = gtaResults[idx];
        if (gta.colorState === 0) {
          bodyColor = '#10b981'; // Green
          borderColor = '#047857';
          wickColor = '#047857';
        } else if (gta.colorState === 1) {
          bodyColor = '#ef4444'; // Red
          borderColor = '#b91c1c';
          wickColor = '#b91c1c';
        } else if (gta.colorState === 2) {
          const neutralCol = isDark ? '#64748b' : '#94a3b8'; // Slate Grey accent
          bodyColor = neutralCol;
          borderColor = isDark ? '#475569' : '#cbd5e1';
          wickColor = isDark ? '#475569' : '#cbd5e1';
        }
      }

      // Draw Wick
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw Candle Body
      const bodyWidth = Math.max(1, candleWidth - 2);
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      const rectY = Math.min(openY, closeY);
      const rectHeight = Math.max(1, Math.abs(openY - closeY));

      ctx.fillRect(x - bodyWidth / 2, rectY, bodyWidth, rectHeight);
      ctx.strokeRect(x - bodyWidth / 2, rectY, bodyWidth, rectHeight);

      // Draw Signal Arrows (if enabled)
      if (settings.indicators.showGTA && gtaResults && gtaResults[idx]) {
        const gta = gtaResults[idx];
        if (gta.buyArrow !== null) {
          drawUpArrow(x, getYFromPrice(gta.buyArrow), 6);
        }
        if (gta.sellArrow !== null) {
          drawDownArrow(x, getYFromPrice(gta.sellArrow), 6);
        }
      }
    });

    // 3. Render Technical Indicator (Moving Average Placeholder)
    if (settings.indicators.showMA) {
      const period = settings.indicators.maPeriod;
      ctx.strokeStyle = '#2962ff'; // Custom blue color for MA
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;

      for (let i = start; i <= end; i++) {
        if (i < period - 1) continue;
        
        // Simple Moving Average
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += candles[i - j].close;
        }
        const maVal = sum / period;
        const x = getXFromIndex(i);
        const y = getYFromPrice(maVal);

        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Render GTA EMAs (if enabled and toggled ON)
    if (settings.indicators.showGTA && settings.indicators.showGTAEMAs && gtaResults && gtaResults.length > 0) {
      const drawEMALine = (key: 'emaShort' | 'emaMid' | 'emaLong', color: string, width = 1.25) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let first = true;
        
        for (let i = start; i <= end; i++) {
          if (i < 0 || i >= gtaResults.length) continue;
          const val = gtaResults[i][key];
          if (isNaN(val)) continue;
          
          const x = getXFromIndex(i);
          const y = getYFromPrice(val);
          
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      drawEMALine('emaLong', '#f59e0b', 1.5); // Warm Gold/Amber for Anchor Line
      drawEMALine('emaMid', '#a855f7', 1.25); // Purple for Baseline
      drawEMALine('emaShort', '#06b6d4', 1.25); // Vibrant Cyan for Velocity Line
    }

    // Render LuxAlgo Trendlines with Breaks (TWB)
    if (settings.indicators.showTrendlinesWithBreaks && twbResults) {
      // 1. Draw upper resistance line
      ctx.strokeStyle = '#ef4444'; // Red resistance
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let firstUpper = true;
      for (let i = start; i <= end; i++) {
        if (i < 0 || i >= twbResults.upperLine.length) continue;
        const val = twbResults.upperLine[i];
        if (val === null) {
          if (!firstUpper) {
            ctx.stroke();
            ctx.beginPath();
            firstUpper = true;
          }
          continue;
        }
        const x = getXFromIndex(i);
        const y = getYFromPrice(val);
        if (firstUpper) {
          ctx.moveTo(x, y);
          firstUpper = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 2. Draw lower support line
      ctx.strokeStyle = '#10b981'; // Green support
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let firstLower = true;
      for (let i = start; i <= end; i++) {
        if (i < 0 || i >= twbResults.lowerLine.length) continue;
        const val = twbResults.lowerLine[i];
        if (val === null) {
          if (!firstLower) {
            ctx.stroke();
            ctx.beginPath();
            firstLower = true;
          }
          continue;
        }
        const x = getXFromIndex(i);
        const y = getYFromPrice(val);
        if (firstLower) {
          ctx.moveTo(x, y);
          firstLower = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 3. Draw breakout signals (Arrows & Labels)
      if (settings.indicators.twbShowSignals ?? true) {
        for (let i = start; i <= end; i++) {
          if (i < 0 || i >= candles.length) continue;
          const x = getXFromIndex(i);
          const c = candles[i];
          
          if (twbResults.buyBreaks[i]) {
            drawUpArrow(x, getYFromPrice(c.low) - 14, 7);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('B', x, getYFromPrice(c.low) - 26);
          }
          if (twbResults.sellBreaks[i]) {
            drawDownArrow(x, getYFromPrice(c.high) + 14, 7);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('B', x, getYFromPrice(c.high) + 26);
          }
        }
      }
    }

    // Render Smart Money Concepts (SMC)
    if (settings.indicators.showSmartMoneyConcepts && smcResults) {
      const activeObLimit = settings.indicators.smcObLimit ?? 5;

      // 1. Draw Order Blocks (OB) Shaded Rectangles
      if (settings.indicators.smcShowOrderBlocks) {
        // Render order blocks (let's only draw active or recent blocks up to limit)
        const recentOBs = [...smcResults.orderBlocks]
          .sort((a, b) => b.startIndex - a.startIndex)
          .slice(0, activeObLimit * 2); // get enough blocks

        recentOBs.forEach((ob) => {
          // Determine boundaries
          const startIdx = ob.startIndex;
          const endIdx = ob.endIndex !== null ? ob.endIndex : candles.length - 1;

          // Check if OB overlaps with visible range
          if (startIdx > end || endIdx < start) return;

          const xStart = getXFromIndex(Math.max(start, startIdx));
          const xEnd = getXFromIndex(Math.min(end, endIdx));
          const yTop = getYFromPrice(ob.top);
          const yBottom = getYFromPrice(ob.bottom);

          const w = xEnd - xStart;
          const h = yBottom - yTop;

          // Styling
          ctx.save();
          if (ob.isBullish) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.08)'; // Very soft green demand zone
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
          } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; // Very soft red supply zone
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          }
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          // Draw OB Rectangle
          ctx.fillRect(xStart, yTop, w, h);
          ctx.strokeRect(xStart, yTop, w, h);

          // Draw OB indicator tag
          ctx.restore();
          ctx.fillStyle = ob.isBullish ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(ob.isBullish ? '+OB' : '-OB', xStart + 4, yTop + 10);
        });
      }

      // 2. Draw BOS & CHoCH structural lines
      smcResults.bosChochLines.forEach((line) => {
        // Only draw if line overlaps with visible window
        if (line.startIndex > end || line.endIndex < start) return;

        const xStart = getXFromIndex(Math.max(start, line.startIndex));
        const xEnd = getXFromIndex(Math.min(end, line.endIndex));
        const y = getYFromPrice(line.level);

        ctx.save();
        ctx.strokeStyle = line.isBullish ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1.25;
        ctx.setLineDash([2, 3]);

        // Draw dotted line
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
        ctx.stroke();

        // Label string
        const labelText = line.type; // "BOS" or "CHoCH"
        const drawLabel = (line.type === 'BOS' && settings.indicators.smcShowBOS) ||
                           (line.type === 'CHoCH' && settings.indicators.smcShowCHoCH);

        if (drawLabel) {
          ctx.restore();
          ctx.fillStyle = line.isBullish ? '#10b981' : '#ef4444';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          // Draw small solid label background
          const labelWidth = ctx.measureText(labelText).width + 6;
          const labelX = (xStart + xEnd) / 2;
          ctx.fillStyle = isDark ? '#000000' : '#ffffff';
          ctx.fillRect(labelX - labelWidth / 2, y - 5, labelWidth, 10);
          
          ctx.fillStyle = line.isBullish ? '#10b981' : '#ef4444';
          ctx.fillText(labelText, labelX, y + 3);
        } else {
          ctx.restore();
        }
      });
    }

    // Render LuxAlgo® - Signals & Overlays™
    if (settings.indicators.showSignalsAndOverlays && soResults) {
      // 1. Render Shaded Ribbon
      if (settings.indicators.soShowRibbon) {
        ctx.save();
        for (let i = start; i < end; i++) {
          if (i < 0 || i >= soResults.fastFilter.length - 1) continue;
          const x1 = getXFromIndex(i);
          const x2 = getXFromIndex(i + 1);
          
          const fastY1 = getYFromPrice(soResults.fastFilter[i]);
          const fastY2 = getYFromPrice(soResults.fastFilter[i + 1]);
          
          const slowY1 = getYFromPrice(soResults.slowFilter[i]);
          const slowY2 = getYFromPrice(soResults.slowFilter[i + 1]);
          
          const isBullish = soResults.fastFilter[i] > soResults.slowFilter[i];
          ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
          
          ctx.beginPath();
          ctx.moveTo(x1, fastY1);
          ctx.lineTo(x2, fastY2);
          ctx.lineTo(x2, slowY2);
          ctx.lineTo(x1, slowY1);
          ctx.closePath();
          ctx.fill();
        }

        // Render the Fast Filter Line (glowing boundary)
        ctx.lineWidth = 1.5;
        for (let i = start; i < end; i++) {
          if (i < 0 || i >= soResults.fastFilter.length - 1) continue;
          const x1 = getXFromIndex(i);
          const x2 = getXFromIndex(i + 1);
          const y1 = getYFromPrice(soResults.fastFilter[i]);
          const y2 = getYFromPrice(soResults.fastFilter[i + 1]);
          const isBullish = soResults.fastFilter[i] > soResults.slowFilter[i];
          ctx.strokeStyle = isBullish ? '#10b981' : '#ef4444';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Render Confirmation / Contrarian Buy/Sell Signals
      if (soResults.signals) {
        soResults.signals.forEach((sig) => {
          if (sig.index < start || sig.index > end) return;
          const x = getXFromIndex(sig.index);
          const c = candles[sig.index];

          if (sig.type === 'buy' || sig.type === 'strong_buy') {
            const isStrong = sig.type === 'strong_buy';
            if (isStrong && !settings.indicators.soShowStrongSignals) return;

            // Arrow below the low of the candle
            const arrowY = getYFromPrice(c.low) - 15;
            drawUpArrow(x, arrowY, isStrong ? 9 : 7);

            ctx.fillStyle = isStrong ? '#10b981' : '#34d399';
            ctx.font = isStrong ? 'bold 10px monospace' : 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(isStrong ? 'STRONG BUY' : 'BUY', x, arrowY - 12);
          } else if (sig.type === 'sell' || sig.type === 'strong_sell') {
            const isStrong = sig.type === 'strong_sell';
            if (isStrong && !settings.indicators.soShowStrongSignals) return;

            // Arrow above the high of the candle
            const arrowY = getYFromPrice(c.high) + 15;
            drawDownArrow(x, arrowY, isStrong ? 9 : 7);

            ctx.fillStyle = isStrong ? '#ef4444' : '#f87171';
            ctx.font = isStrong ? 'bold 10px monospace' : 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(isStrong ? 'STRONG SELL' : 'SELL', x, arrowY + 18);
          }
        });
      }

      // 3. Render Exit Signals (+ or x tags)
      if (settings.indicators.soShowExitSignals && soResults.exits) {
        soResults.exits.forEach((ex) => {
          if (ex.index < start || ex.index > end) return;
          const x = getXFromIndex(ex.index);
          const c = candles[ex.index];

          if (ex.type === 'exit_buy') {
            const y = getYFromPrice(c.high) + 12;
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('×', x, y);
            ctx.font = '7px monospace';
            ctx.fillText('EXIT L', x, y + 8);
          } else if (ex.type === 'exit_sell') {
            const y = getYFromPrice(c.low) - 12;
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+', x, y);
            ctx.font = '7px monospace';
            ctx.fillText('EXIT S', x, y - 6);
          }
        });
      }
    }

    // Render Confluence FVG Finder
    if (settings.indicators.showConfluenceFVG && fvgResults) {
      ctx.save();
      
      const drawZone = (z: FVGZone, isBullish: boolean) => {
        const baseColorHex = isBullish ? settings.indicators.fvgBullishColor : settings.indicators.fvgBearishColor;
        const borderColorHex = isBullish ? settings.indicators.fvgBullishBorderColor : settings.indicators.fvgBearishBorderColor;
        
        const hexToRgba = (hex: string, alpha: number) => {
          const cleanHex = hex.replace('#', '');
          const r = parseInt(cleanHex.substring(0, 2), 16) || 128;
          const g = parseInt(cleanHex.substring(2, 4), 16) || 128;
          const b = parseInt(cleanHex.substring(4, 6), 16) || 128;
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        let fillStyle = 'rgba(139, 139, 139, 0.04)';
        let strokeStyle = 'rgba(139, 139, 139, 0.2)';
        
        if (z.isMitigated) {
          fillStyle = 'rgba(139, 139, 139, 0.04)';
          strokeStyle = 'rgba(139, 139, 139, 0.15)';
        } else {
          fillStyle = hexToRgba(baseColorHex, 0.08);
          strokeStyle = hexToRgba(borderColorHex, 0.6);
        }

        const startX = getCanvasCoords({ time: z.formTime, price: 0 }).x;
        const topY = getYFromPrice(z.top);
        const botY = getYFromPrice(z.bot);
        const height = botY - topY;

        let endX = chartWidth;
        if (z.isMitigated && z.mitigatedAtTime) {
          endX = getCanvasCoords({ time: z.mitigatedAtTime, price: 0 }).x;
        }

        if (startX > chartWidth || (z.isMitigated && z.mitigatedAtTime && endX < 0)) return;

        // 1. Draw Background Fill
        ctx.fillStyle = fillStyle;
        ctx.fillRect(startX, topY, endX - startX, height);

        // 2. Draw Borders (Top & Bottom lines + Left line, Right line only if mitigated)
        ctx.beginPath();
        // Top line
        ctx.moveTo(startX, topY);
        ctx.lineTo(endX, topY);
        // Bottom line
        ctx.moveTo(startX, botY);
        ctx.lineTo(endX, botY);
        // Left line
        ctx.moveTo(startX, topY);
        ctx.lineTo(startX, botY);
        // Right line (only if mitigated)
        if (z.isMitigated) {
          ctx.moveTo(endX, topY);
          ctx.lineTo(endX, botY);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = settings.indicators.fvgBorderWidth ?? 1.5;
        ctx.stroke();

        // 3. Draw Pill Label (exactly like TradingView LuxAlgo original)
        if (settings.indicators.fvgShowLabels && !z.isMitigated) {
          ctx.save();
          const labelText = isBullish ? 'Bull FVG' : 'Bear FVG';
          ctx.font = 'bold 9px "Inter", sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const pillW = textWidth + 12;
          const pillH = 15;
          
          const pillX = startX + 10;
          // Centered on botY for bullish, topY for bearish
          const pillY = isBullish ? botY - pillH / 2 : topY - pillH / 2;

          ctx.beginPath();
          const pillRadius = 3;
          if (ctx.roundRect) {
            ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
          } else {
            ctx.rect(pillX, pillY, pillW, pillH);
          }
          // Premium dark green or dark red backgrounds
          ctx.fillStyle = isBullish ? '#063d27' : '#54151a';
          ctx.fill();

          // Subtle glowing border matching indicator colors
          ctx.strokeStyle = isBullish ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw Text inside pill
          ctx.fillStyle = isBullish ? '#34d399' : '#f87171';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pillX + pillW / 2, pillY + pillH / 2 + 0.5);
          ctx.restore();
        }

        // 4. Draw Right Label "M" (LuxAlgo style active mitigation indicator)
        if (!z.isMitigated) {
          ctx.save();
          ctx.fillStyle = isBullish ? hexToRgba(borderColorHex, 0.8) : hexToRgba(borderColorHex, 0.8);
          ctx.font = 'bold 11px "Inter", sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText('M', endX - 8, (topY + botY) / 2);
          ctx.restore();
        }

        // 5. Draw Info Metrics (if enabled)
        if (settings.indicators.fvgShowInfo && !z.isMitigated) {
          ctx.fillStyle = isBullish ? '#10b981' : '#ef4444';
          
          const sizeMap = {
            'Tiny': '7px',
            'Small': '8px',
            'Normal': '10px',
            'Large': '11px',
            'Huge': '13px'
          };
          const fontSize = sizeMap[settings.indicators.fvgInfoTextSize ?? 'Large'] ?? '11px';
          ctx.font = `500 ${fontSize} monospace`;
          ctx.textAlign = 'left';

          const textX = Math.max(5, startX + 5);
          const midY = (topY + botY) / 2 + 4;

          const infoText = `TF Confluence: ${z.confluenceCount} | Strength: ${z.strength.toFixed(1)}/10 | Session: ${z.session} | Age: ${z.ageBars} bars | Pips: ${z.pips}`;
          
          ctx.save();
          const textWidth = ctx.measureText(infoText).width;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(textX - 2, midY - 10, textWidth + 4, 14);
          ctx.restore();

          ctx.fillStyle = isBullish ? '#34d399' : '#f87171';
          ctx.fillText(infoText, textX, midY);
        }
      };

      fvgResults.bullZones.forEach(z => drawZone(z, true));
      fvgResults.bearZones.forEach(z => drawZone(z, false));

      ctx.restore();
    }

    // ==========================================
    // Render ICT Concepts (LuxAlgo)
    // ==========================================
    if (settings.indicators.showIctConcepts && ictResults) {
      ctx.save();

      // Helper to convert hex to RGBA
      const hexToRgba = (hex: string, alpha: number) => {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) || 128;
        const g = parseInt(cleanHex.substring(2, 4), 16) || 128;
        const b = parseInt(cleanHex.substring(4, 6), 16) || 128;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      // 1. Draw Volume Imbalances (VI)
      if (settings.indicators.ictShowVolumeImbalance) {
        ictResults.volumeImbalances.forEach((vi) => {
          const startX = getCanvasCoords({ time: vi.time, price: 0 }).x;
          const topY = getYFromPrice(vi.top);
          const botY = getYFromPrice(vi.bottom);
          const height = botY - topY;

          let endX = chartWidth;
          if (vi.endTime !== null) {
            endX = getCanvasCoords({ time: vi.endTime, price: 0 }).x;
          }

          if (startX > chartWidth || (vi.endTime !== null && endX < 0)) return;

          const baseColor = vi.isBullish ? settings.indicators.ictViBullishColor : settings.indicators.ictViBearishColor;
          ctx.fillStyle = hexToRgba(baseColor, 0.12);
          ctx.strokeStyle = hexToRgba(baseColor, 0.35);
          ctx.lineWidth = 1;

          ctx.fillRect(startX, topY, endX - startX, height);
          ctx.strokeRect(startX, topY, endX - startX, height);

          // Draw label "VI" inside
          if (vi.endTime === null && startX < chartWidth - 30) {
            ctx.fillStyle = baseColor;
            ctx.font = 'bold 8px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('VI', startX + 5, (topY + botY) / 2 + 3);
          }
        });
      }

      // 2. Draw Buyside / Sellside Liquidity (BSL & SSL)
      if (settings.indicators.ictShowLiquidity) {
        ictResults.liquidityZones.forEach((lz) => {
          const startX = getCanvasCoords({ time: lz.time, price: 0 }).x;
          const y = getYFromPrice(lz.price);

          let endX = chartWidth;
          if (lz.endTime !== null) {
            endX = getCanvasCoords({ time: lz.endTime, price: 0 }).x;
          }

          if (startX > chartWidth || (lz.endTime !== null && endX < 0)) return;

          const isBsl = lz.isBuyside;
          const baseColor = isBsl ? settings.indicators.ictLiqBearishColor : settings.indicators.ictLiqBullishColor; // Red for BSL, Blue/Cyan for SSL
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = lz.endTime === null ? 1.5 : 1.0;
          ctx.setLineDash(lz.endTime === null ? [] : [3, 3]);

          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Shading band
          ctx.fillStyle = hexToRgba(baseColor, 0.04);
          const bandHeight = 6;
          ctx.fillRect(startX, isBsl ? y - bandHeight : y, endX - startX, bandHeight);

          // Text labels "Buyside Liquidity" / "Sellside Liquidity"
          if (lz.endTime === null && startX < chartWidth - 80) {
            ctx.fillStyle = baseColor;
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(isBsl ? 'Buyside Liquidity' : 'Sellside Liquidity', startX + 10, isBsl ? y - 3 : y + 9);
          }
        });
      }

      // 3. Draw Order Blocks (OB)
      if (settings.indicators.ictShowOrderBlocks) {
        ictResults.orderBlocks.forEach((ob) => {
          const startX = getCanvasCoords({ time: ob.time, price: 0 }).x;
          const topY = getYFromPrice(ob.top);
          const botY = getYFromPrice(ob.bottom);
          const height = botY - topY;

          let endX = chartWidth;
          if (ob.endTime !== null) {
            endX = getCanvasCoords({ time: ob.endTime, price: 0 }).x;
          }

          if (startX > chartWidth || (ob.endTime !== null && endX < 0)) return;

          const baseColor = ob.isBullish ? settings.indicators.ictObBullishColor : settings.indicators.ictObBearishColor;
          ctx.fillStyle = hexToRgba(baseColor, 0.1);
          ctx.strokeStyle = hexToRgba(baseColor, 0.4);
          ctx.lineWidth = ob.endTime === null ? 1.5 : 1.0;

          ctx.fillRect(startX, topY, endX - startX, height);
          ctx.strokeRect(startX, topY, endX - startX, height);

          // OB Label
          if (ob.endTime === null && startX < chartWidth - 40) {
            ctx.fillStyle = baseColor;
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(ob.isBullish ? '+OB' : '-OB', startX + 6, topY + 11);
          }
        });
      }

      // 4. Draw Fair Value Gaps (FVG), Inverted FVGs (IFVGs) & Balanced Price Ranges (BPR)
      if (settings.indicators.ictFvgOption !== 'NONE') {
        ictResults.fvgs.forEach((f) => {
          const startX = getCanvasCoords({ time: f.time, price: 0 }).x;
          const topY = getYFromPrice(f.top);
          const botY = getYFromPrice(f.bottom);
          const height = botY - topY;

          let endX = chartWidth;
          if (f.endTime !== null) {
            endX = getCanvasCoords({ time: f.endTime, price: 0 }).x;
          }

          if (startX > chartWidth || (f.endTime !== null && endX < 0)) return;

          let baseColor = f.isBullish ? settings.indicators.ictFvgBullishColor : settings.indicators.ictFvgBearishColor;
          let label = f.isBullish ? 'Bull FVG' : 'Bear FVG';
          let fillOpacity = 0.08;

          if (f.isBpr) {
            baseColor = '#d27d2d'; // Golden bronze for Balanced Price Range
            label = 'BPR';
            fillOpacity = 0.15;
          } else if (f.isInverted) {
            label = f.isBullish ? 'Bull IFVG' : 'Bear IFVG';
            fillOpacity = 0.05;
          }

          ctx.fillStyle = hexToRgba(baseColor, fillOpacity);
          ctx.strokeStyle = hexToRgba(baseColor, f.endTime === null ? 0.45 : 0.2);
          ctx.lineWidth = f.endTime === null ? 1.25 : 1.0;

          ctx.fillRect(startX, topY, endX - startX, height);
          ctx.strokeRect(startX, topY, endX - startX, height);

          // Draw label inside FVG/IFVG/BPR
          if (f.endTime === null && startX < chartWidth - 50) {
            ctx.fillStyle = baseColor;
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, startX + 8, topY + 11);
          }
        });
      }

      // 5. Draw Market Structure Shift (MSS) and Break of Structure (BOS)
      if (settings.indicators.ictShowMarketStructure) {
        ictResults.marketStructures.forEach((ms) => {
          const startX = getCanvasCoords({ time: ms.time, price: 0 }).x;
          const breakX = getCanvasCoords({ time: ms.breakTime, price: 0 }).x;
          const y = getYFromPrice(ms.price);

          if (startX > chartWidth || breakX < 0) return;

          const isBull = ms.isBullish;
          let color = '#ffffff';

          if (ms.type === 'MSS') {
            color = isBull ? settings.indicators.ictMssColorBullish : settings.indicators.ictMssColorBearish;
          } else {
            color = isBull ? settings.indicators.ictBosColorBullish : settings.indicators.ictBosColorBearish;
          }

          // Horizontal line from swing point to breakout bar
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(breakX, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw a small circle at the swing point
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(startX, y, 2.5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw "MSS" or "BOS" text label neatly floating above/below line
          const labelText = ms.type;
          ctx.font = 'bold 9px "Inter", sans-serif';
          const textW = ctx.measureText(labelText).width;
          const labelX = (startX + breakX) / 2;
          const labelY = isBull ? y - 6 : y + 9;

          // Draw small background block for high contrast
          ctx.fillStyle = 'rgba(19, 23, 34, 0.75)';
          ctx.fillRect(labelX - textW / 2 - 3, labelY - 8, textW + 6, 11);

          // Draw label text
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.fillText(labelText, labelX, labelY);
        });
      }

      // 6. Highlight Displacement Candlesticks
      if (settings.indicators.ictShowDisplacement) {
        ictResults.displacements.forEach((time) => {
          const x = getCanvasCoords({ time, price: 0 }).x;
          if (x < 0 || x > chartWidth) return;

          // Draw a neat subtle vertical background highlight or cyan tick
          ctx.fillStyle = 'rgba(0, 230, 118, 0.05)';
          ctx.fillRect(x - candleWidth / 2, 0, candleWidth, chartHeight);

          // Draw a small elegant displacement marker at the top/bottom of the cell
          ctx.fillStyle = '#00e676';
          ctx.font = 'bold 8px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('DISP', x, 14);
        });
      }

      ctx.restore();
    }

    // 4. Draw Drawings (Trend Lines, Horizontal Lines, Risk/Reward)
    drawings.forEach((drawing) => {
      const isSelected = drawing.id === selectedDrawingId;
      ctx.lineWidth = isSelected ? drawing.lineWidth + 1 : drawing.lineWidth;
      ctx.strokeStyle = drawing.color;

      if (drawing.type === 'trend' && drawing.points.length >= 2) {
        const p1 = getCanvasCoords(drawing.points[0]);
        const p2 = getCanvasCoords(drawing.points[1]);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (isSelected) {
          drawHandle(ctx, p1.x, p1.y, drawing.color);
          drawHandle(ctx, p2.x, p2.y, drawing.color);
        }
      } else if (drawing.type === 'horizontal' && drawing.points.length >= 1) {
        const p1 = getCanvasCoords(drawing.points[0]);
        ctx.beginPath();
        ctx.moveTo(0, p1.y);
        ctx.lineTo(chartWidth, p1.y);
        ctx.stroke();

        if (isSelected) {
          drawHandle(ctx, chartWidth / 2, p1.y, drawing.color);
        }
      } else if (drawing.type === 'risk_reward' && drawing.points.length >= 1) {
        const config = drawing.riskReward;
        if (config) {
          const entryY = getYFromPrice(config.entryPrice);
          const targetY = getYFromPrice(config.targetPrice);
          const stopY = getYFromPrice(config.stopPrice);
          const anchorX = getCanvasCoords(drawing.points[0]).x;

          const boxWidth = 180;
          const leftX = anchorX;
          const rightX = anchorX + boxWidth;

          // 1. Determine position type dynamically if not set
          const isLong = config.targetPrice >= config.entryPrice;

          // 2. Scan candles starting from the anchor candle to determine if target or stop has been touched/entered
          const anchorTime = drawing.points[0].time;
          const startIndex = candles.findIndex(c => c.time === anchorTime);
          
          let targetTouched = false;
          let stopTouched = false;
          let hitStatus: 'Active' | 'Target Hit' | 'Stopped Out' = 'Active';

          if (startIndex !== -1) {
            for (let i = startIndex; i < candles.length; i++) {
              const c = candles[i];
              if (isLong) {
                // For Long: Target is above entry (higher price, lower Y), Stop is below entry (lower price, higher Y)
                if (c.high > config.entryPrice) {
                  targetTouched = true;
                }
                if (c.low < config.entryPrice) {
                  stopTouched = true;
                }
                if (c.high >= config.targetPrice && hitStatus === 'Active') {
                  hitStatus = 'Target Hit';
                }
                if (c.low <= config.stopPrice && hitStatus === 'Active') {
                  hitStatus = 'Stopped Out';
                }
              } else {
                // For Short: Target is below entry (lower price, higher Y), Stop is above entry (higher price, lower Y)
                if (c.low < config.entryPrice) {
                  targetTouched = true;
                }
                if (c.high > config.entryPrice) {
                  stopTouched = true;
                }
                if (c.low <= config.targetPrice && hitStatus === 'Active') {
                  hitStatus = 'Target Hit';
                }
                if (c.high >= config.stopPrice && hitStatus === 'Active') {
                  hitStatus = 'Stopped Out';
                }
              }
            }
          }

          // Target and Stop heights & regions
          const targetHeight = Math.abs(entryY - targetY);
          const targetTop = Math.min(entryY, targetY);
          const stopHeight = Math.abs(entryY - stopY);
          const stopTop = Math.min(entryY, stopY);

          // 3. Render Target & Stop box interior colorful fills (MT5 Style)
          // "inside the square must be colorful, others get more bold when candles go that area"
          ctx.fillStyle = targetTouched ? 'rgba(76, 175, 80, 0.45)' : 'rgba(76, 175, 80, 0.12)';
          ctx.fillRect(leftX, targetTop, boxWidth, targetHeight);

          ctx.fillStyle = stopTouched ? 'rgba(239, 83, 80, 0.45)' : 'rgba(239, 83, 80, 0.12)';
          ctx.fillRect(leftX, stopTop, boxWidth, stopHeight);

          // 4. Render Outline Frames
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeStyle = '#2e7d32'; // Green border
          ctx.strokeRect(leftX, targetTop, boxWidth, targetHeight);

          ctx.strokeStyle = '#c62828'; // Red border
          ctx.strokeRect(leftX, stopTop, boxWidth, stopHeight);

          // 5. Draw solid header bars and text (Exactly like MT5 / Photo)
          const barHeight = 20;
          const decimals = config.entryPrice.toString().split('.')[1]?.length || 3;

          // SL bar (At the topmost boundary for Short, bottommost for Long)
          const slBarY = isLong ? stopY - barHeight : stopY;
          ctx.fillStyle = '#b71c1c'; // Solid MT5 Red
          ctx.fillRect(leftX, slBarY, boxWidth, barHeight);

          const riskVal = Math.abs(config.entryPrice - config.stopPrice);
          const slText = `SL : ${config.stopPrice.toFixed(decimals)} - RISK : ${riskVal.toFixed(decimals)}`;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(slText, leftX + boxWidth / 2, slBarY + barHeight / 2);

          // TP bar (At the topmost boundary for Long, bottommost for Short)
          const tpBarY = isLong ? targetY : targetY - barHeight;
          ctx.fillStyle = '#1b5e20'; // Solid MT5 Green
          ctx.fillRect(leftX, tpBarY, boxWidth, barHeight);

          const rewardVal = Math.abs(config.targetPrice - config.entryPrice);
          const tpText = `TP : ${config.targetPrice.toFixed(decimals)} - REWARD : ${rewardVal.toFixed(decimals)}`;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tpText, leftX + boxWidth / 2, tpBarY + barHeight / 2);

          // OPEN bar (Centered on the entry level line)
          const entryBarY = entryY - barHeight / 2;
          ctx.fillStyle = '#424242'; // Solid MT5 Grey
          ctx.fillRect(leftX, entryBarY, boxWidth, barHeight);

          const targetPips = Math.abs(config.targetPrice - config.entryPrice);
          const stopPips = Math.abs(config.entryPrice - config.stopPrice);
          const rrRatio = stopPips > 0 ? (targetPips / stopPips).toFixed(2) : '0.00';
          const entryText = `OPEN : ${config.entryPrice.toFixed(decimals)} - R/R Ratio : ${rrRatio}`;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(entryText, leftX + boxWidth / 2, entryBarY + barHeight / 2);

          // 7. Draw selected handles
          if (isSelected) {
            drawHandle(ctx, anchorX, targetY, '#089981'); // Target Handle
            drawHandle(ctx, anchorX, entryY, '#2196f3');  // Entry Handle
            drawHandle(ctx, anchorX, stopY, '#f23645');   // Stop Handle
          }
        }
      }
    });

    // 5. Draw Active In-Progress drawing
    if (isDrawingInProgress && newDrawingPoints.length > 0) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#2196f3';

      if (activeTool === 'trend') {
        const p1 = getCanvasCoords(newDrawingPoints[0]);
        // Connect p1 to current mouse coordinates
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
      }
    }

    // 6. Draw Borders and Axes
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderCol;

    // Right y-axis border
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(chartWidth, chartHeight);
    ctx.stroke();

    // Bottom x-axis border
    ctx.beginPath();
    ctx.moveTo(0, chartHeight);
    ctx.lineTo(chartWidth, chartHeight);
    ctx.stroke();

    // 7. Render Price Scale Labels (Right Axis)
    ctx.fillStyle = textCol;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let p = startPrice; p <= maxPrice; p += priceStep) {
      const y = getYFromPrice(p);
      if (y >= 0 && y <= chartHeight) {
        ctx.fillText(p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }), chartWidth + 6, y);
      }
    }

    // Current Price line and badge
    const latestCandle = candles[candles.length - 1];
    if (latestCandle) {
      const currentY = getYFromPrice(latestCandle.close);
      if (currentY >= 0 && currentY <= chartHeight) {
        // Draw dashed line to current price
        ctx.strokeStyle = settings.appearance.priceLineColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(chartWidth, currentY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Draw badge container
        ctx.fillStyle = settings.appearance.priceLineColor;
        ctx.fillRect(chartWidth + 2, currentY - 8, RIGHT_SCALE_WIDTH - 4, 16);

        // Badge Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(latestCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), chartWidth + 6, currentY);
      }
    }

    // 8. Render Time Scale Labels (Bottom Axis)
    ctx.fillStyle = textCol;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = start; i <= end; i++) {
      if (i % (labelSpacing * 5) === 0) {
        const x = getXFromIndex(i);
        if (x >= 0 && x <= chartWidth) {
          const date = new Date(candles[i].time * 1000);
          const timeStr = formatLabelDate(date);
          ctx.fillText(timeStr, x, chartHeight + 6);
        }
      }
    }

    // 9. Draw interactive Snap Circle or Magnet dot
    if (snappedPoint) {
      const snapCoords = getCanvasCoords(snappedPoint);
      if (snapCoords.x >= 0 && snapCoords.x <= chartWidth && snapCoords.y >= 0 && snapCoords.y <= chartHeight) {
        ctx.fillStyle = '#2196f3';
        ctx.beginPath();
        ctx.arc(snapCoords.x, snapCoords.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 10. Draw Crosshair cursor
    if (mousePos.x >= 0 && mousePos.x <= chartWidth && mousePos.y >= 0 && mousePos.y <= chartHeight) {
      ctx.strokeStyle = settings.appearance.crosshairColor;
      ctx.lineWidth = 1;
      
      if (settings.appearance.crosshairStyle === 'dashed') {
        ctx.setLineDash([3, 3]);
      } else {
        ctx.setLineDash([]);
      }

      // Draw horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();

      // Draw vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();
      
      ctx.setLineDash([]); // Reset

      // Crosshair Price Badge on Y-axis
      const currentCrosshairPrice = getPriceFromY(mousePos.y);
      ctx.fillStyle = isDark ? '#363c4e' : '#474f66';
      ctx.fillRect(chartWidth + 2, mousePos.y - 8, RIGHT_SCALE_WIDTH - 4, 16);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(currentCrosshairPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), chartWidth + 6, mousePos.y);

      // Crosshair Date Badge on X-axis
      const activeIdx = getIndexFromX(mousePos.x);
      if (activeIdx >= 0 && activeIdx < candles.length) {
        const activeDate = new Date(candles[activeIdx].time * 1000);
        const dateStr = activeDate.toLocaleDateString() + ' ' + activeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        ctx.fillStyle = isDark ? '#363c4e' : '#474f66';
        ctx.fillRect(mousePos.x - 60, chartHeight + 2, 120, 16);

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(dateStr, mousePos.x, chartHeight + 5);
      }
    }

    // 11. Draw Symbol Logo/Text overlay (Removed per request to clean up texts from screen)
  }, [
    dimensions,
    candles,
    candleWidth,
    scrollOffset,
    drawings,
    selectedDrawingId,
    mousePos,
    isDrawingInProgress,
    newDrawingPoints,
    activeTool,
    settings,
    snappedPoint,
    visibleRange,
    symbolName,
    timeframe,
    gtaResults,
  ]);

  // Helper: Get nice tick interval for price grid
  const getNicePriceStep = (range: number): number => {
    const rough = range / 6;
    if (rough === 0) return 1;
    const exponent = Math.floor(Math.log10(rough));
    const fraction = rough / Math.pow(10, exponent);
    
    let niceFraction = 1;
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * Math.pow(10, exponent);
  };

  // Helper: draw handle dots for selected drawings
  const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // Helper: Format bottom labels based on time gap
  const formatLabelDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (hours === '00' && minutes === '00') {
      // Return short month and day if it is start of day
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return timeStr;
  };

  // Snapping logic to OHLC prices of nearest candle
  const calculateSnapping = (x: number, y: number): DrawingPoint | null => {
    if (candles.length === 0) return null;
    const idx = getIndexFromX(x);
    if (idx < 0 || idx >= candles.length) return null;

    const candle = candles[idx];
    const candleX = getXFromIndex(idx);

    // If cursor is close horizontally to the candle center
    if (Math.abs(x - candleX) < candleWidth) {
      const prices = [candle.open, candle.high, candle.low, candle.close];
      let closestPrice = prices[0];
      let minDistance = Infinity;

      prices.forEach((p) => {
        const py = getYFromPrice(p);
        const dist = Math.abs(y - py);
        if (dist < minDistance) {
          minDistance = dist;
          closestPrice = p;
        }
      });

      // Snap within 15px radius
      if (minDistance < 15) {
        return { time: candle.time, price: closestPrice };
      }
    }
    return null;
  };

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Calculate hover states for status display
    const idx = getIndexFromX(x);
    if (idx >= 0 && idx < candles.length) {
      setHoveredCandle(candles[idx]);
    } else {
      setHoveredCandle(null);
    }
    setHoveredPrice(getPriceFromY(y));
    setHoveredTime(getSpaceCoords(x, y).time);

    // Dynamic Magnet snapping on mouse move
    const snap = calculateSnapping(x, y);
    setSnappedPoint(snap);

    // Drawing-in-progress trendline tracking
    if (isDrawingInProgress && activeTool === 'trend' && newDrawingPoints.length > 0) {
      // Repaint will dynamically hook mousePos
    }

    // Handle dragging/resizing interaction
    if (draggedDrawingId) {
      const drawingIdx = drawings.findIndex((d) => d.id === draggedDrawingId);
      if (drawingIdx !== -1) {
        const drawing = drawings[drawingIdx];
        const currentCoord = snap || getSpaceCoords(x, y);

        if (draggedHandleIndex !== null && draggedHandleIndex >= 0) {
          // RESIZING A SPECIFIC HANDLE
          const updatedDrawings = [...drawings];
          const updatedDrawing = { ...drawing };
          const updatedPoints = [...updatedDrawing.points];

          if (drawing.type === 'trend' && draggedHandleIndex < 2) {
            updatedPoints[draggedHandleIndex] = currentCoord;
          } else if (drawing.type === 'risk_reward' && drawing.riskReward) {
            const config = { ...drawing.riskReward };
            if (draggedHandleIndex === 0) {
              // Target level handle
              config.targetPrice = currentCoord.price;
            } else if (draggedHandleIndex === 1) {
              // Entry level handle
              config.entryPrice = currentCoord.price;
            } else if (draggedHandleIndex === 2) {
              // Stop loss level handle
              config.stopPrice = currentCoord.price;
            }
            updatedDrawing.riskReward = config;
            // Also keep anchor locked to latest price/time
            updatedPoints[0] = { time: currentCoord.time, price: config.entryPrice };
          }

          updatedDrawing.points = updatedPoints;
          updatedDrawings[drawingIdx] = updatedDrawing;
          setDrawings(updatedDrawings);
        } else if (dragOffset) {
          // DRAGGING THE ENTIRE DRAWING BODY
          const updatedDrawings = [...drawings];
          const updatedDrawing = { ...drawing };

          if (drawing.type === 'horizontal') {
            updatedDrawing.points = [{
              time: currentCoord.time,
              price: currentCoord.price,
            }];
          } else if (drawing.type === 'trend') {
            const deltaPrice = currentCoord.price - dragOffset.price;
            const targetTimeIndex = candles.findIndex(c => c.time === currentCoord.time);
            const sourceTimeIndex = candles.findIndex(c => c.time === dragOffset.time);
            
            let deltaIndex = 0;
            if (targetTimeIndex !== -1 && sourceTimeIndex !== -1) {
              deltaIndex = targetTimeIndex - sourceTimeIndex;
            }

            const updatedPoints = drawing.points.map((p) => {
              let pIdx = candles.findIndex(c => c.time === p.time);
              if (pIdx === -1) pIdx = 0;
              const newIdx = Math.max(0, Math.min(candles.length - 1, pIdx + deltaIndex));
              return {
                time: candles[newIdx].time,
                price: p.price + deltaPrice,
              };
            });

            updatedDrawing.points = updatedPoints;
            setDragOffset({ time: currentCoord.time, price: currentCoord.price });
          } else if (drawing.type === 'risk_reward' && drawing.riskReward) {
            const deltaPrice = currentCoord.price - dragOffset.price;
            const config = { ...drawing.riskReward };
            config.entryPrice += deltaPrice;
            config.targetPrice += deltaPrice;
            config.stopPrice += deltaPrice;

            updatedDrawing.points = [currentCoord];
            updatedDrawing.riskReward = config;
            setDragOffset(currentCoord);
          }

          updatedDrawings[drawingIdx] = updatedDrawing;
          setDrawings(updatedDrawings);
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > chartWidth || y > chartHeight) return; // User clicked scales

    const snap = calculateSnapping(x, y);
    const spaceCoord = snap || getSpaceCoords(x, y);

    // 1. ACTIVE DRAWING MODE
    if (activeTool !== 'cursor') {
      if (activeTool === 'trend') {
        if (!isDrawingInProgress) {
          // Start Trend Line
          setIsDrawingInProgress(true);
          setNewDrawingPoints([spaceCoord]);
        } else {
          // Finish Trend Line
          const finalPoints = [...newDrawingPoints, spaceCoord];
          const newDrawing: Drawing = {
            id: 'drawing_' + Date.now(),
            type: 'trend',
            points: finalPoints,
            color: '#2196f3',
            lineWidth: 2,
          };
          setDrawings((prev) => [...prev, newDrawing]);
          setIsDrawingInProgress(false);
          setNewDrawingPoints([]);
          setActiveTool('cursor');
        }
      } else if (activeTool === 'horizontal') {
        // Spawn Horizontal Line instantly
        const newDrawing: Drawing = {
          id: 'drawing_' + Date.now(),
          type: 'horizontal',
          points: [spaceCoord],
          color: '#e040fb',
          lineWidth: 2,
        };
        setDrawings((prev) => [...prev, newDrawing]);
        setActiveTool('cursor');
      } else if (activeTool === 'risk_reward') {
        // Spawn Risk/Reward tool instantly centered on clicked price
        const entryPrice = spaceCoord.price;
        // Default target is +2%, Stop is -1% (Long)
        const targetPrice = entryPrice * 1.02;
        const stopPrice = entryPrice * 0.99;

        const newDrawing: Drawing = {
          id: 'drawing_' + Date.now(),
          type: 'risk_reward',
          points: [spaceCoord],
          color: '#2196f3',
          lineWidth: 1.5,
          riskReward: {
            isLong: true,
            entryPrice,
            targetPrice,
            stopPrice,
            riskAmount: 100,
            lotSize: 1,
          },
        };
        setDrawings((prev) => [...prev, newDrawing]);
        setActiveTool('cursor');
      }
      return;
    }

    // 2. CURSOR/EDITING SELECTION MODE
    // Check if clicked close to handles first
    let foundHandle = false;
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];
      if (d.id === selectedDrawingId) {
        if (d.type === 'trend') {
          const p1 = getCanvasCoords(d.points[0]);
          const p2 = getCanvasCoords(d.points[1]);

          if (Math.hypot(x - p1.x, y - p1.y) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(0);
            foundHandle = true;
            break;
          }
          if (Math.hypot(x - p2.x, y - p2.y) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(1);
            foundHandle = true;
            break;
          }
        } else if (d.type === 'horizontal') {
          const p1 = getCanvasCoords(d.points[0]);
          if (Math.hypot(x - chartWidth / 2, y - p1.y) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(0);
            foundHandle = true;
            break;
          }
        } else if (d.type === 'risk_reward' && d.riskReward) {
          const entryY = getYFromPrice(d.riskReward.entryPrice);
          const targetY = getYFromPrice(d.riskReward.targetPrice);
          const stopY = getYFromPrice(d.riskReward.stopPrice);
          const anchorX = getCanvasCoords(d.points[0]).x;

          if (Math.hypot(x - anchorX, y - targetY) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(0); // Target
            foundHandle = true;
            break;
          }
          if (Math.hypot(x - anchorX, y - entryY) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(1); // Entry
            foundHandle = true;
            break;
          }
          if (Math.hypot(x - anchorX, y - stopY) < 10) {
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(2); // Stop
            foundHandle = true;
            break;
          }
        }
      }
    }

    if (foundHandle) return;

    // Check if clicked on a drawing's body to select or drag
    let foundBody = false;
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];
      if (d.type === 'horizontal') {
        const py = getYFromPrice(d.points[0].price);
        if (Math.abs(y - py) < 8) {
          setSelectedDrawingId(d.id);
          setDraggedDrawingId(d.id);
          setDraggedHandleIndex(null); // drag whole body
          setDragOffset(spaceCoord);
          foundBody = true;
          break;
        }
      } else if (d.type === 'trend' && d.points.length >= 2) {
        const p1 = getCanvasCoords(d.points[0]);
        const p2 = getCanvasCoords(d.points[1]);

        // Distance from point to line segment
        const dist = distToSegment({ x, y }, p1, p2);
        if (dist < 8) {
          setSelectedDrawingId(d.id);
          setDraggedDrawingId(d.id);
          setDraggedHandleIndex(null);
          setDragOffset(spaceCoord);
          foundBody = true;
          break;
        }
      } else if (d.type === 'risk_reward' && d.riskReward) {
        const config = d.riskReward;
        const entryY = getYFromPrice(config.entryPrice);
        const targetY = getYFromPrice(config.targetPrice);
        const stopY = getYFromPrice(config.stopPrice);
        const anchorX = getCanvasCoords(d.points[0]).x;

        const left = anchorX;
        const right = anchorX + 180;
        const topY = Math.min(targetY, stopY);
        const botY = Math.max(targetY, stopY);

        if (x >= left && x <= right && y >= topY && y <= botY) {
          setSelectedDrawingId(d.id);
          setDraggedDrawingId(d.id);
          setDraggedHandleIndex(null);
          setDragOffset(spaceCoord);
          foundBody = true;
          break;
        }
      }
    }

    if (foundBody) return;

    // If nothing matches, deselect drawing and initiate panning
    setSelectedDrawingId(null);

    // Setup for panning (drag chart)
    const startX = e.clientX;
    const startOffset = scrollOffset;

    const handlePanMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Clamp scrolling so they don't scroll past data boundaries
      const maxScroll = candles.length * candleWidth;
      const minScroll = -chartWidth / 2;
      setScrollOffset(Math.max(minScroll, Math.min(maxScroll, startOffset + deltaX)));
    };

    const handlePanMouseUp = () => {
      window.removeEventListener('mousemove', handlePanMouseMove);
      window.removeEventListener('mouseup', handlePanMouseUp);
    };

    window.addEventListener('mousemove', handlePanMouseMove);
    window.addEventListener('mouseup', handlePanMouseUp);
  };

  const handleMouseUp = () => {
    if (draggedDrawingId) {
      setDraggedDrawingId(null);
      setDraggedHandleIndex(null);
      setDragOffset(null);
      // Save drawings to persistence
      saveDrawingsToLocalStorage();
    }
  };

  const saveDrawingsToLocalStorage = () => {
    try {
      localStorage.setItem(`drawings_${symbolName}`, JSON.stringify(drawings));
    } catch (e) {
      console.error('Failed to save drawings to localstorage:', e);
    }
  };

  // Distance from point p to line segment v-w
  const distToSegment = (p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) => {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  };

  // Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (x > chartWidth || y > chartHeight) return; // ignore scales

      const snap = calculateSnapping(x, y);
      const spaceCoord = snap || getSpaceCoords(x, y);

      // 1. ACTIVE DRAWING MODE
      if (activeTool !== 'cursor') {
        if (activeTool === 'trend') {
          if (!isDrawingInProgress) {
            setIsDrawingInProgress(true);
            setNewDrawingPoints([spaceCoord]);
          } else {
            const finalPoints = [...newDrawingPoints, spaceCoord];
            const newDrawing: Drawing = {
              id: 'drawing_' + Date.now(),
              type: 'trend',
              points: finalPoints,
              color: '#2196f3',
              lineWidth: 2,
            };
            setDrawings((prev) => [...prev, newDrawing]);
            setIsDrawingInProgress(false);
            setNewDrawingPoints([]);
            setActiveTool('cursor');
          }
        } else if (activeTool === 'horizontal') {
          const newDrawing: Drawing = {
            id: 'drawing_' + Date.now(),
            type: 'horizontal',
            points: [spaceCoord],
            color: '#e040fb',
            lineWidth: 2,
          };
          setDrawings((prev) => [...prev, newDrawing]);
          setActiveTool('cursor');
        } else if (activeTool === 'risk_reward') {
          const entryPrice = spaceCoord.price;
          const targetPrice = entryPrice * 1.02;
          const stopPrice = entryPrice * 0.99;
          const newDrawing: Drawing = {
            id: 'drawing_' + Date.now(),
            type: 'risk_reward',
            points: [spaceCoord],
            color: '#2196f3',
            lineWidth: 1.5,
            riskReward: {
              isLong: true,
              entryPrice,
              targetPrice,
              stopPrice,
              riskAmount: 100,
              lotSize: 1,
            },
          };
          setDrawings((prev) => [...prev, newDrawing]);
          setActiveTool('cursor');
        }
        return;
      }

      // 2. CURSOR/EDITING SELECTION MODE
      // Check if clicked close to handles of selected drawing
      let foundHandle = false;
      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i];
        if (d.id === selectedDrawingId) {
          if (d.type === 'trend') {
            const p1 = getCanvasCoords(d.points[0]);
            const p2 = getCanvasCoords(d.points[1]);

            if (Math.hypot(x - p1.x, y - p1.y) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(0);
              foundHandle = true;
              break;
            }
            if (Math.hypot(x - p2.x, y - p2.y) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(1);
              foundHandle = true;
              break;
            }
          } else if (d.type === 'horizontal') {
            const p1 = getCanvasCoords(d.points[0]);
            if (Math.hypot(x - chartWidth / 2, y - p1.y) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(0);
              foundHandle = true;
              break;
            }
          } else if (d.type === 'risk_reward' && d.riskReward) {
            const entryY = getYFromPrice(d.riskReward.entryPrice);
            const targetY = getYFromPrice(d.riskReward.targetPrice);
            const stopY = getYFromPrice(d.riskReward.stopPrice);
            const anchorX = getCanvasCoords(d.points[0]).x;

            if (Math.hypot(x - anchorX, y - targetY) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(0);
              foundHandle = true;
              break;
            }
            if (Math.hypot(x - anchorX, y - entryY) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(1);
              foundHandle = true;
              break;
            }
            if (Math.hypot(x - anchorX, y - stopY) < 22) {
              setDraggedDrawingId(d.id);
              setDraggedHandleIndex(2);
              foundHandle = true;
              break;
            }
          }
        }
      }

      if (foundHandle) {
        touchStartRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startScrollOffset: scrollOffset,
          isDraggingDrawing: true,
        };
        return;
      }

      // Check if clicked on a drawing's body
      let foundBody = false;
      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i];
        if (d.type === 'horizontal') {
          const py = getYFromPrice(d.points[0].price);
          if (Math.abs(y - py) < 18) {
            setSelectedDrawingId(d.id);
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(null);
            setDragOffset(spaceCoord);
            foundBody = true;
            break;
          }
        } else if (d.type === 'trend' && d.points.length >= 2) {
          const p1 = getCanvasCoords(d.points[0]);
          const p2 = getCanvasCoords(d.points[1]);
          const dist = distToSegment({ x, y }, p1, p2);
          if (dist < 18) {
            setSelectedDrawingId(d.id);
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(null);
            setDragOffset(spaceCoord);
            foundBody = true;
            break;
          }
        } else if (d.type === 'risk_reward' && d.riskReward) {
          const config = d.riskReward;
          const entryY = getYFromPrice(config.entryPrice);
          const targetY = getYFromPrice(config.targetPrice);
          const stopY = getYFromPrice(config.stopPrice);
          const anchorX = getCanvasCoords(d.points[0]).x;
          const left = anchorX;
          const right = anchorX + 180;
          const topY = Math.min(targetY, stopY);
          const botY = Math.max(targetY, stopY);

          if (x >= left && x <= right && y >= topY && y <= botY) {
            setSelectedDrawingId(d.id);
            setDraggedDrawingId(d.id);
            setDraggedHandleIndex(null);
            setDragOffset(spaceCoord);
            foundBody = true;
            break;
          }
        }
      }

      if (foundBody) {
        touchStartRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startScrollOffset: scrollOffset,
          isDraggingDrawing: true,
        };
        return;
      }

      // Otherwise pan
      setSelectedDrawingId(null);
      touchStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollOffset: scrollOffset,
        isDraggingDrawing: false,
      };

      setHoveredCandle(candles[getIndexFromX(x)] || null);
      setHoveredPrice(getPriceFromY(y));
      setHoveredTime(getSpaceCoords(x, y).time);
      setMousePos({ x, y });
    } else if (e.touches.length === 2) {
      // Pinch to Zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const index = getIndexFromX(centerX);

      touchPinchRef.current = {
        startDist: dist,
        startCandleWidth: candleWidth,
        startScrollOffset: scrollOffset,
        centerX,
        indexAtCenter: index,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;

    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const { startX, startScrollOffset, isDraggingDrawing } = touchStartRef.current;

      if (isDraggingDrawing) {
        const snap = calculateSnapping(x, y);
        const currentCoord = snap || getSpaceCoords(x, y);

        if (draggedDrawingId) {
          const drawingIdx = drawings.findIndex((d) => d.id === draggedDrawingId);
          if (drawingIdx !== -1) {
            const drawing = drawings[drawingIdx];

            if (draggedHandleIndex !== null && draggedHandleIndex >= 0) {
              const updatedDrawings = [...drawings];
              const updatedDrawing = { ...drawing };
              const updatedPoints = [...updatedDrawing.points];

              if (drawing.type === 'trend' && draggedHandleIndex < 2) {
                updatedPoints[draggedHandleIndex] = currentCoord;
              } else if (drawing.type === 'risk_reward' && drawing.riskReward) {
                const config = { ...drawing.riskReward };
                if (draggedHandleIndex === 0) {
                  config.targetPrice = currentCoord.price;
                } else if (draggedHandleIndex === 1) {
                  config.entryPrice = currentCoord.price;
                } else if (draggedHandleIndex === 2) {
                  config.stopPrice = currentCoord.price;
                }
                updatedDrawing.riskReward = config;
                updatedPoints[0] = { time: currentCoord.time, price: config.entryPrice };
              }

              updatedDrawing.points = updatedPoints;
              updatedDrawings[drawingIdx] = updatedDrawing;
              setDrawings(updatedDrawings);
            } else if (dragOffset) {
              const updatedDrawings = [...drawings];
              const updatedDrawing = { ...drawing };

              if (drawing.type === 'horizontal') {
                updatedDrawing.points = [{
                  time: currentCoord.time,
                  price: currentCoord.price,
                }];
              } else if (drawing.type === 'trend') {
                const deltaPrice = currentCoord.price - dragOffset.price;
                const targetTimeIndex = candles.findIndex(c => c.time === currentCoord.time);
                const sourceTimeIndex = candles.findIndex(c => c.time === dragOffset.time);
                
                let deltaIndex = 0;
                if (targetTimeIndex !== -1 && sourceTimeIndex !== -1) {
                  deltaIndex = targetTimeIndex - sourceTimeIndex;
                }

                const updatedPoints = drawing.points.map((p) => {
                  let pIdx = candles.findIndex(c => c.time === p.time);
                  if (pIdx === -1) pIdx = 0;
                  const newIdx = Math.max(0, Math.min(candles.length - 1, pIdx + deltaIndex));
                  return {
                    time: candles[newIdx].time,
                    price: p.price + deltaPrice,
                  };
                });

                updatedDrawing.points = updatedPoints;
                setDragOffset({ time: currentCoord.time, price: currentCoord.price });
              } else if (drawing.type === 'risk_reward' && drawing.riskReward) {
                const deltaPrice = currentCoord.price - dragOffset.price;
                const config = { ...drawing.riskReward };
                config.entryPrice += deltaPrice;
                config.targetPrice += deltaPrice;
                config.stopPrice += deltaPrice;

                updatedDrawing.points = [currentCoord];
                updatedDrawing.riskReward = config;
                setDragOffset(currentCoord);
              }

              updatedDrawings[drawingIdx] = updatedDrawing;
              setDrawings(updatedDrawings);
            }
          }
        }
      } else {
        const deltaX = touch.clientX - startX;
        const maxScroll = candles.length * candleWidth;
        const minScroll = -chartWidth / 2;
        setScrollOffset(Math.max(minScroll, Math.min(maxScroll, startScrollOffset + deltaX)));
      }

      setMousePos({ x, y });
      const idx = getIndexFromX(x);
      if (idx >= 0 && idx < candles.length) {
        setHoveredCandle(candles[idx]);
      } else {
        setHoveredCandle(null);
      }
      setHoveredPrice(getPriceFromY(y));
      setHoveredTime(getSpaceCoords(x, y).time);
      const snap = calculateSnapping(x, y);
      setSnappedPoint(snap);
    } else if (e.touches.length === 2 && touchPinchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      const { startDist, startCandleWidth, startScrollOffset, centerX, indexAtCenter } = touchPinchRef.current;
      
      const ratio = dist / startDist;
      const newCandleWidth = Math.max(1.5, Math.min(80, startCandleWidth * ratio));

      if (newCandleWidth !== candleWidth) {
        const paddingRight = 50;
        const newScrollOffset = centerX - (chartWidth - paddingRight) + (candles.length - 1 - indexAtCenter) * newCandleWidth;

        setCandleWidth(newCandleWidth);
        setScrollOffset(newScrollOffset);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    touchPinchRef.current = null;
    if (draggedDrawingId) {
      setDraggedDrawingId(null);
      setDraggedHandleIndex(null);
      setDragOffset(null);
      saveDrawingsToLocalStorage();
    }
  };

  // Zooming with mouse wheel (towards cursor position)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    if (mouseX > chartWidth) return; // Ignore zooms on scales

    // Zoom multiplier
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const newCandleWidth = Math.max(1.5, Math.min(80, candleWidth * factor));

    if (newCandleWidth === candleWidth) return;

    // Standard Zooming-towards-cursor logic:
    // Keep the candle index currently under the mouse at the same exact pixel location.
    // Pixel coordinate formula:
    // x = chartWidth - paddingRight + scrollOffset - (candles.length - 1 - index) * candleWidth
    // Therefore, scrollOffset = x - (chartWidth - paddingRight) + (candles.length - 1 - index) * candleWidth
    // We want scrollOffset_new to keep "index" at "x" under "newCandleWidth":
    const index = getIndexFromX(mouseX);
    const paddingRight = 50;
    
    const newScrollOffset = mouseX - (chartWidth - paddingRight) + (candles.length - 1 - index) * newCandleWidth;

    setCandleWidth(newCandleWidth);
    setScrollOffset(newScrollOffset);
  };

  // Delete drawing handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedDrawingId && (e.key === 'Backspace' || e.key === 'Delete')) {
        setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId, setDrawings]);

  // Flip Risk/Reward direction (Long <-> Short)
  const toggleRiskRewardDirection = () => {
    if (!selectedDrawingId) return;
    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id === selectedDrawingId && d.type === 'risk_reward' && d.riskReward) {
          const isLong = !d.riskReward.isLong;
          const entryPrice = d.riskReward.entryPrice;
          
          // Re-invert target and stop distances
          const targetDist = Math.abs(d.riskReward.targetPrice - entryPrice);
          const stopDist = Math.abs(entryYStopDist() || (entryPrice * 0.01));

          function entryYStopDist() {
            if (!d.riskReward) return 0;
            return d.riskReward.entryPrice - d.riskReward.stopPrice;
          }

          const targetPrice = isLong ? entryPrice + targetDist : entryPrice - targetDist;
          const stopPrice = isLong ? entryPrice - stopDist : entryPrice + stopDist;

          return {
            ...d,
            riskReward: {
              ...d.riskReward,
              isLong,
              targetPrice,
              stopPrice,
            },
          };
        }
        return d;
      })
    );
  };

  const hasSelectedRiskReward = useMemo(() => {
    const active = drawings.find((d) => d.id === selectedDrawingId);
    return active?.type === 'risk_reward';
  }, [drawings, selectedDrawingId]);

  return (
    <div id="chart-panel-container" ref={containerRef} className="relative w-full h-full flex flex-col select-none">
      {/* Live OHDLV Metrics Ribbon */}
      <div id="ohdlv-ribbon" className="absolute top-2 left-4 z-10 flex flex-wrap gap-4 px-2 py-1 bg-black/85 border border-neutral-800 text-xs font-mono rounded shadow backdrop-blur text-gray-300 pointer-events-none">
        {hoveredCandle ? (
          <>
            <span className="text-blue-400">O: <strong className="text-white">{hoveredCandle.open.toFixed(2)}</strong></span>
            <span className="text-green-400">H: <strong className="text-white">{hoveredCandle.high.toFixed(2)}</strong></span>
            <span className="text-red-400">L: <strong className="text-white">{hoveredCandle.low.toFixed(2)}</strong></span>
            <span className="text-blue-400">C: <strong className="text-white">{hoveredCandle.close.toFixed(2)}</strong></span>
            <span className="text-gray-400">Time: <strong className="text-white">{new Date(hoveredCandle.time * 1000).toLocaleTimeString()}</strong></span>
          </>
        ) : (
          candles.length > 0 && (
            <>
              <span>O: <strong>{candles[candles.length - 1].open.toFixed(2)}</strong></span>
              <span>H: <strong>{candles[candles.length - 1].high.toFixed(2)}</strong></span>
              <span>L: <strong>{candles[candles.length - 1].low.toFixed(2)}</strong></span>
              <span>C: <strong>{candles[candles.length - 1].close.toFixed(2)}</strong></span>
            </>
          )
        )}
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        id="trading-chart-canvas"
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex-grow cursor-crosshair block"
        style={{ touchAction: 'none' }}
      />

      {/* Floating Bottom Scale Utility Actions (TradingView style controls) */}
      <div id="chart-controls" className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 p-1.5 bg-black/90 border border-neutral-800 rounded shadow-lg backdrop-blur">
        <button
          id="btn-zoom-in"
          onClick={() => {
            setCandleWidth((w) => Math.min(80, w * 1.2));
          }}
          title="Zoom In"
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={() => {
            setCandleWidth((w) => Math.max(1.5, w * 0.8));
          }}
          title="Zoom Out"
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-zoom"
          onClick={resetZoomPan}
          title="Reset View"
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {hasSelectedRiskReward && (
          <button
            id="btn-flip-rr"
            onClick={toggleRiskRewardDirection}
            title="Flip Risk/Reward (Long/Short)"
            className="p-1 px-2 hover:bg-blue-600 bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ArrowUpRight className="w-3 h-3" /> Flip L/S
          </button>
        )}

        {selectedDrawingId && (
          <button
            id="btn-delete-selected"
            onClick={() => {
              setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
              setSelectedDrawingId(null);
            }}
            title="Delete Selected Drawing (Delete / Backspace)"
            className="p-1.5 hover:bg-red-900 rounded text-red-400 hover:text-red-200 transition-colors border border-red-900/50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
