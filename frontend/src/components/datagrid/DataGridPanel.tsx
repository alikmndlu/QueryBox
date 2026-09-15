import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Clock,
  Database,
  Table as TableIcon,
  Activity,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  BarChart3,
  History as HistoryIcon,
  Search,
  ArrowUpDown,
  Play,
  Trash2,
  Timer,
  SlidersHorizontal,
  BarChart2,
} from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useUIStore } from '../../store/useUIStore';
import { ChartVisualizer } from './ChartVisualizer';
import { ColumnProfilerModal } from './ColumnProfilerModal';

export const DataGridPanel: React.FC = () => {
  const {
    isDataGridOpen,
    setDataGridOpen,
    lastResult,
    explainPlan,
    benchmarkResult,
    isBenchmarking,
    activeDataGridTab,
    setActiveDataGridTab,
    isExecuting,
    activeProfile,
    executionHistory,
    fetchExecutionHistory,
    clearExecutionHistory,
    executeQuery,
  } = useConnectionStore();
  const { showToast } = useUIStore();
  const { updateDraft } = useQueryStore();

  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState<number>(300);
  const [filterText, setFilterText] = useState<string>('');
  const [sortColIdx, setSortColIdx] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hiddenCols, setHiddenCols] = useState<Record<string, boolean>>({});
  const [showColPicker, setShowColPicker] = useState<boolean>(false);
  const [profilingCol, setProfilingCol] = useState<{ name: string; index: number } | null>(null);

  const visibleColIndices = useMemo(() => {
    if (!lastResult || !lastResult.columns) return [];
    return lastResult.columns
      .map((col, idx) => ({ col, idx }))
      .filter(({ col }) => !hiddenCols[col])
      .map(({ idx }) => idx);
  }, [lastResult, hiddenCols]);

  if (!isDataGridOpen) {
    return null;
  }

  // Handle column sort toggle
  const handleSort = (colIdx: number) => {
    if (sortColIdx === colIdx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColIdx(null);
        setSortDirection('asc');
      }
    } else {
      setSortColIdx(colIdx);
      setSortDirection('asc');
    }
  };

  // Filter and sort rows in memory
  const processedRows = useMemo(() => {
    if (!lastResult || !lastResult.rows) return [];
    let rows = [...lastResult.rows];

    // Filter
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      rows = rows.filter((r) =>
        r.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortColIdx !== null) {
      rows.sort((a, b) => {
        const valA = a[sortColIdx];
        const valB = b[sortColIdx];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [lastResult, filterText, sortColIdx, sortDirection]);

  const handleCopyCell = (val: any, cellKey: string) => {
    const text = val === null || val === undefined ? 'NULL' : String(val);
    navigator.clipboard.writeText(text);
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const handleExportCSV = () => {
    if (!lastResult || !lastResult.columns || lastResult.columns.length === 0) return;
    const cols = visibleColIndices.map((idx) => lastResult.columns[idx]);
    const header = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = processedRows.map((row) =>
      visibleColIndices
        .map((idx) => {
          const cell = row[idx];
          if (cell === null || cell === undefined) return '';
          return `"${String(cell).replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [header, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported results to CSV');
  };

  const handleExportJSON = () => {
    if (!lastResult || !lastResult.columns || lastResult.columns.length === 0) return;
    const cols = visibleColIndices.map((idx) => lastResult.columns[idx]);
    const data = processedRows.map((row) => {
      const obj: Record<string, any> = {};
      visibleColIndices.forEach((idx) => {
        const col = lastResult.columns[idx];
        obj[col] = row[idx];
      });
      return obj;
    });
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_result_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported results to JSON');
  };

  const handleCopyTSV = () => {
    if (!lastResult || !lastResult.columns || lastResult.columns.length === 0) return;
    const cols = visibleColIndices.map((idx) => lastResult.columns[idx]);
    const header = cols.join('\t');
    const rows = processedRows.map((row) =>
      visibleColIndices
        .map((idx) => {
          const cell = row[idx];
          return cell === null || cell === undefined ? 'NULL' : String(cell);
        })
        .join('\t')
    );
    const tsv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(tsv);
    showToast('Copied visible results to clipboard as TSV');
  };

  return (
    <div
      style={{ height: `${panelHeight}px` }}
      className="border-t border-[#1b2333] bg-[#0c101a] flex flex-col z-20 transition-all select-none"
    >
      {/* Panel Tab Header */}
      <div className="h-8.5 px-3 bg-[#0a0d17] border-b border-[#1b2333] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {/* Results Tab */}
          <button
            onClick={() => setActiveDataGridTab('results')}
            className={`flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeDataGridTab === 'results'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Results</span>
            {lastResult && (
              <span className="text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                {processedRows.length}
                {filterText ? ` / ${lastResult.rowCount}` : ''}
              </span>
            )}
          </button>

          {/* Chart Tab */}
          <button
            onClick={() => setActiveDataGridTab('chart')}
            className={`flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeDataGridTab === 'chart'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chart</span>
          </button>

          {/* EXPLAIN Plan Tab */}
          <button
            onClick={() => setActiveDataGridTab('explain')}
            className={`flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeDataGridTab === 'explain'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>EXPLAIN</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => {
              setActiveDataGridTab('history');
              fetchExecutionHistory();
            }}
            className={`flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeDataGridTab === 'history'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>History</span>
          </button>

          {/* Benchmark Tab */}
          <button
            onClick={() => setActiveDataGridTab('benchmark')}
            className={`flex items-center gap-1.5 h-6.5 px-2.5 rounded text-xs font-medium transition-colors ${
              activeDataGridTab === 'benchmark'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
            }`}
          >
            <Timer className={`w-3.5 h-3.5 text-violet-400 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>Benchmark</span>
            {benchmarkResult && (
              <span className="text-[10px] font-mono px-1 rounded bg-violet-500/20 text-violet-300">
                {benchmarkResult.avgTimeMs.toFixed(1)}ms
              </span>
            )}
          </button>

          {lastResult && !isExecuting && activeDataGridTab === 'results' && (
            <div className="flex items-center gap-2 ml-2 text-[11px] font-mono text-slate-400 hidden sm:flex">
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Clock className="w-3 h-3" />
                {lastResult.executionTimeMs}ms
              </span>
              {activeProfile && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-indigo-400 truncate max-w-[130px]">
                    {activeProfile.name}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {activeDataGridTab === 'results' && lastResult && lastResult.rowCount > 0 && (
            <>
              {/* In-memory search filter */}
              <div className="flex items-center bg-[#111622] border border-[#1b2333] rounded px-1.5 py-0.5 text-xs text-slate-200">
                <Search className="w-3 h-3 text-slate-500 mr-1" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter rows..."
                  className="bg-transparent focus:outline-none text-[11px] font-mono w-24 sm:w-32 text-slate-200 placeholder:text-slate-600"
                />
                {filterText && (
                  <button onClick={() => setFilterText('')} className="text-slate-500 hover:text-slate-300">
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 h-6 px-2 text-[11px] text-slate-300 hover:text-white bg-[#151c2d] hover:bg-[#1b2438] rounded border border-[#1b2333] transition-colors"
                title="Export result rows to CSV"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 h-6 px-2 text-[11px] text-slate-300 hover:text-white bg-[#151c2d] hover:bg-[#1b2438] rounded border border-[#1b2333] transition-colors"
                title="Export result rows to JSON"
              >
                <FileJson className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">JSON</span>
              </button>
              <button
                onClick={handleCopyTSV}
                className="flex items-center gap-1 h-6 px-2 text-[11px] text-slate-300 hover:text-white bg-[#151c2d] hover:bg-[#1b2438] rounded border border-[#1b2333] transition-colors"
                title="Copy all rows to clipboard as TSV"
              >
                <Copy className="w-3 h-3 text-sky-400" />
                <span className="hidden md:inline">Copy</span>
              </button>

              {/* Columns Visibility Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowColPicker(!showColPicker)}
                  className="flex items-center gap-1.5 h-6 px-2 rounded bg-[#151c2d] hover:bg-[#1b2438] border border-[#1b2333] text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                  title="Toggle Columns Visibility"
                >
                  <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                  <span className="hidden sm:inline">Columns</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
                    {visibleColIndices.length}/{lastResult.columns.length}
                  </span>
                </button>

                {showColPicker && (
                  <div
                    onMouseLeave={() => setShowColPicker(false)}
                    className="absolute right-0 mt-1 w-56 max-h-60 overflow-y-auto py-1.5 px-2 rounded-lg bg-[#111622] border border-[#1b2333] shadow-2xl z-50 text-xs text-slate-300 space-y-1 animate-in fade-in-50 duration-100 select-none"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[#1b2333] mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Visible Columns</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setHiddenCols({})}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300"
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            const allHidden: Record<string, boolean> = {};
                            lastResult.columns.forEach((c) => (allHidden[c] = true));
                            setHiddenCols(allHidden);
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {lastResult.columns.map((col) => {
                      const isVisible = !hiddenCols[col];
                      return (
                        <label
                          key={col}
                          className="flex items-center gap-2 py-1 px-1 rounded hover:bg-[#182133] cursor-pointer text-[11px] font-mono truncate"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() =>
                              setHiddenCols((prev) => ({
                                ...prev,
                                [col]: !prev[col],
                              }))
                            }
                            className="rounded border-[#2a354c] bg-[#0c101a] text-indigo-600 focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <span className={`truncate ${isVisible ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                            {col}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeDataGridTab === 'history' && executionHistory.length > 0 && (
            <button
              onClick={clearExecutionHistory}
              className="flex items-center gap-1 h-6 px-2 text-[11px] text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/20 transition-colors"
              title="Clear execution log records"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={() => setPanelHeight(panelHeight === 300 ? 500 : 300)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#161d2d] rounded transition-colors"
            title={panelHeight === 300 ? 'Expand Grid Height' : 'Shrink Grid Height'}
          >
            {panelHeight === 300 ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setDataGridOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-rose-500/10 hover:text-rose-400 rounded transition-colors ml-1"
            title="Close Results Grid"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-auto bg-[#080b11]">
        {isExecuting ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 select-none">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-medium text-slate-200">Executing query...</span>
            <span className="text-[11px] text-slate-500 mt-1">
              Connecting to {activeProfile?.name || 'database'}
            </span>
          </div>
        ) : activeDataGridTab === 'chart' ? (
          /* CHART VISUALIZER VIEW */
          <ChartVisualizer columns={lastResult?.columns || []} rows={processedRows} />
        ) : activeDataGridTab === 'history' ? (
          /* EXECUTION AUDIT HISTORY VIEW */
          <div className="p-3">
            {executionHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                <HistoryIcon className="w-6 h-6 text-slate-600 mb-2" />
                <span>No execution history recorded yet. Run a query to start logging.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {executionHistory.map((item) => {
                  const isSuccess = item.status === 'success';
                  const dateStr = new Date(item.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-[#0e1422] border border-[#1b2333] flex items-center justify-between gap-3 text-xs hover:border-indigo-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isSuccess ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400 shadow-sm shadow-rose-400/50'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-slate-400 font-semibold">{item.profileName}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">{dateStr}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400">{item.executionTimeMs}ms</span>
                            {isSuccess && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-400">{item.rowCount} rows</span>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 truncate mt-0.5">
                            {item.sqlContent.replace(/\s+/g, ' ')}
                          </div>
                          {!isSuccess && item.errorMessage && (
                            <div className="text-[10px] font-mono text-rose-400 truncate mt-0.5">
                              {item.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          updateDraft({ sqlContent: item.sqlContent });
                          executeQuery(item.sqlContent);
                        }}
                        className="flex items-center gap-1 h-6 px-2 text-[10px] text-slate-300 hover:text-white bg-[#151c2d] hover:bg-[#1c253b] rounded border border-[#1b2333] transition-colors shrink-0"
                        title="Load into editor and re-execute"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Re-run</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeDataGridTab === 'benchmark' ? (
          /* BENCHMARK View */
          <div className="p-4 select-text">
            {isBenchmarking ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400">
                <Timer className="w-8 h-8 text-violet-400 animate-spin mb-3" />
                <span className="text-sm font-semibold text-white">Benchmarking Query Performance...</span>
                <span className="text-xs text-slate-500 mt-1">Executing iterations in isolated database sessions</span>
              </div>
            ) : benchmarkResult ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {benchmarkResult.errorMessage ? (
                  <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <div className="font-semibold mb-1">Benchmark Error</div>
                      <div className="font-mono text-[11px] leading-relaxed break-all select-text">
                        {benchmarkResult.errorMessage}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Stat KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-[#0d121e] border border-[#1b2333] rounded-lg">
                        <div className="text-[11px] text-slate-500 font-medium">Average Latency</div>
                        <div className="text-xl font-bold font-mono text-violet-400 mt-1">
                          {benchmarkResult.avgTimeMs.toFixed(1)} <span className="text-xs font-normal text-slate-500">ms</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#0d121e] border border-[#1b2333] rounded-lg">
                        <div className="text-[11px] text-slate-500 font-medium">Fastest (Min)</div>
                        <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                          {benchmarkResult.minTimeMs} <span className="text-xs font-normal text-slate-500">ms</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#0d121e] border border-[#1b2333] rounded-lg">
                        <div className="text-[11px] text-slate-500 font-medium">Slowest (Max)</div>
                        <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                          {benchmarkResult.maxTimeMs} <span className="text-xs font-normal text-slate-500">ms</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#0d121e] border border-[#1b2333] rounded-lg">
                        <div className="text-[11px] text-slate-500 font-medium">Iterations & Rows</div>
                        <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                          {benchmarkResult.iterations} <span className="text-xs font-normal text-slate-500">runs · {benchmarkResult.rowCount} rows</span>
                        </div>
                      </div>
                    </div>

                    {/* Iteration Timeline Breakdown */}
                    <div className="p-4 bg-[#0c101a] border border-[#1b2333] rounded-lg">
                      <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                        <span>Latency by Iteration</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Max: {benchmarkResult.maxTimeMs}ms
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {benchmarkResult.timingsMs.map((ms, idx) => {
                          const max = Math.max(...benchmarkResult.timingsMs, 1);
                          const pct = Math.max(8, Math.round((ms / max) * 100));
                          const isFastest = ms === benchmarkResult.minTimeMs;
                          const isSlowest = ms === benchmarkResult.maxTimeMs && benchmarkResult.timingsMs.length > 1;

                          return (
                            <div key={idx} className="flex items-center gap-3 text-xs font-mono">
                              <span className="w-16 text-slate-500 text-[11px]">Run #{idx + 1}</span>
                              <div className="flex-1 h-5 bg-[#111622] rounded overflow-hidden p-0.5 border border-[#1b2333]">
                                <div
                                  className={`h-full rounded transition-all duration-300 ${
                                    isFastest
                                      ? 'bg-emerald-500/80'
                                      : isSlowest
                                      ? 'bg-amber-500/80'
                                      : 'bg-violet-500/70'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className={`w-16 text-right font-bold ${
                                  isFastest
                                    ? 'text-emerald-400'
                                    : isSlowest
                                    ? 'text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              >
                                {ms} ms
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-center">
                <Timer className="w-6 h-6 text-slate-600 mb-2" />
                <span className="text-xs text-slate-400 font-medium">No benchmark data yet</span>
                <span className="text-[11px] text-slate-600 mt-1 max-w-sm">
                  Click "Benchmark" in the toolbar to run this query 5 consecutive times and measure real-world latency variance and caching impact.
                </span>
              </div>
            )}
          </div>
        ) : activeDataGridTab === 'explain' ? (
          /* EXPLAIN View */
          <div className="p-4">
            {explainPlan ? (
              <pre className="text-xs font-mono text-slate-200 leading-relaxed bg-[#0b0f19] p-3 rounded-lg border border-[#1b2333] overflow-auto select-text whitespace-pre-wrap">
                {explainPlan}
              </pre>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Click "Explain" in the toolbar to generate an execution plan breakdown for this query.
              </div>
            )}
          </div>
        ) : (
          /* RESULTS Grid View */
          <>
            {lastResult?.error ? (
              <div className="p-4">
                <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <div className="font-semibold mb-1">Execution Error</div>
                    <div className="font-mono text-[11px] leading-relaxed break-all select-text">
                      {lastResult.error}
                    </div>
                  </div>
                </div>
              </div>
            ) : lastResult && lastResult.columns && lastResult.columns.length > 0 ? (
              <div className="relative min-w-full inline-block align-middle select-text">
                <table className="min-w-full text-left text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-[#0e1422] border-b border-[#1b2333] z-10 shadow-sm">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-r border-[#1b2333]/50 w-12 text-center select-none">
                        #
                      </th>
                      {visibleColIndices.map((idx) => {
                        const col = lastResult.columns[idx];
                        return (
                          <th
                            key={idx}
                            className="px-3 py-2 text-[11px] font-bold text-indigo-300 border-r border-[#1b2333]/50 select-none whitespace-nowrap group/th hover:bg-[#161e31] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={() => handleSort(idx)}
                                className="flex items-center gap-1.5 cursor-pointer flex-1"
                                title="Click to sort"
                              >
                                <span>{col}</span>
                                {sortColIdx === idx ? (
                                  <span className="text-emerald-400 text-[10px]">
                                    {sortDirection === 'asc' ? '▲' : '▼'}
                                  </span>
                                ) : (
                                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-50 group-hover/th:opacity-100" />
                                )}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfilingCol({ name: col, index: idx });
                                }}
                                className="opacity-0 group-hover/th:opacity-100 p-0.5 rounded hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-300 transition-all"
                                title="Inspect Column Distribution & Stats"
                              >
                                <BarChart2 className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b2333]/40">
                    {processedRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`hover:bg-[#151c2d]/70 transition-colors ${
                          rowIdx % 2 === 0 ? 'bg-[#080b11]' : 'bg-[#0b0f19]'
                        }`}
                      >
                        <td className="px-3 py-1.5 text-[10px] text-slate-600 border-r border-[#1b2333]/40 text-center select-none font-mono">
                          {rowIdx + 1}
                        </td>
                        {visibleColIndices.map((colIdx) => {
                          const cell = row[colIdx];
                          const cellKey = `${rowIdx}-${colIdx}`;
                          const isNull = cell === null || cell === undefined;
                          const cellStr = isNull ? 'NULL' : String(cell);

                          return (
                            <td
                              key={colIdx}
                              onClick={() => handleCopyCell(cell, cellKey)}
                              className={`px-3 py-1.5 border-r border-[#1b2333]/40 whitespace-nowrap max-w-xs truncate cursor-pointer relative group ${
                                isNull ? 'text-slate-600 italic' : 'text-slate-200'
                              }`}
                              title={isNull ? 'NULL (Click to copy)' : `${cellStr} (Click to copy)`}
                            >
                              <span>{cellStr}</span>
                              {copiedCell === cellKey && (
                                <span className="absolute right-1 top-1 bg-emerald-500 text-slate-950 font-bold px-1 py-0.2 rounded text-[9px] shadow">
                                  Copied
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : lastResult && lastResult.rowCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 select-none">
                <TableIcon className="w-6 h-6 text-emerald-500 mb-2" />
                <span className="text-xs text-slate-300 font-medium">Query executed successfully</span>
                <span className="text-[11px] text-slate-500 mt-1">
                  0 rows returned ({lastResult.executionTimeMs}ms)
                </span>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 select-none">
                <Database className="w-6 h-6 text-slate-600 mb-2" />
                <span className="text-xs text-slate-400">No query results yet</span>
                <span className="text-[11px] text-slate-600 mt-1">
                  Press Ctrl+Enter or click Run Query to execute
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Column Profiler Modal */}
      <ColumnProfilerModal
        isOpen={!!profilingCol}
        onClose={() => setProfilingCol(null)}
        columnName={profilingCol?.name || ''}
        columnIndex={profilingCol?.index ?? -1}
        rows={lastResult?.rows || []}
      />
    </div>
  );
};
