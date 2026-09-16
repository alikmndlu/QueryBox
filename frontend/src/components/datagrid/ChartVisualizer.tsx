import React, { useState, useMemo } from 'react';
import { BarChart3, LineChart, PieChart, Info } from 'lucide-react';

interface ChartVisualizerProps {
  columns: string[];
  rows: any[][];
}

type ChartType = 'bar' | 'line' | 'donut';

export const ChartVisualizer: React.FC<ChartVisualizerProps> = ({ columns, rows }) => {
  const safeColumns = useMemo(() => (Array.isArray(columns) ? columns : []), [columns]);
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const [labelColIdx, setLabelColIdx] = useState<number>(0);
  const [valColIdx, setValColIdx] = useState<number>(1);
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Auto-detect best column for X-axis (labels) and Y-axis (values) when dataset changes
  React.useEffect(() => {
    if (safeColumns.length === 0 || safeRows.length === 0) return;
    const defaultLabelColIdx = 0;
    let defaultValueColIdx = safeColumns.length > 1 ? 1 : 0;

    for (let c = 0; c < safeColumns.length; c++) {
      const isNumeric = safeRows.slice(0, 10).some((r) => r && !isNaN(Number(r[c])) && r[c] !== null && r[c] !== '');
      if (isNumeric && c !== defaultLabelColIdx) {
        defaultValueColIdx = c;
        break;
      }
    }

    setLabelColIdx(defaultLabelColIdx);
    setValColIdx(defaultValueColIdx);
  }, [safeColumns, safeRows]);

  // Prepare chart dataset (limit to first 30 rows for crisp rendering)
  const chartData = useMemo(() => {
    if (safeRows.length === 0) return [];
    return safeRows.slice(0, 30).map((r, idx) => {
      if (!r) return { label: `Row ${idx + 1}`, value: 0 };
      const rawLabel = r[labelColIdx];
      const label = rawLabel === null || rawLabel === undefined ? `Row ${idx + 1}` : String(rawLabel);
      const rawVal = Number(r[valColIdx]);
      const value = isNaN(rawVal) ? 0 : rawVal;
      return { label, value };
    });
  }, [safeRows, labelColIdx, valColIdx]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    const max = Math.max(...chartData.map((d) => d.value), 0);
    return max === 0 ? 1 : max;
  }, [chartData]);

  const totalSum = useMemo(() => {
    if (chartData.length === 0) return 1;
    return chartData.reduce((acc, curr) => acc + Math.max(curr.value, 0), 0) || 1;
  }, [chartData]);

  const colors = [
    '#6366f1', '#10b981', '#38bdf8', '#f59e0b', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];

  if (safeColumns.length === 0 || safeRows.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
        <Info className="w-5 h-5 mb-2 text-slate-600" />
        <span>No query data available to visualize. Execute a query with results first.</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-[#080b11] overflow-hidden select-none">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-[#1b2333]/80 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Category (X):</span>
          <select
            value={labelColIdx}
            onChange={(e) => setLabelColIdx(Number(e.target.value))}
            className="h-7 px-2 rounded-md bg-[#111622] border border-[#1b2333] text-indigo-300 font-medium focus:outline-none cursor-pointer"
          >
            {columns.map((c, idx) => (
              <option key={idx} value={idx}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-slate-400 font-medium ml-2">Value (Y):</span>
          <select
            value={valColIdx}
            onChange={(e) => setValColIdx(Number(e.target.value))}
            className="h-7 px-2 rounded-md bg-[#111622] border border-[#1b2333] text-emerald-400 font-medium focus:outline-none cursor-pointer"
          >
            {columns.map((c, idx) => (
              <option key={idx} value={idx}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex items-center bg-[#111622] p-0.5 rounded-lg border border-[#1b2333]">
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              chartType === 'bar' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              chartType === 'line' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Line</span>
          </button>
          <button
            onClick={() => setChartType('donut')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              chartType === 'donut' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Donut Chart"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 w-full h-full min-h-[160px] flex items-center justify-center overflow-auto">
        {chartType === 'bar' && (
          <div className="w-full h-full flex items-end gap-2 px-6 pb-6 pt-2">
            {chartData.map((d, i) => {
              const heightPct = Math.max(Math.round((d.value / maxValue) * 100), 4);
              const color = colors[i % colors.length];

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group min-w-[24px] max-w-[60px]">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold">
                    {d.value}
                  </div>
                  <div
                    style={{ height: `${heightPct}%`, backgroundColor: color }}
                    className="w-full rounded-t-md transition-all duration-300 hover:brightness-125 shadow-lg shadow-indigo-950/20"
                    title={`${d.label}: ${d.value}`}
                  />
                  <span className="text-[10px] text-slate-400 truncate w-full text-center mt-2 font-mono" title={d.label}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {chartType === 'line' && (
          <div className="w-full h-full flex items-center justify-center px-4 py-2">
            <svg viewBox="0 0 600 200" className="w-full h-full max-h-[220px] overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="580" y2="20" stroke="#1b2333" strokeDasharray="4" />
              <line x1="40" y1="90" x2="580" y2="90" stroke="#1b2333" strokeDasharray="4" />
              <line x1="40" y1="160" x2="580" y2="160" stroke="#1b2333" strokeDasharray="4" />

              {/* Polygons and Points */}
              {(() => {
                const count = chartData.length;
                if (count < 2) return null;
                const step = 520 / (count - 1);
                const points = chartData.map((d, i) => {
                  const x = 50 + i * step;
                  const y = 160 - (d.value / maxValue) * 140;
                  return { x, y, ...d };
                });

                const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
                const areaStr = `${points[0].x},160 ${polylineStr} ${points[points.length - 1].x},160`;

                return (
                  <>
                    <polygon points={areaStr} fill="url(#lineGrad)" />
                    <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={polylineStr} />
                    {points.map((p, i) => (
                      <g key={i} className="group">
                        <circle cx={p.x} cy={p.y} r="4" fill="#38bdf8" stroke="#080b11" strokeWidth="2" />
                        <title>{`${p.label}: ${p.value}`}</title>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {chartType === 'donut' && (
          <div className="flex items-center justify-center gap-8 h-full">
            <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
              {(() => {
                let accumulatedPercent = 0;
                return chartData.slice(0, 8).map((d, i) => {
                  const percent = (Math.max(d.value, 0) / totalSum) * 100;
                  const strokeDash = `${percent} ${100 - percent}`;
                  const strokeOffset = -accumulatedPercent;
                  accumulatedPercent += percent;
                  const color = colors[i % colors.length];

                  return (
                    <circle
                      key={i}
                      r="25"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="20"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={strokeOffset}
                      pathLength="100"
                      className="transition-all hover:opacity-80"
                    >
                      <title>{`${d.label}: ${d.value} (${Math.round(percent)}%)`}</title>
                    </circle>
                  );
                });
              })()}
            </svg>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-36 overflow-y-auto pr-2 text-xs">
              {chartData.slice(0, 8).map((d, i) => {
                const percent = Math.round((Math.max(d.value, 0) / totalSum) * 100);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="truncate max-w-[90px] text-slate-300 font-mono text-[11px]">{d.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
