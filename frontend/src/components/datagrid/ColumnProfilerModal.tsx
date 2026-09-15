import React, { useMemo } from 'react';
import { BarChart2, X, Hash, Percent, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';

interface ColumnProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  columnIndex: number;
  rows: any[][];
}

export const ColumnProfilerModal: React.FC<ColumnProfilerModalProps> = ({
  isOpen,
  onClose,
  columnName,
  columnIndex,
  rows,
}) => {
  const stats = useMemo(() => {
    if (!rows || rows.length === 0 || columnIndex < 0) {
      return null;
    }

    const totalRows = rows.length;
    let nullCount = 0;
    const freqMap: Record<string, number> = {};
    const numericValues: number[] = [];

    for (let i = 0; i < totalRows; i++) {
      const val = rows[i][columnIndex];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        const strVal = String(val);
        freqMap[strVal] = (freqMap[strVal] || 0) + 1;

        const num = Number(val);
        if (!isNaN(num) && typeof val !== 'boolean') {
          numericValues.push(num);
        }
      }
    }

    const nonNullCount = totalRows - nullCount;
    const nullPercent = ((nullCount / totalRows) * 100).toFixed(1);
    const distinctCount = Object.keys(freqMap).length;
    const uniquenessRatio = nonNullCount > 0 ? ((distinctCount / nonNullCount) * 100).toFixed(1) : '0';

    // Top 5 most frequent values
    const topValues = Object.entries(freqMap)
      .map(([value, count]) => ({
        value,
        count,
        percent: ((count / totalRows) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Numeric stats if applicable
    let numericStats = null;
    if (numericValues.length > 0 && numericValues.length >= nonNullCount * 0.7) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      numericStats = {
        min,
        max,
        sum: Number.isInteger(sum) ? sum : sum.toFixed(2),
        avg: avg.toFixed(2),
      };
    }

    return {
      totalRows,
      nullCount,
      nonNullCount,
      nullPercent,
      distinctCount,
      uniquenessRatio,
      topValues,
      numericStats,
    };
  }, [rows, columnIndex]);

  if (!isOpen || !stats) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-[#0c101a] border border-[#1b2333] shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1b2333] bg-[#080b12]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span>{columnName}</span>
                <span className="text-[11px] font-sans font-normal text-slate-500">· Column Profiler</span>
              </DialogTitle>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#161f32] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-[#101522] border border-[#1b2333]">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Rows</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {stats.totalRows.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#101522] border border-[#1b2333]">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Distinct Values</span>
              <span className="text-base font-bold font-mono text-indigo-300 mt-0.5 block">
                {stats.distinctCount.toLocaleString()}
                <span className="text-[10px] text-slate-500 font-normal ml-1">({stats.uniquenessRatio}%)</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#101522] border border-[#1b2333]">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Null / Empty</span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${stats.nullCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.nullCount.toLocaleString()}
                <span className="text-[10px] text-slate-500 font-normal ml-1">({stats.nullPercent}%)</span>
              </span>
            </div>
          </div>

          {/* Numeric Aggregates (if detected) */}
          {stats.numericStats && (
            <div className="p-3 rounded-lg bg-[#0e1422] border border-[#1b2333]">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Numeric Summary</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-1.5 rounded bg-[#131a2c]">
                  <span className="text-[10px] text-slate-500 block">Min</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block truncate">
                    {stats.numericStats.min}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-[#131a2c]">
                  <span className="text-[10px] text-slate-500 block">Average</span>
                  <span className="text-xs font-mono font-bold text-indigo-300 mt-0.5 block truncate">
                    {stats.numericStats.avg}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-[#131a2c]">
                  <span className="text-[10px] text-slate-500 block">Max</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block truncate">
                    {stats.numericStats.max}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-[#131a2c]">
                  <span className="text-[10px] text-slate-500 block">Sum</span>
                  <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block truncate">
                    {stats.numericStats.sum}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top Frequent Values */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Top Frequent Values</span>
              <span className="text-[10px] text-slate-500 font-normal">Count / Share</span>
            </div>
            <div className="space-y-2">
              {stats.topValues.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 text-center">All rows are null or empty</div>
              ) : (
                stats.topValues.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300 truncate max-w-[260px]" title={item.value}>
                        {item.value || <span className="text-slate-600 italic">empty</span>}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {item.count} <span className="text-slate-600">({item.percent}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#141b2b] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, Number(item.percent))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1b2333] bg-[#080b12] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
