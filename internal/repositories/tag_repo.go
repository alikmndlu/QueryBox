package repositories

import (
	"database/sql"
	"querybox/internal/models"
)

type TagRepository struct {
	DB *sql.DB
}

func NewTagRepository(db *sql.DB) *TagRepository {
	return &TagRepository{DB: db}
}

func (r *TagRepository) List() ([]models.Tag, error) {
	query := `
		SELECT t.id, t.name, COUNT(qt.query_id) as usage_count
		FROM tags t
		LEFT JOIN query_tags qt ON qt.tag_id = t.id
		GROUP BY t.id, t.name
		ORDER BY usage_count DESC, t.name ASC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.Tag
	for rows.Next() {
		var tag models.Tag
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.UsageCount); err == nil {
			tags = append(tags, tag)
		}
	}
	return tags, nil
}
