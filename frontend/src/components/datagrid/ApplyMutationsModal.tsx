import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  CheckCircle2,
  Code2,
  AlertTriangle,
  Play,
  Layers,
  Edit3,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { PendingGridMutations } from '../../types';

interface ApplyMutationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mutations: PendingGridMutations;
  generatedSQL: string;
  tableName?: string;
  connectionName?: string;
  databaseName?: string;
  hasPrimaryKey: boolean;
}

export const ApplyMutationsModal: React.FC<ApplyMutationsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mutations,
  generatedSQL,
  tableName,
  connectionName,
  databaseName,
  hasPrimaryKey,
}) => {
  const [copied, setCopied] = useState(false);

  const editCount = Object.keys(mutations.edits).length;
  const insertCount = mutations.insertedRows.length;
  const deleteCount = mutations.deletedRowIndices.length;
  const totalCount = editCount + insertCount + deleteCount;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0d121c] border-[#1b2333] text-slate-100 shadow-2xl p-0 overflow-hidden select-none">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1b2333] bg-[#0a0e17] flex items-center justify-between">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white">
                  Confirm Database Mutations
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Review generated DML SQL queries before applying changes to live database
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4 text-xs">
          {/* Target Info Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Target Connection</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>{connectionName || 'Active Connection'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Database / Table</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tableName ? `${databaseName || 'db'}.${tableName}` : databaseName || 'Active Database'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Changes</div>
              <div className="text-xs font-semibold text-amber-400 mt-0.5 font-mono">
                {totalCount} mutations ({editCount} edit, {insertCount} add, {deleteCount} del)
              </div>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {editCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Edit3 className="w-3 h-3" />
                {editCount} Cell Edits
              </span>
            )}
            {insertCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <PlusCircle className="w-3 h-3" />
                {insertCount} Row Inserts
              </span>
            )}
            {deleteCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                <Trash2 className="w-3 h-3" />
                {deleteCount} Row Deletions
              </span>
            )}
          </div>

          {/* Primary Key Warning Alert */}
          {!hasPrimaryKey && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">Primary Key Missing</div>
                <div className="text-[11px] text-amber-200/80 leading-relaxed">
                  Target table does not have an explicit primary key (`id` / `PK`). `UPDATE` and `DELETE` queries will match using all row column values.
                </div>
              </div>
            </div>
          )}

          {/* Generated SQL DML Batch Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generated DML SQL Batch Script</span>
              </span>
              <button
                type="button"
                onClick={handleCopySQL}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono"
              >
                {copied ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#080b11] border border-[#1b2333] text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed select-text whitespace-pre-wrap">
              {generatedSQL}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1b2333] bg-[#0a0e17] flex items-center justify-end gap-2">
          <Button onClick={onClose} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            variant="default"
            size="sm"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/20 gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Confirm & Execute Transaction</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
