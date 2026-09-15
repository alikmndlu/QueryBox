import { create } from 'zustand';

export interface ToastNotice {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  settingsModalOpen: boolean;
  importExportModalOpen: boolean;
  copyAsCodeModalOpen: boolean;
  gitSyncModalOpen: boolean;
  diffModalOpen: boolean;
  diffVersion: any | null;
  shortcutsModalOpen: boolean;
  updateModalOpen: boolean;
  toasts: ToastNotice[];
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setImportExportModalOpen: (open: boolean) => void;
  setCopyAsCodeModalOpen: (open: boolean) => void;
  setGitSyncModalOpen: (open: boolean) => void;
  setDiffModalOpen: (open: boolean, version?: any | null) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setUpdateModalOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  commandPaletteOpen: false,
  settingsModalOpen: false,
  importExportModalOpen: false,
  copyAsCodeModalOpen: false,
  gitSyncModalOpen: false,
  diffModalOpen: false,
  diffVersion: null,
  shortcutsModalOpen: false,
  updateModalOpen: false,
  toasts: [],

  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setImportExportModalOpen: (open) => set({ importExportModalOpen: open }),
  setCopyAsCodeModalOpen: (open) => set({ copyAsCodeModalOpen: open }),
  setGitSyncModalOpen: (open) => set({ gitSyncModalOpen: open }),
  setDiffModalOpen: (open, version = null) => set({ diffModalOpen: open, diffVersion: version }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),

  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
