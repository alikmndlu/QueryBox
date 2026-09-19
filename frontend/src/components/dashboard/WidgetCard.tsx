import React from 'react';
import {
  RotateCcw,
  Trash2,
  BarChart3,
  TrendingUp,
  PieChart,
  Table as TableIcon,
  Clock,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { DashboardWidget, useDashboardStore } from '../../store/useDashboardStore';

interface WidgetCardProps {
  widget: DashboardWidget;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget }) => {
  const { refreshWidget, deleteWidget } = useDashboardStore();

  const columns = widget.lastResult?.columns || [];
  const rows = widget.lastResult?.rows || [];
  const rowCount = widget.lastResult?.rowCount ?? rows.length;

  // Extract primary numeric value for KPI Card view
  const firstCell = rows[0]?.[0];
  const isNumeric = firstCell !== undefined && !isNaN(Number(firstCell));
  const kpiValue = isNumeric ? Number(firstCell).toLocaleString() : firstCell ?? 'N/A';

  return (
    <div className="bg-[#101625] border border-[#1e2942] rounded-xl p-4 flex flex-col justify-between shadow-xl hover:border-[#2b3a5c] transition-all group select-none relative overflow-hidden">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1c263c] mb-3">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {widget.chartType === 'kpi' ? (
              <Hash className="w-4 h-4 text-emerald-400" />
            ) : widget.chartType === 'bar' ? (
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            ) : widget.chartType === 'line' ? (
              <TrendingUp className="w-4 h-4 text-sky-400" />
            ) : widget.chartType === 'donut' || widget.chartType === 'pie' ? (
              <PieChart className="w-4 h-4 text-amber-400" />
            ) : (
              <TableIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="truncate">
            <h3 className="text-xs font-bold text-slate-100 truncate">{widget.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono truncate">{widget.sql}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => refreshWidget(widget.id)}
            disabled={widget.isRefreshing}
            className="p-1 rounded hover:bg-[#1c263c] text-slate-400 hover:text-white transition-colors"
            title="Refresh Widget Query"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${widget.isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => deleteWidget(widget.id)}
            className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
            title="Delete Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Widget Content Body */}
      <div className="flex-1 min-h-[140px] flex flex-col justify-center">
        {widget.error ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="break-all">{widget.error}</div>
          </div>
        ) : widget.chartType === 'kpi' ? (
          /* KPI Stat View */
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 font-mono tracking-tight">
              {kpiValue}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {columns[0] || 'Result Value'} ({rowCount} rows)
            </div>
          </div>
        ) : widget.chartType === 'bar' ? (
          /* Mini SVG Bar Chart */
          <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 pb-1">
            {rows.slice(0, 10).map((r, i) => {
              const val = Number(r[1] ?? r[0]) || 10;
              const maxVal = Math.max(...rows.slice(0, 10).map((row) => Number(row[1] ?? row[0]) || 1), 1);
              const heightPct = Math.max(15, Math.min(100, (val / maxVal) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group/bar relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t hover:from-indigo-500 hover:to-violet-400 transition-all shadow-sm"
                  />
                  <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center mt-1">
                    {String(r[0]).slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mini Table Summary */
          <div className="max-h-32 overflow-y-auto font-mono text-[11px] text-slate-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1c263c] text-[10px] text-slate-500 uppercase">
                  {columns.slice(0, 3).map((col) => (
                    <th key={col} className="pb-1 px-1">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c263c]/40">
                {rows.slice(0, 4).map((r, i) => (
                  <tr key={i} className="hover:bg-[#161f33]">
                    {r.slice(0, 3).map((cell: any, j: number) => (
                      <td key={j} className="py-1 px-1 truncate max-w-[100px]">
                        {cell === null ? 'NULL' : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="pt-2 border-t border-[#1c263c] mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-600" />
          <span>{widget.lastRefreshedAt || 'Just now'}</span>
        </span>
        {widget.refreshIntervalSec > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Auto-refresh {widget.refreshIntervalSec}s
          </span>
        )}
      </div>
    </div>
  );
};
