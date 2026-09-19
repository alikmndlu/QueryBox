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
    showToast('پکیج کالکشن‌های تیمی با موفقیت خروجی گرفته شد!');
  };

  const handleImportTeamPackage = () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed.queries)) {
        parsed.queries.forEach((q: any) => {
          useQueryStore.getState().createNewQuery(q.collectionId || null, q);
        });
        showToast(`تعداد ${parsed.queries.length} کوئری تیمی همگام‌سازی شد!`);
        setImportJsonText('');
        onClose();
      } else {
        showToast('فرمت پکیج تیمی معتبر نیست', 'error');
      }
    } catch (err: any) {
      showToast('خطا در خواندن فایل پکیج تیمی', 'error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d121c] border-[#1c263c] text-slate-100 shadow-2xl p-0 overflow-hidden select-none">
        <div className="p-4 border-b border-[#1c263c] bg-[#090d16] flex items-center justify-between">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-white">
                  Shared Team Workspaces (سینک کالکشن‌های تیمی)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  اشتراک‌گذاری پکیج کوئری‌های آماده و کالکشن‌ها با اعضای تیم
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
                <span>خروجی پکیج تیمی (Export Workspace Bundle)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                شامل {collections.length} کالکشن و {queries.length} کوئری آماده جهت ارسال به همکاران.
              </p>
            </div>
            <button
              onClick={handleExportTeamPackage}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی .json</span>
            </button>
          </div>

          {/* Import Action Area */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-200 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>ورود پکیج کوئری‌های تیمی (Import Team Bundle)</span>
            </label>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={4}
              placeholder="محتوای JSON پکیج دریافت شده از همکاران را اینجا قرار دهید..."
              className="w-full bg-[#080b11] border border-[#1e2942] rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleImportTeamPackage}
              disabled={!importJsonText.trim()}
              className="w-full py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>همگام‌سازی و افزودن کوئری‌های تیمی</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
