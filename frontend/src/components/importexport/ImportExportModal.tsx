import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { API } from '../../lib/api';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
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

export const ImportExportModal: React.FC = () => {
  const { importExportModalOpen, setImportExportModalOpen, showToast } = useUIStore();
  const { fetchQueries } = useQueryStore();
  const { fetchCollections } = useCollectionStore();

  const [importJsonText, setImportJsonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

  const handleExportJSON = async () => {
    try {
      const jsonStr = await API.exportDataJSON();
      if (!jsonStr) {
        showToast('Export failed: Empty backup data', 'error');
        return;
      }

      // Try native save dialog if inside Wails, else fallback to browser download blob
      const savedPath = await API.saveFileDialog('querybox-backup.json');
      if (savedPath) {
        showToast('Export saved successfully');
      } else {
        // Fallback file download
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `querybox-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('QueryBox backup JSON exported');
      }
    } catch {
      showToast('Export error occurred', 'error');
    }
  };

  const handleImportFile = async () => {
    try {
      const content = await API.openFileDialog();
      if (content) {
        setImportJsonText(content);
      }
    } catch {
      showToast('Failed to open file', 'error');
    }
  };

  const handleExecuteImport = async () => {
    if (!importJsonText.trim()) return;
    setIsProcessing(true);
    try {
      await API.importDataJSON(importJsonText);
      await fetchQueries();
      await fetchCollections();
      showToast('QueryBox library backup imported successfully!');
      setImportJsonText('');
      setImportExportModalOpen(false);
    } catch {
      showToast('Failed to parse or import JSON backup', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      await API.resetData();
      await fetchQueries();
      await fetchCollections();
      showToast('Database reset complete');
      setShowResetAlert(false);
      setImportExportModalOpen(false);
    } catch {
      showToast('Failed to reset database', 'error');
    }
  };

  return (
    <>
      <Dialog open={importExportModalOpen} onOpenChange={setImportExportModalOpen}>
        <DialogContent className="max-w-lg bg-[#0d121c] border-[#1b2333] p-0 overflow-hidden select-none">
          {/* Modal Header */}
          <div className="p-4 border-b border-[#1b2333] bg-[#0a0e17]">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <DialogTitle className="text-sm font-semibold text-white">QueryBox Backup & Portability</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-slate-400">
                Export or restore your complete SQL query database and collections.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-5 text-xs text-slate-300">
            {/* Export Box */}
            <div className="p-3.5 rounded-lg bg-[#111622] border border-[#1b2333] flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Export Library Backup</div>
                <div className="text-[11px] text-slate-500">Save all queries, collections, tags, and settings to a JSON file</div>
              </div>
              <Button
                onClick={handleExportJSON}
                variant="default"
                size="sm"
                className="gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </Button>
            </div>

            {/* Import Box */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-200">Import Library Backup</div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleImportFile}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select JSON File</span>
                </Button>
              </div>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Or paste JSON backup payload here..."
                rows={4}
                className="w-full p-2.5 rounded-lg bg-[#111622] border border-[#1b2333] text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
              />
              {importJsonText && (
                <Button
                  onClick={handleExecuteImport}
                  disabled={isProcessing}
                  variant="default"
                  size="default"
                  className="w-full"
                >
                  {isProcessing ? 'Importing...' : 'Confirm Import Data'}
                </Button>
              )}
            </div>

            {/* Danger Zone */}
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <div>
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Reset Application Data</span>
                </div>
                <div className="text-[11px] text-slate-400">Permanently erase all local queries and collections</div>
              </div>
              <Button
                onClick={() => setShowResetAlert(true)}
                variant="destructive"
                size="sm"
                className="gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* shadcn AlertDialog for Reset Data Warning */}
      <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Reset All Application Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL stored queries, collections, tags, and version history?
              This action is permanent and cannot be undone!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmReset}>
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
