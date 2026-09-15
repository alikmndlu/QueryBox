import { create } from 'zustand';
import { Query, SearchFilter, QueryVersion, SQLDialect } from '../types';
import { API } from '../lib/api';
import { formatSQL } from '../lib/formatter';
import { useUIStore } from './useUIStore';
import { useSettingsStore } from './useSettingsStore';
import { useTabStore } from './useTabStore';

interface QueryState {
  queries: Query[];
  activeQuery: Query | null;
  draftSQL: string;
  draftTitle: string;
  draftDescription: string;
  draftCollectionId: string | null;
  draftDialect: SQLDialect;
  draftTags: string[];
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: 'saved' | 'saving' | 'dirty';
  isLoading: boolean;
  quickFilter: 'all' | 'favorites' | 'recent' | 'uncategorized';
  searchText: string;
  versionHistory: QueryVersion[];

  // Actions
  fetchQueries: () => Promise<void>;
  setActiveQuery: (query: Query | null) => Promise<void>;
  setSearchText: (text: string) => void;
  setQuickFilter: (filter: 'all' | 'favorites' | 'recent' | 'uncategorized') => void;
  updateDraft: (fields: Partial<{
    title: string;
    sqlContent: string;
    description: string;
    collectionId: string | null;
    dialect: SQLDialect;
    tags: string[];
  }>) => void;
  createNewQuery: (initialCollectionId?: string | null) => Promise<Query>;
  saveActiveQuery: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  duplicateQuery: (id: string) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  formatActiveQuery: () => void;
  fetchVersionHistory: (queryId: string) => Promise<void>;
  restoreVersion: (version: QueryVersion) => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  activeQuery: null,
  draftSQL: '',
  draftTitle: '',
  draftDescription: '',
  draftCollectionId: null,
  draftDialect: 'postgresql',
  draftTags: [],
  isDirty: false,
  isSaving: false,
  saveStatus: 'saved',
  isLoading: false,
  quickFilter: 'all',
  searchText: '',
  versionHistory: [],

