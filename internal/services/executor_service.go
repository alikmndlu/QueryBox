package services

import (
	"context"
	"database/sql"
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/microsoft/go-mssqldb"

	"querybox/internal/models"
	"querybox/internal/repositories"
)

type ExecutorService struct {
	poolMu      sync.RWMutex
	pools       map[string]*sql.DB
	historyRepo *repositories.HistoryRepository
}

func NewExecutorService(historyRepo *repositories.HistoryRepository) *ExecutorService {
	return &ExecutorService{
		pools:       make(map[string]*sql.DB),
		historyRepo: historyRepo,
	}
}

// BuildDSN generates the driver-specific connection string
func (s *ExecutorService) BuildDSN(p *models.ConnectionProfile) (driverName string, dsn string, err error) {
	switch strings.ToLower(p.Driver) {
	case "postgresql", "postgres":
		driverName = "postgres"
		ssl := p.SSLMode
		if ssl == "" {
			ssl = "disable"
		}
		dsn = fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			p.Host, p.Port, p.Username, p.Password, p.Database, ssl,
		)

	case "mysql":
		driverName = "mysql"
		port := p.Port
		if port == 0 {
			port = 3306
		}
		// username:password@tcp(host:port)/dbname?parseTime=true
		dsn = fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?parseTime=true&timeout=10s",
			p.Username, p.Password, p.Host, port, p.Database,
		)

	case "sqlite", "sqlite3":
		driverName = "sqlite"
		dsn = p.Database // file path

	case "sqlserver", "mssql":
		driverName = "sqlserver"
		port := p.Port
		if port == 0 {
			port = 1433
		}
		query := url.Values{}
		query.Add("database", p.Database)
		if p.SSLMode == "disable" {
			query.Add("encrypt", "disable")
		} else {
			query.Add("encrypt", "true")
			query.Add("TrustServerCertificate", "true")
		}
		u := &url.URL{
			Scheme:   "sqlserver",
			User:     url.UserPassword(p.Username, p.Password),
			Host:     fmt.Sprintf("%s:%d", p.Host, port),
			RawQuery: query.Encode(),
		}
		dsn = u.String()

	default:
		return "", "", fmt.Errorf("unsupported database driver: %s", p.Driver)
	}

	return driverName, dsn, nil
}

func (s *ExecutorService) GetConnection(p *models.ConnectionProfile) (*sql.DB, error) {
	s.poolMu.RLock()
	db, ok := s.pools[p.ID]
	s.poolMu.RUnlock()
	if ok {
		if err := db.Ping(); err == nil {
			return db, nil
		}
	}

	driver, dsn, err := s.BuildDSN(p)
	if err != nil {
		return nil, err
	}

	newDB, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, err
	}
	newDB.SetMaxOpenConns(5)
	newDB.SetMaxIdleConns(2)
	newDB.SetConnMaxLifetime(5 * time.Minute)

	if err := newDB.Ping(); err != nil {
		newDB.Close()
		return nil, err
	}

	s.poolMu.Lock()
	s.pools[p.ID] = newDB
	s.poolMu.Unlock()

	return newDB, nil
}

func (s *ExecutorService) TestConnection(p *models.ConnectionProfile) error {
	driver, dsn, err := s.BuildDSN(p)
	if err != nil {
		return err
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 7*time.Second)
	defer cancel()

	return db.PingContext(ctx)
}

// CheckSafeExecution validates read-only constraints
func (s *ExecutorService) CheckSafeExecution(sqlQuery string, readOnly bool) (bool, error) {
	upper := strings.ToUpper(strings.TrimSpace(sqlQuery))

	// Dangerous keywords
	isDrop := regexp.MustCompile(`\b(DROP|TRUNCATE|ALTER)\b`).MatchString(upper)
	isDeleteWithoutWhere := regexp.MustCompile(`\bDELETE\s+FROM\b`).MatchString(upper) && !regexp.MustCompile(`\bWHERE\b`).MatchString(upper)
	isUpdateWithoutWhere := regexp.MustCompile(`\bUPDATE\s+`).MatchString(upper) && !regexp.MustCompile(`\bWHERE\b`).MatchString(upper)
	isDestructive := isDrop || isDeleteWithoutWhere || isUpdateWithoutWhere

	if readOnly && (isDestructive || strings.HasPrefix(upper, "INSERT") || strings.HasPrefix(upper, "UPDATE") || strings.HasPrefix(upper, "DELETE")) {
		return true, fmt.Errorf("read-only mode active: Modifying queries are blocked on this connection profile")
	}

	return isDestructive, nil
}

