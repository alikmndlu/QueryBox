import React, { useState, useEffect } from 'react';
import {
  Star,
  Clock,
  Folder,
  FolderPlus,
  Settings as SettingsIcon,
  Plus,
  Search,
  Inbox,
  HardDrive,
  Trash2,
  Edit2,
  FilePlus,
  Database,
  FolderSync,
  Keyboard,
} from 'lucide-react';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useUIStore } from '../../store/useUIStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { ContextMenu } from '../ui/ContextMenu';
import { SchemaExplorer } from '../schema/SchemaExplorer';
import { Collection } from '../../types';
import { QueryBoxLogo } from '../ui/QueryBoxLogo';
import { Button } from '../ui/button';
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

export const LeftSidebar: React.FC = () => {
  const {
    quickFilter,
    setQuickFilter,
    setSearchText,
    createNewQuery,
    queries,
  } = useQueryStore();

  const {
    collections,
    selectedCollectionId,
    selectCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    fetchCollections,
  } = useCollectionStore();

  const {
    sidebarTab,
    setSidebarTab,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    setGitSyncModalOpen,
    setShortcutsModalOpen,
    leftSidebarWidth,
    setLeftSidebarWidth,
  } = useUIStore();
  const { profiles, schemaTables, setConnectionModalOpen } = useConnectionStore();

  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const [colContextMenu, setColContextMenu] = useState<{ x: number; y: number; col: Collection } | null>(null);
  const [colToDelete, setColToDelete] = useState<Collection | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftSidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setLeftSidebarWidth(startWidth + deltaX);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createCollection(newColName.trim());
    setNewColName('');
    setIsCreatingCol(false);
  };

  const handleSaveRename = async (colId: string) => {
    if (!editingColName.trim()) return;
    const col = collections.find((c) => c.id === colId);
    if (col) {
      await updateCollection({ ...col, name: editingColName.trim() });
    }
    setEditingColId(null);
  };

  const handleColContextMenu = (e: React.MouseEvent, col: Collection) => {
    e.preventDefault();
    setColContextMenu({ x: e.clientX, y: e.clientY, col });
  };

  const handleConfirmDeleteCollection = async () => {
    if (colToDelete) {
      await deleteCollection(colToDelete.id);
      setColToDelete(null);
    }
  };

  return (
    <div
      style={{ width: `${leftSidebarWidth}px` }}
      className="h-full bg-[#0d121c] border-r border-[#1b2333] flex flex-col select-none text-slate-300 shrink-0 relative group/sidebar"
    >
      {/* Resizer Handle Bar */}
      <div
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={() => setLeftSidebarWidth(260)}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-30 transition-colors group-hover/sidebar:opacity-100"
        title="Drag to resize left panel (Double click to reset)"
      />
      {/* App Branding Header with QueryBox Logo */}
      <div className="p-3.5 border-b border-[#1b2333] flex items-center justify-between bg-[#0a0e17]">
        <QueryBoxLogo size={30} showText={true} />

        <Button
          onClick={() => createNewQuery(selectedCollectionId)}
          size="iconSm"
          variant="subtle"
          title="New Query (Cmd+N)"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Global Quick Search / Command Palette Trigger */}
      <div className="p-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full h-8 px-2.5 rounded-lg bg-[#111622] hover:bg-[#161c2b] border border-[#1b2333] text-slate-400 text-xs flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span className="group-hover:text-slate-200 transition-colors">Command Palette...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1b2333] text-[10px] font-mono text-slate-400 border border-[#2a3449]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Sidebar View Toggle: Queries vs Schema */}
      <div className="px-3 pb-2 pt-0 flex items-center gap-1">
        <button
          onClick={() => setSidebarTab('queries')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium transition-colors ${
            sidebarTab === 'queries'
              ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111622]'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Queries</span>
        </button>

        <button
          onClick={() => setSidebarTab('schema')}
          className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium transition-colors ${
            sidebarTab === 'schema'
              ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#111622]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tables</span>
          {schemaTables.length > 0 && (
            <span className="text-[10px] font-mono px-1 rounded bg-indigo-500/20 text-indigo-300">
              {schemaTables.length}
            </span>
          )}
        </button>
      </div>

      {sidebarTab === 'schema' ? (
        <SchemaExplorer />
      ) : (
        /* Navigation Sections */
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-1">
          {/* Quick Views */}
          <div className="space-y-0.5">
          <button
            onClick={() => {
              selectCollection(null);
              setSearchText('');
              setQuickFilter('all');
            }}
            className={`w-full h-8 px-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
              quickFilter === 'all' && !selectedCollectionId
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'hover:bg-[#161c2b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>All Queries</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1b2333] text-slate-400">
              {queries.length}
            </span>
          </button>

          <button
            onClick={() => {
              selectCollection(null);
              setSearchText('');
              setQuickFilter('favorites');
            }}
            className={`w-full h-8 px-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
              quickFilter === 'favorites'
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'hover:bg-[#161c2b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Favorites</span>
            </div>
          </button>

          <button
            onClick={() => {
              selectCollection(null);
              setSearchText('');
              setQuickFilter('recent');
            }}
            className={`w-full h-8 px-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
              quickFilter === 'recent'
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'hover:bg-[#161c2b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recently Used</span>
            </div>
          </button>

          <button
            onClick={() => {
              selectCollection(null);
              setSearchText('');
              setQuickFilter('uncategorized');
            }}
            className={`w-full h-8 px-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
              quickFilter === 'uncategorized'
                ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                : 'hover:bg-[#161c2b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-3.5 h-3.5 text-slate-400" />
              <span>Uncategorized</span>
            </div>
          </button>
        </div>

        {/* Collections Tree Section */}
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <span>Collections</span>
            <button
              onClick={() => setIsCreatingCol(true)}
              className="p-1 rounded hover:bg-[#1b2333] text-slate-400 hover:text-slate-200 transition-colors"
              title="New Collection"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Collection Input Form */}
          {isCreatingCol && (
            <form onSubmit={handleCreateCollection} className="px-2 py-1.5 flex items-center gap-1.5">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="Collection name..."
                autoFocus
                className="w-full h-7 px-2 rounded bg-[#111622] border border-indigo-500 text-xs text-slate-200 focus:outline-none"
              />
              <Button type="submit" size="sm" variant="default" className="h-7 px-2 text-[11px]">
                Add
              </Button>
            </form>
          )}

          <div className="mt-1 space-y-0.5">
            {collections.map((col) => {
              const isSelected = selectedCollectionId === col.id;
              const isEditing = editingColId === col.id;

              return (
                <div key={col.id} className="group relative">
                  {isEditing ? (
                    <div className="px-2 py-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={editingColName}
                        onChange={(e) => setEditingColName(e.target.value)}
                        onBlur={() => handleSaveRename(col.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(col.id);
                          if (e.key === 'Escape') setEditingColId(null);
                        }}
                        autoFocus
                        className="w-full h-7 px-2 rounded bg-[#111622] border border-indigo-500 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSearchText('');
                        setQuickFilter('all');
                        selectCollection(col.id);
                      }}
                      onContextMenu={(e) => handleColContextMenu(e, col)}
                      className={`w-full h-8 px-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'hover:bg-[#161c2b] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{col.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1b2333] text-slate-400 group-hover:hidden">
                          {col.itemCount}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingColId(col.id);
                              setEditingColName(col.name);
                            }}
                            className="p-1 rounded hover:bg-[#1b2333] text-slate-400 hover:text-slate-200"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setColToDelete(col);
                            }}
                            className="p-1 rounded hover:bg-[#1b2333] text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Power Tools: Connections & Git Sync */}
      <div className="p-2 border-t border-[#1b2333] space-y-1 bg-[#090d16]">
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#141b2b] hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Database Connections</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {profiles.length}
          </Badge>
        </button>

        <button
          onClick={() => setGitSyncModalOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#141b2b] hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
            <span>Git / Directory Sync</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Sync</span>
        </button>
      </div>

      {/* Sidebar Footer / Settings & Shortcuts */}
      <div className="p-2.5 border-t border-[#1b2333] flex items-center justify-between bg-[#0a0e17]">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          title="Settings (Ctrl+,)"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-300 transition-colors px-1.5 py-0.5 rounded hover:bg-[#151c2d]"
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <Keyboard className="w-3 h-3 text-slate-500" />
          <kbd className="text-[10px] font-mono text-slate-400">Ctrl+/</kbd>
        </button>
      </div>

      {/* Collection Right-Click Context Menu */}
      {colContextMenu && (
        <ContextMenu
          x={colContextMenu.x}
          y={colContextMenu.y}
          onClose={() => setColContextMenu(null)}
          items={[
            {
              id: 'new-in-col',
              label: 'New Query Here',
              icon: <FilePlus className="w-3.5 h-3.5 text-indigo-400" />,
              action: () => {
                selectCollection(colContextMenu.col.id);
                createNewQuery(colContextMenu.col.id);
              },
            },
            {
              id: 'rename-col',
              label: 'Rename Collection',
              icon: <Edit2 className="w-3.5 h-3.5 text-slate-400" />,
              action: () => {
                setEditingColId(colContextMenu.col.id);
                setEditingColName(colContextMenu.col.name);
              },
            },
            {
              id: 'delete-col',
              label: 'Delete Collection',
              icon: <Trash2 className="w-3.5 h-3.5" />,
              danger: true,
              action: () => {
                setColToDelete(colContextMenu.col);
              },
            },
          ]}
        />
      )}

      {/* shadcn AlertDialog for Delete Collection Confirmation */}
      <AlertDialog open={!!colToDelete} onOpenChange={(open) => !open && setColToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-slate-200">"{colToDelete?.name}"</span>?
              Queries inside this collection will not be deleted; they will be moved to Uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteCollection}>
              Delete Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
