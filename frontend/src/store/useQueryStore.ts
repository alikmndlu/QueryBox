import { create } from 'zustand';
import { Query, SearchFilter, QueryVersion, SQLDialect } from '../types';
import { API } from '../lib/api';
import { formatSQL } from '../lib/formatter';
import { useUIStore } from './useUIStore';
import { useSettingsStore } from './useSettingsStore';
import { useTabStore } from './useTabStore';

interface QueryState {
  queries: Query[];
  scratchQueries: Record<string, Query>;
  activeQuery: Query | null;
  draftSQL: string;
  draftTitle: string;
  draftCollectionId: string | null;
  draftDialect: SQLDialect;
  draftConnectionProfileId: string;
  draftDatabaseName: string;
  draftShowInDashboard: boolean;
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
  openScratchpad: (data: { title: string; sqlContent: string; dialect: SQLDialect }) => void;
  removeScratchQuery: (id: string) => void;
  setSearchText: (text: string) => void;
  setQuickFilter: (filter: 'all' | 'favorites' | 'recent' | 'uncategorized') => void;
  updateDraft: (fields: Partial<{
    title: string;
    sqlContent: string;
    collectionId: string | null;
    dialect: SQLDialect;
    connectionProfileId: string;
    databaseName: string;
    showInDashboard: boolean;
  }>) => void;
  createNewQuery: (initialCollectionId?: string | null, initialData?: Partial<Query>) => Promise<Query>;
  saveActiveQuery: (overrideSQL?: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleDashboardShow: (id: string) => Promise<void>;
  duplicateQuery: (id: string) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  formatActiveQuery: () => void;
  fetchVersionHistory: (queryId: string) => Promise<void>;
  restoreVersion: (version: QueryVersion) => void;
}

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  scratchQueries: {},
  activeQuery: null,
  draftSQL: '',
  draftTitle: '',
  draftCollectionId: null,
  draftDialect: 'postgresql',
  draftConnectionProfileId: '',
  draftDatabaseName: '',
  draftShowInDashboard: false,
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
    let selectedCollectionId: string | null = null;
    try {
      const { useCollectionStore } = await import('./useCollectionStore');
      selectedCollectionId = useCollectionStore.getState().selectedCollectionId;
    } catch {}

