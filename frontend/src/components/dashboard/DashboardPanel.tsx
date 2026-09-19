import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  RotateCcw,
  Clock,
  Sparkles,
  Layers,
  X,
  Play,
  Grid,
} from 'lucide-react';
import { useDashboardStore, WidgetChartType } from '../../store/useDashboardStore';
import { WidgetCard } from './WidgetCard';
import { useUIStore } from '../../store/useUIStore';

export const DashboardPanel: React.FC = () => {
  const {
    widgets,
    addWidget,
    refreshAllWidgets,
    globalRefreshSec,
    setGlobalRefreshSec,
    isAutoRefreshActive,
  } = useDashboardStore();

  const { showToast } = useUIStore();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSql, setNewSql] = useState('SELECT COUNT(*) AS total_count FROM users;');
  const [newChartType, setNewChartType] = useState<WidgetChartType>('kpi');
  const [newRefreshSec, setNewRefreshSec] = useState(60);

  // Auto-refresh interval timer
  useEffect(() => {
    if (!isAutoRefreshActive || globalRefreshSec === 0) return;
    const interval = setInterval(() => {
      refreshAllWidgets();
    }, globalRefreshSec * 1000);

    return () => clearInterval(interval);
  }, [globalRefreshSec, isAutoRefreshActive]);

  const handleCreateWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSql.trim()) return;

    addWidget({
      title: newTitle.trim(),
      sql: newSql.trim(),
      chartType: newChartType,
      refreshIntervalSec: newRefreshSec,
    });

    setAddModalOpen(false);
    setNewTitle('');
    showToast('New widget added to dashboard');
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-100 select-none overflow-hidden">
      {/* Dashboard Top Bar */}
      <div className="h-12 px-4 bg-[#090d16] border-b border-[#1c263c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <span>Live KPI Dashboard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {widgets.length} Widgets
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Global Auto-Refresh selector */}
          <div className="flex items-center bg-[#101625] border border-[#1e2942] rounded-lg px-2 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Auto-refresh:</span>
            <select
              value={globalRefreshSec}
              onChange={(e) => setGlobalRefreshSec(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-[#101625]">Off (Manual)</option>
              <option value={5} className="bg-[#101625]">Every 5s</option>
              <option value={10} className="bg-[#101625]">Every 10s</option>
              <option value={30} className="bg-[#101625]">Every 30s</option>
              <option value={60} className="bg-[#101625]">Every 60s (1m)</option>
              <option value={120} className="bg-[#101625]">Every 120s (2m)</option>
              <option value={180} className="bg-[#101625]">Every 180s (3m)</option>
              <option value={300} className="bg-[#101625]">Every 300s (5m)</option>
            </select>
          </div>

          <button
            onClick={() => refreshAllWidgets()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#161f33] hover:bg-[#202c48] rounded-lg border border-[#232e48] transition-colors"
            title="Refresh All Widgets"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Refresh All</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md shadow-emerald-950/40 transition-all font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 p-5 overflow-y-auto">
        {widgets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center">
            <Grid className="w-10 h-10 text-slate-600 mb-3" />
            <span className="text-sm font-semibold text-slate-300">Live Dashboard is empty</span>
            <span className="text-xs text-slate-500 mt-1 max-w-sm">
              Click "Add Widget" or pin any SQL query result from the Data Grid to build your live KPI dashboard.
            </span>
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Dashboard Widget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((w) => (
              <WidgetCard key={w.id} widget={w} />
            ))}
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d121c] border border-[#1c263c] rounded-xl shadow-2xl p-5 text-xs text-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c263c]">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Add Dashboard Widget</span>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWidget} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Widget Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Total Active Users Count"
                  required
                  className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">SQL Query Statement</label>
                <textarea
                  value={newSql}
                  onChange={(e) => setNewSql(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Chart / View Type</label>
                  <select
                    value={newChartType}
                    onChange={(e) => setNewChartType(e.target.value as WidgetChartType)}
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
                    value={newRefreshSec}
                    onChange={(e) => setNewRefreshSec(Number(e.target.value))}
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
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow"
                >
                  Create Widget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
