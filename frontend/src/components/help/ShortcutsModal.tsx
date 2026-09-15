import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

export const ShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useUIStore();

  if (!shortcutsModalOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const categories: ShortcutCategory[] = [
    {
      title: 'Query Editor & Code',
      items: [
        { keys: [modKey, 'S'], description: 'Save current query draft' },
        { keys: [modKey, 'Shift', 'F'], description: 'Format / Beautify SQL' },
        { keys: [modKey, 'Shift', 'C'], description: 'Copy raw SQL to clipboard' },
        { keys: [modKey, 'F'], description: 'Find / Replace within Monaco editor' },
        { keys: [modKey, 'Z'], description: 'Undo' },
        { keys: [modKey, isMac ? 'Shift, Z' : 'Y'], description: 'Redo' },
      ],
    },
    {
      title: 'Database & Execution',
      items: [
        { keys: [modKey, 'Enter'], description: 'Execute query on active database' },
        { keys: ['Explain Button'], description: 'Inspect EXPLAIN execution plan' },
        { keys: ['Benchmark Button'], description: 'Measure latency across 5 iterations' },
        { keys: [':param / {{param}}'], description: 'Auto-detects variables above editor' },
      ],
    },
    {
      title: 'Workspace & Navigation',
      items: [
        { keys: [modKey, 'N'], description: 'Create new query tab' },
        { keys: [modKey, 'B'], description: 'Toggle left navigation sidebar' },
        { keys: ['Middle Click Tab'], description: 'Close workspace tab' },
        { keys: ['Sidebar "Tables"'], description: 'Browse introspected database schema' },
      ],
    },
    {
      title: 'Global Shortcuts',
      items: [
        { keys: [modKey, 'K'], description: 'Open Command Palette' },
        { keys: [modKey, 'Shift', 'P'], description: 'Alternative Command Palette shortcut' },
        { keys: [modKey, ','], description: 'Open Application Settings' },
        { keys: [modKey, '/'], description: 'Open this Keyboard Shortcuts cheat sheet' },
      ],
    },
  ];

  return (
    <Dialog open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-[#0c101a] border border-[#1b2333] shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b2333] bg-[#090d16]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-white">
                Keyboard Shortcuts
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick reference for power keys and workflow navigation
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#161f32] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {categories.map((cat, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2.5">
                {cat.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-2 rounded-md bg-[#101522] border border-[#1b2333]/80 hover:border-indigo-500/30 transition-colors"
                  >
                    <span className="text-xs text-slate-300 mr-2 truncate">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-[#182133] border border-[#27354d] text-indigo-200 rounded shadow-sm select-none"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1b2333] bg-[#090d16] flex items-center justify-between text-xs text-slate-400">
          <span>
            Press <kbd className="px-1 py-0.5 font-mono text-[10px] bg-[#182133] rounded border border-[#27354d] text-slate-300">Esc</kbd> anytime to close
          </span>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
