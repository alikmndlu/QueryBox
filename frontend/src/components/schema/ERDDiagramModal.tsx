import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Network,
  Table as TableIcon,
  Key,
  Link as LinkIcon,
  Layers,
  Database,
} from 'lucide-react';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useUIStore } from '../../store/useUIStore';
import { TableInfo, ColumnInfo } from '../../types';
import { Button } from '../ui/button';

interface TablePos {
  x: number;
  y: number;
}

interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export const ERDDiagramModal: React.FC = () => {
  const { erdModalOpen, erdDatabaseName, setErdModalOpen } = useUIStore();
  const { activeProfile, activeDatabase, databaseTables, fetchDatabaseSchema } = useConnectionStore();

  const targetDb = erdDatabaseName || activeDatabase || activeProfile?.database || '';
  const rawTables: TableInfo[] = (databaseTables && databaseTables[targetDb]) || [];

  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [positions, setPositions] = useState<Record<string, TablePos>>({});
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<{ table: string; column: string } | null>(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load schema if not already fetched
  useEffect(() => {
    if (erdModalOpen && targetDb && (!databaseTables[targetDb] || databaseTables[targetDb].length === 0)) {
      fetchDatabaseSchema(targetDb);
    }
  }, [erdModalOpen, targetDb]);

  // Compute relationships between tables
  const relationships = useMemo(() => {
    const rels: Relationship[] = [];
    if (!rawTables || rawTables.length === 0) return rels;

    const tableNames = new Set(rawTables.map((t) => t.name.toLowerCase()));

    rawTables.forEach((table) => {
      table.columns.forEach((col) => {
        const colLower = col.name.toLowerCase();

        // 1. Check for explicit foreign keys or naming convention like user_id -> users
        if (colLower.endsWith('_id') && colLower.length > 3) {
          const targetBase = colLower.slice(0, -3); // e.g. "user"
          // Plural / singular matching (user -> users, category -> categories, product -> products)
          let matchedTarget = rawTables.find((t) => {
            const tName = t.name.toLowerCase();
            return (
              tName === targetBase ||
              tName === `${targetBase}s` ||
              tName === `${targetBase}es` ||
              tName === targetBase.replace(/y$/, 'ies')
            );
          });

          if (matchedTarget && matchedTarget.name !== table.name) {
            const targetPkCol = matchedTarget.columns.find((c) => c.isPrimaryKey) || matchedTarget.columns[0];
            if (targetPkCol) {
              rels.push({
                id: `${table.name}.${col.name}->${matchedTarget.name}.${targetPkCol.name}`,
                fromTable: table.name,
                fromColumn: col.name,
                toTable: matchedTarget.name,
                toColumn: targetPkCol.name,
              });
            }
          }
        }
      });
    });

    return rels;
  }, [rawTables]);

  // Calculate automatic grid layout positions for tables
  useEffect(() => {
    if (!rawTables || rawTables.length === 0) return;
    const initialPos: Record<string, TablePos> = {};
    const colsCount = Math.ceil(Math.sqrt(rawTables.length * 1.5));
    const cardWidth = 280;
    const cardHeight = 320;
    const gapX = 80;
    const gapY = 80;

    rawTables.forEach((table, index) => {
      const col = index % colsCount;
      const row = Math.floor(index / colsCount);
      initialPos[table.name] = {
        x: 60 + col * (cardWidth + gapX),
        y: 60 + row * (cardHeight + gapY),
      };
    });

    setPositions(initialPos);
  }, [rawTables]);

  if (!erdModalOpen) return null;

  const filteredTables = search.trim()
    ? rawTables.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      )
    : rawTables;

  // Mouse Dragging Handlers for Table Nodes
  const handleMouseDown = (e: React.MouseEvent, tableName: string) => {
    e.stopPropagation();
    setSelectedTable(tableName);
    setDraggedTable(tableName);
    const pos = positions[tableName] || { x: 0, y: 0 };
    dragOffsetRef.current = {
      x: e.clientX / zoom - pos.x,
      y: e.clientY / zoom - pos.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedTable) return;
    const newX = Math.max(10, e.clientX / zoom - dragOffsetRef.current.x);
    const newY = Math.max(10, e.clientY / zoom - dragOffsetRef.current.y);

    setPositions((prev) => ({
      ...prev,
      [draggedTable]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    setDraggedTable(null);
  };

  const isRelHighlighted = (rel: Relationship) => {
    if (!selectedTable && !selectedColumn) return true;
    if (selectedTable) {
      return rel.fromTable === selectedTable || rel.toTable === selectedTable;
    }
    if (selectedColumn) {
      return (
        (rel.fromTable === selectedColumn.table && rel.fromColumn === selectedColumn.column) ||
        (rel.toTable === selectedColumn.table && rel.toColumn === selectedColumn.column)
      );
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col select-none overflow-hidden animate-in fade-in-50 duration-150">
      {/* Top ERD Toolbar */}
      <div className="h-14 px-5 bg-[#0a0d16] border-b border-[#1c2538] flex items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Network className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">ERD Visualizer</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30">
                {targetDb}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{rawTables.length} Tables</span>
              <span>·</span>
              <span>{relationships.length} Relations</span>
              <span>·</span>
              <span className="text-indigo-400">{activeProfile?.name}</span>
            </div>
          </div>
        </div>

        {/* Center: Search & Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables & columns in diagram..."
              className="w-full h-8 pl-8 pr-3 bg-[#111622] border border-[#1c2538] rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 font-mono"
            />
          </div>
        </div>

        {/* Right: Controls & Close */}
        <div className="flex items-center gap-2">
          {/* Zoom Actions */}
          <div className="flex items-center bg-[#111622] border border-[#1c2538] rounded-lg p-0.5">
            <Button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-mono font-semibold px-2 text-indigo-300">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <span className="w-px h-4 bg-[#1c2538] mx-0.5" />
            <Button
              onClick={() => setZoom(1.0)}
              variant="ghost"
              size="iconSm"
              className="h-7 w-7 text-slate-400 hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            onClick={() => setErdModalOpen(false)}
            variant="ghost"
            size="iconSm"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-rose-500/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main ERD Canvas Area */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          setSelectedTable(null);
          setSelectedColumn(null);
        }}
        className="flex-1 relative overflow-auto bg-[#070912] cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="relative min-w-[2400px] min-h-[1800px] transition-transform duration-75 origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* SVG Relationship Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker
                id="erd-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
              </marker>
              <marker
                id="erd-arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
              </marker>
            </defs>

            {relationships.map((rel) => {
              const fromPos = positions[rel.fromTable];
              const toPos = positions[rel.toTable];
              if (!fromPos || !toPos) return null;

              // Compute start & end coordinates for connection bezier curve
              const cardWidth = 260;
              const cardHeaderHeight = 40;
              const x1 = fromPos.x + cardWidth / 2;
              const y1 = fromPos.y + cardHeaderHeight;
              const x2 = toPos.x + cardWidth / 2;
              const y2 = toPos.y + cardHeaderHeight;

              const dx = x2 - x1;
              const dy = y2 - y1;
              const cx1 = x1 + dx * 0.5;
              const cy1 = y1;
              const cx2 = x1 + dx * 0.5;
              const cy2 = y2;

              const highlighted = isRelHighlighted(rel);

              return (
                <g key={rel.id} className="transition-all duration-150">
                  <path
                    d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={highlighted ? (selectedTable || selectedColumn ? '#38bdf8' : '#6366f1') : '#1e293b'}
                    strokeWidth={highlighted ? (selectedTable || selectedColumn ? 2.5 : 1.8) : 1}
                    strokeDasharray={highlighted ? 'none' : '4 4'}
                    opacity={highlighted ? 0.9 : 0.25}
                    markerEnd={highlighted ? 'url(#erd-arrow-active)' : 'url(#erd-arrow)'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Table Cards Layer */}
          {filteredTables.map((table) => {
            const pos = positions[table.name] || { x: 100, y: 100 };
            const isSelected = selectedTable === table.name;
            const hasFocus = !selectedTable || isSelected;

            return (
              <div
                key={table.name}
                onMouseDown={(e) => handleMouseDown(e, table.name)}
                style={{
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                }}
                className={`absolute w-64 rounded-xl border shadow-2xl transition-shadow bg-[#0d1220]/95 backdrop-blur-md z-20 overflow-hidden group ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/20'
                    : 'border-[#1e293b] hover:border-indigo-500/60'
                } ${!hasFocus ? 'opacity-45' : 'opacity-100'}`}
              >
                {/* Table Header */}
                <div className="px-3 py-2 bg-[#12182a] border-b border-[#1e293b] flex items-center justify-between cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-white font-mono truncate" title={table.name}>
                      {table.name}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1c2538] text-slate-400 shrink-0">
                    {table.columns.length} cols
                  </span>
                </div>

                {/* Columns List */}
                <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto font-mono text-[11px]">
                  {table.columns.map((col) => {
                    const isPk = col.isPrimaryKey || col.name.toLowerCase() === 'id';
                    const isFk = col.name.toLowerCase().endsWith('_id') && !isPk;
                    const isColSelected =
                      selectedColumn?.table === table.name && selectedColumn?.column === col.name;

                    return (
                      <div
                        key={col.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColumn({ table: table.name, column: col.name });
                          setSelectedTable(table.name);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded transition-colors cursor-pointer ${
                          isColSelected
                            ? 'bg-indigo-600/30 text-white font-semibold'
                            : 'hover:bg-[#161e33] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                          {isPk ? (
                            <span title="Primary Key"><Key className="w-3 h-3 text-amber-400 shrink-0" /></span>
                          ) : isFk ? (
                            <span title="Foreign Key"><LinkIcon className="w-3 h-3 text-sky-400 shrink-0" /></span>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                          )}

                          <span className={`truncate ${isPk ? 'font-bold text-amber-200' : isFk ? 'text-sky-200' : ''}`}>
                            {col.name}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-500 uppercase shrink-0 font-medium">
                          {col.dataType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
