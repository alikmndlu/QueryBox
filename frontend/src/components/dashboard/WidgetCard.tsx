import React, { useState } from 'react';
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
  Edit3,
  X,
} from 'lucide-react';
import { DashboardWidget, WidgetChartType, useDashboardStore } from '../../store/useDashboardStore';

interface WidgetCardProps {
  widget: DashboardWidget;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget }) => {
  const { refreshWidget, updateWidget, deleteWidget } = useDashboardStore();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(widget.title);
  const [sql, setSql] = useState(widget.sql);
  const [chartType, setChartType] = useState<WidgetChartType>(widget.chartType);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(widget.refreshIntervalSec);

  React.useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  const columns = widget.lastResult?.columns || [];
  const rows = widget.lastResult?.rows || [];
  const rowCount = widget.lastResult?.rowCount ?? rows.length;

  const firstCell = rows[0]?.[0];
  const isNumeric = firstCell !== undefined && !isNaN(Number(firstCell));
  const kpiValue = isNumeric ? Number(firstCell).toLocaleString() : firstCell ?? 'N/A';

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWidget(widget.id, {
      title: title.trim(),
      sql: sql.trim(),
      chartType,
      refreshIntervalSec,
    });
    setIsEditing(false);
    refreshWidget(widget.id);
  };

  return (
    <div className="bg-[#101625] border border-[#1e2942] rounded-xl p-4 flex flex-col justify-between shadow-xl hover:border-[#2b3a5c] transition-all group select-none relative overflow-hidden">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#1c263c] mb-3">
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
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
          <div className="truncate min-w-0">
            <h3 className="text-xs font-bold text-slate-100 truncate">{widget.title}</h3>
            <p className="text-[10px] text-slate-500 font-mono truncate">{widget.sql}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => refreshWidget(widget.id)}
            disabled={widget.isRefreshing}
            className="p-1 rounded hover:bg-[#1c263c] text-slate-400 hover:text-white transition-colors"
            title="Refresh Widget Query"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${widget.isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
            title="Edit Widget Query & Settings"
          >
            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Edit Widget Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d121c] border border-[#1c263c] rounded-xl shadow-2xl p-5 text-xs text-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c263c]">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>Edit Widget Configuration</span>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">SQL Query Statement</label>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as WidgetChartType)}
                    className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="kpi">KPI Metric Card</option>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="table">Table Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Auto-refresh Interval</label>
                  <select
                    value={refreshIntervalSec}
                    onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                    className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={0}>Manual (Off)</option>
                    <option value={5}>Every 5s</option>
                    <option value={10}>Every 10s</option>
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 60s (1m)</option>
                    <option value={120}>Every 120s (2m)</option>
                    <option value={180}>Every 180s (3m)</option>
                    <option value={300}>Every 300s (5m)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c263c]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
                >
                  Save & Update Widget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
