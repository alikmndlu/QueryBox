import { create } from 'zustand';

export interface ToastNotice {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  queryListWidth: number;
  dataGridHeight: number;
  commandPaletteOpen: boolean;
  settingsModalOpen: boolean;
  importExportModalOpen: boolean;
  copyAsCodeModalOpen: boolean;
  gitSyncModalOpen: boolean;
  diffModalOpen: boolean;
  diffVersion: any | null;
  shortcutsModalOpen: boolean;
  updateModalOpen: boolean;
  erdModalOpen: boolean;
  erdDatabaseName: string | null;
  sidebarTab: 'queries' | 'schema';
  toasts: ToastNotice[];
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setQueryListWidth: (width: number) => void;
  setDataGridHeight: (height: number) => void;
  setSidebarTab: (tab: 'queries' | 'schema') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setImportExportModalOpen: (open: boolean) => void;
  setCopyAsCodeModalOpen: (open: boolean) => void;
  setGitSyncModalOpen: (open: boolean) => void;
  setDiffModalOpen: (open: boolean, version?: any | null) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setUpdateModalOpen: (open: boolean) => void;
  setErdModalOpen: (open: boolean, dbName?: string | null) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const initialLeftWidth = typeof window !== 'undefined'
  ? Number(localStorage.getItem('qb_left_sidebar_width')) || 260
  : 260;

const initialQueryListWidth = typeof window !== 'undefined'
  ? Number(localStorage.getItem('qb_query_list_width')) || 280
  : 280;

const initialDataGridHeight = typeof window !== 'undefined'
  ? Number(localStorage.getItem('qb_datagrid_height')) || 320
  : 320;

export const useUIStore = create<UIState>((set, get) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: false,
  leftSidebarWidth: initialLeftWidth,
  queryListWidth: initialQueryListWidth,
  dataGridHeight: initialDataGridHeight,
  sidebarTab: 'queries',
  commandPaletteOpen: false,
  settingsModalOpen: false,
  importExportModalOpen: false,
  copyAsCodeModalOpen: false,
  gitSyncModalOpen: false,
  diffModalOpen: false,
  diffVersion: null,
  shortcutsModalOpen: false,
  updateModalOpen: false,
  erdModalOpen: false,
  erdDatabaseName: null,
  toasts: [],

  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setLeftSidebarWidth: (width) => {
    const clamped = Math.max(180, Math.min(650, width));
    if (typeof window !== 'undefined') {
      localStorage.setItem('qb_left_sidebar_width', String(clamped));
    }
    set({ leftSidebarWidth: clamped });
  },
  setQueryListWidth: (width) => {
    const clamped = Math.max(200, Math.min(650, width));
    if (typeof window !== 'undefined') {
      localStorage.setItem('qb_query_list_width', String(clamped));
    }
    set({ queryListWidth: clamped });
  },
  setDataGridHeight: (height) => {
    const maxHeight = typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.85) : 800;
    const clamped = Math.max(120, Math.min(maxHeight, height));
    if (typeof window !== 'undefined') {
      localStorage.setItem('qb_datagrid_height', String(clamped));
    }
    set({ dataGridHeight: clamped });
  },
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
  setImportExportModalOpen: (open) => set({ importExportModalOpen: open }),
  setCopyAsCodeModalOpen: (open) => set({ copyAsCodeModalOpen: open }),
  setGitSyncModalOpen: (open) => set({ gitSyncModalOpen: open }),
  setDiffModalOpen: (open, version = null) => set({ diffModalOpen: open, diffVersion: version }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),
  setErdModalOpen: (open, dbName = null) => set({ erdModalOpen: open, erdDatabaseName: dbName }),

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
