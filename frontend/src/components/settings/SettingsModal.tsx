import React from 'react';
import { Settings as SettingsIcon, Sliders, Code2, Database, Sun, Moon, Laptop } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SQLDialect } from '../../types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

export const SettingsModal: React.FC = () => {
  const { settingsModalOpen, setSettingsModalOpen, setImportExportModalOpen } = useUIStore();
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <DialogContent className="max-w-lg bg-[#0d121c] border-[#1b2333] p-0 overflow-hidden select-none">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1b2333] bg-[#0a0e17]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-indigo-400" />
              <DialogTitle className="text-sm font-semibold text-white">QueryBox Settings</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Customize appearance, code editor behavior, SQL dialects, and data backups.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Appearance Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Appearance & Theme</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium shadow-sm'
                    : 'bg-[#111622] border-[#1b2333] hover:bg-[#161c2b] text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium shadow-sm'
                    : 'bg-[#111622] border-[#1b2333] hover:bg-[#161c2b] text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'system' })}
                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'system'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium shadow-sm'
                    : 'bg-[#111622] border-[#1b2333] hover:bg-[#161c2b] text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Editor Options */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL Editor Preferences</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
                <div>
                  <div className="font-medium text-slate-200">Editor Font Size</div>
                  <div className="text-[11px] text-slate-500">Pixel size for code editor text</div>
                </div>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="h-7 px-2 rounded bg-[#0d121c] border border-[#1b2333] text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  <option value={12}>12 px</option>
                  <option value={13}>13 px</option>
                  <option value={14}>14 px</option>
                  <option value={15}>15 px</option>
                  <option value={16}>16 px</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
                <div>
                  <div className="font-medium text-slate-200">Format on Save</div>
                  <div className="text-[11px] text-slate-500">Automatically run SQL pretty printing when saving</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.formatOnSave}
                  onChange={(e) => updateSettings({ formatOnSave: e.target.checked })}
                  className="w-4 h-4 rounded border-[#1b2333] text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
                <div>
                  <div className="font-medium text-slate-200">Format on Paste</div>
                  <div className="text-[11px] text-slate-500">Automatically format raw SQL pasted into editor</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.formatOnPaste}
                  onChange={(e) => updateSettings({ formatOnPaste: e.target.checked })}
                  className="w-4 h-4 rounded border-[#1b2333] text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111622] border border-[#1b2333]">
                <div>
                  <div className="font-medium text-slate-200">Default SQL Dialect</div>
                  <div className="text-[11px] text-slate-500">Dialect selected when creating a new query</div>
                </div>
                <select
                  value={settings.defaultDialect}
                  onChange={(e) => updateSettings({ defaultDialect: e.target.value as SQLDialect })}
                  className="h-7 px-2 rounded bg-[#0d121c] border border-[#1b2333] text-slate-200 text-xs focus:outline-none uppercase cursor-pointer"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="sqlserver">SQL Server</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Portability Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Data Portability & Backup</span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#111622] border border-[#1b2333] flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Backup & Restore</div>
                <div className="text-[11px] text-slate-500">Export or import your full QueryBox library JSON file</div>
              </div>
              <Button
                onClick={() => {
                  setSettingsModalOpen(false);
                  setImportExportModalOpen(true);
                }}
                variant="default"
                size="sm"
              >
                Manage Backup
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
