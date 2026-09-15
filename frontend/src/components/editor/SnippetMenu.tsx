import React, { useState } from 'react';
import { BookTemplate, ChevronDown, Check } from 'lucide-react';
import { useQueryStore } from '../../store/useQueryStore';
import { useUIStore } from '../../store/useUIStore';

interface Snippet {
  id: string;
  name: string;
  description: string;
  sql: string;
}

export const SnippetMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { draftSQL, updateDraft, draftDialect } = useQueryStore();
  const { showToast } = useUIStore();

  const snippets: Snippet[] = [
    {
      id: 'cte',
      name: 'Common Table Expression (WITH)',
      description: 'Modular temporary result sets for complex queries',
      sql: `WITH user_metrics AS (
    SELECT
        user_id,
        COUNT(*) AS total_orders,
        SUM(amount) AS lifetime_value
    FROM orders
    GROUP BY user_id
)
SELECT
    u.id,
    u.email,
    COALESCE(m.total_orders, 0) AS total_orders,
    COALESCE(m.lifetime_value, 0) AS lifetime_value
FROM users u
LEFT JOIN user_metrics m ON u.id = m.user_id
ORDER BY lifetime_value DESC;`,
    },
    {
      id: 'window-func',
      name: 'Window Function (ROW_NUMBER / RANK)',
      description: 'Partitioned rankings and running totals',
      sql: `SELECT
    id,
    department_id,
    employee_name,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank,
    AVG(salary) OVER (PARTITION BY department_id) AS dept_avg_salary
FROM employees;`,
    },
    {
      id: 'pagination',
      name: 'Paginated Query (LIMIT / OFFSET)',
      description: 'Clean pagination template with parameters',
      sql: `SELECT
    id,
    title,
    created_at
FROM items
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;`,
    },
    {
      id: 'upsert',
      name: 'UPSERT / ON CONFLICT',
      description: 'Insert or update on primary key conflict',
      sql: draftDialect === 'mysql'
        ? `INSERT INTO app_settings (key_name, value_text, updated_at)
VALUES ('theme', 'dark', NOW())
ON DUPLICATE KEY UPDATE
    value_text = VALUES(value_text),
    updated_at = NOW();`
        : `INSERT INTO app_settings (key_name, value_text, updated_at)
VALUES ('theme', 'dark', NOW())
ON CONFLICT (key_name)
DO UPDATE SET
    value_text = EXCLUDED.value_text,
    updated_at = NOW();`,
    },
    {
      id: 'index',
      name: 'CREATE INDEX (Concurrently)',
      description: 'Safe composite index creation',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status
ON users (email, status);`,
    },
    {
      id: 'date-trunc',
      name: 'Time Series Aggregation (DATE_TRUNC)',
      description: 'Group orders by day or month',
      sql: `SELECT
    DATE_TRUNC('day', created_at) AS order_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 ASC;`,
    },
  ];

  const handleInsert = (snippet: Snippet) => {
    const separator = draftSQL.trim() ? '\n\n' : '';
    const newSQL = draftSQL + separator + snippet.sql;
    updateDraft({ sqlContent: newSQL });
    setIsOpen(false);
    showToast(`Inserted template: ${snippet.name}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 h-7 px-2 text-xs text-slate-300 hover:text-white bg-[#111622] hover:bg-[#161d2d] rounded-md border border-[#1b2333] transition-colors"
        title="Insert SQL template snippet"
      >
        <BookTemplate className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden md:inline">Snippets</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-1 w-72 py-1 bg-[#111622] border border-[#1b2333] rounded-lg shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-[#1b2333] text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Insert SQL Template
          </div>
          <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
            {snippets.map((snip) => (
              <button
                key={snip.id}
                onClick={() => handleInsert(snip)}
                className="w-full px-2.5 py-1.5 rounded-md hover:bg-[#161f32] text-left transition-colors flex flex-col group"
              >
                <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {snip.name}
                </span>
                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {snip.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