    try {
      const filter: SearchFilter = {
        searchText,
        quickFilter,
        collectionId: selectedCollectionId,
      };
      const queries = await API.listQueries(filter);
      set({ queries, isLoading: false });

      // If active query is null and queries exist, select first query
      const currentActive = get().activeQuery;
      if (!currentActive && queries.length > 0) {
        get().setActiveQuery(queries[0]);
      } else if (currentActive && !currentActive.isTemporary) {
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
    const { isDirty, saveActiveQuery, activeQuery } = get();

    // Auto-save unsaved changes before switching query if it's a persistent query
    if (isDirty && activeQuery && !activeQuery.isTemporary) {
      await saveActiveQuery();
    }

    if (!query) {
      set({
        activeQuery: null,
        draftSQL: '',
        draftTitle: '',
        draftCollectionId: null,
        draftDialect: 'postgresql',
        isDirty: false,
        saveStatus: 'saved',
        versionHistory: [],
      });
      return;
    }

    // Always reveal SQL Editor view when opening a query
    useUIStore.getState().setDashboardOpen(false);

    set({
      activeQuery: query,
      draftSQL: query.sqlContent || '',
      draftTitle: query.title || '',
      draftCollectionId: query.collectionId,
      draftDialect: query.dialect || 'postgresql',
      draftConnectionProfileId: query.connectionProfileId || '',
      draftDatabaseName: query.databaseName || '',
      draftShowInDashboard: query.showInDashboard || false,
      isDirty: false,
      saveStatus: 'saved',
    });

    if (query.connectionProfileId || query.databaseName) {
      import('./useConnectionStore').then(({ useConnectionStore }) => {
        if (query.connectionProfileId) {
          useConnectionStore.getState().setActiveProfileId(query.connectionProfileId);
        }
        if (query.databaseName) {
          useConnectionStore.getState().setActiveDatabase(query.databaseName);
        }
      }).catch(() => {});
    }

    if (!query.isTemporary) {
      // Touch query last_used timestamp asynchronously
      API.touchQuery(query.id).catch(() => {});
      // Load version history asynchronously
      get().fetchVersionHistory(query.id);
    }
    // Ensure tab is tracked
    useTabStore.getState().openTab(query.id);
  },

  openScratchpad: (data) => {
    useUIStore.getState().setDashboardOpen(false);
    const scratchId = `temp_${Date.now()}`;
    const scratchQuery: Query = {
      id: scratchId,
      title: data.title || 'Table Preview',
      sqlContent: data.sqlContent,
      collectionId: null,
      dialect: data.dialect || 'postgresql',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isTemporary: true,
    };

    set((state) => ({
      scratchQueries: { ...state.scratchQueries, [scratchId]: scratchQuery },
      activeQuery: scratchQuery,
      draftSQL: scratchQuery.sqlContent,
      draftTitle: scratchQuery.title,
      draftCollectionId: null,
      draftDialect: scratchQuery.dialect,
      draftConnectionProfileId: '',
      draftDatabaseName: '',
      draftShowInDashboard: false,
      isDirty: false,
      saveStatus: 'saved',
    }));

    useTabStore.getState().openTab(scratchId);
  },

  removeScratchQuery: (id) => {
    set((state) => {
      const copy = { ...state.scratchQueries };
      delete copy[id];
      return { scratchQueries: copy };
    });
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
      draftCollectionId: fields.collectionId !== undefined ? fields.collectionId : state.draftCollectionId,
      draftDialect: fields.dialect !== undefined ? fields.dialect : state.draftDialect,
      draftConnectionProfileId: fields.connectionProfileId !== undefined ? fields.connectionProfileId : state.draftConnectionProfileId,
      draftDatabaseName: fields.databaseName !== undefined ? fields.databaseName : state.draftDatabaseName,
      draftShowInDashboard: fields.showInDashboard !== undefined ? fields.showInDashboard : state.draftShowInDashboard,
      isDirty: true,
      saveStatus: 'dirty',
    }));
  },

  createNewQuery: async (initialCollectionId, initialData) => {
    const { isDirty, saveActiveQuery, activeQuery } = get();
    if (isDirty && activeQuery && !activeQuery.isTemporary) {
      await saveActiveQuery();
    }

    const defaultDialect = initialData?.dialect || useSettingsStore.getState().settings.defaultDialect || 'postgresql';
    const defaultSQL = initialData?.sqlContent ?? `SELECT\n    *\nFROM users\nORDER BY created_at DESC;`;
    const defaultTitle = initialData?.title || 'Untitled Query';

    const tempId = `temp_${Date.now()}`;
    const scratchQuery: Query = {
      id: tempId,
      title: defaultTitle,
      sqlContent: defaultSQL,
      collectionId: initialCollectionId || initialData?.collectionId || null,
      dialect: defaultDialect,
      connectionProfileId: initialData?.connectionProfileId || '',
      databaseName: initialData?.databaseName || '',
      showInDashboard: initialData?.showInDashboard || false,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isTemporary: true,
    };

    useUIStore.getState().setDashboardOpen(false);

    set((state) => ({
      scratchQueries: { ...state.scratchQueries, [tempId]: scratchQuery },
      activeQuery: scratchQuery,
      draftSQL: scratchQuery.sqlContent,
      draftTitle: scratchQuery.title,
      draftCollectionId: scratchQuery.collectionId,
      draftDialect: scratchQuery.dialect,
      draftConnectionProfileId: scratchQuery.connectionProfileId || '',
      draftDatabaseName: scratchQuery.databaseName || '',
      draftShowInDashboard: scratchQuery.showInDashboard || false,
      isDirty: true,
      saveStatus: 'dirty',
    }));

    useTabStore.getState().openTab(tempId);
    useUIStore.getState().showToast(`Opened new query draft (Unsaved)`);
    return scratchQuery;
  },

  saveActiveQuery: async (overrideSQL?: string) => {
    const {
      activeQuery,
      draftTitle,
      draftSQL,
      draftCollectionId,
      draftDialect,
      draftConnectionProfileId,
      draftDatabaseName,
      draftShowInDashboard,
    } = get();
    if (!activeQuery) return;

    set({ isSaving: true, saveStatus: 'saving' });

    let finalSQL = overrideSQL !== undefined ? overrideSQL : draftSQL;
    const settings = useSettingsStore.getState().settings;

    // Optional format on save
    if (settings.formatOnSave && finalSQL.trim()) {
      const res = formatSQL(finalSQL, draftDialect);
      if (!res.error) {
        finalSQL = res.formatted;
        set({ draftSQL: finalSQL });
      }
    }

    const cleanTitle = draftTitle.trim() || 'Untitled Query';

    try {
      if (activeQuery.isTemporary) {
        // Explicitly saving a temporary table preview -> add to persistent library
        const newQ: Partial<Query> = {
          title: cleanTitle,
          sqlContent: finalSQL,
          collectionId: draftCollectionId,
          dialect: draftDialect,
          connectionProfileId: draftConnectionProfileId,
          databaseName: draftDatabaseName,
          showInDashboard: draftShowInDashboard,
          isFavorite: false,
        };

        const created = await API.createQuery(newQ);
        const oldId = activeQuery.id;

        set((state) => {
          const newScratch = { ...state.scratchQueries };
          delete newScratch[oldId];
          return {
            scratchQueries: newScratch,
            activeQuery: created,
            draftTitle: created.title,
            draftSQL: created.sqlContent,
            draftCollectionId: created.collectionId,
            draftDialect: created.dialect,
            draftConnectionProfileId: created.connectionProfileId || '',
            draftDatabaseName: created.databaseName || '',
            draftShowInDashboard: created.showInDashboard || false,
            isDirty: false,
            isSaving: false,
            saveStatus: 'saved',
          };
        });

        useTabStore.getState().replaceTab(oldId, created.id);
        await get().fetchQueries();
        try {
          const { useCollectionStore } = await import('./useCollectionStore');
          useCollectionStore.getState().fetchCollections();
        } catch {}
        useUIStore.getState().showToast('Query saved to library');
      } else {
        const updated: Query = {
          ...activeQuery,
          title: cleanTitle,
          sqlContent: finalSQL,
          collectionId: draftCollectionId,
          dialect: draftDialect,
          connectionProfileId: draftConnectionProfileId,
          databaseName: draftDatabaseName,
          showInDashboard: draftShowInDashboard,
        };

        const saved = await API.updateQuery(updated);
        set({
          activeQuery: saved,
          draftTitle: saved.title,
          draftSQL: saved.sqlContent,
          draftCollectionId: saved.collectionId,
          draftDialect: saved.dialect,
          draftConnectionProfileId: saved.connectionProfileId || '',
          draftDatabaseName: saved.databaseName || '',
          draftShowInDashboard: saved.showInDashboard || false,
          isDirty: false,
          isSaving: false,
          saveStatus: 'saved',
        });

        await get().fetchQueries();
        await get().fetchVersionHistory(saved.id);
        try {
          const { useCollectionStore } = await import('./useCollectionStore');
          useCollectionStore.getState().fetchCollections();
        } catch {}
        useUIStore.getState().showToast('Query saved');
      }
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

  toggleDashboardShow: async (id) => {
    const { queries, activeQuery, draftShowInDashboard } = get();
    const target = queries.find((q) => q.id === id);
    if (activeQuery?.id === id) {
      const nextVal = !draftShowInDashboard;
      set({ draftShowInDashboard: nextVal, isDirty: true, saveStatus: 'dirty' });
      if (!activeQuery.isTemporary) {
        await get().saveActiveQuery();
      }
      useUIStore.getState().showToast(nextVal ? 'Added to Live Dashboard' : 'Removed from Live Dashboard');
    } else if (target) {
      const updated: Query = { ...target, showInDashboard: !target.showInDashboard };
      await API.updateQuery(updated);
      await get().fetchQueries();
      useUIStore.getState().showToast(updated.showInDashboard ? 'Added to Live Dashboard' : 'Removed from Live Dashboard');
    }
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
