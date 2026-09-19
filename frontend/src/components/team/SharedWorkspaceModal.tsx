import React, { useState } from 'react';
import {
  Users,
  Download,
  Upload,
  CheckCircle2,
  Share2,
  Shield,
  Layers,
  FileCode2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useUIStore } from '../../store/useUIStore';

interface SharedWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SharedWorkspaceModal: React.FC<SharedWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const { queries } = useQueryStore();
  const { collections } = useCollectionStore();
  const { showToast } = useUIStore();

  const [importJsonText, setImportJsonText] = useState('');

  const handleExportTeamPackage = () => {
    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaceName: 'Team Query Workspace',
      collections,
      queries,
    };

    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `querybox_team_workspace_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Team workspace bundle exported successfully!');
  };

  const handleImportTeamPackage = () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed.queries)) {
        parsed.queries.forEach((q: any) => {
          useQueryStore.getState().createNewQuery(q.collectionId || null, q);
        });
        showToast(`Synced ${parsed.queries.length} team queries into workspace!`);
        setImportJsonText('');
        onClose();
      } else {
        showToast('Invalid team bundle JSON format', 'error');
      }
    } catch (err: any) {
      showToast('Error parsing team workspace bundle', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d121c] border-[#1c263c] text-slate-100 shadow-2xl p-0 overflow-hidden select-none">
        <div className="p-4 border-b border-[#1c263c] bg-[#090a14] flex items-center justify-between">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white">
                  Shared Team Workspaces
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Share and sync query collections and snippets with teammates
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Export Action Card */}
          <div className="p-3.5 rounded-xl bg-[#111726] border border-[#1e2942] flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Export Workspace Bundle</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Includes {collections.length} collections and {queries.length} saved queries ready for sharing.
              </p>
            </div>
            <button
              onClick={handleExportTeamPackage}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .json</span>
            </button>
          </div>

          {/* Import Action Area */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-200 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import Team Workspace Bundle</span>
            </label>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={4}
              placeholder="Paste JSON workspace bundle content received from teammates here..."
              className="w-full bg-[#080b11] border border-[#1e2942] rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleImportTeamPackage}
              disabled={!importJsonText.trim()}
              className="w-full py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sync & Import Team Queries</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
