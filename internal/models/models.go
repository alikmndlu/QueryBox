package models

import "time"

// Query represents a saved SQL query record
type Query struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	SQLContent   string    `json:"sqlContent"`
	Description  string    `json:"description"`
	CollectionID *string   `json:"collectionId"`
	Dialect      string    `json:"dialect"` // postgresql, mysql, sqlite, sqlserver
	IsFavorite   bool      `json:"isFavorite"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	LastUsedAt   time.Time `json:"lastUsedAt"`
	Tags         []string  `json:"tags"`
}

// Collection represents a folder/category for organizing queries
type Collection struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ParentID  *string   `json:"parentId"`
	SortOrder int       `json:"sortOrder"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	ItemCount int       `json:"itemCount"`
}

// Tag represents a searchable query tag
type Tag struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	UsageCount int    `json:"usageCount"`
}

// QueryVersion represents a historical snapshot of a query's SQL content
type QueryVersion struct {
	ID         string    `json:"id"`
	QueryID    string    `json:"queryId"`
	SQLContent string    `json:"sqlContent"`
	CreatedAt  time.Time `json:"createdAt"`
}

// Settings represents application settings
type Settings struct {
	Theme          string `json:"theme"`          // dark, light, system
	Density        string `json:"density"`        // comfortable, compact
	FontSize       int    `json:"fontSize"`       // default 14
	TabSize        int    `json:"tabSize"`        // default 2 or 4
	WordWrap       string `json:"wordWrap"`       // on, off
	FormatOnPaste  bool   `json:"formatOnPaste"`  // boolean
	FormatOnSave   bool   `json:"formatOnSave"`   // boolean
	ShowMinimap    bool   `json:"showMinimap"`    // boolean
	LineNumbers    string `json:"lineNumbers"`    // on, off
	DefaultDialect string `json:"defaultDialect"` // postgresql, mysql, sqlite, sqlserver
}

// BackupData represents full application backup for export/import
type BackupData struct {
	ExportedAt    time.Time      `json:"exportedAt"`
	AppVersion    string         `json:"appVersion"`
	Queries       []Query        `json:"queries"`
	Collections   []Collection   `json:"collections"`
	Tags          []Tag          `json:"tags"`
	QueryVersions []QueryVersion `json:"queryVersions"`
	Settings      Settings       `json:"settings"`
}

// SearchFilter defines criteria for querying stored SQL snippets
type SearchFilter struct {
	SearchText   string  `json:"searchText"`
	CollectionID *string `json:"collectionId"`
	TagID        *string `json:"tagId"`
	Dialect      string  `json:"dialect"`
	FavoriteOnly bool    `json:"favoriteOnly"`
	QuickFilter  string  `json:"quickFilter"` // all, favorites, recent, uncategorized
}
