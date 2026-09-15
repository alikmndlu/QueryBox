package repositories

import (
	"database/sql"
	"strconv"
	"querybox/internal/models"
)

type SettingsRepository struct {
	DB *sql.DB
}

func NewSettingsRepository(db *sql.DB) *SettingsRepository {
	return &SettingsRepository{DB: db}
}

func (r *SettingsRepository) Get() (*models.Settings, error) {
	rows, err := r.DB.Query(`SELECT key, value FROM settings`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	kv := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err == nil {
			kv[k] = v
		}
	}

	fontSize, _ := strconv.Atoi(kv["fontSize"])
	if fontSize == 0 {
		fontSize = 14
	}
	tabSize, _ := strconv.Atoi(kv["tabSize"])
	if tabSize == 0 {
		tabSize = 2
	}

	theme := kv["theme"]
	if theme == "" {
		theme = "dark"
	}
	density := kv["density"]
	if density == "" {
		density = "comfortable"
	}
	wordWrap := kv["wordWrap"]
	if wordWrap == "" {
		wordWrap = "on"
	}
	lineNumbers := kv["lineNumbers"]
	if lineNumbers == "" {
		lineNumbers = "on"
	}
	defaultDialect := kv["defaultDialect"]
	if defaultDialect == "" {
		defaultDialect = "postgresql"
	}

	return &models.Settings{
		Theme:          theme,
		Density:        density,
		FontSize:       fontSize,
		TabSize:        tabSize,
		WordWrap:       wordWrap,
		FormatOnPaste:  kv["formatOnPaste"] == "true",
		FormatOnSave:   kv["formatOnSave"] == "true",
		ShowMinimap:    kv["showMinimap"] == "true",
		LineNumbers:    lineNumbers,
		DefaultDialect: defaultDialect,
	}, nil
}

func (r *SettingsRepository) Update(s *models.Settings) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	pairs := map[string]string{
		"theme":          s.Theme,
		"density":        s.Density,
		"fontSize":       strconv.Itoa(s.FontSize),
		"tabSize":        strconv.Itoa(s.TabSize),
		"wordWrap":       s.WordWrap,
		"formatOnPaste":  strconv.FormatBool(s.FormatOnPaste),
		"formatOnSave":   strconv.FormatBool(s.FormatOnSave),
		"showMinimap":    strconv.FormatBool(s.ShowMinimap),
		"lineNumbers":    s.LineNumbers,
		"defaultDialect": s.DefaultDialect,
	}

	for k, v := range pairs {
		_, err := tx.Exec(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, k, v)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
