package services

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"querybox/internal/models"
	"querybox/internal/repositories"
)

type GitSyncService struct {
	queryRepo      *repositories.QueryRepository
	collectionRepo *repositories.CollectionRepository
}

func NewGitSyncService(q *repositories.QueryRepository, c *repositories.CollectionRepository) *GitSyncService {
	return &GitSyncService{
		queryRepo:      q,
		collectionRepo: c,
	}
}

// sanitizeFilename turns a title into a safe file name
func sanitizeFilename(title string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9_-]+`)
	safe := reg.ReplaceAllString(title, "-")
	safe = strings.Trim(safe, "-")
	if safe == "" {
		return "untitled"
	}
	return strings.ToLower(safe)
}

// ExportToDirectory writes all queries as .sql files into target folder
func (s *GitSyncService) ExportToDirectory(targetDir string) (int, error) {
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return 0, err
	}

	queries, err := s.queryRepo.List(models.SearchFilter{})
	if err != nil {
		return 0, err
	}

	collections, err := s.collectionRepo.List()
	if err != nil {
		return 0, err
	}

	colMap := make(map[string]string)
	for _, c := range collections {
		colMap[c.ID] = c.Name
	}

	count := 0
	for _, q := range queries {
		colName := "Uncategorized"
		if q.CollectionID != nil && colMap[*q.CollectionID] != "" {
			colName = colMap[*q.CollectionID]
		}

		subFolder := filepath.Join(targetDir, sanitizeFilename(colName))
		_ = os.MkdirAll(subFolder, 0755)

		fileName := fmt.Sprintf("%s.sql", sanitizeFilename(q.Title))
		filePath := filepath.Join(subFolder, fileName)

		var sb strings.Builder
		sb.WriteString("/*\n")
		sb.WriteString(fmt.Sprintf("title: %s\n", q.Title))
		sb.WriteString(fmt.Sprintf("dialect: %s\n", q.Dialect))
		sb.WriteString(fmt.Sprintf("collection: %s\n", colName))
		if len(q.Tags) > 0 {
			sb.WriteString(fmt.Sprintf("tags: %s\n", strings.Join(q.Tags, ", ")))
		}
		if q.Description != "" {
			sb.WriteString(fmt.Sprintf("description: %s\n", q.Description))
		}
		sb.WriteString(fmt.Sprintf("updated_at: %s\n", q.UpdatedAt.Format(time.RFC3339)))
		sb.WriteString("*/\n\n")
		sb.WriteString(q.SQLContent)

		if err := os.WriteFile(filePath, []byte(sb.String()), 0644); err == nil {
			count++
		}
	}

	return count, nil
}

// ImportFromDirectory reads all .sql files from folder and imports/updates them
func (s *GitSyncService) ImportFromDirectory(sourceDir string) (int, error) {
	var files []string
	err := filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".sql") {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return 0, err
	}

	collections, _ := s.collectionRepo.List()
	colMap := make(map[string]string)
	for _, c := range collections {
		colMap[strings.ToLower(c.Name)] = c.ID
	}

	importedCount := 0

	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			continue
		}

		content := string(data)
		var title, dialect, colName, desc string
		var tags []string
		sqlCode := content

		// Parse frontmatter
		if strings.HasPrefix(strings.TrimSpace(content), "/*") {
			endIdx := strings.Index(content, "*/")
			if endIdx != -1 {
				header := content[2:endIdx]
				sqlCode = strings.TrimSpace(content[endIdx+2:])

				scanner := bufio.NewScanner(strings.NewReader(header))
				for scanner.Scan() {
					line := strings.TrimSpace(scanner.Text())
					parts := strings.SplitN(line, ":", 2)
					if len(parts) == 2 {
						key := strings.ToLower(strings.TrimSpace(parts[0]))
						val := strings.TrimSpace(parts[1])
						switch key {
						case "title":
							title = val
						case "dialect":
							dialect = val
						case "collection":
							colName = val
						case "description":
							desc = val
						case "tags":
							for _, t := range strings.Split(val, ",") {
								tTrim := strings.TrimSpace(t)
								if tTrim != "" {
									tags = append(tags, tTrim)
								}
							}
						}
					}
				}
			}
		}

		if title == "" {
			title = strings.TrimSuffix(filepath.Base(file), ".sql")
		}
		if dialect == "" {
			dialect = "postgresql"
		}

		// Ensure collection exists
		var colID *string
		if colName != "" && colName != "Uncategorized" {
			existingID, exists := colMap[strings.ToLower(colName)]
			if exists {
				colID = &existingID
			} else {
				newCol := &models.Collection{
					ID:        uuid.New().String(),
					Name:      colName,
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}
				if err := s.collectionRepo.Create(newCol); err == nil {
					colMap[strings.ToLower(colName)] = newCol.ID
					colID = &newCol.ID
				}
			}
		}

		query := &models.Query{
			Title:        title,
			SQLContent:   sqlCode,
			Description:  desc,
			CollectionID: colID,
			Dialect:      dialect,
			Tags:         tags,
		}

		if err := s.queryRepo.Create(query); err == nil {
			importedCount++
		}
	}

	return importedCount, nil
}
