import React, { useState, useMemo } from 'react';
import { Star, Folder, Sparkles, Copy, Check, Trash2, Edit3, Search, X, Plus, ExternalLink } from 'lucide-react';
import { Query, SQLDialect } from '../../types';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useUIStore } from '../../store/useUIStore';
import { ContextMenu } from '../ui/ContextMenu';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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

interface QueryListProps {
  queries: Query[];
  activeQueryId: string | null;
  onSelectQuery: (query: Query) => void;
}

export const QueryList: React.FC<QueryListProps> = ({
  queries,
  activeQueryId,
  onSelectQuery,
}) => {
  const {
    toggleFavorite,
    deleteQuery,
    duplicateQuery,
    createNewQuery,
    searchText,
    setSearchText,
    formatActiveQuery,
  } = useQueryStore();
  const { collections } = useCollectionStore();
  const { showToast, queryListWidth, setQueryListWidth } = useUIStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; query: Query } | null>(null);
  const [queryToDelete, setQueryToDelete] = useState<Query | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialectFilter, setDialectFilter] = useState<'all' | SQLDialect>('all');

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = queryListWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setQueryListWidth(startWidth + deltaX);
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

  const filteredQueries = useMemo(() => {
    if (dialectFilter === 'all') return queries;
    return queries.filter((q) => q.dialect === dialectFilter);
  }, [queries, dialectFilter]);

  const getCollectionName = (id: string | null) => {
    if (!id) return null;
    const col = collections.find((c) => c.id === id);
    return col ? col.name : null;
  };

  const handleCopySQL = (e: React.MouseEvent, query: Query) => {
    e.stopPropagation();
    navigator.clipboard.writeText(query.sqlContent);
    setCopiedId(query.id);
    showToast(`Copied "${query.title}" to clipboard`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleContextMenu = (e: React.MouseEvent, query: Query) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, query });
  };

  const handleConfirmDelete = async () => {
    if (queryToDelete) {
      await deleteQuery(queryToDelete.id);
      setQueryToDelete(null);
    }
  };

  return (
    <div
      style={{ width: `${queryListWidth}px` }}
      className="h-full bg-[#0c101b] border-r border-[#1c2538] flex flex-col overflow-hidden shrink-0 select-none relative group/querylist shadow-xl"
    >
      {/* Resizer Handle Bar */}
      <div
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={() => setQueryListWidth(280)}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 z-30 transition-colors group-hover/querylist:opacity-100"
        title="Drag to resize queries panel (Double click to reset)"
      />
      {/* Header & Quick Search Bar - Always Visible */}
      <div className="p-3 border-b border-[#1c2538] space-y-2 bg-[#0e1320] shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
          <span className="tracking-wider text-[11px] font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Saved Queries
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="px-1.5 py-0.2 text-[10px] font-mono bg-[#161f32] text-indigo-300 border border-[#273552]">
              {filteredQueries.length}
            </Badge>
            <button
              onClick={() => createNewQuery()}
              className="p-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all shadow-sm"
              title="New Query (Cmd+N)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search queries or SQL..."
            className="pl-8 pr-7 bg-[#131926] border-[#1c2538] focus:border-indigo-500/70 text-xs h-8.5 rounded-lg"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2 top-2 text-slate-500 hover:text-slate-200 p-0.5"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Dialect Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {(['all', 'postgresql', 'mysql', 'sqlite', 'sqlserver'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDialectFilter(d)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase transition-all shrink-0 ${
                dialectFilter === d
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                  : 'bg-[#131926] text-slate-400 hover:text-slate-200 border border-[#1c2538]'
              }`}
            >
              {d === 'all' ? 'All' : d === 'postgresql' ? 'PG' : d === 'mysql' ? 'MY' : d === 'sqlite' ? 'SQLite' : 'MSSQL'}
            </button>
          ))}
        </div>
      </div>

      {/* Query List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1b2333]/50">
        {filteredQueries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200">
              {searchText || dialectFilter !== 'all' ? 'No matching queries' : 'No queries found'}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
              {searchText || dialectFilter !== 'all'
                ? 'Try adjusting your search terms or dialect filter.'
                : 'Build your personal ready-to-use SQL library.'}
            </p>

            {searchText || dialectFilter !== 'all' ? (
              <Button
                onClick={() => {
                  setSearchText('');
                  setDialectFilter('all');
                }}
                variant="secondary"
                size="sm"
                className="mt-3 text-[11px]"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                onClick={() => createNewQuery()}
                variant="default"
                size="sm"
                className="mt-3 text-[11px]"
              >
                Create First Query
              </Button>
            )}
          </div>
        ) : (
          filteredQueries.map((q) => {
            const isActive = q.id === activeQueryId;
            const colName = getCollectionName(q.collectionId);
            const sqlPreview = q.sqlContent ? q.sqlContent.replace(/\s+/g, ' ').trim() : '';

            return (
              <div
                key={q.id}
                onClick={() => onSelectQuery(q)}
                onContextMenu={(e) => handleContextMenu(e, q)}
                className={`p-3 cursor-pointer transition-all group relative border-b border-[#1b2333]/40 ${
                  isActive
                    ? 'bg-[#12192b] border-l-[3px] border-l-indigo-500 text-slate-100 shadow-inner'
                    : 'hover:bg-[#0f1422] text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 flex-1">
                    {q.title || 'Untitled Query'}
                  </h4>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(q.id);
                    }}
                    className={`p-0.5 hover:scale-110 transition-transform shrink-0 ${
                      q.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star className={`w-3.5 h-3.5 ${q.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 font-mono truncate mt-1 leading-snug">
                  {sqlPreview || 'Empty query'}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono font-semibold tracking-wide ${
                      q.dialect === 'postgresql'
                        ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30'
                        : q.dialect === 'mysql'
                        ? 'text-sky-300 bg-sky-500/15 border-sky-500/30'
                        : q.dialect === 'sqlite'
                        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                        : q.dialect === 'sqlserver'
                        ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                        : 'text-slate-300 bg-slate-500/15 border-slate-500/30'
                    }`}
                  >
                    {q.dialect === 'postgresql' ? 'PG' : q.dialect === 'mysql' ? 'MY' : q.dialect === 'sqlite' ? 'SQL' : q.dialect === 'sqlserver' ? 'MS' : (q.dialect || 'SQL')}
                  </span>

                  {colName && (
                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#161c2b] border border-[#1b2333] text-slate-400 text-[10px]">
                      <Folder className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[80px]">{colName}</span>
                    </span>
                  )}
                </div>

                {/* Quick Hover Action Bar */}
                <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-[#161c2b] px-1.5 py-1 rounded-md border border-[#1b2333] shadow-lg animate-in fade-in-50 duration-100">
                  <button
                    onClick={(e) => handleCopySQL(e, q)}
                    className="p-1 hover:bg-[#1f293d] text-slate-400 hover:text-emerald-300 rounded transition-colors"
                    title="Copy SQL"
                  >
                    {copiedId === q.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateQuery(q.id);
                    }}
                    className="p-1 hover:bg-[#1f293d] text-slate-400 hover:text-slate-200 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQueryToDelete(q);
                    }}
                    className="p-1 hover:bg-[#1f293d] text-rose-400 hover:text-rose-300 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu on Right Click */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              id: 'open',
              label: 'Open Query',
              icon: <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />,
              action: () => onSelectQuery(contextMenu.query),
            },
            {
              id: 'copy',
              label: 'Copy SQL',
              icon: <Copy className="w-3.5 h-3.5 text-slate-400" />,
              action: () => {
                navigator.clipboard.writeText(contextMenu.query.sqlContent);
                showToast('SQL copied to clipboard');
              },
            },
            {
              id: 'format',
              label: 'Format SQL',
              icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
              action: () => {
                onSelectQuery(contextMenu.query);
                setTimeout(formatActiveQuery, 50);
              },
            },
            {
              id: 'fav',
              label: contextMenu.query.isFavorite ? 'Remove Favorite' : 'Add to Favorites',
              icon: <Star className="w-3.5 h-3.5 text-amber-400" />,
              action: () => toggleFavorite(contextMenu.query.id),
            },
            {
              id: 'duplicate',
              label: 'Duplicate Query',
              icon: <Edit3 className="w-3.5 h-3.5 text-indigo-400" />,
              action: () => duplicateQuery(contextMenu.query.id),
            },
            {
              id: 'delete',
              label: 'Delete Query',
              icon: <Trash2 className="w-3.5 h-3.5" />,
              danger: true,
              action: () => {
                setQueryToDelete(contextMenu.query);
              },
            },
          ]}
        />
      )}

      {/* shadcn AlertDialog for Delete Confirmation */}
      <AlertDialog open={!!queryToDelete} onOpenChange={(open) => !open && setQueryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Query?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <span className="font-semibold text-slate-200">"{queryToDelete?.title}"</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete Query
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
