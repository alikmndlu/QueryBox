import { create } from 'zustand';
import { ConnectionProfile, QueryResult, ExecutionLog, TableInfo, BenchmarkResult } from '../types';
import { API } from '../lib/api';
import { useUIStore } from './useUIStore';

interface ConnectionState {
  profiles: ConnectionProfile[];
  activeProfileId: string | null;
  activeProfile: ConnectionProfile | null;
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
  setQueryLimit: (limit: number) => void;
  createProfile: (p: Partial<ConnectionProfile>) => Promise<ConnectionProfile>;
  updateProfile: (p: ConnectionProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  testProfile: (p: ConnectionProfile) => Promise<boolean>;
  executeQuery: (rawSQL: string, limit?: number) => Promise<void>;
  explainQuery: (rawSQL: string) => Promise<void>;
  fetchExecutionHistory: (limit?: number) => Promise<void>;
  clearExecutionHistory: () => Promise<void>;
  fetchSchema: () => Promise<void>;
  runBenchmark: (rawSQL: string, iterations?: number) => Promise<void>;
  setDataGridOpen: (open: boolean) => void;
  setActiveDataGridTab: (tab: 'results' | 'explain' | 'chart' | 'history' | 'benchmark') => void;
  setConnectionModalOpen: (open: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  activeProfile: null,
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
        set({ activeProfileId: profiles[0].id, activeProfile: profiles[0] });
        get().fetchSchema();
      } else if (get().activeProfileId) {
        const found = profiles.find((p) => p.id === get().activeProfileId);
        set({ activeProfile: found || null });
        get().fetchSchema();
      }
    } catch (err) {
      console.error('Failed to list connection profiles:', err);
    }
  },

  setActiveProfileId: (id) => {
    const found = get().profiles.find((p) => p.id === id) || null;
    set({ activeProfileId: id, activeProfile: found });
    if (id) {
      get().fetchSchema();
    } else {
      set({ schemaTables: [] });
    }
  },

  createProfile: async (p) => {
    const created = await API.createConnectionProfile(p);
    await get().fetchProfiles();
    set({ activeProfileId: created.id, activeProfile: created });
    get().fetchSchema();
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
      set({ activeProfileId: null, activeProfile: null, schemaTables: [] });
    }
    await get().fetchProfiles();
    useUIStore.getState().showToast('Connection profile removed');
  },

  testProfile: async (p) => {
    set({ isTesting: true });
    try {
      await API.testConnection(p);
      set({ isTesting: false });
      useUIStore.getState().showToast(`Successfully connected to ${p.name}!`);
      return true;
    } catch (err: any) {
      set({ isTesting: false });
      useUIStore.getState().showToast(err?.message || 'Connection test failed', 'error');
      return false;
    }
  },

  executeQuery: async (rawSQL, limit) => {
    const finalLimit = limit ?? get().queryLimit;
    const { activeProfileId } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    set({ isExecuting: true, isDataGridOpen: true, activeDataGridTab: 'results' });

    try {
      const result = await API.executeQuery(activeProfileId, rawSQL, finalLimit);
      set({ lastResult: result, isExecuting: false });
      useUIStore.getState().showToast(`Executed in ${result.executionTimeMs}ms (${result.rowCount} rows)`);
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

  explainQuery: async (rawSQL) => {
    const { activeProfileId } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    set({ isExecuting: true, isDataGridOpen: true, activeDataGridTab: 'explain' });

    try {
      const plan = await API.explainQuery(activeProfileId, rawSQL);
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
    const { activeProfileId } = get();
    if (!activeProfileId) return;

    set({ isLoadingSchema: true });
    try {
      const tables = await API.introspectSchema(activeProfileId);
      set({ schemaTables: tables, isLoadingSchema: false });
    } catch (err) {
      console.warn('Failed to fetch schema:', err);
      set({ schemaTables: [], isLoadingSchema: false });
    }
  },

  runBenchmark: async (rawSQL, iterations = 5) => {
    const { activeProfileId } = get();
    if (!activeProfileId) {
      set({ connectionModalOpen: true });
      useUIStore.getState().showToast('Please select or configure a database connection', 'info');
      return;
    }

    set({ isBenchmarking: true, isDataGridOpen: true, activeDataGridTab: 'benchmark' });

    try {
      const res = await API.benchmarkQuery(activeProfileId, rawSQL, iterations);
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
