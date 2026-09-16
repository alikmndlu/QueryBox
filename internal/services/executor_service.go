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

func escapePQParam(val string) string {
	s := strings.ReplaceAll(val, `\`, `\\`)
	s = strings.ReplaceAll(s, `'`, `\'`)
	return "'" + s + "'"
}

// BuildDSN generates the driver-specific connection string
func (s *ExecutorService) BuildDSN(p *models.ConnectionProfile) (driverName string, dsn string, err error) {
	switch strings.ToLower(strings.TrimSpace(p.Driver)) {
	case "postgresql", "postgres":
		driverName = "postgres"
		host := strings.TrimSpace(p.Host)
		if host == "" {
			host = "localhost"
		}
		port := p.Port
		if port == 0 {
			port = 5432
		}
		user := strings.TrimSpace(p.Username)
		if user == "" {
			user = "postgres"
		}
		dbname := strings.TrimSpace(p.Database)
		if dbname == "" {
			dbname = "postgres"
		}
		ssl := strings.TrimSpace(p.SSLMode)
		if ssl == "" {
			ssl = "disable"
		}
		dsn = fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s connect_timeout=10",
			escapePQParam(host), port, escapePQParam(user), escapePQParam(p.Password), escapePQParam(dbname), ssl,
		)

	case "mysql":
		driverName = "mysql"
		port := p.Port
		if port == 0 {
			port = 3306
		}
		host := strings.TrimSpace(p.Host)
		if host == "" {
			host = "localhost"
		}
		// username:password@tcp(host:port)/dbname?parseTime=true
		dsn = fmt.Sprintf(
			"%s:%s@tcp(%s:%d)/%s?parseTime=true&timeout=10s",
			p.Username, p.Password, host, port, p.Database,
		)

	case "sqlite", "sqlite3":
		driverName = "sqlite"
		dsn = strings.TrimSpace(p.Database)
		if dsn == "" {
			dsn = "querybox_local.db"
		}

	case "sqlserver", "mssql":
		driverName = "sqlserver"
		port := p.Port
		if port == 0 {
			port = 1433
		}
		host := strings.TrimSpace(p.Host)
		if host == "" {
			host = "localhost"
		}
		query := url.Values{}
		query.Add("database", p.Database)
		if strings.EqualFold(p.SSLMode, "disable") {
			query.Add("encrypt", "disable")
		} else {
			query.Add("encrypt", "true")
			query.Add("TrustServerCertificate", "true")
		}
		u := &url.URL{
			Scheme:   "sqlserver",
			User:     url.UserPassword(p.Username, p.Password),
			Host:     fmt.Sprintf("%s:%d", host, port),
			RawQuery: query.Encode(),
		}
		dsn = u.String()

	default:
		return "", "", fmt.Errorf("unsupported database driver: %s", p.Driver)
	}

	return driverName, dsn, nil
}

func (s *ExecutorService) CloseConnection(profileID string) {
	s.poolMu.Lock()
	defer s.poolMu.Unlock()
	for k, db := range s.pools {
		if k == profileID || strings.HasPrefix(k, profileID+"::") {
			_ = db.Close()
			delete(s.pools, k)
		}
	}
}

func (s *ExecutorService) GetConnection(p *models.ConnectionProfile) (*sql.DB, error) {
	return s.GetConnectionForDB(p, p.Database)
}

