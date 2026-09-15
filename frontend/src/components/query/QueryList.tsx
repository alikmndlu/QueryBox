import React, { useState } from 'react';
import { Star, Folder, Sparkles, Copy, Trash2, Edit3, ExternalLink, Search, X } from 'lucide-react';
import { Query } from '../../types';
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
    formatActiveQuery,
    createNewQuery,
    searchText,
    setSearchText,
  } = useQueryStore();
  const { collections } = useCollectionStore();
  const { showToast } = useUIStore();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; query: Query } | null>(null);
  const [queryToDelete, setQueryToDelete] = useState<Query | null>(null);

  const getCollectionName = (id: string | null) => {
    if (!id) return null;
    const col = collections.find((c) => c.id === id);
    return col ? col.name : null;
  };

  const handleCopySQL = (e: React.MouseEvent, sql: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    showToast('SQL copied to clipboard');
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
    <div className="w-72 h-full bg-[#090d16] border-r border-[#1b2333] flex flex-col overflow-hidden shrink-0 select-none">
      {/* Header & Quick Search Bar - Always Visible */}
      <div className="p-2.5 border-b border-[#1b2333] space-y-2 bg-[#0c101a] shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
          <span className="tracking-wider">QUERIES</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {queries.length}
          </Badge>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <Input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter queries..."
            className="pl-8 pr-7 bg-[#111622] border-[#1b2333]"
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
      </div>

      {/* Query List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1b2333]/50">
        {queries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200">
              {searchText ? 'No search results' : 'No queries found'}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
              {searchText
                ? `No queries match "${searchText}". Try a different keyword.`
                : 'Build your personal SQL library.'}
            </p>

            {searchText ? (
              <Button
                onClick={() => setSearchText('')}
                variant="secondary"
                size="sm"
                className="mt-3 text-[11px]"
              >
                Clear Search Filter
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
          queries.map((q) => {
            const isActive = q.id === activeQueryId;
            const colName = getCollectionName(q.collectionId);

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
                    className={`p-0.5 hover:scale-110 transition-transform ${
                      q.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star className={`w-3.5 h-3.5 ${q.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                {q.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                    {q.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono font-semibold tracking-wide ${
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
                    {q.dialect || 'sql'}
                  </span>

                  {colName && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161c2b] border border-[#1b2333] text-slate-400 text-[10px]">
                      <Folder className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[80px]">{colName}</span>
                    </span>
                  )}
                </div>

                {/* Quick Hover Action Bar */}
                <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-[#161c2b] px-1.5 py-1 rounded-md border border-[#1b2333] shadow-lg animate-in fade-in-50 duration-100">
                  <button
                    onClick={(e) => handleCopySQL(e, q.sqlContent)}
                    className="p-1 hover:bg-[#1f293d] text-slate-400 hover:text-slate-200 rounded transition-colors"
                    title="Copy SQL"
                  >
                    <Copy className="w-3 h-3" />
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
