import { create } from 'zustand';
import { Settings } from '../types';
import { API } from '../lib/api';

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'dark',
  density: 'comfortable',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  formatOnPaste: true,
  formatOnSave: true,
  showMinimap: false,
  lineNumbers: 'on',
  defaultDialect: 'postgresql',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await API.getSettings();
      set({ settings: { ...defaultSettings, ...settings }, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    try {
      await API.updateSettings(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  },
}));
