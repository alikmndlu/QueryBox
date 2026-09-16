import React, { useState, useMemo } from 'react';
import {
  Database,
  Table as TableIcon,
  Eye,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Search,
  Key,
  Play,
  Copy,
  Code2,
  X,
  Hash,
  Check,
} from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useUIStore } from '../../store/useUIStore';
import { TableInfo } from '../../types';

export const SchemaExplorer: React.FC = () => {
  const {
    activeProfile,
    databases,
    activeDatabase,
    databaseTables,
    expandedDatabases,
    isLoadingDatabases,
    isLoadingSchema,
    fetchDatabases,
    fetchDatabaseSchema,
    setActiveDatabase,
    toggleDatabaseExpanded,
    setConnectionModalOpen,
    executeQuery,
  } = useConnectionStore();

  const { openScratchpad } = useQueryStore();
  const { showToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Ensure active database is present in display list
  const displayDatabases = useMemo(() => {
    if (databases && databases.length > 0) return databases;
    if (activeProfile?.database) return [activeProfile.database];
    if (activeDatabase) return [activeDatabase];
    return [];
  }, [databases, activeProfile, activeDatabase]);

  const toggleTableExpand = (tableKey: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableKey]: !prev[tableKey],
    }));
  };

  const formatTableIdentifier = (driver: string, table: TableInfo) => {
    const d = (driver || '').toLowerCase();
    const tableName = table.name;
    const schema = table.schema;

    if (d.includes('my')) {
      return schema ? `\`${schema}\`.\`${tableName}\`` : `\`${tableName}\``;
    } else if (d.includes('sqlserver') || d.includes('mssql')) {
      return schema ? `[${schema}].[${tableName}]` : `[${tableName}]`;
    } else {
      // PostgreSQL, SQLite
      if (schema && schema !== 'public' && schema !== 'main') {
        return `"${schema}"."${tableName}"`;
      }
      return `"${tableName}"`;
    }
  };

  const getSelectQuery = (driver: string, table: TableInfo, limit: number = 100) => {
    const d = (driver || '').toLowerCase();
    const tableId = formatTableIdentifier(driver, table);
    if (d.includes('sqlserver') || d.includes('mssql')) {
      return `SELECT TOP ${limit}\n    *\nFROM ${tableId};`;
    }
    return `SELECT\n    *\nFROM ${tableId}\nLIMIT ${limit};`;
  };

  const getCountQuery = (driver: string, table: TableInfo) => {
    const tableId = formatTableIdentifier(driver, table);
    return `SELECT COUNT(*) AS total_rows\nFROM ${tableId};`;
  };

  const handleQueryTable = (dbName: string, table: TableInfo) => {
    setActiveDatabase(dbName);
    const driver = (activeProfile?.driver || 'postgresql').toLowerCase();
    const defaultSQL = getSelectQuery(driver, table, 100);
    const title = `${dbName}.${table.name}`;
    const dialect = driver.includes('my')
      ? 'mysql'
      : driver.includes('sqlserver') || driver.includes('mssql')
      ? 'sqlserver'
      : driver.includes('sqlite')
      ? 'sqlite'
      : 'postgresql';

    openScratchpad({
      title,
      sqlContent: defaultSQL,
      dialect,
    });
    executeQuery(defaultSQL, 100, dbName);
  };

  const handleQueryCount = (dbName: string, table: TableInfo) => {
    setActiveDatabase(dbName);
    const driver = (activeProfile?.driver || 'postgresql').toLowerCase();
    const countSQL = getCountQuery(driver, table);
    const title = `Count: ${table.name}`;
    const dialect = driver.includes('my')
      ? 'mysql'
      : driver.includes('sqlserver') || driver.includes('mssql')
      ? 'sqlserver'
      : driver.includes('sqlite')
      ? 'sqlite'
      : 'postgresql';

    openScratchpad({
      title,
      sqlContent: countSQL,
      dialect,
    });
    executeQuery(countSQL, 50, dbName);
  };

  const handleGenerateDDL = (dbName: string, table: TableInfo) => {
    const driver = (activeProfile?.driver || 'postgres').toLowerCase();
    const isPostgres = driver.includes('post');
    const isMySQL = driver.includes('my');
    const isSQLite = driver.includes('sqlite');
    const isSQLServer = driver.includes('sqlserver') || driver.includes('mssql');

    const colDefs = table.columns.map((c) => {
      let typeStr = c.dataType.toUpperCase();
      let extra = '';

      if (c.isPrimaryKey) {
        if (isPostgres) {
          if (typeStr.includes('INT')) typeStr = 'SERIAL PRIMARY KEY';
          else extra = ' PRIMARY KEY';
        } else if (isMySQL) {
          if (typeStr.includes('INT')) extra = ' AUTO_INCREMENT PRIMARY KEY';
          else extra = ' PRIMARY KEY';
        } else if (isSQLite) {
          if (typeStr.includes('INT')) typeStr = 'INTEGER PRIMARY KEY AUTOINCREMENT';
          else extra = ' PRIMARY KEY';
        } else if (isSQLServer) {
          if (typeStr.includes('INT')) extra = ' IDENTITY(1,1) PRIMARY KEY';
          else extra = ' PRIMARY KEY';
        } else {
          extra = ' PRIMARY KEY';
        }
      }

      const nullStr = !c.isNullable && !c.isPrimaryKey ? ' NOT NULL' : '';
      return `    ${c.name} ${typeStr}${extra}${nullStr}`;
    });

    const ddl = `-- DDL for table: ${table.name} (${activeProfile?.driver || 'SQL'})\nCREATE TABLE ${formatTableIdentifier(driver, table)} (\n${colDefs.join(',\n')}\n);`;

    const dialect = isMySQL ? 'mysql' : isSQLServer ? 'sqlserver' : isSQLite ? 'sqlite' : 'postgresql';
    openScratchpad({
      title: `DDL: ${table.name}`,
      sqlContent: ddl,
      dialect,
    });
    showToast(`Generated DDL for "${table.name}"`);
  };

  const handleCopyColName = (colName: string) => {
    navigator.clipboard.writeText(colName);
    showToast(`Copied column "${colName}"`);
  };

  if (!activeProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none text-slate-500">
        <Database className="w-8 h-8 text-slate-600 mb-3" />
        <span className="text-xs font-semibold text-slate-300">No Active Connection</span>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
          Select or add a database connection profile to browse schemas and tables.
        </p>
        <button
          onClick={() => setConnectionModalOpen(true)}
          className="mt-3.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
        >
          Manage Connections
        </button>
      </div>
    );
  }

  const q = search.trim().toLowerCase();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0d16] select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#1b2333] flex items-center justify-between gap-2 shrink-0 bg-[#0d121c]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Database className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate" title={activeProfile.name}>
              {activeProfile.name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1.5">
              <span className="uppercase font-semibold text-slate-500">{activeProfile.driver}</span>
              {activeDatabase && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-indigo-400 font-medium truncate" title={`Active Database: ${activeDatabase}`}>
                    {activeDatabase}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            fetchDatabases();
            if (activeDatabase) fetchDatabaseSchema(activeDatabase);
          }}
          disabled={isLoadingDatabases || isLoadingSchema}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#161f32] transition-colors"
          title="Refresh All Databases & Schemas"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoadingDatabases || isLoadingSchema ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#1b2333]/60 bg-[#090d16] shrink-0">
        <div className="flex items-center bg-[#111622] border border-[#1b2333] rounded-md px-2 py-1 text-xs">
          <Search className="w-3 h-3 text-slate-500 mr-1.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search databases, tables & cols..."
            className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 focus:outline-none text-[11px] font-mono"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Database Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoadingDatabases && displayDatabases.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Discovering databases...</span>
          </div>
        ) : displayDatabases.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No databases found on this connection
          </div>
        ) : (
          displayDatabases.map((dbName) => {
            const isDbActive = activeDatabase === dbName;
            const isDbExpanded = !!expandedDatabases[dbName] || !!q;
            const allTables = databaseTables[dbName] || [];

            // Filter tables if search is active
            const filteredTables = q
              ? allTables.filter(
                  (t) =>
                    dbName.toLowerCase().includes(q) ||
                    t.name.toLowerCase().includes(q) ||
                    t.columns.some((c) => c.name.toLowerCase().includes(q) || c.dataType.toLowerCase().includes(q))
                )
              : allTables;

            // If searching and this db has no match and doesn't match dbName, skip
            if (q && filteredTables.length === 0 && !dbName.toLowerCase().includes(q)) {
              return null;
            }

            return (
              <div
                key={dbName}
                className={`rounded-lg border transition-colors overflow-hidden ${
                  isDbActive
                    ? 'border-indigo-500/40 bg-[#0d121f]/50'
                    : 'border-[#1b2333]/80 bg-[#0c101a]/30'
                }`}
              >
                {/* Database Accordion Header */}
                <div
                  onClick={() => toggleDatabaseExpanded(dbName)}
                  className="flex items-center justify-between px-2.5 py-2 cursor-pointer bg-[#0e1424] hover:bg-[#12192d] transition-colors group"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isDbExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}

                    <Database className={`w-3.5 h-3.5 shrink-0 ${isDbActive ? 'text-indigo-400' : 'text-slate-500'}`} />

                    <span
                      className={`text-xs font-mono font-semibold truncate ${
                        isDbActive ? 'text-indigo-200' : 'text-slate-300'
                      }`}
                      title={dbName}
                    >
                      {dbName}
                    </span>

                    {isDbActive && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase tracking-wider shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {allTables.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 px-1">
                        {allTables.length} {allTables.length === 1 ? 'tbl' : 'tbls'}
                      </span>
                    )}

                    {!isDbActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDatabase(dbName);
                          showToast(`Switched active database to "${dbName}"`);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 transition-all"
                        title="Set as target database for queries"
                      >
                        Use
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchDatabaseSchema(dbName);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#182238] text-slate-400 hover:text-slate-200 transition-all"
                      title={`Refresh tables in ${dbName}`}
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Database Tables Content */}
                {isDbExpanded && (
                  <div className="p-1.5 space-y-0.5 bg-[#080b11]">
                    {isLoadingSchema && (!databaseTables[dbName] || databaseTables[dbName].length === 0) ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                        <span className="text-[11px] font-mono">Loading tables...</span>
                      </div>
                    ) : filteredTables.length === 0 ? (
                      <div className="py-3 px-2 text-center text-[11px] font-mono text-slate-500">
                        {q ? 'No matching tables' : 'No tables or views found'}
                      </div>
                    ) : (
                      filteredTables.map((table) => {
                        const tableKey = `${dbName}.${table.schema}.${table.name}`;
                        const isTableExpanded = !!expandedTables[tableKey];
                        const isView = table.type === 'VIEW';

                        return (
                          <div
                            key={tableKey}
                            className="rounded border border-transparent hover:border-[#1b2333] bg-transparent hover:bg-[#0f1422]/60 transition-colors"
                          >
                            {/* Table Row */}
                            <div
                              onClick={() => toggleTableExpand(tableKey)}
                              className="flex items-center justify-between px-2 py-1.5 cursor-pointer group/tbl"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {isTableExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                                )}

                                {isView ? (
                                  <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <TableIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                )}

                                <span className="text-xs font-mono text-slate-200 truncate" title={table.name}>
                                  {table.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {/* DDL Action */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateDDL(dbName, table);
                                  }}
                                  className="opacity-0 group-hover/tbl:opacity-100 p-1 rounded hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 transition-all"
                                  title="Generate CREATE TABLE (DDL)"
                                >
                                  <Code2 className="w-3 h-3" />
                                </button>

                                {/* Count Query Action */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQueryCount(dbName, table);
                                  }}
                                  className="opacity-0 group-hover/tbl:opacity-100 p-1 rounded hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-all"
                                  title={`Count rows in ${table.name}`}
                                >
                                  <Hash className="w-3 h-3" />
                                </button>

                                {/* SELECT Action */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQueryTable(dbName, table);
                                  }}
                                  className="opacity-0 group-hover/tbl:opacity-100 p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                                  title={`View records from "${table.name}" on ${dbName}`}
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>

                                <span className="text-[10px] text-slate-500 font-mono">
                                  {table.columns.length}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Columns */}
                            {isTableExpanded && (
                              <div className="pl-6 pr-2 py-1 pb-1.5 space-y-0.5 border-t border-[#1b2333]/40 bg-[#06090f]">
                                {table.columns.map((col) => (
                                  <div
                                    key={col.name}
                                    onClick={() => handleCopyColName(col.name)}
                                    className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1.5 rounded hover:bg-[#131a2b] cursor-pointer text-slate-300 group/col transition-colors"
                                    title={`${col.name} (${col.dataType}) - Click to copy name`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                                      {col.isPrimaryKey ? (
                                        <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                      ) : (
                                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                                      )}
                                      <span className={`truncate ${col.isPrimaryKey ? 'font-semibold text-amber-300' : ''}`}>
                                        {col.name}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                                      <span className="text-indigo-400/80 uppercase">{col.dataType}</span>
                                      {!col.isNullable && <span className="text-rose-400/80 font-bold">*</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
