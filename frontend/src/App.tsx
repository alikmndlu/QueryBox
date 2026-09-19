import React, { useEffect } from 'react';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { QueryList } from './components/query/QueryList';
import { CenterPanel } from './components/layout/CenterPanel';
import { CommandPalette } from './components/command/CommandPalette';
import { SettingsModal } from './components/settings/SettingsModal';
import { ImportExportModal } from './components/importexport/ImportExportModal';
import { ConnectionManagerModal } from './components/connections/ConnectionManagerModal';
import { CopyAsCodeModal } from './components/export/CopyAsCodeModal';
import { DiffViewerModal } from './components/editor/DiffViewerModal';
import { GitSyncModal } from './components/sync/GitSyncModal';
import { ShortcutsModal } from './components/help/ShortcutsModal';
import { UpdateModal } from './components/settings/UpdateModal';
import { ERDDiagramModal } from './components/schema/ERDDiagramModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { TooltipProvider } from './components/ui/tooltip';

import { useQueryStore } from './store/useQueryStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useConnectionStore } from './store/useConnectionStore';
import { useUIStore } from './store/useUIStore';
import { EventsOn } from '../wailsjs/runtime/runtime';

export const App: React.FC = () => {
  const {
    queries,
    activeQuery,
    fetchQueries,
    setActiveQuery,
    createNewQuery,
    saveActiveQuery,
    formatActiveQuery,
  } = useQueryStore();

  const { fetchSettings } = useSettingsStore();
  const { fetchProfiles } = useConnectionStore();
  const {
    leftSidebarOpen,
    sidebarTab,
    toggleLeftSidebar,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    setShortcutsModalOpen,
  } = useUIStore();

  useEffect(() => {
    fetchSettings();
    fetchQueries();
    fetchProfiles();

    // Listen for System Tray Events
    try {
      if (typeof window !== 'undefined' && (window as any).runtime) {
        EventsOn('tray:new-query', () => {
          createNewQuery();
        });
        EventsOn('tray:open-settings', () => {
          setSettingsModalOpen(true);
        });
      }
    } catch (e) {
      console.warn('Tray events not available outside Wails:', e);
    }
  }, []);

  // Global Keyboard Shortcuts Engine
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N -> New Query
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewQuery();
      }

      // Cmd/Ctrl + S -> Save Query
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveQuery();
      }

      // Cmd/Ctrl + Shift + F -> Format SQL
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        formatActiveQuery();
      }

      // Cmd/Ctrl + Shift + C -> Copy SQL
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (activeQuery) {
          navigator.clipboard.writeText(activeQuery.sqlContent);
          useUIStore.getState().showToast('SQL copied to clipboard');
        }
      }

      // Cmd/Ctrl + B -> Toggle Left Sidebar
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleLeftSidebar();
      }

      // Cmd/Ctrl + , -> Open Settings
      if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setSettingsModalOpen(true);
      }

      // Cmd/Ctrl + / -> Open Keyboard Shortcuts
      if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeQuery]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-screen h-screen flex overflow-hidden bg-[#0a0d16] text-slate-200 font-sans relative selection:bg-indigo-500/30 selection:text-white">
        {/* Subtle Ambient Glow Blobs for Warm Atmosphere */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

        {/* Left Navigation Sidebar */}
        {leftSidebarOpen && <LeftSidebar />}

        {/* Center Main SQL Editor */}
        <CenterPanel />

        {/* Global Modals & Overlays */}
        <CommandPalette />
        <SettingsModal />
        <ShortcutsModal />
        <ImportExportModal />
        <ConnectionManagerModal />
        <CopyAsCodeModal />
        <DiffViewerModal />
        <GitSyncModal />
        <UpdateModal />
        <ERDDiagramModal />
        <ToastContainer />
      </div>
    </TooltipProvider>
  );
};

export default App;
