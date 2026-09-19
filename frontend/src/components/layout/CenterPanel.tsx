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
  Folder,
} from 'lucide-react';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useUIStore } from '../../store/useUIStore';
import { useTabStore } from '../../store/useTabStore';
import { SQLEditor } from '../editor/SQLEditor';
import { TabBar } from './TabBar';
import { ParameterBar } from '../editor/ParameterBar';
import { SnippetMenu } from '../editor/SnippetMenu';
import { DataGridPanel } from '../datagrid/DataGridPanel';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { substituteParameters } from '../../lib/paramExtractor';
import { checkQueryMutation, QueryMutationCheck } from '../../lib/queryClassifier';
import { ConfirmExecutionModal } from '../editor/ConfirmExecutionModal';
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
    draftCollectionId,
    updateDraft,
    saveActiveQuery,
    formatActiveQuery,
    toggleFavorite,
    duplicateQuery,
    deleteQuery,
    createNewQuery,
    saveStatus,
  } = useQueryStore();

  const { collections } = useCollectionStore();

  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    databases,
    activeDatabase,
    setActiveDatabase,
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
    showToast,
    setCopyAsCodeModalOpen,
  } = useUIStore();

  const { tabIds } = useTabStore();

  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [selectedSQL, setSelectedSQL] = useState('');

  // Debounce draft updates while typing in Monaco to eliminate React re-render typing lag
  const draftDebounceRef = React.useRef<any>(null);

  const handleSQLEditorChange = (val: string) => {
    if (draftDebounceRef.current) {
      clearTimeout(draftDebounceRef.current);
    }
    draftDebounceRef.current = setTimeout(() => {
      updateDraft({ sqlContent: val });
    }, 180);
  };

  // Execution Confirmation Guard State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSQL, setPendingSQL] = useState('');
  const [pendingMutationCheck, setPendingMutationCheck] = useState<QueryMutationCheck | null>(null);

  const executeWithMutationGuard = (targetSQL?: string) => {
    const raw = (targetSQL !== undefined ? targetSQL : (selectedSQL.trim() ? selectedSQL : draftSQL)).trim();
    if (!raw) {
      showToast('No query to execute', 'info');
      return;
    }
    const finalSQL = substituteParameters(raw, paramValues);
    const check = checkQueryMutation(finalSQL);

    if (check.isMutating) {
      // Require user confirmation for mutating queries (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, etc.)
      setPendingSQL(finalSQL);
      setPendingMutationCheck(check);
      setShowConfirmModal(true);
      return;
    }

    if (selectedSQL.trim() && !targetSQL) {
      showToast(`Running selected SQL (${raw.split('\n').length} lines)...`);
    }
    executeQuery(finalSQL, queryLimit);
  };

  const handleConfirmExecution = () => {
    if (pendingSQL) {
      if (selectedSQL.trim()) {
        showToast(`Executing mutating query...`);
      }
      executeQuery(pendingSQL, queryLimit);
      setPendingSQL('');
      setPendingMutationCheck(null);
    }
  };

  const handleExecute = (overrideSQL?: string) => executeWithMutationGuard(overrideSQL);

  const handleExplain = () => {
    const raw = (selectedSQL.trim() ? selectedSQL : draftSQL).trim();
    if (!raw) return;
    const finalSQL = substituteParameters(raw, paramValues);
    explainQuery(finalSQL);
  };

  const handleBenchmark = () => {
    const raw = (selectedSQL.trim() ? selectedSQL : draftSQL).trim();
    if (!raw) return;
    const finalSQL = substituteParameters(raw, paramValues);
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
  }, [draftSQL, selectedSQL, paramValues, activeProfileId, queryLimit]);

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

      {/* Unified Minimal Workspace Toolbar */}
      <div className="h-11 px-3 border-b border-[#1c2538] bg-[#0e1320] flex items-center justify-between gap-2 shrink-0 select-none shadow-sm">
        {/* Left: Sidebar Toggle, Favorite, Title, Dialect Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            onClick={toggleLeftSidebar}
            variant="ghost"
            size="iconSm"
            className="h-7 w-7 text-slate-400 hover:text-slate-200 hover:bg-[#161f32]"
            title="Toggle Navigation Sidebar (Cmd+B)"
          >
            <Sidebar className="w-4 h-4" />
          </Button>

          <button
            onClick={() => toggleFavorite(activeQuery.id)}
            className={`p-1 hover:scale-110 transition-transform shrink-0 ${
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
                saveActiveQuery();
              }
            }}
            placeholder="Untitled Query..."
            className="h-7 px-2 rounded-lg bg-transparent hover:bg-[#131926] focus:bg-[#131926] border border-transparent focus:border-indigo-500/60 text-xs font-semibold text-slate-100 focus:outline-none min-w-[140px] max-w-sm truncate transition-all"
          />

          {/* Collection Selector */}
          <div className="flex items-center gap-1 bg-[#131926] border border-[#1c2538] rounded-md px-1.5 h-6.5 shrink-0">
            <Folder className="w-3 h-3 text-indigo-400 shrink-0" />
            <select
              value={draftCollectionId || ''}
              onChange={(e) => updateDraft({ collectionId: e.target.value || null })}
              className="bg-transparent text-[11px] font-medium text-slate-300 focus:outline-none cursor-pointer max-w-[110px] truncate"
              title="Query Collection"
            >
              <option value="">No Collection</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dialect Pill */}
          <select
            value={draftDialect}
            onChange={(e) => updateDraft({ dialect: e.target.value as SQLDialect })}
            className="h-6.5 px-2 rounded-md bg-[#131926] border border-[#1c2538] text-[10px] font-mono font-semibold text-indigo-300 focus:outline-none uppercase cursor-pointer"
            title="SQL Dialect"
          >
            <option value="postgresql">Postgres</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="sqlserver">SQL Server</option>
          </select>
        </div>

        {/* Right: Actions Group */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Format SQL */}
          <Button
            onClick={formatActiveQuery}
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-slate-300 hover:text-indigo-300 hover:bg-[#161f32] gap-1"
            title="Format SQL (Cmd+Shift+F)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Format</span>
          </Button>

          <SnippetMenu />

          {/* Primary Action: Copy Ready-to-Use SQL */}
          <Button
            onClick={handleCopy}
            variant="default"
            size="sm"
            className="h-7 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm gap-1.5"
            title="Copy SQL (Cmd+Shift+C)"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </Button>

          <span className="w-px h-4 bg-[#1c2538] mx-0.5" />

          {/* Database Execution Controls (Compact & Clean) */}
          <div className="flex items-center bg-[#131926] border border-[#1c2538] rounded-lg p-0.5 gap-1 shadow-inner">
            <select
              value={activeProfileId || ''}
              onChange={(e) => {
                if (e.target.value === '__manage__') {
                  setConnectionModalOpen(true);
                } else {
                  setActiveProfileId(e.target.value || null);
                }
              }}
              className="h-6.5 px-2 rounded-md bg-[#0e1320] text-[11px] font-medium text-slate-200 focus:outline-none cursor-pointer max-w-[125px] truncate border border-transparent hover:border-[#1c2538]"
              title="Target Connection Profile"
            >
              <option value="" disabled>No DB</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="__manage__">+ Manage DBs...</option>
            </select>

            <Button
              onClick={() => handleExecute()}
              disabled={isExecuting}
              variant="default"
              size="sm"
              className={`text-white font-semibold shadow-md gap-1.5 text-xs h-6.5 px-2.5 transition-all ${
                selectedSQL.trim()
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
              }`}
              title={selectedSQL.trim() ? "Run Selected Query (Ctrl+Enter)" : "Run Query (Ctrl+Enter)"}
            >
              <Play className={`w-3 h-3 fill-white ${isExecuting ? 'animate-spin' : ''}`} />
              <span>
                {isExecuting
                  ? 'Running...'
                  : selectedSQL.trim()
                  ? 'Run Selection'
                  : 'Run'}
              </span>
            </Button>
          </div>

          <span className="w-px h-4 bg-[#1b2333] mx-0.5" />

          {/* Save Status */}
          <Button
            onClick={() => saveActiveQuery()}
            disabled={saveStatus === 'saved'}
            variant="ghost"
            size="sm"
            className={`h-7 text-xs px-2 transition-all ${
              saveStatus === 'dirty'
                ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-medium'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Save Query (Cmd+S)"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span className="hidden lg:inline">{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'dirty' ? 'Save*' : 'Saved'}</span>
          </Button>

          {/* More Options Menu */}
          <div className="relative">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              title="More Actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {showMenu && (
              <div
                onMouseLeave={() => setShowMenu(false)}
                className="absolute right-0 mt-1 w-48 py-1 rounded-lg bg-[#111622] border border-[#1b2333] shadow-2xl z-50 text-xs text-slate-300 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    handleExplain();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#161c2b] flex items-center gap-2 text-left"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explain Plan</span>
                </button>
                <button
                  onClick={() => {
                    handleBenchmark();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#161c2b] flex items-center gap-2 text-left"
                >
                  <Timer className="w-3.5 h-3.5 text-violet-400" />
                  <span>Benchmark Latency</span>
                </button>
                <div className="h-px bg-[#1b2333] my-1" />
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
                  <span>Export as Code...</span>
                </button>
                <div className="h-px bg-[#1b2333] my-1" />
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
          onChange={handleSQLEditorChange}
          onSelectionChange={setSelectedSQL}
          onSave={(currentVal) => {
            if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
            if (currentVal !== undefined) updateDraft({ sqlContent: currentVal });
            saveActiveQuery(currentVal);
          }}
          onFormat={formatActiveQuery}
          onExecute={(overrideSQL) => {
            if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current);
            if (overrideSQL !== undefined && !selectedSQL.trim()) {
              updateDraft({ sqlContent: overrideSQL });
            }
            handleExecute(overrideSQL);
          }}
        />
      </div>

      {/* Data Grid Results & Explain Panel */}
      <ErrorBoundary fallbackTitle="Results Grid encountered an error">
        <DataGridPanel />
      </ErrorBoundary>

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

      {/* Safety Execution Confirmation Modal for DML/DDL queries */}
      <ConfirmExecutionModal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingSQL('');
          setPendingMutationCheck(null);
        }}
        onConfirm={handleConfirmExecution}
        sql={pendingSQL}
        mutationCheck={pendingMutationCheck}
        connectionName={profiles.find((p) => p.id === activeProfileId)?.name}
        databaseName={activeDatabase || undefined}
      />

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
    </div>
  );
};
