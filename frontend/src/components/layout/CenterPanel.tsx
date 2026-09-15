import React, { useState, useEffect } from 'react';
import {
  Star,
  Sparkles,
  Copy,
  Save,
  MoreHorizontal,
  Trash2,
  Edit3,
  Sidebar,
  Check,
  Play,
  Activity,
  Code2,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { useQueryStore } from '../../store/useQueryStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useUIStore } from '../../store/useUIStore';
import { useTabStore } from '../../store/useTabStore';
import { SQLEditor } from '../editor/SQLEditor';
import { TabBar } from './TabBar';
import { ParameterBar } from '../editor/ParameterBar';
import { SnippetMenu } from '../editor/SnippetMenu';
import { DataGridPanel } from '../datagrid/DataGridPanel';
import { substituteParameters } from '../../lib/paramExtractor';
import { checkQueryMutation, QueryMutationCheck } from '../../lib/queryClassifier';
import { SQLDialect } from '../../types';
import { Button } from '../ui/button';
import { QueryBoxLogo } from '../ui/QueryBoxLogo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export const CenterPanel: React.FC = () => {
  const {
    activeQuery,
    draftTitle,
    draftSQL,
    draftDialect,
    updateDraft,
    saveActiveQuery,
    formatActiveQuery,
    toggleFavorite,
    duplicateQuery,
    deleteQuery,
    createNewQuery,
    saveStatus,
  } = useQueryStore();

  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    executeQuery,
    explainQuery,
    runBenchmark,
    queryLimit,
    setQueryLimit,
    isExecuting,
    isBenchmarking,
    setConnectionModalOpen,
  } = useConnectionStore();

  const {
    toggleLeftSidebar,
    toggleRightSidebar,
    showToast,
    setCopyAsCodeModalOpen,
  } = useUIStore();

  const { tabIds } = useTabStore();

  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [pendingMutation, setPendingMutation] = useState<{ sql: string; info: QueryMutationCheck } | null>(null);

  const executeWithMutationGuard = (force: boolean = false) => {
    const finalSQL = substituteParameters(draftSQL, paramValues);
    if (!force) {
      const check = checkQueryMutation(finalSQL);
      if (check.isMutating) {
        setPendingMutation({ sql: finalSQL, info: check });
        return;
      }
    }
    executeQuery(finalSQL, queryLimit);
  };

  const handleExecute = () => executeWithMutationGuard(false);

  const handleExplain = () => {
    const finalSQL = substituteParameters(draftSQL, paramValues);
    explainQuery(finalSQL);
  };

  const handleBenchmark = () => {
    const finalSQL = substituteParameters(draftSQL, paramValues);
    runBenchmark(finalSQL, 5);
  };

  // Keyboard shortcut listener for Ctrl+Enter when not in Monaco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draftSQL, paramValues, activeProfileId]);

  if (!activeQuery) {
    return (
      <div className="flex-1 h-full bg-[#080b11] flex flex-col min-w-0 overflow-hidden select-none">
        {tabIds.length > 0 && <TabBar />}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <QueryBoxLogo size={56} showText={false} className="mb-4" />
          <h2 className="text-xl font-bold text-white tracking-tight">QueryBox</h2>
          <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
            Your personal offline SQL query library. Select an existing query or create a new query to start editing, organizing, and formatting.
          </p>
          <Button
            onClick={() => createNewQuery()}
            variant="default"
            size="default"
            className="mt-5"
          >
            Create New Query (⌘N)
          </Button>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(draftSQL);
    setCopied(true);
    showToast('SQL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = draftSQL ? draftSQL.split('\n').length : 0;
  const charCount = draftSQL ? draftSQL.length : 0;

  return (
    <div className="flex-1 h-full bg-[#080b11] flex flex-col min-w-0 overflow-hidden">
      {/* Multi-Tab Workspace Bar */}
      <TabBar />

      {/* 1. Header Bar: Title, Favorite, Save, and Sidebar/Menu Actions */}
      <div className="h-10 px-3 border-b border-[#182033] bg-[#0c101a] flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left Side: Left Sidebar Toggle, Favorite, & Full-Width Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            onClick={toggleLeftSidebar}
            variant="ghost"
            size="iconSm"
            className="h-7 w-7 text-slate-400 hover:text-slate-200"
            title="Toggle Left Sidebar (Cmd+B)"
          >
            <Sidebar className="w-4 h-4" />
          </Button>

          <button
            onClick={() => toggleFavorite(activeQuery.id)}
            className={`p-1 hover:scale-110 transition-transform ${
              activeQuery.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
            }`}
            title="Toggle Favorite"
          >
            <Star className={`w-4 h-4 ${activeQuery.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <input
            type="text"
            value={draftTitle}
            onChange={(e) => updateDraft({ title: e.target.value })}
            placeholder="Untitled Query..."
            className="h-7 px-2.5 rounded-md bg-transparent hover:bg-[#111622] focus:bg-[#111622] border border-transparent focus:border-indigo-500/50 text-xs font-semibold text-slate-100 focus:outline-none min-w-[160px] flex-1 truncate transition-colors"
          />
        </div>

        {/* Right Side of Title Bar: Save Button, Info Sidebar Toggle, More Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            onClick={saveActiveQuery}
            disabled={saveStatus === 'saved'}
            variant={saveStatus === 'dirty' ? 'default' : 'secondary'}
            size="sm"
            className={`h-7 text-xs px-2.5 transition-all ${
              saveStatus === 'dirty'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
                : 'bg-[#101625] text-slate-400 border border-[#1d273d]'
            }`}
            title="Save Query (Cmd+S)"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'dirty' ? 'Save' : 'Saved'}</span>
          </Button>

          <Button
            onClick={toggleRightSidebar}
            variant="ghost"
            size="iconSm"
            className="h-7 w-7 text-slate-400 hover:text-slate-200"
            title="Toggle Query Info Sidebar"
          >
            <Sidebar className="w-4 h-4 rotate-180" />
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div
                onMouseLeave={() => setShowMenu(false)}
                className="absolute right-0 mt-1 w-44 py-1 rounded-lg bg-[#111622] border border-[#1b2333] shadow-2xl z-50 text-xs text-slate-300 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    duplicateQuery(activeQuery.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#161c2b] flex items-center gap-2 text-left"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Duplicate Query</span>
                </button>
                <button
                  onClick={() => {
                    setCopyAsCodeModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#161c2b] flex items-center gap-2 text-left"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export as Code</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteAlert(true);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 flex items-center gap-2 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Query</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Query Execution & SQL Tooling Bar */}
      <div className="h-10 px-3 border-b border-[#182033] bg-[#090d16] flex items-center justify-between gap-2 shrink-0 select-none overflow-x-auto no-scrollbar">
        {/* Left Side: Database Connection & Run Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#101625]/80 border border-[#1b253b] p-0.5 rounded-lg gap-1">
            <select
              value={activeProfileId || ''}
              onChange={(e) => {
                if (e.target.value === '__manage__') {
                  setConnectionModalOpen(true);
                } else {
                  setActiveProfileId(e.target.value || null);
                }
              }}
              className="h-7 px-2 rounded-md bg-[#0c111d] border border-[#1d273d] text-[11px] font-medium text-slate-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
              title="Target Database Connection"
            >
              <option value="" disabled>No Connection</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.driver})
                </option>
              ))}
              <option value="__manage__">+ Manage Connections...</option>
            </select>

            {/* Limit Selector */}
            <select
              value={queryLimit}
              onChange={(e) => setQueryLimit(Number(e.target.value))}
              className="h-7 px-1.5 rounded-md bg-[#0c111d] border border-[#1d273d] text-[11px] font-mono text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
              title="Result Rows Limit"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
            </select>

            {/* Run Button */}
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950/40 gap-1.5 text-xs h-7 px-2.5 transition-all"
              title="Run Query (Ctrl+Enter)"
            >
              <Play className={`w-3 h-3 fill-white ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Running...' : 'Run'}</span>
            </Button>

            {/* Explain Button */}
            <Button
              onClick={handleExplain}
              disabled={isExecuting || isBenchmarking}
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2 text-slate-300 hover:text-amber-300 hover:bg-[#161f33]"
              title="Analyze Execution Plan (EXPLAIN)"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Explain</span>
            </Button>

            {/* Benchmark Button */}
            <Button
              onClick={handleBenchmark}
              disabled={isExecuting || isBenchmarking}
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2 text-slate-300 hover:text-violet-300 hover:bg-[#161f33]"
              title="Benchmark Query Performance (5 iterations)"
            >
              <Timer className={`w-3.5 h-3.5 text-violet-400 ${isBenchmarking ? 'animate-spin' : ''}`} />
              <span>{isBenchmarking ? '...' : 'Benchmark'}</span>
            </Button>
          </div>
        </div>

        {/* Right Side: Dialect, Format, Snippets, Export, Copy */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#101625]/80 border border-[#1b253b] p-0.5 rounded-lg gap-1">
            <select
              value={draftDialect}
              onChange={(e) => updateDraft({ dialect: e.target.value as SQLDialect })}
              className="h-7 px-2 rounded-md bg-[#0c111d] border border-[#1d273d] text-[11px] font-mono font-medium text-indigo-300 focus:outline-none uppercase cursor-pointer"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
            </select>

            <Button
              onClick={formatActiveQuery}
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-slate-300 hover:text-indigo-300 hover:bg-[#161f33]"
              title="Format SQL (Cmd+Shift+F)"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Format</span>
            </Button>

            <SnippetMenu />
          </div>

          <div className="flex items-center bg-[#101625]/80 border border-[#1b253b] p-0.5 rounded-lg gap-1">
            <Button
              onClick={() => setCopyAsCodeModalOpen(true)}
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2 text-slate-300 hover:text-slate-100 hover:bg-[#161f33]"
              title="Copy as Code (Go, TS, Python, Rust, PHP)"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export</span>
            </Button>

            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-slate-300 hover:text-slate-100 hover:bg-[#161f33]"
              title="Copy SQL (Cmd+Shift+C)"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Parameter / Variable Bar */}
      <ParameterBar
        sql={draftSQL}
        paramValues={paramValues}
        onChangeParam={(k, v) => setParamValues((prev) => ({ ...prev, [k]: v }))}
        onClearParams={() => setParamValues({})}
      />

      {/* Editor Main Content */}
      <div className="flex-1 relative overflow-hidden bg-[#090d16]">
        <SQLEditor
          value={draftSQL}
          onChange={(val) => updateDraft({ sqlContent: val })}
          onSave={saveActiveQuery}
          onFormat={formatActiveQuery}
          onExecute={handleExecute}
        />
      </div>

      {/* Data Grid Results & Explain Panel */}
      <DataGridPanel />

      {/* Bottom Status Bar */}
      <div className="h-6.5 px-4 bg-[#0c101a] border-t border-[#1b2333] flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 ${
              saveStatus === 'dirty'
                ? 'text-amber-400 font-semibold'
                : saveStatus === 'saving'
                ? 'text-indigo-400'
                : 'text-emerald-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'dirty'
                  ? 'bg-amber-400 animate-pulse'
                  : saveStatus === 'saving'
                  ? 'bg-indigo-400 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            {saveStatus === 'dirty' ? 'Unsaved' : saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
          <span className="text-slate-600">|</span>
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span className="text-emerald-400 font-semibold">Ctrl+Enter Run</span>
          <span>⌘S Save</span>
          <span>⌘⇧F Format</span>
          <span>⌘⇧C Copy</span>
        </div>
      </div>

      {/* shadcn AlertDialog for Delete Query in CenterPanel */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-slate-200">"{activeQuery?.title}"</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteQuery(activeQuery.id);
                setShowDeleteAlert(false);
              }}
            >
              Delete Query
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Destructive / Mutating Queries (DELETE, UPDATE, DROP, etc.) */}
      <AlertDialog open={!!pendingMutation} onOpenChange={(open) => !open && setPendingMutation(null)}>
        <AlertDialogContent className="bg-[#0f1422] border-[#222e47] max-w-lg select-none text-slate-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`p-2 rounded-lg ${pendingMutation?.info.severity === 'danger' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <AlertDialogTitle className="text-sm font-bold text-white">
                  {pendingMutation?.info.warningTitle || 'Confirm Database Mutation'}
                </AlertDialogTitle>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Target: <span className="text-indigo-300 font-semibold">{profiles.find(p => p.id === activeProfileId)?.name || 'Default Connection'}</span>
                </div>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-slate-300 leading-relaxed pt-2">
              {pendingMutation?.info.warningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* SQL Preview Box */}
          <div className="my-2 p-3 rounded-lg bg-[#080b12] border border-[#1b253b] font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap select-text">
            {pendingMutation?.sql}
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-[#141b2b] border-[#222e47] text-slate-300 hover:bg-[#1a2338] text-xs h-8">
              Cancel (Esc)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingMutation) {
                  const sqlToRun = pendingMutation.sql;
                  setPendingMutation(null);
                  executeQuery(sqlToRun, queryLimit);
                }
              }}
              className={`text-white text-xs h-8 font-semibold shadow-md ${
                pendingMutation?.info.severity === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
              }`}
            >
              <Play className="w-3.5 h-3.5 mr-1 fill-white" />
              <span>Execute {pendingMutation?.info.operationType}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
