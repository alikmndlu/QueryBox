import React, { useState } from 'react';
import {
  FolderOpen,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FolderSync,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { API } from '../../lib/api';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const GitSyncModal: React.FC = () => {
  const { gitSyncModalOpen, setGitSyncModalOpen, showToast } = useUIStore();
  const { fetchQueries } = useQueryStore();

  const [folderPath, setFolderPath] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!gitSyncModalOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      const selected = await API.selectFolderDialog();
      if (selected) {
        setFolderPath(selected);
      }
    } catch (e: any) {
      showToast('Could not open folder picker', 'error');
    }
  };

  const handleExport = async () => {
    if (!folderPath.trim()) {
      showToast('Please select a target directory', 'error');
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);
    try {
      const count = await API.syncQueriesToFolder(folderPath.trim());
      setIsExporting(false);
      setStatusMessage(`Successfully exported ${count} queries as .sql files into: ${folderPath}`);
      showToast(`Exported ${count} queries for Git sync`);
    } catch (e: any) {
      setIsExporting(false);
      setStatusMessage(`Export failed: ${e?.message || e}`);
      showToast('Export failed', 'error');
    }
  };

  const handleImport = async () => {
    if (!folderPath.trim()) {
      showToast('Please select a directory to import from', 'error');
      return;
    }

    setIsImporting(true);
    setStatusMessage(null);
    try {
      const count = await API.importQueriesFromFolder(folderPath.trim());
      await fetchQueries();
      setIsImporting(false);
      setStatusMessage(`Successfully imported ${count} queries from directory: ${folderPath}`);
      showToast(`Imported ${count} queries from directory`);
    } catch (e: any) {
      setIsImporting(false);
      setStatusMessage(`Import failed: ${e?.message || e}`);
      showToast('Import failed', 'error');
    }
  };

  return (
    <Dialog open={gitSyncModalOpen} onOpenChange={setGitSyncModalOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-[#0a0d16] border-[#1b2333]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b2333] flex items-center justify-between bg-[#0e1322]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-slate-100">
                Git / Directory Synchronization
              </DialogTitle>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Export and import queries as standalone .sql files for team Git version control
              </div>
            </div>
          </div>

          <Button
            onClick={() => setGitSyncModalOpen(false)}
            variant="ghost"
            size="iconSm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              Local Repository / Folder Path
            </label>
            <div className="flex gap-2">
              <Input
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="e.g. C:\Users\Dev\repos\sql-queries"
                className="h-8.5 text-xs bg-[#111622] border-[#1b2333] font-mono"
              />
              <Button
                onClick={handleBrowseFolder}
                variant="secondary"
                size="sm"
                className="h-8.5 text-xs gap-1.5 shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Browse...</span>
              </Button>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5">
              Queries will be saved with clean file names and YAML/SQL frontmatter headers containing title, dialect, and tags.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-[#1b2333] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                <span>Export to Folder</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Exports all your library queries into the target folder so you can commit and push them with Git.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="default"
                size="sm"
                className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export Queries'}</span>
              </Button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0e1422] border border-[#1b2333] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Import from Folder</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reads .sql files from the folder (after git pull) and updates or inserts them into QueryBox.
              </p>
              <Button
                onClick={handleImport}
                disabled={isImporting}
                variant="secondary"
                size="sm"
                className="w-full text-xs gap-1.5"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Importing...' : 'Import Queries'}</span>
              </Button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-[#0d1322] border border-[#1b2333] rounded-lg text-xs text-slate-300 flex items-start gap-2 select-text">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="font-mono text-[11px] break-all">{statusMessage}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
