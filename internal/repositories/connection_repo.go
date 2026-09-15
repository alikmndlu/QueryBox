package repositories

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"querybox/internal/models"
)

type ConnectionRepository struct {
	DB *sql.DB
}

func NewConnectionRepository(db *sql.DB) *ConnectionRepository {
	return &ConnectionRepository{DB: db}
}

func (r *ConnectionRepository) Create(c *models.ConnectionProfile) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	now := time.Now()
	c.CreatedAt = now
	c.UpdatedAt = now

	readOnlyInt := 0
	if c.ReadOnly {
		readOnlyInt = 1
	}

	_, err := r.DB.Exec(
		`INSERT INTO connection_profiles (id, name, driver, host, port, database, username, password, ssl_mode, read_only, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.Driver, c.Host, c.Port, c.Database, c.Username, c.Password, c.SSLMode, readOnlyInt, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *ConnectionRepository) Update(c *models.ConnectionProfile) error {
	c.UpdatedAt = time.Now()
	readOnlyInt := 0
	if c.ReadOnly {
		readOnlyInt = 1
	}

	_, err := r.DB.Exec(
		`UPDATE connection_profiles
		 SET name = ?, driver = ?, host = ?, port = ?, database = ?, username = ?, password = ?, ssl_mode = ?, read_only = ?, updated_at = ?
		 WHERE id = ?`,
		c.Name, c.Driver, c.Host, c.Port, c.Database, c.Username, c.Password, c.SSLMode, readOnlyInt, c.UpdatedAt, c.ID,
	)
	return err
}

func (r *ConnectionRepository) Delete(id string) error {
	_, err := r.DB.Exec(`DELETE FROM connection_profiles WHERE id = ?`, id)
	return err
}

func (r *ConnectionRepository) GetByID(id string) (*models.ConnectionProfile, error) {
	var c models.ConnectionProfile
	var readOnlyInt int

	err := r.DB.QueryRow(
		`SELECT id, name, driver, host, port, database, username, password, ssl_mode, read_only, created_at, updated_at
		 FROM connection_profiles WHERE id = ?`,
		id,
	).Scan(&c.ID, &c.Name, &c.Driver, &c.Host, &c.Port, &c.Database, &c.Username, &c.Password, &c.SSLMode, &readOnlyInt, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	c.ReadOnly = (readOnlyInt == 1)
	return &c, nil
}

func (r *ConnectionRepository) List() ([]models.ConnectionProfile, error) {
	rows, err := r.DB.Query(
		`SELECT id, name, driver, host, port, database, username, password, ssl_mode, read_only, created_at, updated_at
		 FROM connection_profiles ORDER BY name ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionProfile
	for rows.Next() {
		var c models.ConnectionProfile
		var readOnlyInt int
		if err := rows.Scan(&c.ID, &c.Name, &c.Driver, &c.Host, &c.Port, &c.Database, &c.Username, &c.Password, &c.SSLMode, &readOnlyInt, &c.CreatedAt, &c.UpdatedAt); err == nil {
			c.ReadOnly = (readOnlyInt == 1)
			list = append(list, c)
		}
	}
	return list, nil
}