// ExecuteQuery executes query and returns structured result set
func (s *ExecutorService) ExecuteQuery(p *models.ConnectionProfile, rawSQL string, limit int) (res *models.QueryResult, err error) {
	start := time.Now()

	defer func() {
		if s.historyRepo != nil {
			status := "success"
			errMsg := ""
			var rowCount int64 = 0
			if err != nil {
				status = "error"
				errMsg = err.Error()
			} else if res != nil {
				rowCount = res.RowCount
			}
			_ = s.historyRepo.SaveExecutionLog(&models.ExecutionLog{
				ProfileID:       p.ID,
				ProfileName:     p.Name,
				SQLContent:      rawSQL,
				ExecutionTimeMs: time.Since(start).Milliseconds(),
				RowCount:        rowCount,
				Status:          status,
				ErrorMessage:    errMsg,
				ExecutedAt:      start,
			})
		}
	}()

	isDestructive, err := s.CheckSafeExecution(rawSQL, p.ReadOnly)
	if err != nil {
		return nil, err
	}

	db, err := s.GetConnection(p)
	if err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}

	// Apply soft limit if none exists and is SELECT query
	trimmed := strings.TrimSpace(rawSQL)
	isSelect := strings.HasPrefix(strings.ToUpper(trimmed), "SELECT") || strings.HasPrefix(strings.ToUpper(trimmed), "WITH")

	finalSQL := rawSQL
	if isSelect && limit > 0 && !regexp.MustCompile(`(?i)\bLIMIT\s+\d+`).MatchString(finalSQL) && p.Driver != "sqlserver" {
		finalSQL = fmt.Sprintf("%s\nLIMIT %d", strings.TrimSuffix(strings.TrimSpace(finalSQL), ";"), limit)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if !isSelect {
		// Non-select queries (INSERT, UPDATE, DELETE, DDL)
		res, execErr := db.ExecContext(ctx, finalSQL)
		duration := time.Since(start).Milliseconds()
		if execErr != nil {
			return nil, execErr
		}
		rowsAffected, _ := res.RowsAffected()
		return &models.QueryResult{
			Columns:         []string{"Result"},
			Rows:            [][]interface{}{{fmt.Sprintf("Query executed successfully. Rows affected: %d", rowsAffected)}},
			RowCount:        rowsAffected,
			ExecutionTimeMs: duration,
			IsDestructive:   isDestructive,
		}, nil
	}

	rows, err := db.QueryContext(ctx, finalSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results [][]interface{}
	colCount := len(cols)

	for rows.Next() {
		rawVals := make([]interface{}, colCount)
		valPtrs := make([]interface{}, colCount)
		for i := range rawVals {
			valPtrs[i] = &rawVals[i]
		}

		if err := rows.Scan(valPtrs...); err != nil {
			return nil, err
		}

		row := make([]interface{}, colCount)
		for i, val := range rawVals {
			switch v := val.(type) {
			case nil:
				row[i] = nil
			case []byte:
				row[i] = string(v)
			case time.Time:
				row[i] = v.Format(time.RFC3339)
			default:
				row[i] = v
			}
		}
		results = append(results, row)
	}

	duration := time.Since(start).Milliseconds()

	return &models.QueryResult{
		Columns:         cols,
		Rows:            results,
		RowCount:        int64(len(results)),
		ExecutionTimeMs: duration,
		IsDestructive:   isDestructive,
	}, nil
}

// ExplainQuery executes EXPLAIN on target database
func (s *ExecutorService) ExplainQuery(p *models.ConnectionProfile, rawSQL string) (string, error) {
	db, err := s.GetConnection(p)
	if err != nil {
		return "", err
	}

	var explainSQL string
	switch strings.ToLower(p.Driver) {
	case "postgresql", "postgres":
		explainSQL = "EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS) " + rawSQL
	case "mysql":
		explainSQL = "EXPLAIN ANALYZE " + rawSQL
	case "sqlite", "sqlite3":
		explainSQL = "EXPLAIN QUERY PLAN " + rawSQL
	case "sqlserver", "mssql":
		explainSQL = "SET SHOWPLAN_TEXT ON;\n" + rawSQL
	default:
		explainSQL = "EXPLAIN " + rawSQL
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	rows, err := db.QueryContext(ctx, explainSQL)
	if err != nil {
		// Fallback to simple EXPLAIN
		rows, err = db.QueryContext(ctx, "EXPLAIN "+rawSQL)
		if err != nil {
			return "", err
		}
	}
	defer rows.Close()

	var sb strings.Builder
	for rows.Next() {
		var line string
		if err := rows.Scan(&line); err == nil {
			sb.WriteString(line + "\n")
		}
	}

	return sb.String(), nil
}

// ListExecutionLogs returns recent execution entries
func (s *ExecutorService) ListExecutionLogs(limit int) ([]models.ExecutionLog, error) {
	if s.historyRepo == nil {
		return []models.ExecutionLog{}, nil
	}
	return s.historyRepo.ListExecutionLogs(limit)
}

// ClearExecutionHistory purges execution log records
func (s *ExecutorService) ClearExecutionHistory() error {
	if s.historyRepo == nil {
		return nil
	}
	return s.historyRepo.ClearExecutionHistory()
}

// IntrospectSchema retrieves tables, views, and column definitions from the active database
func (s *ExecutorService) IntrospectSchema(p *models.ConnectionProfile) ([]models.TableInfo, error) {
	db, err := s.GetConnection(p)
	if err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var tables []models.TableInfo
	driver := strings.ToLower(p.Driver)

	switch driver {
	case "sqlite", "sqlite3":
		rows, err := db.QueryContext(ctx, "SELECT 'main', name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name")
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var t models.TableInfo
			if err := rows.Scan(&t.Schema, &t.Name, &t.Type); err != nil {
				continue
			}
			t.Type = strings.ToUpper(t.Type)
			t.Columns = []models.ColumnInfo{}
			tables = append(tables, t)
		}

		for i := range tables {
			colRows, err := db.QueryContext(ctx, fmt.Sprintf("PRAGMA table_info('%s')", tables[i].Name))
			if err != nil {
				continue
			}
			for colRows.Next() {
				var cid int
				var name, colType string
				var notnull, pk int
				var dflt interface{}
				if err := colRows.Scan(&cid, &name, &colType, &notnull, &dflt, &pk); err == nil {
					tables[i].Columns = append(tables[i].Columns, models.ColumnInfo{
						Name:         name,
						DataType:     colType,
						IsNullable:   notnull == 0,
						IsPrimaryKey: pk > 0,
					})
				}
			}
			colRows.Close()
		}

	case "mysql":
		rows, err := db.QueryContext(ctx, "SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name")
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		tableMap := make(map[string]int)
		for rows.Next() {
			var t models.TableInfo
			if err := rows.Scan(&t.Schema, &t.Name, &t.Type); err == nil {
				tableMap[t.Name] = len(tables)
				t.Columns = []models.ColumnInfo{}
				tables = append(tables, t)
			}
		}

		colRows, err := db.QueryContext(ctx, "SELECT table_name, column_name, data_type, is_nullable, column_key FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY table_name, ordinal_position")
		if err == nil {
			defer colRows.Close()
			for colRows.Next() {
				var tName, cName, dType, isNull, cKey string
				if err := colRows.Scan(&tName, &cName, &dType, &isNull, &cKey); err == nil {
					if idx, ok := tableMap[tName]; ok {
						tables[idx].Columns = append(tables[idx].Columns, models.ColumnInfo{
							Name:         cName,
							DataType:     dType,
							IsNullable:   strings.ToUpper(isNull) == "YES",
							IsPrimaryKey: strings.ToUpper(cKey) == "PRI",
						})
					}
				}
			}
		}

	case "sqlserver", "mssql":
		rows, err := db.QueryContext(ctx, "SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME")
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		tableMap := make(map[string]int)
		for rows.Next() {
			var t models.TableInfo
			if err := rows.Scan(&t.Schema, &t.Name, &t.Type); err == nil {
				tableMap[t.Name] = len(tables)
				t.Columns = []models.ColumnInfo{}
				tables = append(tables, t)
			}
		}

		colRows, err := db.QueryContext(ctx, "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION")
		if err == nil {
			defer colRows.Close()
			for colRows.Next() {
				var tName, cName, dType, isNull string
				if err := colRows.Scan(&tName, &cName, &dType, &isNull); err == nil {
					if idx, ok := tableMap[tName]; ok {
						tables[idx].Columns = append(tables[idx].Columns, models.ColumnInfo{
							Name:       cName,
							DataType:   dType,
							IsNullable: strings.ToUpper(isNull) == "YES",
						})
					}
				}
			}
		}

	default: // postgresql
		rows, err := db.QueryContext(ctx, `
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
			ORDER BY table_name
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		tableMap := make(map[string]int)
		for rows.Next() {
			var t models.TableInfo
			if err := rows.Scan(&t.Schema, &t.Name, &t.Type); err == nil {
				tableMap[t.Name] = len(tables)
				t.Columns = []models.ColumnInfo{}
				tables = append(tables, t)
			}
		}

		colRows, err := db.QueryContext(ctx, `
			SELECT table_name, column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
			ORDER BY table_name, ordinal_position
		`)
		if err == nil {
			defer colRows.Close()
			for colRows.Next() {
				var tName, cName, dType, isNull string
				if err := colRows.Scan(&tName, &cName, &dType, &isNull); err == nil {
					if idx, ok := tableMap[tName]; ok {
						tables[idx].Columns = append(tables[idx].Columns, models.ColumnInfo{
							Name:       cName,
							DataType:   dType,
							IsNullable: strings.ToUpper(isNull) == "YES",
						})
					}
				}
			}
		}
	}

	if tables == nil {
		tables = []models.TableInfo{}
	}

	return tables, nil
}

// BenchmarkQuery executes the query multiple times to measure latency metrics
func (s *ExecutorService) BenchmarkQuery(p *models.ConnectionProfile, rawSQL string, iterations int) (*models.BenchmarkResult, error) {
	if iterations <= 0 {
		iterations = 5
	}
	if iterations > 20 {
		iterations = 20
	}

	db, err := s.GetConnection(p)
	if err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}

	var timings []int64
	var totalMs int64
	var minMs int64 = 999999999
	var maxMs int64 = -1
	var lastRowCount int64 = 0

	ctx := context.Background()

	for i := 0; i < iterations; i++ {
		start := time.Now()
		iterCtx, cancel := context.WithTimeout(ctx, 30*time.Second)

		rows, qErr := db.QueryContext(iterCtx, rawSQL)
		if qErr != nil {
			res, execErr := db.ExecContext(iterCtx, rawSQL)
			cancel()
			if execErr != nil {
				return nil, fmt.Errorf("iteration %d failed: %w", i+1, execErr)
			}
			d := time.Since(start).Milliseconds()
			timings = append(timings, d)
			totalMs += d
			if d < minMs {
				minMs = d
			}
			if d > maxMs {
				maxMs = d
			}
			if rCount, err := res.RowsAffected(); err == nil {
				lastRowCount = rCount
			}
			continue
		}

		var count int64 = 0
		for rows.Next() {
			count++
		}
		rows.Close()
		cancel()

		d := time.Since(start).Milliseconds()
		timings = append(timings, d)
		totalMs += d
		if d < minMs {
			minMs = d
		}
		if d > maxMs {
			maxMs = d
		}
		lastRowCount = count
	}

	avgMs := float64(totalMs) / float64(iterations)

	return &models.BenchmarkResult{
		Iterations: iterations,
		MinTimeMs:  minMs,
		MaxTimeMs:  maxMs,
		AvgTimeMs:  avgMs,
		TimingsMs:  timings,
		RowCount:   lastRowCount,
	}, nil
}


