import { create } from 'zustand';
import { ConnectionProfile, QueryResult, ExecutionLog, TableInfo, BenchmarkResult } from '../types';
import { API } from '../lib/api';
import { useUIStore } from './useUIStore';

interface ConnectionState {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;
  activeProfile: ConnectionProfile | null;
  databases: string[];
  activeDatabase: string | null;
  databaseTables: Record<string, TableInfo[]>;
  expandedDatabases: Record<string, boolean>;
  isLoadingDatabases: boolean;
  isTesting: boolean;
  isExecuting: boolean;
  lastResult: QueryResult | null;
  explainPlan: string | null;
  executionHistory: ExecutionLog[];
  schemaTables: TableInfo[];
  isLoadingSchema: boolean;
  benchmarkResult: BenchmarkResult | null;
  isBenchmarking: boolean;
  isDataGridOpen: boolean;
  activeDataGridTab: 'results' | 'explain' | 'chart' | 'history' | 'benchmark';
  connectionModalOpen: boolean;
  queryLimit: number;

  fetchProfiles: () => Promise<void>;
  setActiveProfileId: (id: string | null) => void;
  setActiveDatabase: (dbName: string) => void;
  toggleDatabaseExpanded: (dbName: string) => void;
  fetchDatabases: (profileId?: string) => Promise<string[]>;
  fetchDatabaseSchema: (dbName: string, profileId?: string) => Promise<TableInfo[]>;
  setQueryLimit: (limit: number) => void;
  createProfile: (p: Partial<ConnectionProfile>) => Promise<ConnectionProfile>;
  updateProfile: (p: ConnectionProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  testProfile: (p: ConnectionProfile) => Promise<{ success: boolean; message: string }>;
  executeQuery: (rawSQL: string, limit?: number, database?: string) => Promise<void>;
  explainQuery: (rawSQL: string, database?: string) => Promise<void>;
  fetchExecutionHistory: (limit?: number) => Promise<void>;
  clearExecutionHistory: () => Promise<void>;
  fetchSchema: () => Promise<void>;
  runBenchmark: (rawSQL: string, iterations?: number, database?: string) => Promise<void>;
  setDataGridOpen: (open: boolean) => void;
  setActiveDataGridTab: (tab: 'results' | 'explain' | 'chart' | 'history' | 'benchmark') => void;
  setConnectionModalOpen: (open: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
  databases: [],
  activeDatabase: null,
  databaseTables: {},
  expandedDatabases: {},
  isLoadingDatabases: false,
  isTesting: false,
  isExecuting: false,
  lastResult: null,
  explainPlan: null,
  executionHistory: [],
  schemaTables: [],
  isLoadingSchema: false,
  benchmarkResult: null,
  isBenchmarking: false,
  isDataGridOpen: false,
  activeDataGridTab: 'results',
  connectionModalOpen: false,
  queryLimit: 500,

  setQueryLimit: (limit: number) => set({ queryLimit: limit }),

  fetchProfiles: async () => {
    try {
      const profiles = await API.listConnectionProfiles();
      set({ profiles });
      if (!get().activeProfileId && profiles.length > 0) {
        get().setActiveProfileId(profiles[0].id);
      } else if (get().activeProfileId) {
        const found = profiles.find((p) => p.id === get().activeProfileId);
        set({ activeProfile: found || null });
        if (found) {
          get().fetchDatabases(found.id);
        }
      }
    } catch (err) {
      console.error('Failed to list connection profiles:', err);
    }
  },

  setActiveProfileId: (id) => {
    const found = get().profiles.find((p) => p.id === id) || null;
    const initialDb = found?.database || null;
    set({
      activeProfileId: id,
      activeProfile: found,
      databases: initialDb ? [initialDb] : [],
      activeDatabase: initialDb,
      databaseTables: {},
      expandedDatabases: initialDb ? { [initialDb]: true } : {},
      schemaTables: [],
    });
    if (id) {
      get().fetchDatabases(id);
      if (initialDb) {
        get().fetchDatabaseSchema(initialDb, id);
      } else {
        get().fetchSchema();
      }
    } else {
      set({ schemaTables: [], databases: [], databaseTables: {} });
    }
  },

  setActiveDatabase: (dbName) => {
    const currentTables = get().databaseTables[dbName] || [];
    set((state) => ({
      activeDatabase: dbName,
      schemaTables: currentTables.length > 0 ? currentTables : state.schemaTables,
      expandedDatabases: { ...state.expandedDatabases, [dbName]: true },
    }));
    if (!get().databaseTables[dbName]) {
      get().fetchDatabaseSchema(dbName);
    }
  },

  toggleDatabaseExpanded: (dbName) => {
    const isExpanded = !!get().expandedDatabases[dbName];
    set((state) => ({
      expandedDatabases: {
        ...state.expandedDatabases,
        [dbName]: !isExpanded,
      },
    }));
    if (!isExpanded && !get().databaseTables[dbName]) {
      get().fetchDatabaseSchema(dbName);
    }
  },

  fetchDatabases: async (profileId) => {
    const targetProfileId = profileId || get().activeProfileId;
    if (!targetProfileId) return [];
    set({ isLoadingDatabases: true });
    try {
      const dbs = await API.listDatabases(targetProfileId);
      const activeProfile = get().activeProfile;
      const currentActive = get().activeDatabase;
      const initialDb = (currentActive && dbs.includes(currentActive))
        ? currentActive
        : (activeProfile?.database && dbs.includes(activeProfile.database))
        ? activeProfile.database
        : (dbs[0] || activeProfile?.database || null);

      set((state) => ({
        databases: dbs.length > 0 ? dbs : (activeProfile?.database ? [activeProfile.database] : []),
        activeDatabase: initialDb,
        isLoadingDatabases: false,
        expandedDatabases: initialDb ? { ...state.expandedDatabases, [initialDb]: true } : state.expandedDatabases,
      }));

      if (initialDb && !get().databaseTables[initialDb]) {
        get().fetchDatabaseSchema(initialDb, targetProfileId);
      }
      return dbs;
    } catch (err) {
      console.warn('Failed to fetch databases:', err);
      set({ isLoadingDatabases: false });
      return [];
    }
  },

  fetchDatabaseSchema: async (dbName, profileId) => {
    const targetProfileId = profileId || get().activeProfileId;
    if (!targetProfileId || !dbName) return [];
    set({ isLoadingSchema: true });
    try {
      const tables = await API.introspectDatabase(targetProfileId, dbName);
      set((state) => {
        const updatedMap = { ...state.databaseTables, [dbName]: tables };
        const isActive = state.activeDatabase === dbName;
        return {
          databaseTables: updatedMap,
          schemaTables: isActive ? tables : state.schemaTables,
          isLoadingSchema: false,
        };
      });
      return tables;
    } catch (err) {
      console.warn(`Failed to introspect database ${dbName}:`, err);
      set({ isLoadingSchema: false });
      return [];
    }
  },

  createProfile: async (p) => {
    const created = await API.createConnectionProfile(p);
    await get().fetchProfiles();
    get().setActiveProfileId(created.id);
    useUIStore.getState().showToast(`Created profile "${created.name}"`);
    return created;
  },

  updateProfile: async (p) => {
    await API.updateConnectionProfile(p);
    await get().fetchProfiles();
    get().fetchSchema();
    useUIStore.getState().showToast(`Updated profile "${p.name}"`);
  },

  deleteProfile: async (id) => {
    await API.deleteConnectionProfile(id);
    if (get().activeProfileId === id) {
      set({ activeProfileId: null, activeProfile: null, schemaTables: [], databases: [], databaseTables: {} });
    }
    await get().fetchProfiles();
    useUIStore.getState().showToast('Connection profile removed');
  },

  testProfile: async (p) => {
    set({ isTesting: true });
    try {
      await API.testConnection(p);
      set({ isTesting: false });
      const targetName = p.name || p.database || 'database';
      const msg = `Successfully connected to ${targetName}!`;
      useUIStore.getState().showToast(msg);
      return { success: true, message: msg };
    } catch (err: any) {
      set({ isTesting: false });
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Connection test failed';
      useUIStore.getState().showToast(errorMsg, 'error');
      return { success: false, message: errorMsg };
    }
  },

  executeQuery: async (rawSQL, limit, database) => {
    const finalLimit = limit ?? get().queryLimit;
    const { activeProfileId, activeDatabase, activeProfile } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    const targetDb = database || activeDatabase || activeProfile?.database || '';
    set({ isExecuting: true, isDataGridOpen: true, activeDataGridTab: 'results' });

    try {
      const result = await API.executeQuery(activeProfileId, rawSQL, finalLimit, targetDb);
      const safeResult: QueryResult = {
        columns: Array.isArray(result?.columns) ? result.columns : [],
        rows: Array.isArray(result?.rows) ? result.rows : [],
        rowCount: typeof result?.rowCount === 'number' ? result.rowCount : (result?.rows?.length || 0),
        executionTimeMs: result?.executionTimeMs || 0,
        error: result?.error,
        isDestructive: result?.isDestructive,
      };
      set({ lastResult: safeResult, isExecuting: false });
      const dbLabel = targetDb ? ` on ${targetDb}` : '';
      useUIStore.getState().showToast(`Executed${dbLabel} in ${safeResult.executionTimeMs}ms (${safeResult.rowCount} rows)`);
      get().fetchExecutionHistory();
    } catch (err: any) {
      set({
        isExecuting: false,
        lastResult: {
          columns: ['Error'],
          rows: [[err?.message || 'Query execution error']],
          rowCount: 0,
          executionTimeMs: 0,
          error: err?.message || 'Execution failed',
        },
      });
      useUIStore.getState().showToast(err?.message || 'Query execution failed', 'error');
      get().fetchExecutionHistory();
    }
  },

  explainQuery: async (rawSQL, database) => {
    const { activeProfileId, activeDatabase, activeProfile } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    const targetDb = database || activeDatabase || activeProfile?.database || '';
    set({ isExecuting: true, isDataGridOpen: true, activeDataGridTab: 'explain' });

    try {
      const plan = await API.explainQuery(activeProfileId, rawSQL, targetDb);
      set({ explainPlan: plan, isExecuting: false });
      useUIStore.getState().showToast('EXPLAIN plan generated');
    } catch (err: any) {
      set({
        isExecuting: false,
        explainPlan: `Error analyzing query plan:\n${err?.message || err}`,
      });
      useUIStore.getState().showToast(err?.message || 'Explain failed', 'error');
    }
  },

  fetchExecutionHistory: async (limit = 100) => {
    try {
      const history = await API.listExecutionHistory(limit);
      set({ executionHistory: history });
    } catch (err) {
      console.warn('Failed to fetch execution history:', err);
    }
  },

  clearExecutionHistory: async () => {
    try {
      await API.clearExecutionHistory();
      set({ executionHistory: [] });
      useUIStore.getState().showToast('Execution history cleared');
    } catch (err) {
      useUIStore.getState().showToast('Failed to clear execution history', 'error');
    }
  },

  fetchSchema: async () => {
    const { activeProfileId, activeDatabase } = get();
    if (!activeProfileId) return;

    if (activeDatabase) {
      await get().fetchDatabaseSchema(activeDatabase, activeProfileId);
      return;
    }

    set({ isLoadingSchema: true });
    try {
      const tables = await API.introspectSchema(activeProfileId);
      set({ schemaTables: tables, isLoadingSchema: false });
    } catch (err) {
      console.warn('Failed to fetch schema:', err);
      set({ schemaTables: [], isLoadingSchema: false });
    }
  },

  runBenchmark: async (rawSQL, iterations = 5, database) => {
    const { activeProfileId, activeDatabase, activeProfile } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    const targetDb = database || activeDatabase || activeProfile?.database || '';
    set({ isBenchmarking: true, isDataGridOpen: true, activeDataGridTab: 'benchmark' });

    try {
      const res = await API.benchmarkQuery(activeProfileId, rawSQL, iterations, targetDb);
      set({ benchmarkResult: res, isBenchmarking: false });
      useUIStore.getState().showToast(`Benchmark complete: avg ${res.avgTimeMs.toFixed(1)}ms (${res.iterations} runs)`);
    } catch (err: any) {
      set({
        isBenchmarking: false,
        benchmarkResult: {
          iterations: 0,
          minTimeMs: 0,
          maxTimeMs: 0,
          avgTimeMs: 0,
          timingsMs: [],
          rowCount: 0,
          errorMessage: err?.message || 'Benchmark run failed',
        },
      });
      useUIStore.getState().showToast(err?.message || 'Benchmark run failed', 'error');
    }
  },

  setDataGridOpen: (open) => set({ isDataGridOpen: open }),
  setActiveDataGridTab: (tab) => set({ activeDataGridTab: tab }),
  setConnectionModalOpen: (open) => set({ connectionModalOpen: open }),
}));
