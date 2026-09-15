package repositories

import (
	"database/sql"
	"time"

	"querybox/internal/models"

	"github.com/google/uuid"
)

type HistoryRepository struct {
	db *sql.DB
}

func NewHistoryRepository(db *sql.DB) *HistoryRepository {
	return &HistoryRepository{db: db}
}

func (r *HistoryRepository) SaveExecutionLog(log *models.ExecutionLog) error {
	if log.ID == "" {
		log.ID = uuid.New().String()
	}
	if log.ExecutedAt.IsZero() {
		log.ExecutedAt = time.Now()
	}

	query := `
		INSERT INTO execution_history (
			id, profile_id, profile_name, sql_content,
			execution_time_ms, row_count, status, error_message, executed_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(
		query,
		log.ID,
		log.ProfileID,
		log.ProfileName,
		log.SQLContent,
		log.ExecutionTimeMs,
		log.RowCount,
		log.Status,
		log.ErrorMessage,
		log.ExecutedAt.Format(time.RFC3339),
	)
	return err
}

func (r *HistoryRepository) ListExecutionLogs(limit int) ([]models.ExecutionLog, error) {
	if limit <= 0 {
		limit = 100
	}

	query := `
		SELECT
			id, profile_id, profile_name, sql_content,
			execution_time_ms, row_count, status, error_message, executed_at
		FROM execution_history
		ORDER BY executed_at DESC
		LIMIT ?
	`
	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.ExecutionLog
	for rows.Next() {
		var log models.ExecutionLog
		var executedAtStr string
		err := rows.Scan(
			&log.ID,
			&log.ProfileID,
			&log.ProfileName,
			&log.SQLContent,
			&log.ExecutionTimeMs,
			&log.RowCount,
			&log.Status,
			&log.ErrorMessage,
			&executedAtStr,
		)
		if err != nil {
			return nil, err
		}
		log.ExecutedAt, _ = time.Parse(time.RFC3339, executedAtStr)
		logs = append(logs, log)
	}

	if logs == nil {
		logs = []models.ExecutionLog{}
	}

	return logs, rows.Err()
}

func (r *HistoryRepository) ClearExecutionHistory() error {
	_, err := r.db.Exec("DELETE FROM execution_history")
	return err
}
