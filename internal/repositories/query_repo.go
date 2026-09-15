package repositories

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"querybox/internal/models"
)

type QueryRepository struct {
	DB *sql.DB
}

func NewQueryRepository(db *sql.DB) *QueryRepository {
	return &QueryRepository{DB: db}
}

func (r *QueryRepository) Create(q *models.Query) error {
	if q.ID == "" {
		q.ID = uuid.New().String()
	}
	now := time.Now()
	q.CreatedAt = now
	q.UpdatedAt = now
	q.LastUsedAt = now

	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO queries (id, title, sql_content, description, collection_id, dialect, is_favorite, created_at, updated_at, last_used_at) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		q.ID, q.Title, q.SQLContent, q.Description, q.CollectionID, q.Dialect, q.IsFavorite, q.CreatedAt, q.UpdatedAt, q.LastUsedAt,
	)
	if err != nil {
		return err
	}

	// Insert initial version
	verID := uuid.New().String()
	_, err = tx.Exec(
		`INSERT INTO query_versions (id, query_id, sql_content, created_at) VALUES (?, ?, ?, ?)`,
		verID, q.ID, q.SQLContent, q.CreatedAt,
	)
	if err != nil {
		return err
	}

	// Attach tags
	for _, tagName := range q.Tags {
		if strings.TrimSpace(tagName) == "" {
			continue
		}
		tagID := uuid.New().String()
		_, _ = tx.Exec(`INSERT INTO tags (id, name) VALUES (?, ?) ON CONFLICT(name) DO NOTHING`, tagID, tagName)
		var actualID string
		_ = tx.QueryRow(`SELECT id FROM tags WHERE name = ?`, tagName).Scan(&actualID)
		if actualID != "" {
			_, _ = tx.Exec(`INSERT INTO query_tags (query_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, q.ID, actualID)
		}
	}

	return tx.Commit()
}

func (r *QueryRepository) Update(q *models.Query) error {
	now := time.Now()
	q.UpdatedAt = now

	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if SQL content changed to create new version snapshot
	var existingSQL string
	_ = tx.QueryRow(`SELECT sql_content FROM queries WHERE id = ?`, q.ID).Scan(&existingSQL)

	if existingSQL != "" && existingSQL != q.SQLContent {
		verID := uuid.New().String()
		_, _ = tx.Exec(
			`INSERT INTO query_versions (id, query_id, sql_content, created_at) VALUES (?, ?, ?, ?)`,
			verID, q.ID, q.SQLContent, now,
		)
	}

	_, err = tx.Exec(
		`UPDATE queries 
		 SET title = ?, sql_content = ?, description = ?, collection_id = ?, dialect = ?, is_favorite = ?, updated_at = ? 
		 WHERE id = ?`,
		q.Title, q.SQLContent, q.Description, q.CollectionID, q.Dialect, q.IsFavorite, q.UpdatedAt, q.ID,
	)
	if err != nil {
		return err
	}

	// Re-assign tags
	_, _ = tx.Exec(`DELETE FROM query_tags WHERE query_id = ?`, q.ID)
	for _, tagName := range q.Tags {
		if strings.TrimSpace(tagName) == "" {
			continue
		}
		tagID := uuid.New().String()
		_, _ = tx.Exec(`INSERT INTO tags (id, name) VALUES (?, ?) ON CONFLICT(name) DO NOTHING`, tagID, tagName)
		var actualID string
		_ = tx.QueryRow(`SELECT id FROM tags WHERE name = ?`, tagName).Scan(&actualID)
		if actualID != "" {
			_, _ = tx.Exec(`INSERT INTO query_tags (query_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, q.ID, actualID)
		}
	}

	return tx.Commit()
}

