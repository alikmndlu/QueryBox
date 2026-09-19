<div align="center">

# 📦 QueryBox

### High-Performance, Local-First SQL Query Manager & Developer Workbench

[![GitHub Release](https://img.shields.io/github/v/release/alikmndlu/QueryBox?color=6366f1&style=for-the-badge&logo=github)](https://github.com/alikmndlu/QueryBox/releases)
[![GitHub Stars](https://img.shields.io/github/stars/alikmndlu/QueryBox?color=f59e0b&style=for-the-badge&logo=github)](https://github.com/alikmndlu/QueryBox/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://golang.org)
[![Wails v2](https://img.shields.io/badge/Wails-v2.15-df0000?style=for-the-badge)](https://wails.io)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

<br />

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

> [!TIP]
> **🚀 Fast & Lightweight**: Boots in under **1 second** with a ~30MB memory footprint. 100% offline & local-first.

---

## ⚡ Why QueryBox?

Most modern database management applications are bloated Electron shells consuming gigabytes of RAM, or cloud-tethered dashboards that expose proprietary database schemas and query history to third-party servers.

**QueryBox** takes a fundamentally different path:

- 🚀 **Native Go + Wails Efficiency**: Powered by pure [Go](https://go.dev) and [Wails v2](https://wails.io). Zero Chromium overhead.
- 🔒 **100% Local-First Privacy**: All database connection credentials, query collections, version revisions, and logs reside exclusively on your machine in an encrypted local SQLite database.
- 🛡️ **Production Guard Engine**: Intercepts accidental `DELETE`, `UPDATE`, `DROP`, `TRUNCATE`, and `ALTER` statements with mandatory confirmation modals and missing `WHERE` clause warnings.
- 🍏 **Apple-Style UX**: Modern glassmorphism UI, smooth micro-animations, full-screen TV monitor dashboard mode, and an Apple-inspired initialization splash screen.

---

## 🌟 Comprehensive Feature Set

### 1. 🍏 Apple-Style Initialization Splash Screen
- **Ultra-Modern Startup Overlay**: Displays a sleek, Apple-inspired splash screen upon application launch with glassmorphism backdrop blur (`backdrop-blur-3xl`), radial energy glows, and a 3D pulsing QueryBox logo mark.
- **Dynamic Micro-Status Loading**: Smoothly animates initialization steps (*"Initializing Go Native Engine..."*, *"Loading Encrypted SQLite Storage..."*, *"Ready"*) before dissolving into the main desktop workbench.

### 2. 📊 Live KPI Dashboard & Fullscreen TV Monitor Display
- **Real-Time Database Monitoring**: Build interactive KPI dashboard cards for row counts, revenue metrics, query volumes, and analytics summaries.
- **Multiple Visualization Types**: Supports **KPI Stat Cards**, **Bar Charts**, **Line Charts**, and **Summary Data Tables**.
- **Fullscreen TV Display Mode**: Expand the dashboard into a full-screen display mode (`Maximize2` / `Minimize2`), perfect for mounting on large TV screens or wall monitors.
- **Exit Dashboard Button**: Dedicated header control to exit the dashboard and return to the SQL Editor view at any time.
- **Live Status Indicator**: Features an animated green pulsing indicator dot (`LIVE MONITOR`).
- **Flexible Auto-Refresh Intervals**: Configure refresh rates dynamically (Manual / Off, 5s, 10s, 30s, 60s, 120s, 180s, 300s).

### 3. 🛡️ Intelligent Mutation Safety Guard
- **Accidental Execution Interceptor**: Automatically parses queries before execution. Mutating commands (`UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`) halt execution and require explicit user confirmation.
- **Missing `WHERE` Clause Detector**: Specifically flags dangerous `DELETE` and `UPDATE` statements running without a `WHERE` condition to prevent bulk data loss.
- **Read-Only Session Mode**: Enforce a strict read-only execution environment per connection profile.

### 4. 📌 Virtualized Data Grid, Cell Inspector & Column Pinning
- **60fps Virtualized Data Grid**: Capable of scrolling tens of thousands of rows smoothly without browser lag.
- **Column Pinning**: Pin critical identifier columns (like `id`, `uuid`, `username`, `email`) to the left of the grid so they remain visible while scrolling horizontally.
- **Cell Detail Inspector**: Inspect multi-line text, raw JSON trees, HTML previews, or binary hex contents in a popup inspector.
- **Dynamic Sorting & Quick Filter**: Multi-column header sorting and client-side keyword filtering.
- **Multi-Format Export**: One-click export to **CSV**, **JSON**, and **TSV** formats.

### 5. 📈 Zero-Dependency SVG Data Visualizer & Profiler
- **Instant Chart Visualizer**: Turn result tables into presentation-ready **Bar Charts**, **Line Charts**, or **Donut Charts** with zero external chart library overhead.
- **Column Distribution Profiler**: Inspect data distribution across any result column without writing manual `COUNT(DISTINCT ...)` queries. Displays null percentages, unique value ratios, min/max/avg numerical metrics, and mini-histograms.

### 6. 🧠 Monaco SQL Editor with Live Schema Autocompletion
- **Live Database Autocompletion**: Feeds table names, view names, column attributes, and data types directly from active connection schemas into Monaco.
- **Multi-Dialect SQL Formatter**: Format SQL cleanly with `Ctrl + Shift + F` tailored for PostgreSQL, MySQL, SQLite, and T-SQL.
- **IDE Capabilities**: Syntax highlighting, bracket matching, multi-cursor editing, minimap, line folding, and snippet templates.

### 7. 📐 Interactive ERD (Entity Relationship Diagram) Visualizer
- **Visual Schema Topology**: Render interactive ERD diagrams directly from active database connections.
- **Relationship Connectors**: Displays table entities, data types, primary key badges, and foreign key vector connector lines.
- **Interactive Controls**: Pan, zoom in/out, search tables, reset layout, and generate `SELECT` queries with a single click.

### 8. 🤖 SQL AI Copilot (Text-to-SQL & Query Assistant)
- **Natural Language Text-to-SQL**: Generate complex SQL queries from plain English prompts (*"Show top 10 users with highest order volume in the last month"*).
- **Multi-Provider Engine**: Supports **OpenAI (GPT-4o)**, **Anthropic Claude**, **Ollama (local offline LLMs)**, and custom REST endpoints.
- **Query Optimizer & Error Fixer**: AI-powered execution plan analysis, index recommendations, and automatic syntax error resolution.

### 9. 🗂️ Nested Collection Tree & Query Organization
- **Expandable Folder Tree**: Organize queries inside custom collections with an expandable folder tree view in the left sidebar.
- **Quick Views**: Quick view filters: `Live Dashboard`, `All Queries`, `Favorites`, `Recently Used`, and `Uncategorized`.
- **Right-Click Context Menus**: Fast context actions to open, copy SQL, duplicate, toggle favorites, rename, or delete items.

### 10. 🔀 Multi-Tab Workspace & Side-by-Side Version Diff
- Persistent tab management for working on multiple queries concurrently.
- Every save automatically records an immutable version snapshot.
- Compare any two historical query revisions side-by-side using Monaco's integrated diff engine with one-click rollback.

### 11. 💻 "Copy as Code" Generator
- Export your tested SQL query as idiomatic, production-ready code snippets with parameter placeholders for:
  - **Go**: `database/sql` with context
  - **TypeScript / Node.js**: `pg` and `mysql2/promise`
  - **Python**: `psycopg2` and `pymysql`
  - **Rust**: `sqlx` async queries
  - **PHP**: `PDO` prepared statements

### 12. 🌿 Git / Directory Synchronization
- Bidirectional synchronization between your QueryBox collections and any local folder or Git repository.
- Queries are saved as `.sql` files with clean YAML frontmatter metadata (title, tags, dialect, connection target, timestamps).

### 13. ⏱️ Query Latency Benchmarks & EXPLAIN Analyzer
- **Latency Benchmarking**: Benchmark query performance over multiple iterations, calculating minimum, maximum, median, and average execution times.
- **Execution Plan Visualizer**: Render `EXPLAIN` and `EXPLAIN ANALYZE` output nodes clearly to identify costly sequential scans.

### 14. ⌨️ Universal Escape Key Modal Dismissal Engine
- Consistent keyboard accessibility across all 15+ application modals (ERD visualizer, Diff viewer, Cell inspector, Profiler, Settings, Git sync, Connection manager, Shortcuts, Update modal, and alerts).

### 15. 🔄 In-App Self-Updater & System Tray
- **Direct GitHub Releases Integration**: Automatically check for application updates or inspect manually from Settings.
- **Native System Tray**: System tray minimize/restore support and global activator across Windows, macOS, and Linux.

---

## 🖥️ Downloads & Installation

Download pre-compiled binaries for your operating system directly from **[GitHub Releases](https://github.com/alikmndlu/QueryBox/releases)**:

| Platform | Package Format | Download & Setup |
| :--- | :--- | :--- |
| **Windows** (x64) | [`.exe` (NSIS Installer)](https://github.com/alikmndlu/QueryBox/releases) | Recommended installer with desktop shortcut & start menu integration |
| **Windows** (x64) | [`.zip` (Portable)](https://github.com/alikmndlu/QueryBox/releases) | Standalone portable executable (no installer required) |
| **macOS** (Universal) | [`.dmg` (Disk Image)](https://github.com/alikmndlu/QueryBox/releases) | Drag-and-drop installer for Apple Silicon (M1/M2/M3/M4) & Intel Macs |
| **macOS** (Universal) | [`.tar.gz` (Archive)](https://github.com/alikmndlu/QueryBox/releases) | Standalone `QueryBox.app` bundle archive |
| **Linux** (amd64) | [`.deb` (Debian/Ubuntu)](https://github.com/alikmndlu/QueryBox/releases) | Native package installer (`sudo dpkg -i QueryBox_amd64.deb`) |
| **Linux** (amd64) | [`.rpm` (Fedora/RHEL)](https://github.com/alikmndlu/QueryBox/releases) | RedHat / Fedora package installer (`sudo rpm -i QueryBox.rpm`) |
| **Linux** (amd64) | [`.tar.gz` (Binary)](https://github.com/alikmndlu/QueryBox/releases) | Portable Linux executable with desktop launch file |

---

## 🗄️ Supported Database Engines

QueryBox utilizes pure-Go database drivers with **zero external C library dependencies (no CGo required)**:

| Engine | Driver / Package | Connection Details |
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

Contributions make open-source software thrive! Feel free to report issues, suggest enhancements, or submit pull requests.

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
