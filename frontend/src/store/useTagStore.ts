import { create } from 'zustand';
import { Tag } from '../types';
import { API } from '../lib/api';

interface TagState {
  tags: Tag[];
  selectedTagId: string | null;
  isLoading: boolean;
  fetchTags: () => Promise<void>;
  selectTag: (id: string | null) => void;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  selectedTagId: null,
  isLoading: false,

  fetchTags: async () => {
    set({ isLoading: true });
    try {
      const tags = await API.listTags();
      set({ tags, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectTag: (id) => set({ selectedTagId: id }),
}));