func (r *QueryRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM queries WHERE id = ?`, id)
	return err
}

func (r *QueryRepository) GetByID(id string) (*models.Query, error) {
	var q models.Query
	var isFav int
	err := r.DB.QueryRow(
		`SELECT id, title, sql_content, description, collection_id, dialect, is_favorite, created_at, updated_at, last_used_at 
		 FROM queries WHERE id = ?`,
		id,
	).Scan(&q.ID, &q.Title, &q.SQLContent, &q.Description, &q.CollectionID, &q.Dialect, &isFav, &q.CreatedAt, &q.UpdatedAt, &q.LastUsedAt)
	if err != nil {
		return nil, err
	}
	q.IsFavorite = (isFav == 1)

	// Fetch tags
	q.Tags = r.getTagsForQuery(q.ID)
	return &q, nil
}

func (r *QueryRepository) List(filter models.SearchFilter) ([]models.Query, error) {
	queryBuilder := `SELECT q.id, q.title, q.sql_content, q.description, q.collection_id, q.dialect, q.is_favorite, q.created_at, q.updated_at, q.last_used_at 
					 FROM queries q`
	var conditions []string
	var args []interface{}

	if filter.FavoriteOnly {
		conditions = append(conditions, "q.is_favorite = 1")
	}

	if filter.QuickFilter == "favorites" {
		conditions = append(conditions, "q.is_favorite = 1")
	} else if filter.QuickFilter == "uncategorized" {
		conditions = append(conditions, "q.collection_id IS NULL OR q.collection_id = ''")
	}

	if filter.CollectionID != nil && *filter.CollectionID != "" {
		conditions = append(conditions, "q.collection_id = ?")
		args = append(args, *filter.CollectionID)
	}

	if filter.Dialect != "" {
		conditions = append(conditions, "q.dialect = ?")
		args = append(args, filter.Dialect)
	}

	if filter.TagID != nil && *filter.TagID != "" {
		conditions = append(conditions, "q.id IN (SELECT query_id FROM query_tags WHERE tag_id = ?)")
		args = append(args, *filter.TagID)
	}

	if filter.SearchText != "" {
		term := "%" + strings.ToLower(filter.SearchText) + "%"
		conditions = append(conditions, `(
			LOWER(q.title) LIKE ? OR 
			LOWER(q.sql_content) LIKE ? OR 
			LOWER(q.description) LIKE ? OR 
			q.id IN (
				SELECT qt.query_id FROM query_tags qt 
				JOIN tags t ON t.id = qt.tag_id 
				WHERE LOWER(t.name) LIKE ?
			)
		)`)
		args = append(args, term, term, term, term)
	}

	if len(conditions) > 0 {
		queryBuilder += " WHERE " + strings.Join(conditions, " AND ")
	}

	if filter.QuickFilter == "recent" {
		queryBuilder += " ORDER BY q.last_used_at DESC, q.updated_at DESC"
	} else {
		queryBuilder += " ORDER BY q.updated_at DESC"
	}

	rows, err := r.DB.Query(queryBuilder, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.Query
	for rows.Next() {
		var q models.Query
		var isFav int
		err := rows.Scan(&q.ID, &q.Title, &q.SQLContent, &q.Description, &q.CollectionID, &q.Dialect, &isFav, &q.CreatedAt, &q.UpdatedAt, &q.LastUsedAt)
		if err != nil {
			return nil, err
		}
		q.IsFavorite = (isFav == 1)
		q.Tags = r.getTagsForQuery(q.ID)
		results = append(results, q)
	}
	return results, nil
}

func (r *QueryRepository) ToggleFavorite(id string) (bool, error) {
	var current int
	err := r.DB.QueryRow(`SELECT is_favorite FROM queries WHERE id = ?`, id).Scan(&current)
	if err != nil {
		return false, err
	}
	nextVal := 1
	if current == 1 {
		nextVal = 0
	}
	_, err = r.DB.Exec(`UPDATE queries SET is_favorite = ?, updated_at = ? WHERE id = ?`, nextVal, time.Now(), id)
	return nextVal == 1, err
}

func (r *QueryRepository) UpdateLastUsed(id string) error {
	_, err := r.DB.Exec(`UPDATE queries SET last_used_at = ? WHERE id = ?`, time.Now(), id)
	return err
}

func (r *QueryRepository) Duplicate(id string) (*models.Query, error) {
	original, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}
	dup := &models.Query{
		Title:        fmt.Sprintf("%s (Copy)", original.Title),
		SQLContent:   original.SQLContent,
		Description:  original.Description,
		CollectionID: original.CollectionID,
		Dialect:      original.Dialect,
		IsFavorite:   original.IsFavorite,
		Tags:         original.Tags,
	}
	if err := r.Create(dup); err != nil {
		return nil, err
	}
	return dup, nil
}

func (r *QueryRepository) getTagsForQuery(queryID string) []string {
	rows, err := r.DB.Query(
		`SELECT t.name FROM tags t JOIN query_tags qt ON qt.tag_id = t.id WHERE qt.query_id = ? ORDER BY t.name ASC`,
		queryID,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var tags []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			tags = append(tags, name)
		}
	}
	return tags
}
