package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"querybox/internal/database"
	"querybox/internal/models"
	"querybox/internal/repositories"
	"querybox/internal/services"
)

// App struct
type App struct {
	ctx                 context.Context
	db                  *sql.DB
	queryRepo           *repositories.QueryRepository
	collectionRepo      *repositories.CollectionRepository
	tagRepo             *repositories.TagRepository
	versionRepo         *repositories.VersionRepository
	settingsRepo        *repositories.SettingsRepository
	connectionRepo      *repositories.ConnectionRepository
	historyRepo         *repositories.HistoryRepository
	executorService     *services.ExecutorService
	gitSyncService      *services.GitSyncService
	importExportService *services.ImportExportService
	initOnce            sync.Once
	initErr             error
}

// NewApp creates a new App application struct
func NewApp() *App {
	a := &App{}
	_ = a.ensureInit()
	return a
}

func (a *App) ensureInit() error {
	a.initOnce.Do(func() {
		userConfig, err := os.UserConfigDir()
		if err != nil {
			userConfig = "."
		}
		appDir := filepath.Join(userConfig, "QueryBox")
		_ = os.MkdirAll(appDir, 0755)
		dbPath := filepath.Join(appDir, "querybox.db")

		db, err := database.InitDB(dbPath)
		if err != nil {
			a.initErr = fmt.Errorf("failed to initialize SQLite database at %s: %w", dbPath, err)
			return
		}
		a.db = db
		a.queryRepo = repositories.NewQueryRepository(db)
		a.collectionRepo = repositories.NewCollectionRepository(db)
		a.tagRepo = repositories.NewTagRepository(db)
		a.versionRepo = repositories.NewVersionRepository(db)
		a.settingsRepo = repositories.NewSettingsRepository(db)
		a.connectionRepo = repositories.NewConnectionRepository(db)
		a.historyRepo = repositories.NewHistoryRepository(db)
		a.executorService = services.NewExecutorService(a.historyRepo)
		a.gitSyncService = services.NewGitSyncService(a.queryRepo, a.collectionRepo)
		a.importExportService = services.NewImportExportService(
			db,
			a.queryRepo,
			a.collectionRepo,
			a.tagRepo,
			a.versionRepo,
			a.settingsRepo,
		)
	})

	return a.initErr
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := a.ensureInit(); err != nil {
		runtime.LogErrorf(ctx, "App startup DB error: %v", err)
	}
	a.setupTray()
}

func (a *App) shutdown(ctx context.Context) {
	systray.Quit()
	if a.db != nil {
		_ = a.db.Close()
	}
}

// --- Query Bindings ---

func (a *App) CreateQuery(q models.Query) (*models.Query, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	if err := a.queryRepo.Create(&q); err != nil {
		return nil, err
	}
	return a.queryRepo.GetByID(q.ID)
}

func (a *App) UpdateQuery(q models.Query) (*models.Query, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	if err := a.queryRepo.Update(&q); err != nil {
		return nil, err
	}
	return a.queryRepo.GetByID(q.ID)
}

func (a *App) DeleteQuery(id string) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.queryRepo.Delete(id)
}

func (a *App) GetQuery(id string) (*models.Query, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.queryRepo.GetByID(id)
}

func (a *App) ListQueries(filter models.SearchFilter) ([]models.Query, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.queryRepo.List(filter)
}

func (a *App) ToggleFavorite(id string) (bool, error) {
	if err := a.ensureInit(); err != nil {
		return false, err
	}
	return a.queryRepo.ToggleFavorite(id)
}

func (a *App) DuplicateQuery(id string) (*models.Query, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.queryRepo.Duplicate(id)
}

func (a *App) TouchQuery(id string) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.queryRepo.UpdateLastUsed(id)
}

// --- Collection Bindings ---

func (a *App) CreateCollection(c models.Collection) (*models.Collection, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	if err := a.collectionRepo.Create(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

func (a *App) UpdateCollection(c models.Collection) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.collectionRepo.Update(&c)
}

func (a *App) DeleteCollection(id string) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.collectionRepo.Delete(id)
}

func (a *App) ListCollections() ([]models.Collection, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.collectionRepo.List()
}

// --- Tag Bindings ---

func (a *App) ListTags() ([]models.Tag, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.tagRepo.List()
}

