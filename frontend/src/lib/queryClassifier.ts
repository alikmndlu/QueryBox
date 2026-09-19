export interface QueryMutationCheck {
  isMutating: boolean;
  operationType: string;
  hasWhereClause: boolean;
  warningTitle: string;
  warningMessage: string;
  severity: 'warning' | 'danger';
}

/**
 * Inspects a SQL string to identify destructive or mutating operations.
 * Pure SELECT, EXPLAIN, SHOW, DESCRIBE, and WITH ... SELECT queries return isMutating: false.
 * Operations like DELETE, UPDATE, DROP, TRUNCATE, ALTER, INSERT, CREATE return isMutating: true.
 */
export function checkQueryMutation(rawSQL: string): QueryMutationCheck {
  if (!rawSQL || !rawSQL.trim()) {
    return {
      isMutating: false,
      operationType: '',
      hasWhereClause: true,
      warningTitle: '',
      warningMessage: '',
      severity: 'warning',
    };
  }

  // Remove single-line comments (-- ...) and multi-line comments (/* ... */)
  const sqlWithoutComments = rawSQL
    .replace(/--.*$/gm, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .trim();

  if (!sqlWithoutComments) {
    return {
      isMutating: false,
      operationType: '',
      hasWhereClause: true,
      warningTitle: '',
      warningMessage: '',
      severity: 'warning',
    };
  }

  // Check for presence of WHERE clause
  const hasWhere = /\bWHERE\b/i.test(sqlWithoutComments);

  // 1. Critical Drop & Truncate
  if (/\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER)\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'DROP',
      hasWhereClause: true,
      warningTitle: 'Execute DROP Statement?',
      warningMessage: 'This query will permanently DROP database schema elements. This action cannot be reversed.',
      severity: 'danger',
    };
  }

  if (/\bTRUNCATE\s+(TABLE\s+)?/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'TRUNCATE',
      hasWhereClause: true,
      warningTitle: 'Execute TRUNCATE Statement?',
      warningMessage: 'This query will wipe all rows from the target table. Are you sure you want to proceed?',
      severity: 'danger',
    };
  }

  // 2. DELETE queries
  if (/\bDELETE\s+FROM\b/i.test(sqlWithoutComments) || /^\s*DELETE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'DELETE',
      hasWhereClause: hasWhere,
      warningTitle: hasWhere ? 'Confirm DELETE Execution' : 'DANGER: DELETE Without WHERE Clause!',
      warningMessage: hasWhere
        ? 'You are about to delete matching records from the database table.'
        : 'ATTENTION: This DELETE statement has NO WHERE clause and will remove ALL records in the target table!',
      severity: hasWhere ? 'warning' : 'danger',
    };
  }

  // 3. UPDATE queries
  if (/\bUPDATE\s+[\w."`]+(?:\s+AS\s+\w+)?\s+SET\b/i.test(sqlWithoutComments) || /^\s*UPDATE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'UPDATE',
      hasWhereClause: hasWhere,
      warningTitle: hasWhere ? 'Confirm UPDATE Execution' : 'DANGER: UPDATE Without WHERE Clause!',
      warningMessage: hasWhere
        ? 'You are about to modify database records with an UPDATE statement.'
        : 'ATTENTION: This UPDATE statement has NO WHERE clause and will update ALL records in the target table!',
      severity: hasWhere ? 'warning' : 'danger',
    };
  }

  // 4. INSERT queries
  if (/\bINSERT\s+INTO\b/i.test(sqlWithoutComments) || /^\s*INSERT\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'INSERT',
      hasWhereClause: true,
      warningTitle: 'Confirm INSERT Execution',
      warningMessage: 'You are about to insert new row(s) into the database table.',
      severity: 'warning',
    };
  }

  // 5. ALTER queries
  if (/\bALTER\s+TABLE\b/i.test(sqlWithoutComments) || /^\s*ALTER\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'ALTER',
      hasWhereClause: true,
      warningTitle: 'Confirm ALTER TABLE Execution',
      warningMessage: 'This statement will alter table schemas or constraints in your database.',
      severity: 'warning',
    };
  }

  // 6. CREATE queries
  if (/\bCREATE\s+(TABLE|DATABASE|INDEX|VIEW|SCHEMA)\b/i.test(sqlWithoutComments) || /^\s*CREATE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'CREATE',
      hasWhereClause: true,
      warningTitle: 'Confirm CREATE Execution',
      warningMessage: 'You are creating new database objects (table, index, or view).',
      severity: 'warning',
    };
  }

  // Safe read-only: SELECT, WITH ... SELECT, EXPLAIN, SHOW, DESCRIBE, PRAGMA
  return {
    isMutating: false,
    operationType: 'SELECT',
    hasWhereClause: true,
    warningTitle: '',
    warningMessage: '',
    severity: 'warning',
  };
}

