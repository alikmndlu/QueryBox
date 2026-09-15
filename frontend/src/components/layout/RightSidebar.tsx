import React, { useState } from 'react';
import {
  FileText,
  Folder,
  Tag as TagIcon,
  Calendar,
  Clock,
  History,
  RotateCcw,
  X,
  Code2,
  GitCompare,
} from 'lucide-react';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useUIStore } from '../../store/useUIStore';
import { SQLDialect } from '../../types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export const RightSidebar: React.FC = () => {
  const {
    activeQuery,
    draftDescription,
    draftCollectionId,
    draftDialect,
    draftTags,
    updateDraft,
    versionHistory,
    restoreVersion,
  } = useQueryStore();

  const { collections } = useCollectionStore();
  const { setDiffModalOpen } = useUIStore();
  const [tagInput, setTagInput] = useState('');

  if (!activeQuery) {
    return (
      <div className="w-72 h-full bg-[#0d121c] border-l border-[#1b2333] flex items-center justify-center p-6 text-center text-slate-500 text-xs shrink-0 select-none">
        Select a query to view details and version history.
      </div>
    );
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!draftTags.includes(newTag)) {
        updateDraft({ tags: [...draftTags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateDraft({ tags: draftTags.filter((t) => t !== tagToRemove) });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-72 h-full bg-[#0d121c] border-l border-[#1b2333] flex flex-col overflow-y-auto shrink-0 text-slate-300 select-none divide-y divide-[#1b2333]">
      {/* Header */}
      <div className="p-3.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0a0e17]">
        <span>QUERY INFO</span>
      </div>

      {/* Description Section */}
      <div className="p-3.5 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Description</span>
        </label>
        <textarea
          value={draftDescription}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Add notes or documentation for this SQL query..."
          rows={3}
          className="w-full p-2.5 rounded-lg bg-[#111622] border border-[#1b2333] focus:border-indigo-500 text-xs text-slate-200 focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* Collection Picker */}
      <div className="p-3.5 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>Collection</span>
        </label>
        <select
          value={draftCollectionId || ''}
          onChange={(e) => updateDraft({ collectionId: e.target.value || null })}
          className="w-full h-8 px-2.5 rounded-lg bg-[#111622] border border-[#1b2333] focus:border-indigo-500 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="">📁 Uncategorized</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              📁 {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* SQL Dialect Selector */}
      <div className="p-3.5 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>SQL Dialect</span>
        </label>
        <select
          value={draftDialect}
          onChange={(e) => updateDraft({ dialect: e.target.value as SQLDialect })}
          className="w-full h-8 px-2.5 rounded-lg bg-[#111622] border border-[#1b2333] focus:border-indigo-500 text-xs text-slate-200 focus:outline-none font-mono uppercase cursor-pointer"
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
          <option value="sqlserver">SQL Server (T-SQL)</option>
        </select>
      </div>

      {/* Tags Manager */}
      <div className="p-3.5 space-y-2">
        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
          <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tags</span>
        </label>
        <div className="flex flex-wrap gap-1.5 min-h-[30px]">
          {draftTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="inline-flex items-center gap-1 text-[10px] pl-2 pr-1 py-0.5"
            >
              #{tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-rose-400 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag and press Enter..."
          className="w-full h-7 px-2.5 rounded-lg bg-[#111622] border border-[#1b2333] focus:border-indigo-500 text-xs text-slate-200 focus:outline-none"
        />
      </div>

      {/* Timestamps */}
      <div className="p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Created
          </span>
          <span className="font-mono text-[11px] text-slate-300">{formatDate(activeQuery.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Updated
          </span>
          <span className="font-mono text-[11px] text-slate-300">{formatDate(activeQuery.updatedAt)}</span>
        </div>
      </div>

      {/* Query Version History Section */}
      <div className="p-3.5 space-y-2 flex-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-400" /> Version History
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {versionHistory.length}
          </Badge>
        </div>

        {versionHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No history snapshots recorded yet.</p>
        ) : (
          <div className="space-y-1.5 mt-2">
            {versionHistory.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-2.5 rounded-lg bg-[#111622] border border-[#1b2333] flex items-center justify-between text-xs hover:border-indigo-500/40 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-200 text-[11px]">
                    Version {versionHistory.length - idx}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {formatDate(ver.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setDiffModalOpen(true, ver)}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] gap-1 text-slate-400 hover:text-indigo-300"
                    title="Compare diff against current editor"
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>Diff</span>
                  </Button>
                  <Button
                    onClick={() => restoreVersion(ver)}
                    variant="subtle"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    title="Restore this version into editor"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
