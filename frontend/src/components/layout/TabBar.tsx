import React from 'react';
import { X, Plus } from 'lucide-react';
import { useTabStore } from '../../store/useTabStore';
import { useQueryStore } from '../../store/useQueryStore';

export const TabBar: React.FC = () => {
  const { tabIds, activeTabId, setActiveTabId, closeTab } = useTabStore();
  const { queries, scratchQueries, activeQuery, draftTitle, isDirty, createNewQuery } = useQueryStore();

  if (tabIds.length === 0) {
    return null;
  }

  const dialectBadgeColors: Record<string, string> = {
    postgresql: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    mysql: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    sqlite: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sqlserver: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="h-9 bg-[#0a0d16] border-b border-[#1b2333] flex items-center px-2 gap-1 overflow-x-auto select-none no-scrollbar shrink-0">
      <div className="flex items-center gap-1 min-w-0">
        {tabIds.map((id) => {
          const isActive = id === activeTabId;
          const query = queries.find((q) => q.id === id) || scratchQueries?.[id] || (activeQuery?.id === id ? activeQuery : null);
          const title = isActive ? draftTitle || 'Untitled Query' : query?.title || 'Untitled Query';
          const dialect = (isActive && activeQuery?.dialect) || query?.dialect || 'postgresql';
          const badgeStyle = dialectBadgeColors[dialect] || dialectBadgeColors.postgresql;
          const showDirty = isActive && isDirty;

          return (
            <div
              key={id}
              onClick={() => setActiveTabId(id)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(id);
                }
              }}
              title={`${title} (${dialect})`}
              className={`group flex items-center gap-2 h-7.5 px-2.5 rounded-t-md text-xs font-medium cursor-pointer transition-all border-b-2 max-w-[200px] min-w-[110px] ${
                isActive
                  ? 'bg-[#0f1422] text-slate-100 border-indigo-500 shadow-sm'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#111726]/60 border-transparent'
              }`}
            >
              <span
                className={`text-[9px] uppercase font-mono px-1 py-0.5 rounded border leading-none font-semibold ${badgeStyle}`}
              >
                {dialect === 'postgresql' ? 'PG' : dialect === 'mysql' ? 'MY' : dialect === 'sqlite' ? 'SQL' : 'MS'}
              </span>

              <span className="truncate flex-1 text-[11px] font-medium">{title}</span>

              {showDirty ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:hidden shrink-0" />
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(id);
                }}
                className={`p-0.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-100 ${
                  showDirty ? 'hidden group-hover:inline-flex' : 'opacity-0 group-hover:opacity-100'
                }`}
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => createNewQuery()}
        className="flex items-center gap-1 h-6.5 px-2 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600/30 rounded border border-emerald-500/30 transition-colors ml-1 shrink-0"
        title="New Query Tab (Cmd+N)"
      >
        <Plus className="w-3 h-3 text-emerald-400" />
        <span>New Query</span>
      </button>
    </div>
  );
};
