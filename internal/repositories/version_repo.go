package repositories

import (
	"database/sql"
	"querybox/internal/models"
)

type VersionRepository struct {
	DB *sql.DB
}

func NewVersionRepository(db *sql.DB) *VersionRepository {
	return &VersionRepository{DB: db}
}

func (r *VersionRepository) ListByQueryID(queryID string) ([]models.QueryVersion, error) {
	rows, err := r.DB.Query(
		`SELECT id, query_id, sql_content, created_at FROM query_versions WHERE query_id = ? ORDER BY created_at DESC`,
		queryID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var versions []models.QueryVersion
	for rows.Next() {
		var v models.QueryVersion
		if err := rows.Scan(&v.ID, &v.QueryID, &v.SQLContent, &v.CreatedAt); err == nil {
			versions = append(versions, v)
		}
	}
	return versions, nil
}