// --- Query Version Bindings ---

func (a *App) GetQueryVersions(queryID string) ([]models.QueryVersion, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.versionRepo.ListByQueryID(queryID)
}

// --- Settings Bindings ---

func (a *App) GetSettings() (*models.Settings, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.settingsRepo.Get()
}

func (a *App) UpdateSettings(s models.Settings) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.settingsRepo.Update(&s)
}

// --- Connection Profile Bindings ---

func (a *App) ListConnectionProfiles() ([]models.ConnectionProfile, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.connectionRepo.List()
}

func (a *App) CreateConnectionProfile(c models.ConnectionProfile) (*models.ConnectionProfile, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	if err := a.connectionRepo.Create(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

func (a *App) UpdateConnectionProfile(c models.ConnectionProfile) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	if a.executorService != nil {
		a.executorService.CloseConnection(c.ID)
	}
	return a.connectionRepo.Update(&c)
}

func (a *App) DeleteConnectionProfile(id string) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	if a.executorService != nil {
		a.executorService.CloseConnection(id)
	}
	return a.connectionRepo.Delete(id)
}

func (a *App) TestConnection(c models.ConnectionProfile) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.executorService.TestConnection(&c)
}

// --- Live Query Execution & Explain Bindings ---

func (a *App) ExecuteQuery(profileID string, dbName string, rawSQL string, limit int) (*models.QueryResult, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return nil, fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.ExecuteQuery(profile, dbName, rawSQL, limit)
}

func (a *App) ExplainQuery(profileID string, dbName string, rawSQL string) (string, error) {
	if err := a.ensureInit(); err != nil {
		return "", err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return "", fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.ExplainQuery(profile, dbName, rawSQL)
}

func (a *App) ListExecutionHistory(limit int) ([]models.ExecutionLog, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	return a.executorService.ListExecutionLogs(limit)
}

func (a *App) ClearExecutionHistory() error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.executorService.ClearExecutionHistory()
}

func (a *App) ListDatabases(profileID string) ([]string, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return nil, fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.ListDatabases(profile)
}

func (a *App) IntrospectDatabase(profileID string, dbName string) ([]models.TableInfo, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return nil, fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.IntrospectDatabase(profile, dbName)
}

func (a *App) IntrospectSchema(profileID string) ([]models.TableInfo, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return nil, fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.IntrospectSchema(profile)
}

func (a *App) BenchmarkQuery(profileID string, dbName string, rawSQL string, iterations int) (*models.BenchmarkResult, error) {
	if err := a.ensureInit(); err != nil {
		return nil, err
	}
	profile, err := a.connectionRepo.GetByID(profileID)
	if err != nil {
		return nil, fmt.Errorf("connection profile not found: %w", err)
	}
	return a.executorService.BenchmarkQuery(profile, dbName, rawSQL, iterations)
}

// --- Git & Directory Synchronization Bindings ---

func (a *App) SyncQueriesToFolder(path string) (int, error) {
	if err := a.ensureInit(); err != nil {
		return 0, err
	}
	return a.gitSyncService.ExportToDirectory(path)
}

func (a *App) ImportQueriesFromFolder(path string) (int, error) {
	if err := a.ensureInit(); err != nil {
		return 0, err
	}
	return a.gitSyncService.ImportFromDirectory(path)
}

func (a *App) SelectFolderDialog() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("context not ready")
	}
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Folder for Query Synchronization",
	})
}

// --- Import / Export Bindings ---

func (a *App) ExportDataJSON() (string, error) {
	if err := a.ensureInit(); err != nil {
		return "", err
	}
	return a.importExportService.ExportDataJSON()
}

func (a *App) ImportDataJSON(jsonData string) error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.importExportService.ImportDataJSON(jsonData)
}

func (a *App) ResetData() error {
	if err := a.ensureInit(); err != nil {
		return err
	}
	return a.importExportService.ResetData()
}

func (a *App) SaveFileDialog(defaultName string) (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("context not ready")
	}
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Export QueryBox Data",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
		},
	})
}

func (a *App) OpenFileDialog() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("context not ready")
	}
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import QueryBox Data",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
		},
	})
	if err != nil || path == "" {
		return "", err
	}
	return services.ReadFile(path)
}
