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
  Plus,
  Code2,
  X,
} from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryStore } from '../../store/useQueryStore';
import { useUIStore } from '../../store/useUIStore';
import { TableInfo } from '../../types';

export const SchemaExplorer: React.FC = () => {
  const {
    activeProfile,
    schemaTables,
    isLoadingSchema,
    fetchSchema,
    setConnectionModalOpen,
    executeQuery,
  } = useConnectionStore();

  const { createNewQuery, updateDraft } = useQueryStore();
  const { showToast } = useUIStore();

  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleExpand = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredTables = useMemo(() => {
    if (!search.trim()) return schemaTables;
    const q = search.toLowerCase();
    return schemaTables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q) || c.dataType.toLowerCase().includes(q))
    );
  }, [schemaTables, search]);

  const handleQueryTable = async (table: TableInfo) => {
    const defaultSQL = `SELECT\n    *\nFROM ${table.name}\nLIMIT 100;`;
    await createNewQuery();
    updateDraft({
      title: `Select ${table.name}`,
      sqlContent: defaultSQL,
    });
    executeQuery(defaultSQL, 100);
  };

  const generateMockValue = (colName: string, dataType: string, rowIndex: number): string => {
    const name = colName.toLowerCase();
    const type = dataType.toLowerCase();

    if (name.includes('email')) return `'user${rowIndex + 1}@example.com'`;
    if (name.includes('phone')) return `'+1-555-01${rowIndex}'`;
    if (name.includes('name') && !name.includes('id')) return rowIndex === 0 ? `'John Doe'` : `'Jane Smith'`;
    if (name.includes('title')) return `'Sample Title ${rowIndex + 1}'`;
    if (name.includes('status')) return `'active'`;
    if (name.includes('role')) return `'member'`;
    if (name.includes('password') || name.includes('hash')) return `'hashed_secret_token'`;
    if (name.includes('url') || name.includes('link')) return `'https://example.com'`;
    if (name.includes('ip')) return `'192.168.1.${rowIndex + 10}'`;

    if (type.includes('bool')) {
      return rowIndex % 2 === 0 ? 'TRUE' : 'FALSE';
    }
    if (type.includes('int') || type.includes('serial')) {
      return String(100 + rowIndex);
    }
    if (type.includes('float') || type.includes('double') || type.includes('numeric') || type.includes('decimal') || type.includes('real')) {
      return `${(29.99 + rowIndex * 10).toFixed(2)}`;
    }
    if (type.includes('date') || type.includes('time')) {
      return 'NOW()';
    }
    if (type.includes('uuid')) {
      return `'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1${rowIndex}'`;
    }
    if (type.includes('json')) {
      return `'{"item": ${rowIndex + 1}, "status": "ok"}'`;
    }

    return `'sample_${colName}_${rowIndex + 1}'`;
  };

  const handleGenerateInsert = async (table: TableInfo) => {
    const insertCols = table.columns.filter(
      (c) => !(c.isPrimaryKey && (c.dataType.toLowerCase().includes('serial') || c.dataType.toLowerCase().includes('auto')))
    );
    const colsToUse = insertCols.length > 0 ? insertCols : table.columns;
    const colList = colsToUse.map((c) => c.name).join(', ');

    const row1 = colsToUse.map((c) => generateMockValue(c.name, c.dataType, 0)).join(', ');
    const row2 = colsToUse.map((c) => generateMockValue(c.name, c.dataType, 1)).join(', ');

    const sql = `INSERT INTO ${table.name} (${colList})\nVALUES\n    (${row1}),\n    (${row2});`;

    await createNewQuery();
    updateDraft({
      title: `Insert ${table.name}`,
      sqlContent: sql,
    });
    showToast(`Generated mock INSERT template for "${table.name}"`);
  };

  const handleGenerateDDL = async (table: TableInfo) => {
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
      return `    ${c.name.padEnd(20)} ${typeStr}${nullStr}${extra}`;
    });

    const ddl = `CREATE TABLE ${table.name} (\n${colDefs.join(',\n')}\n);`;

    await createNewQuery();
    updateDraft({
      title: `DDL: ${table.name}`,
      sqlContent: ddl,
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
            <div className="text-[10px] text-slate-500 font-mono truncate uppercase">
              {activeProfile.driver} · {activeProfile.database}
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchSchema()}
          disabled={isLoadingSchema}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#161f32] transition-colors"
          title="Refresh Database Schema"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoadingSchema ? 'animate-spin text-indigo-400' : ''}`} />
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
            placeholder="Search tables & columns..."
            className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 focus:outline-none text-[11px] font-mono"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tables & Views List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingSchema ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Introspecting tables...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {search ? 'No tables match your search' : 'No tables or views found in database'}
          </div>
        ) : (
          filteredTables.map((table) => {
            const isExpanded = !!expandedTables[table.name];
            const isView = table.type === 'VIEW';

            return (
              <div
                key={`${table.schema}.${table.name}`}
                className="rounded-md border border-transparent hover:border-[#1b2333] bg-transparent hover:bg-[#0f1422]/60 transition-colors"
              >
                {/* Table Header Row */}
                <div
                  onClick={() => toggleExpand(table.name)}
                  className="flex items-center justify-between px-2 py-1.5 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}

                    {isView ? (
                      <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <TableIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}

                    <span className="text-xs font-mono font-medium text-slate-200 truncate" title={table.name}>
                      {table.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateDDL(table);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 transition-all"
                      title="Generate CREATE TABLE (DDL)"
                    >
                      <Code2 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateInsert(table);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-all"
                      title="Generate Mock INSERT Statement"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQueryTable(table);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-all"
                      title={`Run "SELECT * FROM ${table.name} LIMIT 100"`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {table.columns.length}
                    </span>
                  </div>
                </div>

                {/* Expanded Columns List */}
                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 pb-2 space-y-1 border-t border-[#1b2333]/40 bg-[#080b12]">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        onClick={() => handleCopyColName(col.name)}
                        className="flex items-center justify-between text-[11px] font-mono py-0.5 px-1.5 rounded hover:bg-[#151c2d] cursor-pointer text-slate-300 group/col transition-colors"
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
    </div>
  );
};