func (s *ExecutorService) GetConnectionForDB(p *models.ConnectionProfile, dbName string) (*sql.DB, error) {
	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		dbName = strings.TrimSpace(p.Database)
	}
	cacheKey := fmt.Sprintf("%s::%s", p.ID, dbName)

	s.poolMu.RLock()
	db, ok := s.pools[cacheKey]
	s.poolMu.RUnlock()
	if ok {
		if err := db.Ping(); err == nil {
			return db, nil
		}
	}

	profCopy := *p
	if dbName != "" {
		profCopy.Database = dbName
	}

	driver, dsn, err := s.BuildDSN(&profCopy)
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
		// Fallback for PostgreSQL if localhost failed: try 127.0.0.1
		trimmedHost := strings.TrimSpace(p.Host)
		if (strings.EqualFold(p.Driver, "postgresql") || strings.EqualFold(p.Driver, "postgres")) &&
			(strings.EqualFold(trimmedHost, "localhost") || trimmedHost == "") {
			fbProf := profCopy
			fbProf.Host = "127.0.0.1"
			fbDriver, fbDSN, fbErr := s.BuildDSN(&fbProf)
			if fbErr == nil {
				fbDB, fbOpenErr := sql.Open(fbDriver, fbDSN)
				if fbOpenErr == nil {
					fbDB.SetMaxOpenConns(5)
					fbDB.SetMaxIdleConns(2)
					fbDB.SetConnMaxLifetime(5 * time.Minute)
					if fbPingErr := fbDB.Ping(); fbPingErr == nil {
						s.poolMu.Lock()
						s.pools[cacheKey] = fbDB
						s.poolMu.Unlock()
						return fbDB, nil
					}
					fbDB.Close()
				}
			}
		}
		return nil, err
	}

	s.poolMu.Lock()
	s.pools[cacheKey] = newDB
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

	err = db.PingContext(ctx)
	if err != nil {
		// If localhost failed for postgres, test if 127.0.0.1 works to give actionable advice
		trimmedHost := strings.TrimSpace(p.Host)
		if (strings.EqualFold(p.Driver, "postgresql") || strings.EqualFold(p.Driver, "postgres")) &&
			(strings.EqualFold(trimmedHost, "localhost") || trimmedHost == "") {
			fbProf := *p
			fbProf.Host = "127.0.0.1"
			_, fbDSN, fbErr := s.BuildDSN(&fbProf)
			if fbErr == nil {
				fbDB, fbOpenErr := sql.Open(driver, fbDSN)
				if fbOpenErr == nil {
					defer fbDB.Close()
					if fbPingErr := fbDB.PingContext(ctx); fbPingErr == nil {
						return fmt.Errorf("%w (Note: connection to 127.0.0.1 succeeded! Try changing Host from '%s' to '127.0.0.1')", err, p.Host)
					}
				}
			}
		}
		return err
	}

	return nil
}

// CheckSafeExecution strictly validates that the query is read-only.
// In QueryBox, modifying operations (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, etc.)
// are permanently blocked. Only data retrieval operations (SELECT, WITH ... SELECT, EXPLAIN, SHOW, DESCRIBE, PRAGMA) are allowed.
func (s *ExecutorService) CheckSafeExecution(sqlQuery string, readOnly bool) (bool, error) {
	// Strip single line comments (-- ... and # ...)
	commentRe1 := regexp.MustCompile(`(?m)(--|#).*$`)
	cleanSQL := commentRe1.ReplaceAllString(sqlQuery, " ")

	// Strip multi-line comments (/* ... */)
	commentRe2 := regexp.MustCompile(`/\*[\s\S]*?\*/`)
	cleanSQL = commentRe2.ReplaceAllString(cleanSQL, " ")

	cleanSQL = strings.TrimSpace(cleanSQL)
	if cleanSQL == "" {
		return false, fmt.Errorf("empty query")
	}

	// Strip string literals '...' so column checks or values like WHERE status = 'DELETED' do not trigger false positives
	stringLiteralRe := regexp.MustCompile(`'([^'\\]|\\.)*'`)
	sqlWithoutStrings := stringLiteralRe.ReplaceAllString(cleanSQL, "''")

	upper := strings.ToUpper(strings.TrimSpace(sqlWithoutStrings))

	// Must begin with permitted read-only statements
	isAllowedStart := regexp.MustCompile(`^(SELECT|WITH|EXPLAIN|SHOW|DESC|DESCRIBE|PRAGMA)\b`).MatchString(upper)
	if !isAllowedStart {
		return true, fmt.Errorf("query execution blocked: QueryBox is in strict Read-Only mode. Only data retrieval queries (SELECT, EXPLAIN, SHOW, DESCRIBE) are allowed")
	}

	// Reject any modifying/destructive keywords anywhere in the query (including within CTEs)
	modifyingPatterns := []*regexp.Regexp{
		regexp.MustCompile(`\bINSERT\s+INTO\b`),
		regexp.MustCompile(`\bUPDATE\s+`),
		regexp.MustCompile(`\bDELETE\b`),
		regexp.MustCompile(`\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER|SEQUENCE)\b`),
		regexp.MustCompile(`\bTRUNCATE\s+`),
		regexp.MustCompile(`\bALTER\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX)\b`),
		regexp.MustCompile(`\bCREATE\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER|SEQUENCE)\b`),
		regexp.MustCompile(`\bREPLACE\s+INTO\b`),
		regexp.MustCompile(`\bGRANT\b`),
		regexp.MustCompile(`\bREVOKE\b`),
		regexp.MustCompile(`\bMERGE\s+INTO\b`),
		regexp.MustCompile(`\bUPSERT\b`),
	}

	for _, re := range modifyingPatterns {
		if re.MatchString(upper) {
			return true, fmt.Errorf("query execution blocked: QueryBox is in strict Read-Only mode. Modifying operations are permanently disabled")
		}
	}

	return false, nil
}

