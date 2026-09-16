import { create } from 'zustand';
import { useQueryStore } from './useQueryStore';

interface TabState {
  tabIds: string[];
  activeTabId: string | null;
  openTab: (queryId: string) => void;
  closeTab: (queryId: string) => void;
  replaceTab: (oldId: string, newId: string) => void;
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

  replaceTab: (oldId: string, newId: string) => {
    const { tabIds, activeTabId } = get();
    set({
      tabIds: tabIds.map((id) => (id === oldId ? newId : id)),
      activeTabId: activeTabId === oldId ? newId : activeTabId,
    });
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
        const store = useQueryStore.getState();
        const nextQuery = store.queries.find((q) => q.id === nextActiveId) || store.scratchQueries?.[nextActiveId];
        if (nextQuery) {
          store.setActiveQuery(nextQuery);
        }
      }
    }

    useQueryStore.getState().removeScratchQuery?.(queryId);

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
    const store = useQueryStore.getState();
    const query = store.queries.find((q) => q.id === queryId) || store.scratchQueries?.[queryId];
    if (query) {
      store.setActiveQuery(query);
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

    const store = useQueryStore.getState();
    const query = store.queries.find((q) => q.id === queryId) || store.scratchQueries?.[queryId];
    if (query) {
      store.setActiveQuery(query);
    }
  },
}));
