import { ExportCodeLanguage, SQLDialect } from '../types';

export interface GeneratedSnippet {
  language: ExportCodeLanguage;
  displayName: string;
  monacoLang: string;
  code: string;
}

export function generateCodeSnippet(
  sql: string,
  language: ExportCodeLanguage,
  dialect: SQLDialect = 'postgresql'
): GeneratedSnippet {
  const cleanSQL = sql.trim();
  const escapedQuotes = cleanSQL.replace(/"/g, '\\"');

  switch (language) {
    case 'go':
      return {
        language: 'go',
        displayName: 'Go (database/sql)',
        monacoLang: 'go',
        code: `package main

import (
	"context"
	"database/sql"
	"log"
	"time"
)

func runQuery(ctx context.Context, db *sql.DB) error {
	query := \`${cleanSQL}\`

	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		// Scan columns into variables
	}

	return rows.Err()
}`,
      };

    case 'typescript':
      return {
        language: 'typescript',
        displayName: 'TypeScript / Node.js (pg / mysql2)',
        monacoLang: 'typescript',
        code: `import { Pool } from 'pg';

async function executeQuery(pool: Pool) {
  const sql = \`
${cleanSQL}
  \`;

  try {
    const { rows } = await pool.query(sql);
    console.log(\`Fetched \${rows.length} rows\`);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}`,
      };

    case 'python':
      return {
        language: 'python',
        displayName: 'Python (psycopg2 / SQLAlchemy)',
        monacoLang: 'python',
        code: `import psycopg2
from psycopg2.extras import RealDictCursor

def execute_query(conn):
    query = """
${cleanSQL}
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query)
        results = cursor.fetchall()
        return results`,
      };

    case 'rust':
      return {
        language: 'rust',
        displayName: 'Rust (sqlx)',
        monacoLang: 'rust',
        code: `use sqlx::{PgPool, Row};

pub async fn execute_query(pool: &PgPool) -> Result<(), sqlx::Error> {
    let sql = r#"
${cleanSQL}
    "#;

    let rows = sqlx::query(sql)
        .fetch_all(pool)
        .await?;

    println!("Fetched {} records", rows.len());
    Ok(())
}`,
      };

    case 'php':
      return {
        language: 'php',
        displayName: 'PHP (PDO)',
        monacoLang: 'php',
        code: `<?php

function executeQuery(PDO $pdo): array {
    $sql = <<<'SQL'
${cleanSQL}
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}`,
      };

    default:
      return {
        language: 'go',
        displayName: 'SQL',
        monacoLang: 'sql',
        code: cleanSQL,
      };
  }
}
