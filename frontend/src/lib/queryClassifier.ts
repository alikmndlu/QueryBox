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
      warningTitle: 'Irreversible Schema Deletion (DROP)',
      warningMessage: 'This query contains a DROP statement that will permanently destroy tables or database schemas and all associated records.',
      severity: 'danger',
    };
  }

  if (/\bTRUNCATE\s+(TABLE\s+)?/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'TRUNCATE',
      hasWhereClause: true,
      warningTitle: 'Complete Table Wipe (TRUNCATE)',
      warningMessage: 'This query contains a TRUNCATE statement that will delete all rows from the target table immediately without transaction rollback.',
      severity: 'danger',
    };
  }

  // 2. DELETE queries
  if (/\bDELETE\s+FROM\b/i.test(sqlWithoutComments) || /^\s*DELETE\b/i.test(sqlWithoutComments)) {
    if (!hasWhere) {
      return {
        isMutating: true,
        operationType: 'DELETE (NO WHERE)',
        hasWhereClause: false,
        warningTitle: 'Unconditional Data Deletion (DELETE WITHOUT WHERE)',
        warningMessage: 'DANGER: This DELETE statement has NO WHERE clause! Every single row in the target table will be permanently deleted.',
        severity: 'danger',
      };
    }
    return {
      isMutating: true,
      operationType: 'DELETE',
      hasWhereClause: true,
      warningTitle: 'Data Deletion (DELETE)',
      warningMessage: 'This query will delete matching rows from the database. Are you sure you want to proceed?',
      severity: 'warning',
    };
  }

  // 3. UPDATE queries
  if (/\bUPDATE\s+[\w."`]+(?:\s+AS\s+\w+)?\s+SET\b/i.test(sqlWithoutComments) || /^\s*UPDATE\b/i.test(sqlWithoutComments)) {
    if (!hasWhere) {
      return {
        isMutating: true,
        operationType: 'UPDATE (NO WHERE)',
        hasWhereClause: false,
        warningTitle: 'Unconditional Data Modification (UPDATE WITHOUT WHERE)',
        warningMessage: 'WARNING: This UPDATE statement has NO WHERE clause! Every row in the target table will be updated.',
        severity: 'danger',
      };
    }
    return {
      isMutating: true,
      operationType: 'UPDATE',
      hasWhereClause: true,
      warningTitle: 'Data Modification (UPDATE)',
      warningMessage: 'This query will modify existing records in the database. Are you sure you want to proceed?',
      severity: 'warning',
    };
  }

  // 4. INSERT queries
  if (/\bINSERT\s+INTO\b/i.test(sqlWithoutComments) || /^\s*INSERT\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'INSERT',
      hasWhereClause: true,
      warningTitle: 'Data Insertion (INSERT)',
      warningMessage: 'This query will insert new records into the target database table.',
      severity: 'warning',
    };
  }

  // 5. ALTER queries
  if (/\bALTER\s+TABLE\b/i.test(sqlWithoutComments) || /^\s*ALTER\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'ALTER',
      hasWhereClause: true,
      warningTitle: 'Schema Alteration (ALTER)',
      warningMessage: 'This query will alter the table definition, columns, or constraints.',
      severity: 'warning',
    };
  }

  // 6. CREATE queries
  if (/\bCREATE\s+(TABLE|DATABASE|INDEX|VIEW|SCHEMA)\b/i.test(sqlWithoutComments) || /^\s*CREATE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'CREATE',
      hasWhereClause: true,
      warningTitle: 'Schema Creation (CREATE)',
      warningMessage: 'This query will create new tables, views, or database objects.',
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
