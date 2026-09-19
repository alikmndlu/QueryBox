<div align="center">

# 📦 QueryBox

### High-Performance, Local-First SQL Query Manager & Developer Workbench

[![GitHub Release](https://img.shields.io/github/v/release/alikmndlu/QueryBox?color=6366f1&style=for-the-badge&logo=github)](https://github.com/alikmndlu/QueryBox/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://golang.org)
[![Wails v2](https://img.shields.io/badge/Wails-v2.15-df0000?style=for-the-badge)](https://wails.io)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

<p align="center">
  <a href="#-key-features"><b>Key Features</b></a> •
  <a href="#-live-kpi-dashboard"><b>Live Dashboard</b></a> •
  <a href="#-downloads--installation"><b>Downloads</b></a> •
  <a href="#-supported-databases"><b>Databases</b></a> •
  <a href="#-keyboard-shortcuts"><b>Shortcuts</b></a> •
  <a href="#-architecture"><b>Architecture</b></a>
</p>

<p align="center">
  A lightning-fast, privacy-centric desktop SQL query library, interactive schema explorer, and developer workbench.<br />
  Manage, benchmark, visualize, and execute queries across <b>PostgreSQL</b>, <b>MySQL</b>, <b>SQLite</b>, and <b>SQL Server</b> with zero cloud dependencies.
</p>

</div>

---

## ⚡ Why QueryBox?

Most modern database utilities are either memory-hungry web apps running inside heavy browser wrappers, or cloud-tethered products that compromise your proprietary schemas and query history.

**QueryBox** delivers a modern, privacy-first alternative:
- **Native Performance**: Built on [Wails v2](https://wails.io) and pure Go, launching instantly with a tiny ~30MB memory footprint.
- **100% Local-First Privacy**: All connection credentials, saved queries, version revisions, and execution logs reside exclusively on your machine in an encrypted local SQLite WAL database.
- **Safety First**: Intelligent query analyzer guards you against accidental production mishaps by intercepting destructive `DELETE`, `UPDATE`, `DROP`, `TRUNCATE`, and `ALTER` commands with mandatory confirmation dialogs and missing `WHERE` clause alerts.
- **Developer Ergonomics**: Full Monaco Editor with live schema autocompletion, interactive ERD diagrams, virtualized data grid with column pinning, zero-dependency SVG charts, multi-tab workspace, live KPI dashboard, AI Copilot integration, and in-app self-updating.

---

## 🌟 Comprehensive Feature Set

### 1. 📊 Live KPI Dashboard & Auto-Refresh Widgets
- **Real-Time Monitoring**: Create visual dashboard widget cards for your critical metrics, key performance indicators (KPIs), row counts, and analytics summaries.
- **Multiple Visualization Types**: Display data as **KPI Metric Cards**, **Bar Charts**, **Line Charts**, or **Donut Charts**.
- **Flexible Auto-Refresh Intervals**: Set auto-refresh loops dynamically (Manual / Off, 5s, 10s, 30s, 60s, 120s, 180s, 300s) to monitor live database health without manual execution.
- **Always Accessible Workspace View**: Switch between the **SQL Editor** and **Live Dashboard** at any time via top workspace toggles or sidebar navigation, even when no query tabs are open.

### 2. 🛡️ Intelligent Mutation Safety Guard
- **Accidental Execution Interceptor**: Automatically parses and analyzes queries before sending them to the database engine. Whenever a mutating query (`UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`) is detected, QueryBox halts and requires explicit user confirmation.
- **Missing `WHERE` Warning**: Detects dangerous `DELETE` and `UPDATE` queries executing without a `WHERE` clause to safeguard against unintended bulk table data loss.
- **Read-Only Session Mode**: Enforce a strict read-only execution mode with a single toggle in connection profiles.

### 3. 📌 Virtualized Data Grid, Cell Inspector & Column Pinning
- **High-Performance Virtual Scrolling**: Smooth 60fps data grid rendering capable of displaying tens of thousands of rows without browser slowdown.
- **Column Pinning**: Pin critical identifier columns (such as `id`, `uuid`, `username`, `email`) to the left of the grid so they stay fixed while scrolling horizontally through wide table structures.
- **Cell Detail Inspector**: Double-click or select any cell to view multi-line text, raw JSON trees, HTML previews, or binary hex contents in a dedicated popup inspector.
- **Dynamic Sorting & Quick Filter**: Instant client-side text filtering and multi-column header sorting.
- **Multi-Format Export**: Export query result sets to **CSV**, **JSON**, and **TSV** formats with custom delimiter options.

### 4. 📈 Zero-Dependency SVG Data Visualizer & Profiler
- **Instant Chart Visualizer**: Turn query output tables into presentation-ready **Bar Charts**, **Line Charts**, or **Donut Charts** with zero external chart library overhead.
- **Column Distribution Profiler**: Inspect data distribution across any result column without writing manual `COUNT(DISTINCT ...)` queries. Displays null percentages, unique value ratios, min/max/avg numerical metrics, and mini-histograms.

### 5. 🧠 Monaco SQL Editor with Live Schema Autocompletion
- **Contextual Database Autocompletion**: Live autocompletion feeds table names, view names, column attributes, and data types directly from your active database connection.
- **Multi-Dialect SQL Formatter**: Format complex SQL queries neatly with `Ctrl + Shift + F` formatted specifically for PostgreSQL, MySQL, SQLite, and Microsoft SQL Server (T-SQL).
- **IDE Capabilities**: Full-featured editing experience with syntax highlighting, bracket matching, multi-cursor editing, minimap, line folding, and snippet templates.

### 6. 📐 Interactive ERD (Entity Relationship Diagram) Visualizer
- **Visual Schema Explorer**: Generate interactive ERD diagrams directly from your active database connection.
- **Relationship Connectors**: Displays table entities, column data types, primary key badges, and foreign key relationship vector lines.
- **Interactive Controls**: Pan, zoom in/out, search tables, reset canvas layout, and execute one-click `SELECT` queries for any selected entity.

### 7. 🤖 SQL AI Copilot (Text-to-SQL & Query Assistant)
- **Natural Language to SQL**: Generate complex SQL queries from English prompts (e.g., *"Find the top 10 customers with highest total order values in the last 30 days"*).
- **Multi-Provider AI Engine**: Supports **OpenAI (GPT-4o)**, **Anthropic Claude**, **Ollama (local offline LLMs)**, and custom OpenAI-compatible REST endpoints.
- **Query Optimizer & Error Fixer**: One-click AI explanation for complex execution plans, index recommendations, and automatic syntax error resolution.

### 8. 🗂️ Nested Collection Tree & Query Organization
- **Expandable Folder Tree**: Organize queries inside custom collections with an expandable folder tree view in the left sidebar.
- **Quick Views**: Access single-click quick view filters: `Live Dashboard`, `All Queries`, `Favorites`, `Recently Used`, and `Uncategorized`.
- **Right-Click Context Menus**: Fast context actions to open, copy SQL, duplicate, toggle favorites, rename, or delete queries and collections.

### 9. 🔀 Multi-Tab Workspace & Side-by-Side Version Diff
- Work on multiple queries concurrently with persistent tab state.
- Every save automatically records an immutable version snapshot.
- Compare any two historical query revisions side-by-side using Monaco's integrated diff engine with one-click rollback.

### 10. 💻 "Copy as Code" Generator
- Export your tested SQL query as idiomatic, production-ready code snippets with parameter placeholders for:
  - **Go**: `database/sql` with context
  - **TypeScript / Node.js**: `pg` and `mysql2/promise`
  - **Python**: `psycopg2` and `pymysql`
  - **Rust**: `sqlx` async queries
  - **PHP**: `PDO` prepared statements

### 11. 🌿 Git / Directory Synchronization
- Bidirectional synchronization between your QueryBox collections and any local folder or Git repository.
- Queries are saved as human-readable `.sql` files with clean YAML frontmatter metadata (title, tags, dialect, connection target, timestamps).

### 12. ⏱️ Query Benchmarking & EXPLAIN Execution Plan Analyzer
- **Performance Benchmarking**: Run query latency benchmarks across multiple iterations, calculating minimum, maximum, median, and average execution times.
- **Execution Plan Visualizer**: Render `EXPLAIN` and `EXPLAIN ANALYZE` output nodes clearly to identify costly sequential scans and missing indexes.

### 13. ⌨️ Universal Escape Key Modal Closure Engine
- Consistent keyboard accessibility across all 15+ application modals (ERD visualizer, Diff viewer, Cell inspector, Profiler, Settings, Git sync, Connection manager, Shortcuts, Update modal, and alerts).

### 14. 🔄 In-App Self-Updater
- **Direct GitHub Releases Integration**: Automatically check for application updates or inspect manually from Settings.
- **Changelog Preview & Progress Bar**: View release notes, track download progress, and automatically update binary executables seamlessly.

---

## 🖥️ Downloads & Installation

### Pre-Compiled Packages

Download the latest release for your operating system from the **[GitHub Releases Page](https://github.com/alikmndlu/QueryBox/releases)**:

| Operating System | Package Format | Installation Instructions |
| :--- | :--- | :--- |
| **Windows** (x64) | [`.exe` (NSIS Installer)](https://github.com/alikmndlu/QueryBox/releases) | Recommended setup wizard with desktop shortcut & start menu integration |
| **Windows** (x64) | [`.zip` (Portable)](https://github.com/alikmndlu/QueryBox/releases) | Standalone portable executable (no installer required) |
| **macOS** (Universal) | [`.dmg` (Disk Image)](https://github.com/alikmndlu/QueryBox/releases) | Drag-and-drop installer for Apple Silicon (M1/M2/M3/M4) & Intel Macs |
| **macOS** (Universal) | [`.tar.gz` (Archive)](https://github.com/alikmndlu/QueryBox/releases) | Standalone `QueryBox.app` bundle archive |
| **Linux** (amd64) | [`.deb` (Debian/Ubuntu)](https://github.com/alikmndlu/QueryBox/releases) | Native package installer (`sudo dpkg -i QueryBox_amd64.deb`) |
| **Linux** (amd64) | [`.rpm` (Fedora/RHEL)](https://github.com/alikmndlu/QueryBox/releases) | RedHat / Fedora package installer (`sudo rpm -i QueryBox.rpm`) |
| **Linux** (amd64) | [`.tar.gz` (Binary)](https://github.com/alikmndlu/QueryBox/releases) | Portable Linux executable with desktop launch file |

---

## 🗄️ Supported Database Engines

QueryBox utilizes pure-Go database drivers with **zero external C library dependencies (no CGo required)**:

| Engine | Driver / Package | Connection Parameters |
| :--- | :--- | :--- |
| **PostgreSQL** | `github.com/lib/pq` | Host, Port (5432), Database, User, Password, SSL modes (`disable`, `require`, `verify-full`) |
| **MySQL** / MariaDB | `github.com/go-sql-driver/mysql` | Host, Port (3306), Database, User, Password, Connection collation |
| **SQLite** | `github.com/glebarez/go-sqlite` | Local file path (`.db`, `.sqlite`, `.sqlite3`) with in-memory WAL support |
| **Microsoft SQL Server** | `github.com/microsoft/go-mssqldb` | Host, Port (1433), Database, User, Password, Encryption settings |

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Keyboard Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Ctrl + Enter`** | **Execute Query** | Executes active SQL content or selected text against target DB |
| **`Ctrl + S`** | **Save Query** | Saves query title, SQL code, parameters, and collection association |
| **`Ctrl + Shift + F`** | **Format SQL** | Formats active SQL using dialect-specific syntax rules |
| **`Ctrl + Shift + C`** | **Copy SQL** | Copies active editor SQL directly to clipboard |
| **`Ctrl + N`** | **New Query Tab** | Opens a fresh, untitled query editor tab |
| **`Ctrl + W`** | **Close Tab** | Closes current active tab |
| **`Ctrl + B`** | **Toggle Sidebar** | Collapses or expands left navigation sidebar |
| **`Ctrl + K`** / **`Ctrl + Shift + P`** | **Command Palette** | Opens global command search modal |
| **`Ctrl + ,`** | **Settings** | Opens theme, editor, and system update preferences |
| **`Ctrl + /`** | **Shortcuts Guide** | Opens interactive keyboard shortcuts reference modal |
| **`Escape`** | **Dismiss Modal** | Closes any currently open dialog, drawer, or popup modal |

*(Note: On macOS operating systems, substitute `Ctrl` with `Cmd ⌘`)*

---

## 🏗️ Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│             React 19 + TypeScript + Tailwind CSS             │
│   (Monaco Editor • Virtual Data Grid • SVG Visualizer)       │
└──────────────────────────────┬───────────────────────────────┘
                               │ Wails v2 IPC Bridge
┌──────────────────────────────┴───────────────────────────────┐
│                     Go Application Core                      │
│             (app.go • Local SQLite WAL Storage)              │
├──────────────────────────────┬───────────────────────────────┤
│    Services & Repositories   │      Native Desktop Tray      │
│  - Query & Version Repo      │  - Windows Native Tray (.ico) │
│  - Connection Profile Repo   │  - macOS / Linux Tray (.png)  │
│  - Query Execution Engine    │  - Minimized-to-Tray Support  │
│  - Git Bidirectional Sync    │  - Global Window Activation   │
│  - Self-Updater (GitHub API) │                               │
└──────────────────────────────┴───────────────────────────────┘
                               │ Pure Go Database Drivers (Zero CGo)
    ┌──────────────┬───────────┴───┬──────────────┬─────────────┐
    ▼              ▼               ▼              ▼             ▼
PostgreSQL       MySQL           SQLite       SQL Server    Local Git
 (lib/pq)    (go-sql-driver)  (go-sqlite)   (go-mssqldb)    (Folder)
```

---

## 🛠️ Building from Source

### Prerequisites
- [Go](https://go.dev/dl/) `1.23` or newer
- [Node.js](https://nodejs.org/) `20.x` or newer & npm
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation):
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

### Development Mode (Hot Reloading)
```bash
# Clone the repository
git clone https://github.com/alikmndlu/QueryBox.git
cd QueryBox

# Run live development server with hot reload
wails dev
```

### Production Build
```bash
# Generate high-resolution desktop icons
go run ./scripts/genicon.go

# Compile native binary executable
wails build -clean
```
The compiled binary executable will be placed in `build/bin/`.

---

## 🤝 Contributing

Contributions are welcomed! Feel free to report issues, suggest enhancements, or submit pull requests.

1. Fork the Repository
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

---

<div align="center">
  <b>QueryBox</b> — Built with passion by <a href="https://github.com/alikmndlu">Ali Kamandlu</a>
</div>
