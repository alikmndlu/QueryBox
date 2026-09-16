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
      warningTitle: 'Blocked: DROP Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. DROP statements cannot be executed.',
      severity: 'danger',
    };
  }

  if (/\bTRUNCATE\s+(TABLE\s+)?/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'TRUNCATE',
      hasWhereClause: true,
      warningTitle: 'Blocked: TRUNCATE Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. TRUNCATE statements cannot be executed.',
      severity: 'danger',
    };
  }

  // 2. DELETE queries
  if (/\bDELETE\s+FROM\b/i.test(sqlWithoutComments) || /^\s*DELETE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'DELETE',
      hasWhereClause: hasWhere,
      warningTitle: 'Blocked: DELETE Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. DELETE operations cannot be executed.',
      severity: 'danger',
    };
  }

  // 3. UPDATE queries
  if (/\bUPDATE\s+[\w."`]+(?:\s+AS\s+\w+)?\s+SET\b/i.test(sqlWithoutComments) || /^\s*UPDATE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'UPDATE',
      hasWhereClause: hasWhere,
      warningTitle: 'Blocked: UPDATE Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. UPDATE operations cannot be executed.',
      severity: 'danger',
    };
  }

  // 4. INSERT queries
  if (/\bINSERT\s+INTO\b/i.test(sqlWithoutComments) || /^\s*INSERT\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'INSERT',
      hasWhereClause: true,
      warningTitle: 'Blocked: INSERT Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. INSERT operations cannot be executed.',
      severity: 'danger',
    };
  }

  // 5. ALTER queries
  if (/\bALTER\s+TABLE\b/i.test(sqlWithoutComments) || /^\s*ALTER\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'ALTER',
      hasWhereClause: true,
      warningTitle: 'Blocked: ALTER Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. Schema alterations cannot be executed.',
      severity: 'danger',
    };
  }

  // 6. CREATE queries
  if (/\bCREATE\s+(TABLE|DATABASE|INDEX|VIEW|SCHEMA)\b/i.test(sqlWithoutComments) || /^\s*CREATE\b/i.test(sqlWithoutComments)) {
    return {
      isMutating: true,
      operationType: 'CREATE',
      hasWhereClause: true,
      warningTitle: 'Blocked: CREATE Statement',
      warningMessage: 'QueryBox is in strict Read-Only mode. Schema creation statements cannot be executed.',
      severity: 'danger',
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
