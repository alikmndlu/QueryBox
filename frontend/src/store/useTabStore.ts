import { create } from 'zustand';
import { useQueryStore } from './useQueryStore';

interface TabState {
  tabIds: string[];
  activeTabId: string | null;
  openTab: (queryId: string) => void;
  closeTab: (queryId: string) => void;
  closeOtherTabs: (queryId: string) => void;
  closeAllTabs: () => void;
  setActiveTabId: (queryId: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabIds: [],
  activeTabId: null,

  openTab: (queryId: string) => {
    const { tabIds } = get();
    if (!tabIds.includes(queryId)) {
      set({
        tabIds: [...tabIds, queryId],
        activeTabId: queryId,
      });
    } else {
      set({ activeTabId: queryId });
    }
  },

  closeTab: (queryId: string) => {
    const { tabIds, activeTabId } = get();
    const index = tabIds.indexOf(queryId);
    if (index === -1) return;

    const newTabIds = tabIds.filter((id) => id !== queryId);
    let nextActiveId = activeTabId;

    if (activeTabId === queryId) {
      if (newTabIds.length === 0) {
        nextActiveId = null;
        useQueryStore.getState().setActiveQuery(null);
      } else {
        const nextIndex = Math.min(index, newTabIds.length - 1);
        nextActiveId = newTabIds[nextIndex];
        const nextQuery = useQueryStore.getState().queries.find((q) => q.id === nextActiveId);
        if (nextQuery) {
          useQueryStore.getState().setActiveQuery(nextQuery);
        }
      }
    }

    set({
      tabIds: newTabIds,
      activeTabId: nextActiveId,
    });
  },

  closeOtherTabs: (queryId: string) => {
    set({
      tabIds: [queryId],
      activeTabId: queryId,
    });
    const query = useQueryStore.getState().queries.find((q) => q.id === queryId);
    if (query) {
      useQueryStore.getState().setActiveQuery(query);
    }
  },

  closeAllTabs: () => {
    set({
      tabIds: [],
      activeTabId: null,
    });
    useQueryStore.getState().setActiveQuery(null);
  },

  setActiveTabId: (queryId: string) => {
    const { tabIds } = get();
    if (!tabIds.includes(queryId)) {
      set({
        tabIds: [...tabIds, queryId],
        activeTabId: queryId,
      });
    } else {
      set({ activeTabId: queryId });
    }

    const query = useQueryStore.getState().queries.find((q) => q.id === queryId);
    if (query) {
      useQueryStore.getState().setActiveQuery(query);
    }
  },
}));
