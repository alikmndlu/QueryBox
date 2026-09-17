package models

// ConnectionProfile represents database connection configuration
type ConnectionProfile struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Driver    string `json:"driver"` // postgresql, mysql, sqlite, sqlserver
	Host      string `json:"host"`
	Port      int    `json:"port"`
	Database  string `json:"database"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	SSLMode   string `json:"sslMode"` // disable, require, verify-full
	ReadOnly  bool   `json:"readOnly"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// QueryResult represents the execution outcome of a SQL query
type QueryResult struct {
	Columns         []string        `json:"columns"`
	Rows            [][]interface{} `json:"rows"`
	RowCount        int64           `json:"rowCount"`
	ExecutionTimeMs int64           `json:"executionTimeMs"`
	Error           string          `json:"error,omitempty"`
	Plan            string          `json:"plan,omitempty"`
	IsDestructive   bool            `json:"isDestructive,omitempty"`
}

// ExplainResult represents parsed output of EXPLAIN query
type ExplainResult struct {
	RawPlan    string `json:"rawPlan"`
	TotalCost  string `json:"totalCost,omitempty"`
	ExecTimeMs string `json:"execTimeMs,omitempty"`
	PlanType   string `json:"planType,omitempty"`
}

// ExecutionLog records an execution entry in the audit history
type ExecutionLog struct {
	ID              string `json:"id"`
	ProfileID       string `json:"profileId"`
	ProfileName     string `json:"profileName"`
	SQLContent      string `json:"sqlContent"`
	ExecutionTimeMs int64  `json:"executionTimeMs"`
	RowCount        int64  `json:"rowCount"`
	Status          string `json:"status"` // "success" or "error"
	ErrorMessage    string `json:"errorMessage,omitempty"`
	ExecutedAt      string `json:"executedAt"`
}

// ColumnInfo represents column metadata for a table
type ColumnInfo struct {
	Name         string `json:"name"`
	DataType     string `json:"dataType"`
	IsNullable   bool   `json:"isNullable"`
	IsPrimaryKey bool   `json:"isPrimaryKey"`
}

// TableInfo represents table or view metadata
type TableInfo struct {
	Database string       `json:"database,omitempty"`
	Schema   string       `json:"schema"`
	Name     string       `json:"name"`
	Type     string       `json:"type"` // "TABLE" or "VIEW"
	RowCount int64        `json:"rowCount"`
	Columns  []ColumnInfo `json:"columns"`
}

// BenchmarkResult stores the statistical outcome of running a query multiple times
type BenchmarkResult struct {
	Iterations   int     `json:"iterations"`
	MinTimeMs    int64   `json:"minTimeMs"`
	MaxTimeMs    int64   `json:"maxTimeMs"`
	AvgTimeMs    float64 `json:"avgTimeMs"`
	TimingsMs    []int64 `json:"timingsMs"`
	RowCount     int64   `json:"rowCount"`
	ErrorMessage string  `json:"errorMessage,omitempty"`
}


