import { PendingGridMutations, CellEdit, InsertedRow } from '../types';

export interface DMLGeneratorOptions {
  tableName: string;
  columns: string[];
  rawRows: any[][];
  mutations: PendingGridMutations;
  dialect?: string;
}

export const generateDMLScript = ({
  tableName,
  columns,
  rawRows,
  mutations,
}: DMLGeneratorOptions): string => {
  const statements: string[] = [];
  const cleanTable = tableName || 'table_name';

  // Identify Primary Key column index (e.g. 'id', 'pk', or column ending in '_id' / marked PK)
  let pkColIdx = columns.findIndex(
    (c) => c.toLowerCase() === 'id' || c.toLowerCase().endsWith('_pk')
  );
  if (pkColIdx === -1) pkColIdx = 0; // Default to first column if no explicit PK

  const pkColName = columns[pkColIdx] || columns[0];

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `'${str.replace(/'/g, "''")}'`;
  };

  const getWhereClause = (row: any[]): string => {
    if (!row) return '1=1';
    const pkVal = row[pkColIdx];
    if (pkVal !== null && pkVal !== undefined && pkColName) {
      return `${pkColName} = ${formatValue(pkVal)}`;
    }

    // Fallback if PK is null: match all column values
    const matchPairs = columns
      .map((col, idx) => {
        const v = row[idx];
        return v === null || v === undefined ? `${col} IS NULL` : `${col} = ${formatValue(v)}`;
      })
      .slice(0, 4);

    return matchPairs.join(' AND ');
  };

  // 1. Generate UPDATE queries for edited cells
  const editsByRow: Record<number, CellEdit[]> = {};
  Object.values(mutations.edits).forEach((edit) => {
    if (!editsByRow[edit.rowIndex]) editsByRow[edit.rowIndex] = [];
    editsByRow[edit.rowIndex].push(edit);
  });

  Object.entries(editsByRow).forEach(([rIdxStr, cellEdits]) => {
    const rIdx = Number(rIdxStr);
    // Skip if row is marked for deletion
    if (mutations.deletedRowIndices.includes(rIdx)) return;

    const row = rawRows[rIdx];
    if (!row) return;

    const setClauses = cellEdits.map(
      (edit) => `${edit.colName} = ${formatValue(edit.newValue)}`
    );

    const whereClause = getWhereClause(row);
    statements.push(`UPDATE ${cleanTable} SET ${setClauses.join(', ')} WHERE ${whereClause};`);
  });

  // 2. Generate INSERT INTO queries for new rows
  mutations.insertedRows.forEach((insRow) => {
    const colsToInsert: string[] = [];
    const valsToInsert: string[] = [];

    columns.forEach((colName, cIdx) => {
      const val = insRow.values[cIdx];
      if (val !== undefined && val !== null) {
        colsToInsert.push(colName);
        valsToInsert.push(formatValue(val));
      }
    });

    if (colsToInsert.length > 0) {
      statements.push(
        `INSERT INTO ${cleanTable} (${colsToInsert.join(', ')}) VALUES (${valsToInsert.join(', ')});`
      );
    }
  });

  // 3. Generate DELETE FROM queries for deleted rows
  mutations.deletedRowIndices.forEach((rIdx) => {
    const row = rawRows[rIdx];
    if (!row) return;
    const whereClause = getWhereClause(row);
    statements.push(`DELETE FROM ${cleanTable} WHERE ${whereClause};`);
  });

  if (statements.length === 0) return '-- No changes pending';

  return `BEGIN;\n\n${statements.join('\n')}\n\nCOMMIT;`;
};