  fetchQueries: async () => {
    set({ isLoading: true });
    const { quickFilter, searchText } = get();
    try {
      const filter: SearchFilter = {
        searchText,
        quickFilter,
      };
      const queries = await API.listQueries(filter);
      set({ queries, isLoading: false });

      // If active query is null and queries exist, select first query
      const currentActive = get().activeQuery;
      if (!currentActive && queries.length > 0) {
        get().setActiveQuery(queries[0]);
      } else if (currentActive) {
        // Keep active query ref updated if in list
        const updatedRef = queries.find((q) => q.id === currentActive.id);
        if (updatedRef) {
          set({ activeQuery: updatedRef });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveQuery: async (query) => {
    const { isDirty, saveActiveQuery } = get();

    // Auto-save unsaved changes before switching query
    if (isDirty && get().activeQuery) {
      await saveActiveQuery();
    }

    if (!query) {
      set({
        activeQuery: null,
        draftSQL: '',
        draftTitle: '',
        draftDescription: '',
        draftCollectionId: null,
        draftDialect: 'postgresql',
        draftTags: [],
        isDirty: false,
        saveStatus: 'saved',
        versionHistory: [],
      });
      return;
    }

    set({
      activeQuery: query,
      draftSQL: query.sqlContent || '',
      draftTitle: query.title || '',
      draftDescription: query.description || '',
      draftCollectionId: query.collectionId,
      draftDialect: query.dialect || 'postgresql',
      draftTags: query.tags || [],
      isDirty: false,
      saveStatus: 'saved',
    });

    // Touch query last_used timestamp asynchronously
    API.touchQuery(query.id).catch(() => {});
    // Load version history
    get().fetchVersionHistory(query.id);
    // Ensure tab is tracked
    useTabStore.getState().openTab(query.id);
  },

  setSearchText: (text) => {
    set({ searchText: text });
    get().fetchQueries();
  },

  setQuickFilter: (filter) => {
    set({ quickFilter: filter });
    get().fetchQueries();
  },

  updateDraft: (fields) => {
    set((state) => ({
      draftTitle: fields.title !== undefined ? fields.title : state.draftTitle,
      draftSQL: fields.sqlContent !== undefined ? fields.sqlContent : state.draftSQL,
      draftDescription: fields.description !== undefined ? fields.description : state.draftDescription,
      draftCollectionId: fields.collectionId !== undefined ? fields.collectionId : state.draftCollectionId,
      draftDialect: fields.dialect !== undefined ? fields.dialect : state.draftDialect,
      draftTags: fields.tags !== undefined ? fields.tags : state.draftTags,
      isDirty: true,
      saveStatus: 'dirty',
    }));
  },

  createNewQuery: async (initialCollectionId) => {
    const { isDirty, saveActiveQuery } = get();
    if (isDirty && get().activeQuery) {
      await saveActiveQuery();
    }

    const defaultDialect = useSettingsStore.getState().settings.defaultDialect || 'postgresql';
    const defaultSQL = `SELECT\n    *\nFROM users\nORDER BY created_at DESC;`;

    const newQ: Partial<Query> = {
      title: 'Untitled Query',
      sqlContent: defaultSQL,
      description: '',
      collectionId: initialCollectionId || null,
      dialect: defaultDialect,
      isFavorite: false,
      tags: [],
    };

    const created = await API.createQuery(newQ);
    await get().fetchQueries();
    await get().setActiveQuery(created);
    useUIStore.getState().showToast('Created new query');
    return created;
  },

  saveActiveQuery: async () => {
    const { activeQuery, draftTitle, draftSQL, draftDescription, draftCollectionId, draftDialect, draftTags } = get();
    if (!activeQuery) return;

    set({ isSaving: true, saveStatus: 'saving' });

    let finalSQL = draftSQL;
    const settings = useSettingsStore.getState().settings;

    // Optional format on save
    if (settings.formatOnSave && draftSQL.trim()) {
      const res = formatSQL(draftSQL, draftDialect);
      if (!res.error) {
        finalSQL = res.formatted;
        set({ draftSQL: finalSQL });
      }
    }

    try {
      const updated: Query = {
        ...activeQuery,
        title: draftTitle.trim() || 'Untitled Query',
        sqlContent: finalSQL,
        description: draftDescription,
        collectionId: draftCollectionId,
        dialect: draftDialect,
        tags: draftTags,
      };

      const saved = await API.updateQuery(updated);
      set({
        activeQuery: saved,
        isDirty: false,
        isSaving: false,
        saveStatus: 'saved',
      });

      await get().fetchQueries();
      await get().fetchVersionHistory(saved.id);
      useUIStore.getState().showToast('Query saved');
    } catch (err) {
      set({ isSaving: false, saveStatus: 'dirty' });
      useUIStore.getState().showToast('Failed to save query', 'error');
    }
  },

  toggleFavorite: async (id) => {
    const isFav = await API.toggleFavorite(id);
    const { activeQuery } = get();
    if (activeQuery && activeQuery.id === id) {
      set({ activeQuery: { ...activeQuery, isFavorite: isFav } });
    }
    await get().fetchQueries();
    useUIStore.getState().showToast(isFav ? 'Added to favorites' : 'Removed from favorites');
  },

  duplicateQuery: async (id) => {
    const dup = await API.duplicateQuery(id);
    await get().fetchQueries();
    await get().setActiveQuery(dup);
    useUIStore.getState().showToast('Query duplicated');
  },

  deleteQuery: async (id) => {
    useTabStore.getState().closeTab(id);
    await API.deleteQuery(id);
    const { activeQuery } = get();
    await get().fetchQueries();
    if (activeQuery && activeQuery.id === id) {
      const remaining = get().queries;
      set({ isDirty: false });
      get().setActiveQuery(remaining.length > 0 ? remaining[0] : null);
    }
    useUIStore.getState().showToast('Query deleted');
  },

  formatActiveQuery: () => {
    const { draftSQL, draftDialect } = get();
    const result = formatSQL(draftSQL, draftDialect);
    if (result.error) {
      useUIStore.getState().showToast(result.error, 'error');
    } else {
      get().updateDraft({ sqlContent: result.formatted });
      useUIStore.getState().showToast('SQL Formatted');
    }
  },

  fetchVersionHistory: async (queryId) => {
    try {
      const history = await API.getQueryVersions(queryId);
      set({ versionHistory: history });
    } catch {
      set({ versionHistory: [] });
    }
  },

  restoreVersion: (version) => {
    get().updateDraft({ sqlContent: version.sqlContent });
    useUIStore.getState().showToast('Restored version preview to editor');
  },
}));
