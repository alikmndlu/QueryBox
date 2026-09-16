import { create } from 'zustand';
import { Collection } from '../types';
import { API } from '../lib/api';

interface CollectionState {
  collections: Collection[];
  selectedCollectionId: string | null;
  expandedIds: Record<string, boolean>;
  isLoading: boolean;
  fetchCollections: () => Promise<void>;
  selectCollection: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  createCollection: (name: string, parentId?: string | null) => Promise<Collection>;
  updateCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  selectedCollectionId: null,
  expandedIds: {},
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const cols = await API.listCollections();
      set({ collections: cols, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectCollection: (id) => {
    set({ selectedCollectionId: id });
    // Dynamically import to avoid cyclic dependency issues
    import('./useQueryStore').then((m) => m.useQueryStore.getState().fetchQueries());
  },

  toggleExpand: (id) =>
    set((state) => ({
      expandedIds: {
        ...state.expandedIds,
        [id]: !state.expandedIds[id],
      },
    })),

  createCollection: async (name, parentId) => {
    const col = await API.createCollection(name, parentId);
    await get().fetchCollections();
    return col;
  },

  updateCollection: async (col) => {
    await API.updateCollection(col);
    await get().fetchCollections();
  },

  deleteCollection: async (id) => {
    await API.deleteCollection(id);
    if (get().selectedCollectionId === id) {
      set({ selectedCollectionId: null });
    }
    await get().fetchCollections();
  },
}));
