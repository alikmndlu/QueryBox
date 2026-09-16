package repositories

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"querybox/internal/models"
)

type CollectionRepository struct {
	DB *sql.DB
}

func NewCollectionRepository(db *sql.DB) *CollectionRepository {
	return &CollectionRepository{DB: db}
}

func (r *CollectionRepository) Create(c *models.Collection) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	now := time.Now().Format(time.RFC3339)
	if c.CreatedAt == "" {
		c.CreatedAt = now
	}
	c.UpdatedAt = now

	_, err := r.DB.Exec(
		`INSERT INTO collections (id, name, parent_id, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.ParentID, c.SortOrder, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *CollectionRepository) Update(c *models.Collection) error {
	c.UpdatedAt = time.Now().Format(time.RFC3339)
	_, err := r.DB.Exec(
		`UPDATE collections SET name = ?, parent_id = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
		c.Name, c.ParentID, c.SortOrder, c.UpdatedAt, c.ID,
	)
	return err
}

func (r *CollectionRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM collections WHERE id = ?`, id)
	return err
}

func (r *CollectionRepository) List() ([]models.Collection, error) {
	query := `
		SELECT 
			c.id, c.name, c.parent_id, c.sort_order, c.created_at, c.updated_at,
			(SELECT COUNT(*) FROM queries q WHERE q.collection_id = c.id) as item_count
		FROM collections c
		ORDER BY c.sort_order ASC, c.name ASC
	`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cols []models.Collection
	for rows.Next() {
		var c models.Collection
		err := rows.Scan(&c.ID, &c.Name, &c.ParentID, &c.SortOrder, &c.CreatedAt, &c.UpdatedAt, &c.ItemCount)
		if err != nil {
			return nil, err
		}
		cols = append(cols, c)
	}
	return cols, nil
}
