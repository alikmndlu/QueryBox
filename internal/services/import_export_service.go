package services

import (
	"database/sql"
	"encoding/json"
	"os"
	"time"

	"querybox/internal/models"
	"querybox/internal/repositories"
)

type ImportExportService struct {
	db             *sql.DB
	queryRepo      *repositories.QueryRepository
	collectionRepo *repositories.CollectionRepository
	tagRepo        *repositories.TagRepository
	versionRepo    *repositories.VersionRepository
	settingsRepo   *repositories.SettingsRepository
}

func NewImportExportService(
	db *sql.DB,
	q *repositories.QueryRepository,
	c *repositories.CollectionRepository,
	t *repositories.TagRepository,
	v *repositories.VersionRepository,
	s *repositories.SettingsRepository,
) *ImportExportService {
	return &ImportExportService{
		db:             db,
		queryRepo:      q,
		collectionRepo: c,
		tagRepo:        t,
		versionRepo:    v,
		settingsRepo:   s,
	}
}

func (s *ImportExportService) ExportDataJSON() (string, error) {
	queries, err := s.queryRepo.List(models.SearchFilter{})
	if err != nil {
		return "", err
	}
	collections, err := s.collectionRepo.List()
	if err != nil {
		return "", err
	}
	tags, err := s.tagRepo.List()
	if err != nil {
		return "", err
	}
	settings, err := s.settingsRepo.Get()
	if err != nil {
		return "", err
	}

	backup := models.BackupData{
		ExportedAt:  time.Now().Format(time.RFC3339),
		AppVersion:  "1.0.0",
		Queries:     queries,
		Collections: collections,
		Tags:        tags,
		Settings:    *settings,
	}

	bytes, err := json.MarshalIndent(backup, "", "  ")
	if err != nil {
		return "", err
	}

	return string(bytes), nil
}

func (s *ImportExportService) ImportDataJSON(jsonData string) error {
	var backup models.BackupData
	if err := json.Unmarshal([]byte(jsonData), &backup); err != nil {
		return err
	}

	for _, col := range backup.Collections {
		_ = s.collectionRepo.Create(&col)
	}

	for _, q := range backup.Queries {
		_ = s.queryRepo.Create(&q)
	}

	if backup.Settings.Theme != "" {
		_ = s.settingsRepo.Update(&backup.Settings)
	}

	return nil
}

func (s *ImportExportService) ResetData() error {
	_, err := s.db.Exec(`
		DELETE FROM query_tags;
		DELETE FROM query_versions;
		DELETE FROM queries;
		DELETE FROM collections;
		DELETE FROM tags;
	`)
	return err
}

func SaveFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

func ReadFile(path string) (string, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
