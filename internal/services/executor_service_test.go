package services

import (
	"strings"
	"testing"

	"querybox/internal/models"
)

func TestBuildDSN_Postgres(t *testing.T) {
	svc := NewExecutorService(nil)

	tests := []struct {
		name         string
		profile      models.ConnectionProfile
		wantDriver   string
		containsStrs []string
	}{
		{
			name: "default values when empty",
			profile: models.ConnectionProfile{
				Driver: "postgresql",
			},
			wantDriver: "postgres",
			containsStrs: []string{
				"host='localhost'",
				"port=5432",
				"user='postgres'",
				"password=''",
				"dbname='postgres'",
				"sslmode=disable",
				"connect_timeout=10",
			},
		},
		{
			name: "custom values with special characters in password",
			profile: models.ConnectionProfile{
				Driver:   "postgres",
				Host:     "127.0.0.1",
				Port:     5433,
				Username: "my_user",
				Password: `secret'pass\with spaces#123`,
				Database: "my_db",
				SSLMode:  "require",
			},
			wantDriver: "postgres",
			containsStrs: []string{
				"host='127.0.0.1'",
				"port=5433",
				"user='my_user'",
				`password='secret\'pass\\with spaces#123'`,
				"dbname='my_db'",
				"sslmode=require",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			driver, dsn, err := svc.BuildDSN(&tt.profile)
			if err != nil {
				t.Fatalf("BuildDSN failed: %v", err)
			}
			if driver != tt.wantDriver {
				t.Errorf("got driver %q, want %q", driver, tt.wantDriver)
			}
			for _, substr := range tt.containsStrs {
				if !strings.Contains(dsn, substr) {
					t.Errorf("DSN %q does not contain expected substring %q", dsn, substr)
				}
			}
		})
	}
}

func TestCloseConnection(t *testing.T) {
	svc := NewExecutorService(nil)
	// Should not panic on non-existent profile
	svc.CloseConnection("unknown-id")
}

func TestCheckSafeExecution(t *testing.T) {
	svc := NewExecutorService(nil)

	// Allowed read-only queries
	allowedQueries := []string{
		"SELECT * FROM users;",
		"SELECT id, name, is_deleted, created_at FROM users WHERE status = 'DELETED';",
		"  select count(*) from orders where amount > 100",
		"WITH active_users AS (SELECT * FROM users WHERE active = true) SELECT * FROM active_users;",
		"EXPLAIN ANALYZE SELECT * FROM orders;",
		"SHOW TABLES;",
		"DESCRIBE users;",
		"-- comment\nSELECT 1;",
		"/* multi\nline\ncomment */ SELECT * FROM products;",
		"PRAGMA table_info('users');",
		"USE bnpl_sales; SELECT * FROM purchases;",
		"USE `analytics`; SELECT count(*) FROM events;",
	}

	for _, q := range allowedQueries {
		_, err := svc.CheckSafeExecution(q, true)
		if err != nil {
			t.Errorf("expected allowed query %q to pass, but got error: %v", q, err)
		}
	}

	// Disallowed mutating queries
	blockedQueries := []string{
		"DELETE FROM users WHERE id = 1;",
		"DELETE FROM users;",
		"UPDATE users SET name = 'John' WHERE id = 1;",
		"UPDATE users SET name = 'John';",
		"INSERT INTO users (name) VALUES ('Jane');",
		"DROP TABLE users;",
		"DROP DATABASE test_db;",
		"TRUNCATE TABLE logs;",
		"ALTER TABLE users ADD COLUMN age INT;",
		"CREATE TABLE test (id INT);",
		"CREATE INDEX idx_name ON users(name);",
		"REPLACE INTO users (id, name) VALUES (1, 'Alice');",
		"GRANT ALL PRIVILEGES ON DATABASE test TO user1;",
		"REVOKE ALL ON users FROM public;",
		"WITH bad AS (DELETE FROM users RETURNING *) SELECT * FROM bad;",
		"-- delete attempt\nDELETE FROM users;",
		"/* stealth */ DROP TABLE accounts;",
	}

	for _, q := range blockedQueries {
		_, err := svc.CheckSafeExecution(q, true)
		if err == nil {
			t.Errorf("expected mutating query %q to be blocked, but it passed!", q)
		}
	}
}

func TestResolveQueryAndDB(t *testing.T) {
	svc := NewExecutorService(nil)
	prof := &models.ConnectionProfile{
		Driver:   "mysql",
		Database: "default_db",
	}

	// Test USE statement stripping
	targetDB, cleanSQL := svc.resolveQueryAndDB(prof, "default_db", "USE bnpl_sales; SELECT * FROM purchases;")
	if targetDB != "bnpl_sales" {
		t.Errorf("got targetDB %q, want %q", targetDB, "bnpl_sales")
	}
	if cleanSQL != "SELECT * FROM purchases;" {
		t.Errorf("got cleanSQL %q, want %q", cleanSQL, "SELECT * FROM purchases;")
	}
}


