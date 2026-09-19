import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  RotateCcw,
  Clock,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Grid,
  LogOut,
  Tv,
  Zap,
  Bookmark,
  Database,
} from 'lucide-react';
import { useDashboardStore, WidgetChartType } from '../../store/useDashboardStore';
import { WidgetCard } from './WidgetCard';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useConnectionStore } from '../../store/useConnectionStore';

export const DashboardPanel: React.FC = () => {
  const {
    widgets,
    addWidget,
    refreshAllWidgets,
    globalRefreshSec,
    setGlobalRefreshSec,
    isAutoRefreshActive,
  } = useDashboardStore();

  const { queries, toggleDashboardShow } = useQueryStore();
  const { profiles } = useConnectionStore();
  const { setDashboardOpen, showToast } = useUIStore();

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newSql, setNewSql] = useState('SELECT COUNT(*) AS total_count FROM users;');
  const [newChartType, setNewChartType] = useState<WidgetChartType>('kpi');
  const [newRefreshSec, setNewRefreshSec] = useState(60);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedSavedQueryId, setSelectedSavedQueryId] = useState('');

  // Automatically sync saved queries pinned to dashboard (q.showInDashboard === true)
  useEffect(() => {
    const pinnedQueries = queries.filter((q) => q.showInDashboard);
    pinnedQueries.forEach((q) => {
      const exists = widgets.some((w) => w.savedQueryId === q.id || w.title === q.title);
      if (!exists) {
        addWidget({
          title: q.title,
          sql: q.sqlContent,
          chartType: 'kpi',
          refreshIntervalSec: 30,
          profileId: q.connectionProfileId,
          databaseName: q.databaseName,
          savedQueryId: q.id,
        });
      }
    });
  }, [queries]);

  // Auto-refresh interval timer
  useEffect(() => {
    if (!isAutoRefreshActive || globalRefreshSec === 0) return;
    const interval = setInterval(() => {
      refreshAllWidgets();
    }, globalRefreshSec * 1000);

    return () => clearInterval(interval);
  }, [globalRefreshSec, isAutoRefreshActive]);

  // Handle Escape key to exit fullscreen or exit dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleCreateWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSql.trim()) return;

    addWidget({
      title: newTitle.trim(),
      sql: newSql.trim(),
      chartType: newChartType,
      refreshIntervalSec: newRefreshSec,
      profileId: selectedProfileId || undefined,
      databaseName: selectedDatabase || undefined,
      savedQueryId: selectedSavedQueryId || undefined,
    });

    setAddModalOpen(false);
    setNewTitle('');
    setSelectedProfileId('');
    setSelectedDatabase('');
    setSelectedSavedQueryId('');
    showToast('New widget added to live dashboard');
  };

  const handleLoadDemoLayout = () => {
    addWidget({
      title: 'Total Active Users',
      sql: 'SELECT COUNT(*) AS total_users FROM users;',
      chartType: 'kpi',
      refreshIntervalSec: 10,
    });
    addWidget({
      title: 'Hourly Execution Volume',
      sql: 'SELECT strftime("%H", createdAt) AS hour, COUNT(*) AS volume FROM history GROUP BY hour LIMIT 8;',
      chartType: 'bar',
      refreshIntervalSec: 30,
    });
    addWidget({
      title: 'Average Latency (ms)',
      sql: 'SELECT executionTimeMs FROM history ORDER BY id DESC LIMIT 10;',
      chartType: 'line',
      refreshIntervalSec: 15,
    });
    addWidget({
      title: 'Database Tables Summary',
      sql: 'SELECT table_name, table_rows FROM information_schema.tables LIMIT 5;',
      chartType: 'table',
      refreshIntervalSec: 60,
    });
    showToast('Loaded demo KPI dashboard layout');
  };

  return (
    <div
      className={`flex flex-col bg-[#070a12] text-slate-100 select-none overflow-hidden transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-6 bg-[#060910]'
          : 'h-full w-full relative'
      }`}
    >
      {/* Dashboard Top Header Bar */}
      <div className="h-13 px-4 bg-[#0a0e17] border-b border-[#1c263c] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <BarChart3 className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Live KPI Dashboard</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {widgets.length} Widgets
                </span>
              </h2>
            </div>

            {/* Live Pulsing Connection Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>LIVE MONITOR</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Global Auto-Refresh selector */}
          <div className="flex items-center bg-[#111726] border border-[#1e2942] rounded-lg px-2.5 py-1 text-xs">
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#141c2e] hover:bg-[#1f2b45] rounded-lg border border-[#232e48] transition-colors"
            title="Refresh All Widgets"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Refresh All</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>

          {/* Fullscreen TV Monitor Display Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isFullscreen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#141c2e] text-slate-300 hover:text-white border-[#232e48]'
            }`}
            title={isFullscreen ? "Exit Fullscreen TV View (Esc)" : "Fullscreen TV Display Mode"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Prominent Exit Dashboard Button */}
          <button
            onClick={() => setDashboardOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors ml-1"
            title="Exit Live Dashboard and return to SQL Editor"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 p-5 overflow-y-auto">
        {widgets.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-slate-500 text-center">
            <div className="p-4 rounded-2xl bg-[#0e1422] border border-[#1d273c] mb-4">
              <Tv className="w-12 h-12 text-emerald-400 opacity-80" />
            </div>
            <span className="text-base font-bold text-slate-200">Live Dashboard is empty</span>
            <span className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
              Pin saved queries from your library to the Live Dashboard or add custom metric cards.
            </span>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Widget</span>
              </button>
              <button
                onClick={handleLoadDemoLayout}
                className="px-4 py-2 text-xs font-semibold text-indigo-300 hover:text-white bg-[#131a2a] hover:bg-[#1a2338] border border-[#232e48] rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Load Demo KPI Layout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {widgets.map((w) => (
              <WidgetCard key={w.id} widget={w} />
            ))}
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
              {/* Import from Saved Query dropdown */}
              {queries.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Import from Saved Query Library</label>
                  <select
                    onChange={(e) => {
                      const qId = e.target.value;
                      const q = queries.find((item) => item.id === qId);
                      if (q) {
                        setNewTitle(q.title);
                        setNewSql(q.sqlContent);
                        setSelectedProfileId(q.connectionProfileId || '');
                        setSelectedDatabase(q.databaseName || '');
                        setSelectedSavedQueryId(q.id);
                      }
                    }}
                    className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-2.5 py-2 text-xs text-indigo-300 font-medium focus:outline-none"
                  >
                    <option value="">-- Choose a Saved Query --</option>
                    {queries.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.dialect})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {/* Connection Profile & Database Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Connection Profile</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="">(Current Active Profile)</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Database Name</label>
                  <input
                    type="text"
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    placeholder="e.g. analytics_db"
                    className="w-full bg-[#111726] border border-[#232e48] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
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
