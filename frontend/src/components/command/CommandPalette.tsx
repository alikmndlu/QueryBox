import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Save,
  Sparkles,
  Copy,
  Star,
  Edit3,
  Trash2,
  Sidebar,
  Settings as SettingsIcon,
  Download,
  Upload,
  X,
  Play,
  Activity,
  Code2,
  Database,
  FolderSync,
  Keyboard,
  ArrowUpCircle,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { Badge } from '../ui/badge';
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

export interface CommandItem {
  id: string;
  label: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    setShortcutsModalOpen,
    setImportExportModalOpen,
    setCopyAsCodeModalOpen,
    setGitSyncModalOpen,
    setUpdateModalOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useUIStore();
  const {
    createNewQuery,
    saveActiveQuery,
    formatActiveQuery,
    activeQuery,
    draftSQL,
    toggleFavorite,
    duplicateQuery,
    deleteQuery,
  } = useQueryStore();
  const { executeQuery, explainQuery, setConnectionModalOpen } = useConnectionStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      // Escape
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'run-query',
      label: 'Run Query',
      category: 'Database',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Ctrl+Enter',
      action: () => {
        if (draftSQL) executeQuery(draftSQL);
      },
    },
    {
      id: 'explain-query',
      label: 'Explain Execution Plan',
      category: 'Database',
      icon: <Activity className="w-4 h-4 text-amber-400" />,
      action: () => {
        if (draftSQL) explainQuery(draftSQL);
      },
    },
    {
      id: 'copy-as-code',
      label: 'Export / Copy as Code Snippet',
      category: 'Actions',
      icon: <Code2 className="w-4 h-4 text-indigo-400" />,
      action: () => setCopyAsCodeModalOpen(true),
    },
    {
      id: 'manage-connections',
      label: 'Manage Database Connections',
      category: 'Database',
      icon: <Database className="w-4 h-4 text-indigo-400" />,
      action: () => setConnectionModalOpen(true),
    },
    {
      id: 'git-sync',
      label: 'Git / Directory Synchronization',
      category: 'Data',
      icon: <FolderSync className="w-4 h-4 text-emerald-400" />,
      action: () => setGitSyncModalOpen(true),
    },
    {
      id: 'new-query',
      label: 'New Query',
      category: 'Actions',
      icon: <Plus className="w-4 h-4 text-indigo-400" />,
      shortcut: '⌘N',
      action: () => createNewQuery(),
    },
    {
      id: 'save-query',
      label: 'Save Active Query',
      category: 'Actions',
      icon: <Save className="w-4 h-4 text-emerald-400" />,
      shortcut: '⌘S',
      action: () => saveActiveQuery(),
    },
    {
      id: 'format-sql',
      label: 'Format SQL',
      category: 'Editor',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      shortcut: '⌘⇧F',
      action: () => formatActiveQuery(),
    },
    {
      id: 'copy-sql',
      label: 'Copy SQL to Clipboard',
      category: 'Editor',
      icon: <Copy className="w-4 h-4 text-slate-300" />,
      shortcut: '⌘⇧C',
      action: () => {
        if (activeQuery) {
          navigator.clipboard.writeText(activeQuery.sqlContent);
          useUIStore.getState().showToast('SQL copied to clipboard');
        }
      },
    },
    {
      id: 'toggle-fav',
      label: 'Toggle Favorite Status',
      category: 'Query',
      icon: <Star className="w-4 h-4 text-amber-400" />,
      action: () => {
        if (activeQuery) toggleFavorite(activeQuery.id);
      },
    },
    {
      id: 'duplicate-query',
      label: 'Duplicate Query',
      category: 'Query',
      icon: <Edit3 className="w-4 h-4 text-indigo-400" />,
      shortcut: '⌘D',
      action: () => {
        if (activeQuery) duplicateQuery(activeQuery.id);
      },
    },
    {
      id: 'delete-query',
      label: 'Delete Active Query',
      category: 'Query',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: () => {
        if (activeQuery) {
          setShowDeleteConfirm(true);
        }
      },
    },
    {
      id: 'toggle-left-sidebar',
      label: 'Toggle Navigation Sidebar',
      category: 'View',
      icon: <Sidebar className="w-4 h-4 text-slate-400" />,
      shortcut: '⌘B',
      action: () => toggleLeftSidebar(),
    },
    {
      id: 'toggle-right-sidebar',
      label: 'Toggle Metadata Sidebar',
      category: 'View',
      icon: <Sidebar className="w-4 h-4 rotate-180 text-slate-400" />,
      action: () => toggleRightSidebar(),
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      category: 'System',
      icon: <SettingsIcon className="w-4 h-4 text-slate-400" />,
      shortcut: '⌘,',
      action: () => setSettingsModalOpen(true),
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts Reference',
      category: 'Help',
      icon: <Keyboard className="w-4 h-4 text-indigo-400" />,
      shortcut: '⌘/',
      action: () => setShortcutsModalOpen(true),
    },
    {
      id: 'check-updates',
      label: 'Check for Updates',
      category: 'Help',
      icon: <ArrowUpCircle className="w-4 h-4 text-emerald-400" />,
      action: () => setUpdateModalOpen(true),
    },
    {
      id: 'export-data',
      label: 'Export QueryBox Backup (JSON)',
      category: 'Data',
      icon: <Download className="w-4 h-4 text-indigo-400" />,
      action: () => setImportExportModalOpen(true),
    },
    {
      id: 'import-data',
      label: 'Import QueryBox Backup (JSON)',
      category: 'Data',
      icon: <Upload className="w-4 h-4 text-indigo-400" />,
      action: () => setImportExportModalOpen(true),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleRunCommand = (cmd: CommandItem) => {
    cmd.action();
    if (cmd.id !== 'delete-query') {
      setCommandPaletteOpen(false);
      setSearch('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 select-none">
        <div className="w-full max-w-xl bg-[#0d121c] border border-[#1b2333] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Search Input */}
          <div className="p-3.5 border-b border-[#1b2333] flex items-center gap-3 bg-[#111622]">
            <Search className="w-4 h-4 text-indigo-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search actions..."
              autoFocus
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => setCommandPaletteOpen(false)}
              className="p-1 hover:bg-[#1b2333] rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching commands found.
              </div>
            ) : (
              filtered.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  onClick={() => handleRunCommand(cmd)}
                  className={`p-2.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    idx === selectedIndex
                      ? 'bg-indigo-600/15 text-slate-100 border border-indigo-500/30'
                      : 'hover:bg-[#111622] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cmd.icon}
                    <span className="font-medium">{cmd.label}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {cmd.category}
                    </Badge>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded bg-[#161c2b] text-[10px] font-mono text-slate-400 border border-[#1b2333]">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* shadcn AlertDialog for Delete Query from Command Palette */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
                if (activeQuery) {
                  deleteQuery(activeQuery.id);
                }
                setShowDeleteConfirm(false);
                setCommandPaletteOpen(false);
              }}
            >
              Delete Query
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
