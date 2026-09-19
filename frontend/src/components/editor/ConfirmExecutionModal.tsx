import React from 'react';
import { AlertTriangle, ShieldAlert, Database, Terminal, CheckCircle2 } from 'lucide-react';
import { QueryMutationCheck } from '../../lib/queryClassifier';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '../ui/alert-dialog';

interface ConfirmExecutionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sql: string;
  mutationCheck: QueryMutationCheck | null;
  connectionName?: string;
  databaseName?: string;
}

export const ConfirmExecutionModal: React.FC<ConfirmExecutionModalProps> = ({
  open,
  onClose,
  onConfirm,
  sql,
  mutationCheck,
  connectionName,
  databaseName,
}) => {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mutationCheck) return null;

  const isDanger = mutationCheck.severity === 'danger' || !mutationCheck.hasWhereClause;
  const shortSQL = sql.length > 300 ? sql.slice(0, 300) + '\n...' : sql;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-xl bg-[#0f1420] border-[#1e293b] text-slate-100 shadow-2xl p-6 rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isDanger
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isDanger ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <AlertDialogTitle className="text-lg font-bold text-white tracking-tight">
                  {mutationCheck.warningTitle || 'Confirm Database Mutation'}
                </AlertDialogTitle>

                <Badge
                  variant={isDanger ? 'destructive' : 'secondary'}
                  className="text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold"
                >
                  {mutationCheck.operationType || 'MUTATION'}
                </Badge>
              </div>

              <AlertDialogDescription className="text-xs text-slate-300 leading-relaxed">
                {mutationCheck.warningMessage}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Target Connection & Database Badge Bar */}
        <div className="mt-4 p-2.5 rounded-lg bg-[#0a0d16] border border-[#1b2333] flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Target:</span>
            <span className="font-semibold text-slate-200">{connectionName || 'Default Connection'}</span>
          </div>
          {databaseName && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#131a29] text-indigo-300 border border-indigo-500/20">
              <span className="text-[10px] text-slate-400">DB:</span>
              <span className="font-semibold">{databaseName}</span>
            </div>
          )}
        </div>

        {/* Missing WHERE clause alert banner if applicable */}
        {!mutationCheck.hasWhereClause && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-rose-300">Warning: No WHERE Clause Detected!</div>
              <p className="text-[11px] text-rose-200/80 leading-snug">
                Executing an {mutationCheck.operationType} query without a WHERE condition will mutate every single record in your table.
              </p>
            </div>
          </div>
        )}

        {/* SQL Code Snippet Preview */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-slate-400" />
              SQL Snippet Preview
            </span>
            <span>{sql.split('\n').length} lines</span>
          </div>

          <pre className="max-h-36 overflow-y-auto p-3 rounded-lg bg-[#06080e] border border-[#1b2333] text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap break-all select-text">
            {shortSQL}
          </pre>
        </div>

        {/* Modal Action Buttons */}
        <AlertDialogFooter className="mt-6 flex items-center justify-end gap-2">
          <AlertDialogCancel
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium bg-[#131926] hover:bg-[#1c2538] text-slate-300 border-[#1c2538]"
          >
            Cancel
          </AlertDialogCancel>

          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={isDanger ? 'destructive' : 'default'}
            className={`h-9 px-5 text-xs font-semibold gap-1.5 shadow-lg ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Execute</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