// ExecuteQuery executes query against specified database and returns structured result set.
// Strictly enforces read-only data retrieval operations.
func (s *ExecutorService) ExecuteQuery(p *models.ConnectionProfile, dbName string, rawSQL string, limit int) (res *models.QueryResult, err error) {
	start := time.Now()

	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		dbName = strings.TrimSpace(p.Database)
	}

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
			profileLabel := p.Name
			if dbName != "" && !strings.Contains(profileLabel, dbName) {
				profileLabel = fmt.Sprintf("%s (%s)", p.Name, dbName)
			}
			_ = s.historyRepo.SaveExecutionLog(&models.ExecutionLog{
				ProfileID:       p.ID,
				ProfileName:     profileLabel,
				SQLContent:      rawSQL,
				ExecutionTimeMs: time.Since(start).Milliseconds(),
				RowCount:        rowCount,
				Status:          status,
				ErrorMessage:    errMsg,
				ExecutedAt:      start.Format(time.RFC3339),
			})
		}
	}()

	isDestructive, err := s.CheckSafeExecution(rawSQL, true)
	if err != nil {
		return nil, err
	}

	db, err := s.GetConnectionForDB(p, dbName)
	if err != nil {
		return nil, fmt.Errorf("connection to database %q failed: %w", dbName, err)
	}

	trimmed := strings.TrimSpace(rawSQL)
	isSelect := regexp.MustCompile(`(?i)^(SELECT|WITH|EXPLAIN|SHOW|DESC|DESCRIBE|PRAGMA)\b`).MatchString(trimmed)

	if !isSelect {
		return nil, fmt.Errorf("query execution blocked: only read-only queries (SELECT, EXPLAIN, SHOW, DESCRIBE) are permitted in QueryBox")
	}

	finalSQL := rawSQL
	if limit > 0 && !regexp.MustCompile(`(?i)\bLIMIT\s+\d+`).MatchString(finalSQL) && p.Driver != "sqlserver" {
		if strings.HasPrefix(strings.ToUpper(trimmed), "SELECT") || strings.HasPrefix(strings.ToUpper(trimmed), "WITH") {
			finalSQL = fmt.Sprintf("%s\nLIMIT %d", strings.TrimSuffix(strings.TrimSpace(finalSQL), ";"), limit)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	rows, err := db.QueryContext(ctx, finalSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	if cols == nil {
		cols = []string{}
	}

	results := make([][]interface{}, 0)
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
func (s *ExecutorService) ExplainQuery(p *models.ConnectionProfile, dbName string, rawSQL string) (string, error) {
	if _, err := s.CheckSafeExecution(rawSQL, true); err != nil {
		return "", err
	}

	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		dbName = strings.TrimSpace(p.Database)
	}

	db, err := s.GetConnectionForDB(p, dbName)
	if err != nil {
		return "", fmt.Errorf("connection to database %q failed: %w", dbName, err)
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

// ListDatabases discovers all accessible databases on the server
func (s *ExecutorService) ListDatabases(p *models.ConnectionProfile) ([]string, error) {
	driver := strings.ToLower(strings.TrimSpace(p.Driver))
	if driver == "sqlite" || driver == "sqlite3" {
		db := strings.TrimSpace(p.Database)
		if db == "" {
			db = "main"
		}
		return []string{db}, nil
	}

	connDB, err := s.GetConnection(p)
	if err != nil {
		return nil, fmt.Errorf("connection failed: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var dbs []string

	switch driver {
	case "postgresql", "postgres":
		// Query databases prioritizing those allowed for connection
		query := `
			SELECT datname 
			FROM pg_database 
			WHERE datistemplate = false 
			  AND datallowconn = true 
			ORDER BY datname;
		`
		rows, qErr := connDB.QueryContext(ctx, query)
		if qErr != nil {
			if p.Database != "" {
				return []string{p.Database}, nil
			}
			return []string{"postgres"}, nil
		}
		defer rows.Close()
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err == nil && strings.TrimSpace(name) != "" {
				dbs = append(dbs, strings.TrimSpace(name))
			}
		}

	case "mysql":
		query := `
			SELECT schema_name 
			FROM information_schema.schemata 
			WHERE schema_name NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys') 
			ORDER BY schema_name;
		`
		rows, qErr := connDB.QueryContext(ctx, query)
		if qErr != nil {
			if p.Database != "" {
				return []string{p.Database}, nil
			}
			return []string{}, nil
		}
		defer rows.Close()
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err == nil && strings.TrimSpace(name) != "" {
				dbs = append(dbs, strings.TrimSpace(name))
			}
		}

	case "sqlserver", "mssql":
		query := `
			SELECT name 
			FROM sys.databases 
			WHERE state_desc = 'ONLINE' 
			  AND name NOT IN ('master', 'tempdb', 'model', 'msdb') 
			ORDER BY name;
		`
		rows, qErr := connDB.QueryContext(ctx, query)
		if qErr != nil {
			if p.Database != "" {
				return []string{p.Database}, nil
			}
			return []string{}, nil
		}
		defer rows.Close()
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err == nil && strings.TrimSpace(name) != "" {
				dbs = append(dbs, strings.TrimSpace(name))
			}
		}

	default:
		if p.Database != "" {
			dbs = append(dbs, p.Database)
		}
	}

	if len(dbs) == 0 && p.Database != "" {
		dbs = append(dbs, p.Database)
	}

	return dbs, nil
}

// IntrospectDatabase retrieves tables, views, and column definitions from a specific database
func (s *ExecutorService) IntrospectDatabase(p *models.ConnectionProfile, dbName string) ([]models.TableInfo, error) {
	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		dbName = strings.TrimSpace(p.Database)
	}

	db, err := s.GetConnectionForDB(p, dbName)
	if err != nil {
		return nil, fmt.Errorf("connection to database %q failed: %w", dbName, err)
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
			t.Database = dbName
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
		rows, err := db.QueryContext(ctx, "SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name", dbName)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		tableMap := make(map[string]int)
		for rows.Next() {
			var t models.TableInfo
			t.Database = dbName
			if err := rows.Scan(&t.Schema, &t.Name, &t.Type); err == nil {
				tableMap[t.Name] = len(tables)
				t.Columns = []models.ColumnInfo{}
				tables = append(tables, t)
			}
		}

		colRows, err := db.QueryContext(ctx, "SELECT table_name, column_name, data_type, is_nullable, column_key FROM information_schema.columns WHERE table_schema = ? ORDER BY table_name, ordinal_position", dbName)
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
			t.Database = dbName
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
			t.Database = dbName
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

// IntrospectSchema retrieves tables, views, and column definitions from the active database
func (s *ExecutorService) IntrospectSchema(p *models.ConnectionProfile) ([]models.TableInfo, error) {
	return s.IntrospectDatabase(p, p.Database)
}

// BenchmarkQuery executes the query multiple times to measure latency metrics
func (s *ExecutorService) BenchmarkQuery(p *models.ConnectionProfile, dbName string, rawSQL string, iterations int) (*models.BenchmarkResult, error) {
	if _, err := s.CheckSafeExecution(rawSQL, true); err != nil {
		return nil, err
	}

	if iterations <= 0 {
		iterations = 5
	}
	if iterations > 20 {
		iterations = 20
	}

	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		dbName = strings.TrimSpace(p.Database)
	}

	db, err := s.GetConnectionForDB(p, dbName)
	if err != nil {
		return nil, fmt.Errorf("connection to database %q failed: %w", dbName, err)
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
			cancel()
			return nil, fmt.Errorf("iteration %d failed: %w", i+1, qErr)
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


