import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueryResult } from '../types';
import { useConnectionStore } from './useConnectionStore';
import { API } from '../lib/api';

export type WidgetChartType = 'bar' | 'line' | 'pie' | 'donut' | 'kpi' | 'table';

export interface DashboardWidget {
  id: string;
  title: string;
  sql: string;
  chartType: WidgetChartType;
  refreshIntervalSec: number; // 0 = manual, 5, 10, 30, 60
  lastResult?: QueryResult;
  lastRefreshedAt?: string;
  isRefreshing?: boolean;
  error?: string;
  createdAt: string;
}

interface DashboardState {
  widgets: DashboardWidget[];
  globalRefreshSec: number;
  isAutoRefreshActive: boolean;

  addWidget: (w: Omit<DashboardWidget, 'id' | 'createdAt'>) => string;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  deleteWidget: (id: string) => void;
  refreshWidget: (id: string) => Promise<void>;
  refreshAllWidgets: () => Promise<void>;
  setGlobalRefreshSec: (sec: number) => void;
  toggleAutoRefresh: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: [
        {
          id: 'w_demo_1',
          title: 'Total Active Users',
          sql: 'SELECT COUNT(*) AS total_users FROM users;',
          chartType: 'kpi',
          refreshIntervalSec: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'w_demo_2',
          title: 'Recent Query Executions',
          sql: 'SELECT id, rowCount, executionTimeMs FROM history LIMIT 10;',
          chartType: 'bar',
          refreshIntervalSec: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      globalRefreshSec: 0,
      isAutoRefreshActive: true,

      addWidget: (w) => {
        const id = `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newWidget: DashboardWidget = {
          ...w,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ widgets: [...state.widgets, newWidget] }));
        get().refreshWidget(id);
        return id;
      },

      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),

      deleteWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      refreshWidget: async (id) => {
        const { activeProfileId, activeDatabase } = useConnectionStore.getState();
        const widget = get().widgets.find((w) => w.id === id);
        if (!widget || !activeProfileId) return;

        get().updateWidget(id, { isRefreshing: true, error: undefined });

        try {
          const res = await API.executeQuery(activeProfileId, widget.sql, 200, activeDatabase || '');
          get().updateWidget(id, {
            isRefreshing: false,
            lastResult: {
              columns: Array.isArray(res?.columns) ? res.columns : [],
              rows: Array.isArray(res?.rows) ? res.rows : [],
              rowCount: res?.rowCount || res?.rows?.length || 0,
              executionTimeMs: res?.executionTimeMs || 0,
              error: res?.error,
            },
            lastRefreshedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          });
        } catch (err: any) {
          get().updateWidget(id, {
            isRefreshing: false,
            error: err?.message || 'Failed to refresh widget',
          });
        }
      },

      refreshAllWidgets: async () => {
        const widgets = get().widgets;
        await Promise.all(widgets.map((w) => get().refreshWidget(w.id)));
      },

      setGlobalRefreshSec: (globalRefreshSec) => set({ globalRefreshSec }),
      toggleAutoRefresh: () => set((state) => ({ isAutoRefreshActive: !state.isAutoRefreshActive })),
    }),
    {
      name: 'querybox-dashboard-storage',
      partialize: (state) => ({
        widgets: state.widgets,
        globalRefreshSec: state.globalRefreshSec,
      }),
    }
  )
);
