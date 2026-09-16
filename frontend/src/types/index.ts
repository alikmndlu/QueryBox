export type SQLDialect = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver';

export interface Query {
  id: string;
  title: string;
  sqlContent: string;
  description?: string;
  collectionId: string | null;
  dialect: SQLDialect;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
  tags?: string[];
  isTemporary?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface Tag {
  id: string;
  name: string;
  usageCount: number;
}

export interface QueryVersion {
  id: string;
  queryId: string;
  sqlContent: string;
  createdAt: string;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  density: 'comfortable' | 'compact';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  formatOnPaste: boolean;
  formatOnSave: boolean;
  showMinimap: boolean;
  lineNumbers: 'on' | 'off';
  defaultDialect: SQLDialect;
}

export interface SearchFilter {
  searchText: string;
  collectionId?: string | null;
  tagId?: string | null;
  dialect?: string;
  favoriteOnly?: boolean;
  quickFilter: 'all' | 'favorites' | 'recent' | 'uncategorized';
}

export interface ConnectionProfile {
  id: string;
  name: string;
  driver: SQLDialect;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  sslMode: string;
  readOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  plan?: string;
  isDestructive?: boolean;
}

export type ExportCodeLanguage = 'go' | 'typescript' | 'python' | 'rust' | 'php';

export interface ExecutionLog {
  id: string;
  profileId: string;
  profileName: string;
  sqlContent: string;
  executionTimeMs: number;
  rowCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
  executedAt: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface TableInfo {
  database?: string;
  schema: string;
  name: string;
  type: string;
  columns: ColumnInfo[];
}

export interface BenchmarkResult {
  iterations: number;
  minTimeMs: number;
  maxTimeMs: number;
  avgTimeMs: number;
  timingsMs: number[];
  rowCount: number;
  errorMessage?: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  notes: string;
  assetName: string;
  assetUrl: string;
  packageName: string;
  packageUrl: string;
  installHint: string;
  available: boolean;
  canInstall: boolean;
}

export interface UpdateProgress {
  percent: number;
  bytes: number;
  total: number;
}

export interface UpdateResult {
  restartRequired: boolean;
  openedInstaller: boolean;
}



