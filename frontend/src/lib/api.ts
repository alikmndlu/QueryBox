import {
  Query,
  Collection,
  Tag,
  QueryVersion,
  Settings,
  SearchFilter,
  ConnectionProfile,
  QueryResult,
  ExecutionLog,
  TableInfo,
  BenchmarkResult,
  UpdateInfo,
  UpdateProgress,
  UpdateResult,
} from '../types';
import * as WailsApp from '../../wailsjs/go/main/App';

// Helper to access Wails App bindings safely with fallback
function getWailsApp(): any {
  if (typeof window !== 'undefined' && (window as any).go?.main?.App) {
    return (window as any).go.main.App;
  }
  return WailsApp;
}

export const API = {
  // Query API
  async listQueries(filter: SearchFilter): Promise<Query[]> {
    try {
      const app = getWailsApp();
      if (app.ListQueries) {
        return (await app.ListQueries(filter)) || [];
      }
    } catch (e) {
      console.warn('API ListQueries error:', e);
    }
    return [];
  },

  async getQuery(id: string): Promise<Query | null> {
    try {
      const app = getWailsApp();
      if (app.GetQuery) {
        return await app.GetQuery(id);
      }
    } catch (e) {
      console.warn('API GetQuery error:', e);
    }
    return null;
  },

  async createQuery(query: Partial<Query>): Promise<Query> {
    const app = getWailsApp();
    if (app.CreateQuery) {
      return await app.CreateQuery(query);
    }
    throw new Error('Wails App binding unavailable');
  },

  async updateQuery(query: Query): Promise<Query> {
    const app = getWailsApp();
    if (app.UpdateQuery) {
      return await app.UpdateQuery(query);
    }
    throw new Error('Wails App binding unavailable');
  },

  async deleteQuery(id: string): Promise<void> {
    const app = getWailsApp();
    if (app.DeleteQuery) {
      await app.DeleteQuery(id);
    }
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const app = getWailsApp();
    if (app.ToggleFavorite) {
      return await app.ToggleFavorite(id);
    }
    return false;
  },

  async duplicateQuery(id: string): Promise<Query> {
    const app = getWailsApp();
    if (app.DuplicateQuery) {
      return await app.DuplicateQuery(id);
    }
    throw new Error('Wails App binding unavailable');
  },

  async touchQuery(id: string): Promise<void> {
    const app = getWailsApp();
    if (app.TouchQuery) {
      await app.TouchQuery(id);
    }
  },

  // Collection API
  async listCollections(): Promise<Collection[]> {
    try {
      const app = getWailsApp();
      if (app.ListCollections) {
        return (await app.ListCollections()) || [];
      }
    } catch (e) {
      console.warn('API ListCollections error:', e);
    }
    return [];
  },

  async createCollection(name: string, parentId?: string | null): Promise<Collection> {
    const app = getWailsApp();
    if (app.CreateCollection) {
      return await app.CreateCollection({ name, parentId: parentId || null, sortOrder: 0 });
    }
    throw new Error('Wails App binding unavailable');
  },

  async updateCollection(collection: Collection): Promise<void> {
    const app = getWailsApp();
    if (app.UpdateCollection) {
      await app.UpdateCollection(collection);
    }
  },

  async deleteCollection(id: string): Promise<void> {
    const app = getWailsApp();
    if (app.DeleteCollection) {
      await app.DeleteCollection(id);
    }
  },

  // Tags API
  async listTags(): Promise<Tag[]> {
    try {
      const app = getWailsApp();
      if (app.ListTags) {
        return (await app.ListTags()) || [];
      }
    } catch (e) {
      console.warn('API ListTags error:', e);
    }
    return [];
  },

  // Versions API
  async getQueryVersions(queryId: string): Promise<QueryVersion[]> {
    try {
      const app = getWailsApp();
      if (app.GetQueryVersions) {
        return (await app.GetQueryVersions(queryId)) || [];
      }
    } catch (e) {
      console.warn('API GetQueryVersions error:', e);
    }
    return [];
  },

  // Settings API
  async getSettings(): Promise<Settings> {
    try {
      const app = getWailsApp();
      if (app.GetSettings) {
        const res = await app.GetSettings();
        if (res) return res;
      }
    } catch (e) {
      console.warn('API GetSettings error:', e);
    }
    return {
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
  },

  async updateSettings(settings: Settings): Promise<void> {
    const app = getWailsApp();
    if (app.UpdateSettings) {
      await app.UpdateSettings(settings);
    }
  },

  // Connection Profiles API
  async listConnectionProfiles(): Promise<ConnectionProfile[]> {
    try {
      const app = getWailsApp();
      if (app.ListConnectionProfiles) {
        return (await app.ListConnectionProfiles()) || [];
      }
    } catch (e) {
      console.warn('API ListConnectionProfiles error:', e);
    }
    return [];
  },

  async createConnectionProfile(profile: Partial<ConnectionProfile>): Promise<ConnectionProfile> {
    const app = getWailsApp();
    if (app.CreateConnectionProfile) {
      const now = new Date().toISOString();
      const payload = {
        ...profile,
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      };
      return await app.CreateConnectionProfile(payload);
    }
    throw new Error('Wails App binding unavailable');
  },

  async updateConnectionProfile(profile: ConnectionProfile): Promise<void> {
    const app = getWailsApp();
    if (app.UpdateConnectionProfile) {
      const payload = {
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await app.UpdateConnectionProfile(payload);
    }
  },

  async deleteConnectionProfile(id: string): Promise<void> {
    const app = getWailsApp();
    if (app.DeleteConnectionProfile) {
      await app.DeleteConnectionProfile(id);
    }
  },

  async testConnection(profile: ConnectionProfile): Promise<void> {
    const app = getWailsApp();
    if (app.TestConnection) {
      const now = new Date().toISOString();
      const payload = {
        ...profile,
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      };
      await app.TestConnection(payload);
    }
  },

  // Live Query Execution & EXPLAIN
  async executeQuery(profileId: string, rawSQL: string, limit: number = 500, database?: string): Promise<QueryResult> {
    const app = getWailsApp();
    if (app.ExecuteQuery) {
      return await app.ExecuteQuery(profileId, database || '', rawSQL, limit);
    }
    throw new Error('Wails App binding unavailable');
  },

  async explainQuery(profileId: string, rawSQL: string, database?: string): Promise<string> {
    const app = getWailsApp();
    if (app.ExplainQuery) {
      return await app.ExplainQuery(profileId, database || '', rawSQL);
    }
    throw new Error('Wails App binding unavailable');
  },

  async listExecutionHistory(limit = 100): Promise<ExecutionLog[]> {
    try {
      const app = getWailsApp();
      if (app.ListExecutionHistory) {
        return (await app.ListExecutionHistory(limit)) || [];
      }
    } catch (e) {
      console.warn('API listExecutionHistory error:', e);
    }
    return [];
  },

  async clearExecutionHistory(): Promise<void> {
    const app = getWailsApp();
    if (app.ClearExecutionHistory) {
      await app.ClearExecutionHistory();
    }
  },

  async listDatabases(profileId: string): Promise<string[]> {
    try {
      const app = getWailsApp();
      if (app.ListDatabases) {
        return (await app.ListDatabases(profileId)) || [];
      }
    } catch (e) {
      console.warn('API listDatabases error:', e);
    }
    return [];
  },

  async introspectDatabase(profileId: string, dbName: string): Promise<TableInfo[]> {
    try {
      const app = getWailsApp();
      if (app.IntrospectDatabase) {
        return (await app.IntrospectDatabase(profileId, dbName)) || [];
      }
    } catch (e) {
      console.warn('API introspectDatabase error:', e);
    }
    return [];
  },

  async introspectSchema(profileId: string): Promise<TableInfo[]> {
    try {
      const app = getWailsApp();
      if (app.IntrospectSchema) {
        return (await app.IntrospectSchema(profileId)) || [];
      }
    } catch (e) {
      console.warn('API introspectSchema error:', e);
    }
    return [];
  },

  async benchmarkQuery(profileId: string, rawSQL: string, iterations = 5, database?: string): Promise<BenchmarkResult> {
    const app = getWailsApp();
    if (app.BenchmarkQuery) {
      return await app.BenchmarkQuery(profileId, database || '', rawSQL, iterations);
    }
    throw new Error('Wails App binding unavailable');
  },

  // Git & Directory Sync
  async syncQueriesToFolder(path: string): Promise<number> {
    const app = getWailsApp();
    if (app.SyncQueriesToFolder) {
      return await app.SyncQueriesToFolder(path);
    }
    return 0;
  },

  async importQueriesFromFolder(path: string): Promise<number> {
    const app = getWailsApp();
    if (app.ImportQueriesFromFolder) {
      return await app.ImportQueriesFromFolder(path);
    }
    return 0;
  },

  async selectFolderDialog(): Promise<string> {
    const app = getWailsApp();
    if (app.SelectFolderDialog) {
      return await app.SelectFolderDialog();
    }
    return '';
  },

  // Import / Export API
  async exportDataJSON(): Promise<string> {
    const app = getWailsApp();
    if (app.ExportDataJSON) {
      return await app.ExportDataJSON();
    }
    return '';
  },

  async importDataJSON(json: string): Promise<void> {
    const app = getWailsApp();
    if (app.ImportDataJSON) {
      await app.ImportDataJSON(json);
    }
  },

  async resetData(): Promise<void> {
    const app = getWailsApp();
    if (app.ResetData) {
      await app.ResetData();
    }
  },

  async saveFileDialog(defaultName: string): Promise<string> {
    const app = getWailsApp();
    if (app.SaveFileDialog) {
      return await app.SaveFileDialog(defaultName);
    }
    return '';
  },

  async openFileDialog(): Promise<string> {
    const app = getWailsApp();
    if (app.OpenFileDialog) {
      return await app.OpenFileDialog();
    }
    return '';
  },

  // Auto-Updater API
  async getAppVersion(): Promise<string> {
    const app = getWailsApp();
    if (app.GetAppVersion) {
      return await app.GetAppVersion();
    }
    return 'v1.0.0';
  },

  async checkForUpdate(): Promise<UpdateInfo> {
    const app = getWailsApp();
    if (app.CheckForUpdate) {
      return await app.CheckForUpdate();
    }
    throw new Error('Updater not available in this environment');
  },

  async installUpdate(): Promise<UpdateResult> {
    const app = getWailsApp();
    if (app.InstallUpdate) {
      return await app.InstallUpdate();
    }
    throw new Error('Updater not available in this environment');
  },

  async openReleasePage(): Promise<void> {
    const app = getWailsApp();
    if (app.OpenReleasePage) {
      await app.OpenReleasePage();
    }
  },
};
