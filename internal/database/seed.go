package database

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

func seedInitialData(db *sql.DB) error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM queries").Scan(&count)
	if err != nil || count > 0 {
		return nil // Already seeded or error
	}

	now := time.Now()

	// Seed Default Collections
	colAuthID := uuid.New().String()
	colPayID := uuid.New().String()
	colReportID := uuid.New().String()
	colDebugID := uuid.New().String()

	collections := []struct {
		id   string
		name string
	}{
		{colAuthID, "Authentication & Users"},
		{colPayID, "Payments & Orders"},
		{colReportID, "Analytics & Reports"},
		{colDebugID, "Debugging & Utility"},
	}

	for i, c := range collections {
		_, err := db.Exec(
			"INSERT INTO collections (id, name, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			c.id, c.name, i, now, now,
		)
		if err != nil {
			return err
		}
	}

	// Seed Sample Queries
	seedQueries := []struct {
		title       string
		sql         string
		description string
		colID       string
		dialect     string
		isFav       bool
		tags        []string
	}{
		{
			title: "Get Active Users with Purchase Summary",
			sql: `SELECT
    u.id AS user_id,
    u.email,
    u.created_at,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
WHERE u.is_active = TRUE
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 100;`,
			description: "Returns top active users along with their total order count and lifetime value.",
			colID:       colAuthID,
			dialect:     "postgresql",
			isFav:       true,
			tags:        []string{"users", "purchases", "reporting"},
		},
		{
			title: "Daily Sales Revenue & Order Breakdown",
			sql: `SELECT
    DATE_TRUNC('day', created_at) AS sale_date,
    COUNT(DISTINCT user_id) AS active_buyers,
    COUNT(id) AS total_orders,
    SUM(amount) AS gross_revenue,
    AVG(amount) AS avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY sale_date DESC;`,
			description: "Daily aggregates of revenue, active buyers, and average order value for the last 30 days.",
			colID:       colReportID,
			dialect:     "postgresql",
			isFav:       true,
			tags:        []string{"analytics", "revenue", "daily"},
		},
		{
			title: "Find Duplicate Accounts by Email",
			sql: `SELECT
    email,
    COUNT(*) AS occurrences,
    ARRAY_AGG(id) AS user_ids
FROM users
GROUP BY email
HAVING COUNT(*) > 1;`,
			description: "Utility query to detect duplicate registered user email addresses.",
			colID:       colDebugID,
			dialect:     "postgresql",
			isFav:       false,
			tags:        []string{"debugging", "cleanup", "users"},
		},
		{
			title: "Failed Payments Audit Log",
			sql: `SELECT
    p.id AS payment_id,
    p.user_id,
    p.amount,
    p.error_code,
    p.error_message,
    p.created_at
FROM payment_transactions p
WHERE p.status = 'failed'
  AND p.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY p.created_at DESC;`,
			description: "Lists all failed payment transactions from the past week for compliance auditing.",
			colID:       colPayID,
			dialect:     "postgresql",
			isFav:       false,
			tags:        []string{"payments", "audit", "security"},
		},
		{
			title: "Customer Detailed Purchase Line Items",
			sql: `SELECT
    o.id AS order_id,
    o.created_at AS order_date,
    p.name AS product_name,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * oi.unit_price) AS line_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.user_id = $1
ORDER BY o.created_at DESC;`,
			description: "Fetches full line item details for a specific customer order history.",
			colID:       colPayID,
			dialect:     "postgresql",
			isFav:       true,
			tags:        []string{"customers", "purchases"},
		},
	}

	for _, q := range seedQueries {
		qID := uuid.New().String()
		_, err := db.Exec(
			`INSERT INTO queries (id, title, sql_content, description, collection_id, dialect, is_favorite, created_at, updated_at, last_used_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			qID, q.title, q.sql, q.description, q.colID, q.dialect, q.isFav, now, now, now,
		)
		if err != nil {
			return err
		}

		// Initial version snapshot
		verID := uuid.New().String()
		_, err = db.Exec(
			"INSERT INTO query_versions (id, query_id, sql_content, created_at) VALUES (?, ?, ?, ?)",
			verID, qID, q.sql, now,
		)
		if err != nil {
			return err
		}

		// Tags
		for _, tagStr := range q.tags {
			tagID := uuid.New().String()
			// Insert tag if not exists
			_, _ = db.Exec("INSERT INTO tags (id, name) VALUES (?, ?) ON CONFLICT(name) DO NOTHING", tagID, tagStr)
			// Get actual tag id
			var actualTagID string
			_ = db.QueryRow("SELECT id FROM tags WHERE name = ?", tagStr).Scan(&actualTagID)

			if actualTagID != "" {
				_, _ = db.Exec("INSERT INTO query_tags (query_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING", qID, actualTagID)
			}
		}
	}

	// Seed default settings
	defaultSettings := map[string]string{
		"theme":          "dark",
		"density":        "comfortable",
		"fontSize":       "14",
		"tabSize":        "2",
		"wordWrap":       "on",
		"formatOnPaste":  "true",
		"formatOnSave":   "true",
		"showMinimap":    "false",
		"lineNumbers":   "on",
		"defaultDialect": "postgresql",
	}

	for k, v := range defaultSettings {
		_, _ = db.Exec("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING", k, v)
	}

	return nil
}
