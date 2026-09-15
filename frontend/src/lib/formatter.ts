import { format } from 'sql-formatter';
import { SQLDialect } from '../types';

export interface FormatOptions {
  tabWidth?: number;
  useTabs?: boolean;
  keywordCase?: 'upper' | 'lower' | 'preserve';
}

export function formatSQL(
  sql: string,
  dialect: SQLDialect = 'postgresql',
  options: FormatOptions = {}
): { formatted: string; error: string | null } {
  if (!sql || !sql.trim()) {
    return { formatted: sql, error: null };
  }

  let language: any = 'postgresql';
  switch (dialect.toLowerCase()) {
    case 'mysql':
      language = 'mysql';
      break;
    case 'sqlite':
      language = 'sqlite';
      break;
    case 'sqlserver':
    case 'transactsql':
    case 'tsql':
      language = 'transactsql';
      break;
    case 'postgresql':
    default:
      language = 'postgresql';
      break;
  }

  try {
    const formatted = format(sql, {
      language,
      tabWidth: options.tabWidth || 4,
      useTabs: options.useTabs || false,
      keywordCase: options.keywordCase || 'upper',
    });
    return { formatted, error: null };
  } catch (err: any) {
    // Fallback: try standard sql language if dialect specific formatter threw
    try {
      const fallback = format(sql, {
        language: 'sql',
        tabWidth: options.tabWidth || 4,
        useTabs: options.useTabs || false,
        keywordCase: options.keywordCase || 'upper',
      });
      return { formatted: fallback, error: null };
    } catch {
      // If formatting fails completely, safely return original SQL without corrupting code
      return {
        formatted: sql,
        error: 'Unable to format SQL. The query may contain unsupported syntax.',
      };
    }
  }
}
