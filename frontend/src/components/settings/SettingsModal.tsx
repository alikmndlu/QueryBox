import React from 'react';
import { Settings as SettingsIcon, Sliders, Code2, Database, Sun, Moon, Laptop, ArrowUpCircle } from 'lucide-react';
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
  const { settingsModalOpen, setSettingsModalOpen, setImportExportModalOpen, setUpdateModalOpen } = useUIStore();
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
          {/* Appearance & Theme Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Theme Presets</span>
              </div>
              <span className="text-[10px] font-normal text-slate-500">8 Custom Color Themes</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'querybox-dark',
                  name: 'QueryBox Dark',
                  sub: 'Midnight Slate (Default)',
                  badge: 'Slate',
                  bg: '#080b11',
                  border: '#6366f1',
                  dots: ['#818cf8', '#fbbf24', '#f472b6'],
                },
                {
                  id: 'onedark',
                  name: 'Quantum One Dark',
                  sub: 'Atom / VS Code Pro',
                  badge: 'One Dark',
                  bg: '#1e222a',
                  border: '#c678dd',
                  dots: ['#c678dd', '#98c379', '#56b6c2'],
                },
                {
                  id: 'dracula',
                  name: 'Dracula Neon',
                  sub: 'Vibrant Neon Dark',
                  badge: 'Dracula',
                  bg: '#282a36',
                  border: '#ff79c6',
                  dots: ['#ff79c6', '#f1fa8c', '#bd93f9'],
                },
                {
                  id: 'github-dark',
                  name: 'GitHub Night',
                  sub: 'Official GitHub Dimmed',
                  badge: 'GitHub',
                  bg: '#22272e',
                  border: '#6cb6ff',
                  dots: ['#f47067', '#96d0ff', '#6cb6ff'],
                },
                {
                  id: 'cyberpunk',
                  name: 'Cyberpunk Neon',
                  sub: 'Electric Glowing Neon',
                  badge: 'Cyberpunk',
                  bg: '#120e24',
                  border: '#ff0055',
                  dots: ['#ff0055', '#ffe600', '#00ff99'],
                },
                {
                  id: 'monokai',
                  name: 'Monokai Pro',
                  sub: 'Pro Contrast Gold',
                  badge: 'Monokai',
                  bg: '#2d2a2e',
                  border: '#ff6188',
                  dots: ['#ff6188', '#ffd866', '#78dce8'],
                },
                {
                  id: 'nord',
                  name: 'Nord Arctic',
                  sub: 'Cool Arctic Ice Blue',
                  badge: 'Nord',
                  bg: '#2e3440',
                  border: '#88c0d0',
                  dots: ['#81a1c1', '#a3be8c', '#b48ead'],
                },
                {
                  id: 'light',
                  name: 'Daylight Light',
                  sub: 'Clean Light Vision',
                  badge: 'Light',
                  bg: '#f8fafc',
                  border: '#6366f1',
                  dots: ['#2563eb', '#d97706', '#dc2626'],
                },
              ].map((theme) => {
                const currentTheme = settings.theme || 'querybox-dark';
                const isSelected = currentTheme === theme.id || (currentTheme === 'dark' && theme.id === 'querybox-dark');

                return (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings({ theme: theme.id as any })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-[#111622] border-[#1b2333] hover:bg-[#161c2b] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#090d16] text-slate-300 border border-[#1c2538]">
                        {theme.badge}
                      </span>
                      <div className="flex items-center gap-1">
                        {theme.dots.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-100 text-xs flex items-center justify-between">
                        <span>{theme.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{theme.sub}</div>
                    </div>
                  </button>
                );
              })}
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

          {/* Software Updates Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Software Updates</span>
            </div>
            <div className="p-3.5 rounded-lg bg-[#111622] border border-[#1b2333] flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">QueryBox Updater</div>
                <div className="text-[11px] text-slate-500">Check for newer versions and install updates automatically</div>
              </div>
              <Button
                onClick={() => {
                  setSettingsModalOpen(false);
                  setUpdateModalOpen(true);
                }}
                variant="outline"
                size="sm"
                className="bg-[#0c101a] border-[#1f293d] hover:bg-[#161f33]"
              >
                Check for Updates
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
