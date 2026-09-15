import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, GitCompare, RotateCcw, Clock } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

export const DiffViewerModal: React.FC = () => {
  const { diffModalOpen, setDiffModalOpen, diffVersion } = useUIStore();
  const { draftSQL, restoreVersion } = useQueryStore();

  if (!diffVersion) return null;

  const handleRestore = () => {
    restoreVersion(diffVersion);
    setDiffModalOpen(false);
  };

  const formattedDate = new Date(diffVersion.createdAt).toLocaleString();

  return (
    <Dialog open={diffModalOpen} onOpenChange={(open) => setDiffModalOpen(open)}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 overflow-hidden bg-[#0a0d16] border-[#1b2333]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2333] flex items-center justify-between bg-[#0e1322] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Version Diff Comparison</span>
                <span className="text-xs font-normal text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formattedDate}
                </span>
              </DialogTitle>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Left: <span className="text-amber-400 font-medium">Historical Snapshot</span> · Right: <span className="text-emerald-400 font-medium">Current Editor</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRestore}
              variant="default"
              size="sm"
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore This Version</span>
            </Button>
            <Button
              onClick={() => setDiffModalOpen(false)}
              variant="ghost"
              size="iconSm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Diff Editor Container */}
        <div className="flex-1 w-full h-full bg-[#080b11] overflow-hidden">
          <DiffEditor
            original={diffVersion.sqlContent || ''}
            modified={draftSQL || ''}
            language="sql"
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              automaticLayout: true,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
